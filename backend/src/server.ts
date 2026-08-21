import "dotenv/config";

import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import jwt from "jsonwebtoken";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import path from "path";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const app = express();
const PORT = 3333;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Cria a pasta de uploads se não existir
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve os arquivos de upload publicamente (para exibir as fotos no frontend)
app.use("/uploads", express.static(uploadsDir));

// Configuração do multer: define onde e com que nome salvar o arquivo
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const nomeUnico = `${Date.now()}-${file.originalname}`;
    cb(null, nomeUnico);
  },
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ImobFlow API está funcionando!");
});

// Rota de cadastro de usuário
app.post("/users", async (req, res) => {
  const { name, email, password } = req.body;

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
});

// Rota de login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ error: "Email ou senha inválidos" });
  }

  const senhaCorreta = await bcrypt.compare(password, user.passwordHash);

  if (!senhaCorreta) {
    return res.status(401).json({ error: "Email ou senha inválidos" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// Middleware: confere se a requisição tem um token válido
function autenticar(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).usuario = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

// Middleware: confere se o usuário logado é administrador
function somenteAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const usuario = (req as any).usuario;
  if (usuario?.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Ação permitida apenas para administradores" });
  }
  next();
}

// Rota de teste protegida
app.get("/me", autenticar, (req, res) => {
  res.json({ usuario: (req as any).usuario });
});

// Rota de estatísticas do dashboard
app.get("/stats", autenticar, async (req, res) => {
  const totalUsuarios = await prisma.user.count();
  const totalImoveis = await prisma.property.count();
  const totalProprietarios = await prisma.owner.count();
  const totalInquilinos = await prisma.tenant.count();
  const contratosAtivos = await prisma.contract.count({
    where: { status: "ativo" },
  });
  const contratosInativos = await prisma.contract.count({
    where: { status: "encerrado" },
  });
  const manutencoesPendentes = await prisma.maintenance.count({
    where: { status: "pendente" },
  });

  res.json({
    imoveis: totalImoveis,
    contratosAtivos,
    contratosInativos,
    proprietarios: totalProprietarios,
    inquilinos: totalInquilinos,
    manutencoesPendentes,
  });
});

// ===== USUÁRIOS (apenas admin) =====

app.get("/users", autenticar, somenteAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(users);
});

app.put("/users/:id/role", autenticar, somenteAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== "admin" && role !== "operador") {
    return res.status(400).json({ error: "Role inválida" });
  }

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  res.json(user);
});

// ===== IMÓVEIS =====

app.post("/properties", autenticar, async (req, res) => {
  try {
    const { address, type, rentValue, bedrooms, bathrooms, photoUrl } =
      req.body;

    const property = await prisma.property.create({
      data: { address, type, rentValue, bedrooms, bathrooms, photoUrl },
    });

    res.status(201).json(property);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/properties", autenticar, async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(properties);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/properties/:id", autenticar, async (req, res) => {
  try {
    const { id } = req.params;
    const { address, type, rentValue, bedrooms, bathrooms, status, photoUrl } =
      req.body;

    const property = await prisma.property.update({
      where: { id: Number(id) },
      data: { address, type, rentValue, bedrooms, bathrooms, status, photoUrl },
    });

    res.json(property);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/properties/:id", autenticar, somenteAdmin, async (req, res) => {
  const { id } = req.params;

  await prisma.property.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== PROPRIETÁRIOS =====

app.post("/owners", autenticar, async (req, res) => {
  const { name, phone, email, cpf, address, photoUrl } = req.body;

  const owner = await prisma.owner.create({
    data: { name, phone, email, cpf, address, photoUrl },
  });

  res.status(201).json(owner);
});

app.get("/owners", autenticar, async (req, res) => {
  const owners = await prisma.owner.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json(owners);
});

app.put("/owners/:id", autenticar, async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, cpf, address, photoUrl } = req.body;

  const owner = await prisma.owner.update({
    where: { id: Number(id) },
    data: { name, phone, email, cpf, address, photoUrl },
  });

  res.json(owner);
});

app.delete("/owners/:id", autenticar, somenteAdmin, async (req, res) => {
  const { id } = req.params;

  await prisma.owner.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== INQUILINOS =====

app.post("/tenants", autenticar, async (req, res) => {
  const {
    name,
    phone,
    email,
    cpf,
    guarantorName,
    guarantorPhone,
    guarantorAddress,
  } = req.body;

  const tenant = await prisma.tenant.create({
    data: {
      name,
      phone,
      email,
      cpf,
      guarantorName,
      guarantorPhone,
      guarantorAddress,
    },
  });

  res.status(201).json(tenant);
});

app.get("/tenants", autenticar, async (req, res) => {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json(tenants);
});

app.put("/tenants/:id", autenticar, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    phone,
    email,
    cpf,
    guarantorName,
    guarantorPhone,
    guarantorAddress,
  } = req.body;

  const tenant = await prisma.tenant.update({
    where: { id: Number(id) },
    data: {
      name,
      phone,
      email,
      cpf,
      guarantorName,
      guarantorPhone,
      guarantorAddress,
    },
  });

  res.json(tenant);
});

app.delete("/tenants/:id", autenticar, somenteAdmin, async (req, res) => {
  const { id } = req.params;

  await prisma.tenant.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== CONTRATOS =====

app.post("/contracts", autenticar, async (req, res) => {
  const {
    startDate,
    endDate,
    rentValue,
    dueDay,
    propertyId,
    ownerId,
    tenantId,
  } = req.body;

  const contract = await prisma.contract.create({
    data: {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      rentValue,
      dueDay,
      propertyId,
      ownerId,
      tenantId,
    },
  });

  res.status(201).json(contract);
});

app.get("/contracts", autenticar, async (req, res) => {
  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      property: true,
      owner: true,
      tenant: true,
    },
  });

  res.json(contracts);
});

app.put("/contracts/:id", autenticar, async (req, res) => {
  const { id } = req.params;
  const {
    startDate,
    endDate,
    rentValue,
    dueDay,
    status,
    propertyId,
    ownerId,
    tenantId,
  } = req.body;

  const contract = await prisma.contract.update({
    where: { id: Number(id) },
    data: {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      rentValue,
      dueDay,
      status,
      propertyId,
      ownerId,
      tenantId,
    },
  });

  res.json(contract);
});

app.delete("/contracts/:id", autenticar, somenteAdmin, async (req, res) => {
  const { id } = req.params;

  await prisma.contract.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== PAGAMENTOS =====

app.post("/payments", autenticar, async (req, res) => {
  const { dueDate, value, contractId } = req.body;

  const payment = await prisma.payment.create({
    data: {
      dueDate: new Date(dueDate),
      value,
      contractId,
    },
  });

  res.status(201).json(payment);
});

app.get("/payments", autenticar, async (req, res) => {
  const payments = await prisma.payment.findMany({
    orderBy: { dueDate: "asc" },
    include: {
      contract: {
        include: {
          property: true,
          tenant: true,
        },
      },
    },
  });

  res.json(payments);
});

app.put("/payments/:id/pagar", autenticar, async (req, res) => {
  const { id } = req.params;

  const payment = await prisma.payment.update({
    where: { id: Number(id) },
    data: {
      status: "pago",
      paidAt: new Date(),
    },
  });

  res.json(payment);
});

app.delete("/payments/:id", autenticar, somenteAdmin, async (req, res) => {
  const { id } = req.params;

  await prisma.payment.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== MANUTENÇÕES =====

app.post("/maintenances", autenticar, async (req, res) => {
  const { description, estimatedCost, propertyId, photoUrl } = req.body;

  const maintenance = await prisma.maintenance.create({
    data: {
      description,
      estimatedCost,
      propertyId,
      photoUrl,
    },
  });

  res.status(201).json(maintenance);
});

app.get("/maintenances", autenticar, async (req, res) => {
  const maintenances = await prisma.maintenance.findMany({
    orderBy: { openedAt: "desc" },
    include: {
      property: true,
    },
  });

  res.json(maintenances);
});

app.put("/maintenances/:id", autenticar, async (req, res) => {
  const { id } = req.params;
  const { description, estimatedCost, status, photoUrl } = req.body;

  const maintenance = await prisma.maintenance.update({
    where: { id: Number(id) },
    data: { description, estimatedCost, status, photoUrl },
  });

  res.json(maintenance);
});

app.put("/maintenances/:id/concluir", autenticar, async (req, res) => {
  const { id } = req.params;

  const maintenance = await prisma.maintenance.update({
    where: { id: Number(id) },
    data: {
      status: "concluida",
      resolvedAt: new Date(),
    },
  });

  res.json(maintenance);
});

app.delete("/maintenances/:id", autenticar, somenteAdmin, async (req, res) => {
  const { id } = req.params;

  await prisma.maintenance.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== AGENDA =====

app.post("/appointments", autenticar, async (req, res) => {
  const { title, description, date, propertyId } = req.body;

  const appointment = await prisma.appointment.create({
    data: {
      title,
      description,
      date: new Date(date),
      propertyId: propertyId ? Number(propertyId) : null,
    },
  });

  res.status(201).json(appointment);
});

app.get("/appointments", autenticar, async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    orderBy: { date: "asc" },
    include: {
      property: true,
    },
  });

  res.json(appointments);
});

app.put("/appointments/:id", autenticar, async (req, res) => {
  const { id } = req.params;
  const { title, description, date, status, propertyId } = req.body;

  const appointment = await prisma.appointment.update({
    where: { id: Number(id) },
    data: {
      title,
      description,
      date: new Date(date),
      status,
      propertyId: propertyId ? Number(propertyId) : null,
    },
  });

  res.json(appointment);
});

app.delete("/appointments/:id", autenticar, somenteAdmin, async (req, res) => {
  const { id } = req.params;

  await prisma.appointment.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== RELATÓRIOS =====

// Resumo financeiro: total pago vs total pendente
app.get("/reports/financial", autenticar, async (req, res) => {
  const pagos = await prisma.payment.aggregate({
    where: { status: "pago" },
    _sum: { value: true },
  });

  const pendentes = await prisma.payment.aggregate({
    where: { status: "pendente" },
    _sum: { value: true },
  });

  res.json({
    totalPago: pagos._sum.value ?? 0,
    totalPendente: pendentes._sum.value ?? 0,
  });
});

// Imóveis por status
app.get("/reports/properties-status", autenticar, async (req, res) => {
  const disponiveis = await prisma.property.count({
    where: { status: "disponivel" },
  });

  const alugados = await prisma.property.count({
    where: { status: "alugado" },
  });

  res.json({ disponiveis, alugados });
});

// Contratos vencendo nos próximos 30 dias
app.get("/reports/expiring-contracts", autenticar, async (req, res) => {
  const hoje = new Date();
  const em30Dias = new Date();
  em30Dias.setDate(hoje.getDate() + 30);

  const contratos = await prisma.contract.findMany({
    where: {
      status: "ativo",
      endDate: {
        gte: hoje,
        lte: em30Dias,
      },
    },
    orderBy: { endDate: "asc" },
    include: {
      property: true,
      tenant: true,
    },
  });

  res.json(contratos);
});

// Pagamentos pendentes, ordenados pelo vencimento mais próximo
app.get("/reports/pending-payments", autenticar, async (req, res) => {
  const pagamentos = await prisma.payment.findMany({
    where: { status: "pendente" },
    orderBy: { dueDate: "asc" },
    take: 5,
    include: {
      contract: {
        include: {
          property: true,
          tenant: true,
        },
      },
    },
  });

  res.json(pagamentos);
});

// Receita dos últimos 7 dias (pagamentos recebidos, agrupados por dia)
app.get("/reports/weekly-revenue", autenticar, async (req, res) => {
  const hoje = new Date();
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(hoje.getDate() - 6);
  seteDiasAtras.setHours(0, 0, 0, 0);

  const pagamentos = await prisma.payment.findMany({
    where: {
      status: "pago",
      paidAt: { gte: seteDiasAtras },
    },
  });

  const categorias: string[] = [];
  const valores: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const dia = new Date();
    dia.setDate(hoje.getDate() - i);
    const diaStr = dia.toISOString().slice(0, 10);

    const totalDia = pagamentos
      .filter((p) => p.paidAt && p.paidAt.toISOString().slice(0, 10) === diaStr)
      .reduce((soma, p) => soma + Number(p.value), 0);

    categorias.push(
      dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    );
    valores.push(totalDia);
  }

  res.json({ categorias, valores });
});

// ===== BUSCA =====

app.get("/search", autenticar, async (req, res) => {
  const query = String(req.query.q || "");

  if (!query.trim()) {
    return res.json({ properties: [], owners: [], tenants: [] });
  }

  const properties = await prisma.property.findMany({
    where: { address: { contains: query, mode: "insensitive" } },
    take: 5,
  });

  const owners = await prisma.owner.findMany({
    where: { name: { contains: query, mode: "insensitive" } },
    take: 5,
  });

  const tenants = await prisma.tenant.findMany({
    where: { name: { contains: query, mode: "insensitive" } },
    take: 5,
  });

  res.json({ properties, owners, tenants });
});

// ===== UPLOAD =====

// Rota de upload de imagem — devolve a URL do arquivo salvo
app.post("/upload", autenticar, upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado" });
  }
  const url = `http://localhost:3333/uploads/${req.file.filename}`;
  res.json({ url });
});

// ===== NOTIFICAÇÕES =====

app.get("/notifications", autenticar, async (req, res) => {
  const hoje = new Date();
  const em7Dias = new Date();
  em7Dias.setDate(hoje.getDate() + 7);

  const notificacoes: any[] = [];

  // Contratos vencendo em 7 dias
  const contratosVencendo = await prisma.contract.findMany({
    where: {
      status: "ativo",
      endDate: { gte: hoje, lte: em7Dias },
    },
    include: { property: true },
  });

  contratosVencendo.forEach((contrato) => {
    notificacoes.push({
      tipo: "contrato_vencendo",
      mensagem: `Contrato do imóvel "${contrato.property.address}" vence em breve`,
    });
  });

  // Pagamentos atrasados
  const pagamentosAtrasados = await prisma.payment.findMany({
    where: {
      status: "pendente",
      dueDate: { lt: hoje },
    },
    include: { contract: { include: { property: true } } },
  });

  pagamentosAtrasados.forEach((pagamento) => {
    notificacoes.push({
      tipo: "pagamento_atrasado",
      mensagem: `Pagamento do imóvel "${pagamento.contract.property.address}" está atrasado`,
    });
  });

  // Manutenções pendentes
  const manutencoesPendentes = await prisma.maintenance.findMany({
    where: { status: "pendente" },
    include: { property: true },
  });

  manutencoesPendentes.forEach((manutencao) => {
    notificacoes.push({
      tipo: "manutencao_pendente",
      mensagem: `Manutenção pendente no imóvel "${manutencao.property.address}": ${manutencao.description}`,
    });
  });

  res.json(notificacoes);
});

// ===== ASSISTENTE IA =====

app.post("/ai/ask", autenticar, async (req, res) => {
  const { question } = req.body;

  try {
    // 1. RETRIEVAL: busca os dados reais do sistema
    const [imoveis, contratos, pagamentos, manutencoes] = await Promise.all([
      prisma.property.findMany(),
      prisma.contract.findMany({
        include: { property: true, tenant: true },
      }),
      prisma.payment.findMany({
        include: { contract: { include: { property: true } } },
      }),
      prisma.maintenance.findMany({ include: { property: true } }),
    ]);

    const contexto = {
      imoveis,
      contratos,
      pagamentos,
      manutencoes,
    };

    // 2. GENERATION: manda os dados reais + pergunta pro Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const prompt = `
Você é um assistente do sistema ImobFlow, de gestão imobiliária.
Responda a pergunta do usuário APENAS com base nos dados JSON abaixo.
Nunca invente números ou informações que não estejam nos dados.
Responda em português, de forma clara e direta.

DADOS DO SISTEMA:
${JSON.stringify(contexto)}

PERGUNTA DO USUÁRIO:
${question}
`;

    const result = await model.generateContent(prompt);
    const resposta = result.response.text();

    res.json({ resposta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao processar pergunta" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
