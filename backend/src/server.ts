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
import rateLimit from "express-rate-limit";

import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const app = express();
const PORT = 3333;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const nomeUnico = `${Date.now()}-${file.originalname}`;
    cb(null, nomeUnico);
  },
});
const upload = multer({ storage });

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
  }),
);

// Limita tentativas de login: no máximo 5 tentativas a cada 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Muitas tentativas de login. Tente novamente em alguns minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ImobFlow API está funcionando!");
});

// ===== CADASTRO E LOGIN =====

app.post("/signup", async (req, res) => {
  const { name, email, password, companyName } = req.body;

  if (!name || !email || !password || !companyName) {
    return res.status(400).json({ error: "Preencha todos os campos" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const company = await prisma.company.create({
    data: { name: companyName },
  });

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "admin",
      companyId: company.id,
    },
  });

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    companyId: company.id,
  });
});

app.post("/users", async (req, res) => {
  const { name, email, password } = req.body;

  const passwordHash = await bcrypt.hash(password, 10);

  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: { name: "Empresa Padrão" },
    });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      companyId: company.id,
    },
  });

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
});

app.post("/login", loginLimiter, async (req, res) => {
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
    {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
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
      companyId: user.companyId,
    },
  });
});

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

// Middleware: autentica o proprietário no portal próprio
function autenticarProprietario(
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
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    if (payload.tipo !== "proprietario") {
      return res.status(401).json({ error: "Token inválido para este acesso" });
    }
    (req as any).proprietario = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

app.get("/me", autenticar, (req, res) => {
  res.json({ usuario: (req as any).usuario });
});

app.get("/me/profile", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;

  const user = await prisma.user.findUnique({
    where: { id: usuario.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      photoUrl: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  res.json(user);
});

app.put("/me/profile", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { name, photoUrl } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Informe o nome" });
  }

  const user = await prisma.user.update({
    where: { id: usuario.id },
    data: { name, photoUrl },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      photoUrl: true,
    },
  });

  res.json(user);
});

app.get("/stats", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const companyId = usuario.companyId;

  const totalImoveis = await prisma.property.count({ where: { companyId } });
  const totalProprietarios = await prisma.owner.count({ where: { companyId } });
  const totalInquilinos = await prisma.tenant.count({ where: { companyId } });
  const contratosAtivos = await prisma.contract.count({
    where: { companyId, status: "ativo" },
  });
  const contratosInativos = await prisma.contract.count({
    where: { companyId, status: "encerrado" },
  });
  const manutencoesPendentes = await prisma.maintenance.count({
    where: { companyId, status: "pendente" },
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
  const usuario = (req as any).usuario;

  const users = await prisma.user.findMany({
    where: { companyId: usuario.companyId },
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

app.post("/users/team", autenticar, somenteAdmin, async (req, res) => {
  const usuario = (req as any).usuario;
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Preencha todos os campos" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      companyId: usuario.companyId,
    },
  });

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

app.put("/users/:id/role", autenticar, somenteAdmin, async (req, res) => {
  const usuario = (req as any).usuario;
  const { id } = req.params;
  const { role } = req.body;

  if (role !== "admin" && role !== "operador") {
    return res.status(400).json({ error: "Role inválida" });
  }

  const existente = await prisma.user.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Usuário não encontrado" });
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
    const usuario = (req as any).usuario;
    const { address, type, rentValue, bedrooms, bathrooms, photoUrl } =
      req.body;

    const property = await prisma.property.create({
      data: {
        address,
        type,
        rentValue,
        bedrooms,
        bathrooms,
        photoUrl,
        companyId: usuario.companyId,
      },
    });

    res.status(201).json(property);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/properties", autenticar, async (req, res) => {
  try {
    const usuario = (req as any).usuario;

    const properties = await prisma.property.findMany({
      where: { companyId: usuario.companyId },
      orderBy: { createdAt: "desc" },
    });

    res.json(properties);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Versão paginada, usada apenas pela tela de listagem de Imóveis
app.get("/properties/paginated", autenticar, async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const pagina = Number(req.query.pagina) || 1;
    const porPagina = 10;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: { companyId: usuario.companyId },
        orderBy: { createdAt: "desc" },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      prisma.property.count({ where: { companyId: usuario.companyId } }),
    ]);

    res.json({
      properties,
      totalPaginas: Math.ceil(total / porPagina),
      paginaAtual: pagina,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/properties/:id", autenticar, async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const { id } = req.params;
    const { address, type, rentValue, bedrooms, bathrooms, status, photoUrl } =
      req.body;

    const existente = await prisma.property.findFirst({
      where: { id: Number(id), companyId: usuario.companyId },
    });

    if (!existente) {
      return res.status(404).json({ error: "Imóvel não encontrado" });
    }

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
  const usuario = (req as any).usuario;
  const { id } = req.params;

  const existente = await prisma.property.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Imóvel não encontrado" });
  }

  await prisma.property.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// Adiciona uma foto à galeria do imóvel
app.post("/properties/:id/photos", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { id } = req.params;
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL da foto não informada" });
  }

  const property = await prisma.property.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!property) {
    return res.status(404).json({ error: "Imóvel não encontrado" });
  }

  const photo = await prisma.propertyPhoto.create({
    data: { url, propertyId: Number(id) },
  });

  res.status(201).json(photo);
});

// Lista as fotos da galeria de um imóvel
app.get("/properties/:id/photos", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { id } = req.params;

  const property = await prisma.property.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!property) {
    return res.status(404).json({ error: "Imóvel não encontrado" });
  }

  const photos = await prisma.propertyPhoto.findMany({
    where: { propertyId: Number(id) },
    orderBy: { createdAt: "asc" },
  });

  res.json(photos);
});

// Remove uma foto específica da galeria
app.delete("/properties/photos/:photoId", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { photoId } = req.params;

  const photo = await prisma.propertyPhoto.findUnique({
    where: { id: Number(photoId) },
    include: { property: true },
  });

  if (!photo || photo.property.companyId !== usuario.companyId) {
    return res.status(404).json({ error: "Foto não encontrada" });
  }

  await prisma.propertyPhoto.delete({ where: { id: Number(photoId) } });

  res.status(204).send();
});

// ===== PROPRIETÁRIOS =====

app.post("/owners", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { name, phone, email, cpf, address, photoUrl } = req.body;

  const owner = await prisma.owner.create({
    data: {
      name,
      phone,
      email,
      cpf,
      address,
      photoUrl,
      companyId: usuario.companyId,
    },
  });

  res.status(201).json(owner);
});

app.get("/owners", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;

  const owners = await prisma.owner.findMany({
    where: { companyId: usuario.companyId },
    orderBy: { createdAt: "desc" },
  });

  res.json(owners);
});

app.get("/owners/paginated", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const pagina = Number(req.query.pagina) || 1;
  const porPagina = 10;

  const [owners, total] = await Promise.all([
    prisma.owner.findMany({
      where: { companyId: usuario.companyId },
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.owner.count({ where: { companyId: usuario.companyId } }),
  ]);

  res.json({
    owners,
    totalPaginas: Math.ceil(total / porPagina),
    paginaAtual: pagina,
  });
});

app.put("/owners/:id", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { id } = req.params;
  const { name, phone, email, cpf, address, photoUrl } = req.body;

  const existente = await prisma.owner.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Proprietário não encontrado" });
  }

  const owner = await prisma.owner.update({
    where: { id: Number(id) },
    data: { name, phone, email, cpf, address, photoUrl },
  });

  res.json(owner);
});

// Admin gera acesso ao portal para um proprietário (senha temporária)
app.post(
  "/owners/:id/generate-access",
  autenticar,
  somenteAdmin,
  async (req, res) => {
    const usuario = (req as any).usuario;
    const { id } = req.params;

    const owner = await prisma.owner.findFirst({
      where: { id: Number(id), companyId: usuario.companyId },
    });

    if (!owner) {
      return res.status(404).json({ error: "Proprietário não encontrado" });
    }

    // Gera uma senha temporária aleatória de 8 caracteres
    const senhaTemporaria = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(senhaTemporaria, 10);

    await prisma.owner.update({
      where: { id: Number(id) },
      data: { passwordHash, precisaTrocarSenha: true },
    });

    res.json({ senhaTemporaria, email: owner.email });
  },
);

app.delete("/owners/:id", autenticar, somenteAdmin, async (req, res) => {
  const usuario = (req as any).usuario;
  const { id } = req.params;

  const existente = await prisma.owner.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Proprietário não encontrado" });
  }

  await prisma.owner.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== INQUILINOS =====

app.post("/tenants", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
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
      companyId: usuario.companyId,
    },
  });

  res.status(201).json(tenant);
});

app.get("/tenants/paginated", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const pagina = Number(req.query.pagina) || 1;
  const porPagina = 10;

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where: { companyId: usuario.companyId },
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.tenant.count({ where: { companyId: usuario.companyId } }),
  ]);

  res.json({
    tenants,
    totalPaginas: Math.ceil(total / porPagina),
    paginaAtual: pagina,
  });
});

// Admin gera acesso ao portal para um inquilino (senha temporária)
app.post(
  "/tenants/:id/generate-access",
  autenticar,
  somenteAdmin,
  async (req, res) => {
    const usuario = (req as any).usuario;
    const { id } = req.params;

    const tenant = await prisma.tenant.findFirst({
      where: { id: Number(id), companyId: usuario.companyId },
    });

    if (!tenant) {
      return res.status(404).json({ error: "Inquilino não encontrado" });
    }

    const senhaTemporaria = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(senhaTemporaria, 10);

    await prisma.tenant.update({
      where: { id: Number(id) },
      data: { passwordHash, precisaTrocarSenha: true },
    });

    res.json({ senhaTemporaria, email: tenant.email });
  },
);

app.get("/tenants", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;

  const tenants = await prisma.tenant.findMany({
    where: { companyId: usuario.companyId },
    orderBy: { createdAt: "desc" },
  });

  res.json(tenants);
});

app.put("/tenants/:id", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
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

  const existente = await prisma.tenant.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Inquilino não encontrado" });
  }

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
  const usuario = (req as any).usuario;
  const { id } = req.params;

  const existente = await prisma.tenant.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Inquilino não encontrado" });
  }

  await prisma.tenant.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== CONTRATOS =====

app.post("/contracts", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
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
      companyId: usuario.companyId,
    },
  });

  const inicio = new Date(startDate);
  const fim = new Date(endDate);
  const pagamentosParaCriar: {
    dueDate: Date;
    value: number;
    contractId: number;
    companyId: number;
  }[] = [];

  let anoAtual = inicio.getFullYear();
  let mesAtual = inicio.getMonth();

  while (
    anoAtual < fim.getFullYear() ||
    (anoAtual === fim.getFullYear() && mesAtual <= fim.getMonth())
  ) {
    const ultimoDiaDoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
    const diaVencimento = Math.min(Number(dueDay), ultimoDiaDoMes);
    const dataVencimento = new Date(anoAtual, mesAtual, diaVencimento);

    pagamentosParaCriar.push({
      dueDate: dataVencimento,
      value: Number(rentValue),
      contractId: contract.id,
      companyId: usuario.companyId,
    });

    mesAtual++;
    if (mesAtual > 11) {
      mesAtual = 0;
      anoAtual++;
    }
  }

  await prisma.payment.createMany({ data: pagamentosParaCriar });

  res.status(201).json(contract);
});

app.get("/contracts", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;

  const contracts = await prisma.contract.findMany({
    where: { companyId: usuario.companyId },
    orderBy: { createdAt: "desc" },
    include: {
      property: true,
      owner: true,
      tenant: true,
    },
  });

  res.json(contracts);
});

app.get("/contracts/paginated", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const pagina = Number(req.query.pagina) || 1;
  const porPagina = 10;

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where: { companyId: usuario.companyId },
      orderBy: { createdAt: "desc" },
      include: { property: true, owner: true, tenant: true },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.contract.count({ where: { companyId: usuario.companyId } }),
  ]);

  res.json({
    contracts,
    totalPaginas: Math.ceil(total / porPagina),
    paginaAtual: pagina,
  });
});

app.put("/contracts/:id", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
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

  const existente = await prisma.contract.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Contrato não encontrado" });
  }

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
  const usuario = (req as any).usuario;
  const { id } = req.params;

  const existente = await prisma.contract.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Contrato não encontrado" });
  }

  await prisma.contract.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

app.get("/contracts/adjustable", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;

  const contratos = await prisma.contract.findMany({
    where: { companyId: usuario.companyId, status: "ativo" },
    include: { property: true, tenant: true },
  });

  const hoje = new Date();

  const elegiveis = contratos.filter((contrato) => {
    const dataBase = contrato.lastAdjustmentDate ?? contrato.startDate;
    const proximoReajuste = new Date(dataBase);
    proximoReajuste.setFullYear(proximoReajuste.getFullYear() + 1);
    return proximoReajuste <= hoje;
  });

  res.json(elegiveis);
});

app.put("/contracts/:id/adjust", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { id } = req.params;
  const { percentage } = req.body;

  if (percentage === undefined || isNaN(Number(percentage))) {
    return res.status(400).json({ error: "Informe um percentual válido" });
  }

  const existente = await prisma.contract.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Contrato não encontrado" });
  }

  const novoValor =
    Number(existente.rentValue) * (1 + Number(percentage) / 100);

  const contract = await prisma.contract.update({
    where: { id: Number(id) },
    data: {
      rentValue: novoValor,
      lastAdjustmentDate: new Date(),
    },
  });

  res.json(contract);
});

// Envia o contrato para assinatura digital (estrutura preparada para integração futura com Clicksign)
app.post(
  "/contracts/:id/send-for-signature",
  autenticar,
  somenteAdmin,
  async (req, res) => {
    const usuario = (req as any).usuario;
    const { id } = req.params;

    const contract = await prisma.contract.findFirst({
      where: { id: Number(id), companyId: usuario.companyId },
      include: { owner: true, tenant: true, property: true },
    });

    if (!contract) {
      return res.status(404).json({ error: "Contrato não encontrado" });
    }

    if (!process.env.CLICKSIGN_API_KEY) {
      return res.status(503).json({
        error:
          "Assinatura digital ainda não configurada. Configure a chave de API da Clicksign para ativar esta funcionalidade.",
      });
    }

    // TODO: quando a chave de API estiver configurada, implementar aqui:
    // 1. Criar um "envelope" na Clicksign com o PDF do contrato
    // 2. Adicionar os signatários (contract.owner.email, contract.tenant.email)
    // 3. Enviar o envelope
    // 4. Salvar o ID do envelope retornado

    await prisma.contract.update({
      where: { id: Number(id) },
      data: { signatureStatus: "aguardando_assinaturas" },
    });

    res.json({ mensagem: "Contrato enviado para assinatura" });
  },
);

// Consulta o status de assinatura de um contrato
app.get("/contracts/:id/signature-status", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { id } = req.params;

  const contract = await prisma.contract.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
    select: { signatureStatus: true, signedDocumentUrl: true },
  });

  if (!contract) {
    return res.status(404).json({ error: "Contrato não encontrado" });
  }

  res.json(contract);
});

// Webhook: receberá notificações da Clicksign quando alguém assinar (estrutura preparada)
app.post("/webhooks/clicksign", async (req, res) => {
  // TODO: quando integrado de verdade, validar a assinatura do webhook
  // e atualizar o contrato correspondente com o novo status/URL do documento assinado
  console.log("Webhook da Clicksign recebido:", req.body);
  res.status(200).send();
});

// ===== PAGAMENTOS =====

app.post("/payments", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { dueDate, value, contractId } = req.body;

  const payment = await prisma.payment.create({
    data: {
      dueDate: new Date(dueDate),
      value,
      contractId,
      companyId: usuario.companyId,
    },
  });

  res.status(201).json(payment);
});

app.get("/payments", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;

  const payments = await prisma.payment.findMany({
    where: { companyId: usuario.companyId },
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

  const hoje = new Date();

  const paymentsComAtraso = payments.map((payment) => {
    if (payment.status !== "pendente" || payment.dueDate >= hoje) {
      return {
        ...payment,
        diasAtraso: 0,
        valorAtualizado: Number(payment.value),
      };
    }

    const diasAtraso = Math.floor(
      (hoje.getTime() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const valorOriginal = Number(payment.value);
    const multa = valorOriginal * 0.02;
    const juros = valorOriginal * 0.01 * (diasAtraso / 30);
    const valorAtualizado = valorOriginal + multa + juros;

    return {
      ...payment,
      diasAtraso,
      valorAtualizado: Number(valorAtualizado.toFixed(2)),
    };
  });

  res.json(paymentsComAtraso);
});

app.put("/payments/:id/pagar", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { id } = req.params;

  const existente = await prisma.payment.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Pagamento não encontrado" });
  }

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
  const usuario = (req as any).usuario;
  const { id } = req.params;

  const existente = await prisma.payment.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Pagamento não encontrado" });
  }

  await prisma.payment.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== MANUTENÇÕES =====

app.post("/maintenances", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { description, estimatedCost, propertyId, photoUrl } = req.body;

  const maintenance = await prisma.maintenance.create({
    data: {
      description,
      estimatedCost,
      propertyId,
      photoUrl,
      companyId: usuario.companyId,
    },
  });

  res.status(201).json(maintenance);
});

app.get("/maintenances", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;

  const maintenances = await prisma.maintenance.findMany({
    where: { companyId: usuario.companyId },
    orderBy: { openedAt: "desc" },
    include: {
      property: true,
    },
  });

  res.json(maintenances);
});

app.put("/maintenances/:id", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { id } = req.params;
  const { description, estimatedCost, status, photoUrl } = req.body;

  const existente = await prisma.maintenance.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Manutenção não encontrada" });
  }

  const maintenance = await prisma.maintenance.update({
    where: { id: Number(id) },
    data: { description, estimatedCost, status, photoUrl },
  });

  res.json(maintenance);
});

app.put("/maintenances/:id/concluir", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { id } = req.params;

  const existente = await prisma.maintenance.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Manutenção não encontrada" });
  }

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
  const usuario = (req as any).usuario;
  const { id } = req.params;

  const existente = await prisma.maintenance.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Manutenção não encontrada" });
  }

  await prisma.maintenance.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== AGENDA =====

app.post("/appointments", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { title, description, date, propertyId } = req.body;

  const appointment = await prisma.appointment.create({
    data: {
      title,
      description,
      date: new Date(date),
      propertyId: propertyId ? Number(propertyId) : null,
      companyId: usuario.companyId,
    },
  });

  res.status(201).json(appointment);
});

app.get("/appointments", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;

  const appointments = await prisma.appointment.findMany({
    where: { companyId: usuario.companyId },
    orderBy: { date: "asc" },
    include: {
      property: true,
    },
  });

  res.json(appointments);
});

app.put("/appointments/:id", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { id } = req.params;
  const { title, description, date, status, propertyId } = req.body;

  const existente = await prisma.appointment.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Compromisso não encontrado" });
  }

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
  const usuario = (req as any).usuario;
  const { id } = req.params;

  const existente = await prisma.appointment.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Compromisso não encontrado" });
  }

  await prisma.appointment.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== RELATÓRIOS =====

app.get("/reports/financial", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;

  const pagos = await prisma.payment.aggregate({
    where: { companyId: usuario.companyId, status: "pago" },
    _sum: { value: true },
  });

  const pendentes = await prisma.payment.aggregate({
    where: { companyId: usuario.companyId, status: "pendente" },
    _sum: { value: true },
  });

  res.json({
    totalPago: pagos._sum.value ?? 0,
    totalPendente: pendentes._sum.value ?? 0,
  });
});

// Exporta o relatório financeiro em PDF
app.get("/reports/financial/export/pdf", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;

  const pagamentos = await prisma.payment.findMany({
    where: { companyId: usuario.companyId },
    orderBy: { dueDate: "desc" },
    include: { contract: { include: { property: true, tenant: true } } },
  });

  const totalPago = pagamentos
    .filter((p) => p.status === "pago")
    .reduce((soma, p) => soma + Number(p.value), 0);
  const totalPendente = pagamentos
    .filter((p) => p.status === "pendente")
    .reduce((soma, p) => soma + Number(p.value), 0);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=relatorio-financeiro.pdf",
  );

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(18).text("Relatório Financeiro - ImobFlow", { align: "center" });
  doc.moveDown();
  doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`);
  doc.moveDown();

  doc.fontSize(12).text(`Total Recebido: R$ ${totalPago.toFixed(2)}`);
  doc.text(`Total Pendente: R$ ${totalPendente.toFixed(2)}`);
  doc.moveDown();

  doc.fontSize(14).text("Pagamentos", { underline: true });
  doc.moveDown(0.5);

  pagamentos.forEach((p) => {
    doc
      .fontSize(9)
      .text(
        `${p.contract.property.address} - ${p.contract.tenant.name} | Venc: ${p.dueDate.toLocaleDateString("pt-BR")} | R$ ${Number(p.value).toFixed(2)} | ${p.status}`,
      );
  });

  doc.end();
});

// Exporta o relatório financeiro em Excel
app.get("/reports/financial/export/excel", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;

  const pagamentos = await prisma.payment.findMany({
    where: { companyId: usuario.companyId },
    orderBy: { dueDate: "desc" },
    include: { contract: { include: { property: true, tenant: true } } },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Relatório Financeiro");

  sheet.columns = [
    { header: "Imóvel", key: "imovel", width: 30 },
    { header: "Inquilino", key: "inquilino", width: 25 },
    { header: "Vencimento", key: "vencimento", width: 15 },
    { header: "Valor", key: "valor", width: 15 },
    { header: "Status", key: "status", width: 15 },
  ];

  pagamentos.forEach((p) => {
    sheet.addRow({
      imovel: p.contract.property.address,
      inquilino: p.contract.tenant.name,
      vencimento: p.dueDate.toLocaleDateString("pt-BR"),
      valor: Number(p.value),
      status: p.status,
    });
  });

  sheet.getRow(1).font = { bold: true };

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=relatorio-financeiro.xlsx",
  );

  await workbook.xlsx.write(res);
  res.end();
});

app.get("/reports/properties-status", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;

  const disponiveis = await prisma.property.count({
    where: { companyId: usuario.companyId, status: "disponivel" },
  });

  const alugados = await prisma.property.count({
    where: { companyId: usuario.companyId, status: "alugado" },
  });

  res.json({ disponiveis, alugados });
});

app.get("/reports/expiring-contracts", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const hoje = new Date();
  const em30Dias = new Date();
  em30Dias.setDate(hoje.getDate() + 30);

  const contratos = await prisma.contract.findMany({
    where: {
      companyId: usuario.companyId,
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

app.get("/reports/pending-payments", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;

  const pagamentos = await prisma.payment.findMany({
    where: { companyId: usuario.companyId, status: "pendente" },
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

app.get("/reports/weekly-revenue", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const hoje = new Date();
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(hoje.getDate() - 6);
  seteDiasAtras.setHours(0, 0, 0, 0);

  const pagamentos = await prisma.payment.findMany({
    where: {
      companyId: usuario.companyId,
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

// Relatório de inadimplência agrupado por inquilino
app.get("/reports/delinquency", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const hoje = new Date();

  const pagamentosAtrasados = await prisma.payment.findMany({
    where: {
      companyId: usuario.companyId,
      status: "pendente",
      dueDate: { lt: hoje },
    },
    include: {
      contract: {
        include: { tenant: true, property: true },
      },
    },
  });

  const porInquilino: {
    [tenantId: number]: {
      tenantId: number;
      tenantName: string;
      totalAtrasado: number;
      quantidadePagamentos: number;
      pagamentos: any[];
    };
  } = {};

  pagamentosAtrasados.forEach((pagamento) => {
    const diasAtraso = Math.floor(
      (hoje.getTime() - pagamento.dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const valorOriginal = Number(pagamento.value);
    const multa = valorOriginal * 0.02;
    const juros = valorOriginal * 0.01 * (diasAtraso / 30);
    const valorAtualizado = valorOriginal + multa + juros;

    const tenantId = pagamento.contract.tenant.id;

    if (!porInquilino[tenantId]) {
      porInquilino[tenantId] = {
        tenantId,
        tenantName: pagamento.contract.tenant.name,
        totalAtrasado: 0,
        quantidadePagamentos: 0,
        pagamentos: [],
      };
    }

    porInquilino[tenantId].totalAtrasado += valorAtualizado;
    porInquilino[tenantId].quantidadePagamentos += 1;
    porInquilino[tenantId].pagamentos.push({
      id: pagamento.id,
      propertyAddress: pagamento.contract.property.address,
      dueDate: pagamento.dueDate,
      valorOriginal,
      valorAtualizado: Number(valorAtualizado.toFixed(2)),
      diasAtraso,
    });
  });

  const resultado = Object.values(porInquilino)
    .map((item) => ({
      ...item,
      totalAtrasado: Number(item.totalAtrasado.toFixed(2)),
    }))
    .sort((a, b) => b.totalAtrasado - a.totalAtrasado);

  res.json(resultado);
});

// Calcula o repasse devido a cada proprietário (aluguel recebido menos taxa de administração)
app.get("/reports/owner-payouts", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;

  const company = await prisma.company.findUnique({
    where: { id: usuario.companyId },
  });

  const taxaPercentual = Number(company?.adminFeePercentage ?? 10);

  const pagamentosPagos = await prisma.payment.findMany({
    where: { companyId: usuario.companyId, status: "pago" },
    include: {
      contract: {
        include: { owner: true, property: true },
      },
    },
  });

  const porProprietario: {
    [ownerId: number]: {
      ownerId: number;
      ownerName: string;
      totalRecebido: number;
      taxaAdministracao: number;
      valorRepasse: number;
      quantidadePagamentos: number;
    };
  } = {};

  pagamentosPagos.forEach((pagamento) => {
    const ownerId = pagamento.contract.owner.id;
    const valor = Number(pagamento.value);
    const taxa = valor * (taxaPercentual / 100);
    const repasse = valor - taxa;

    if (!porProprietario[ownerId]) {
      porProprietario[ownerId] = {
        ownerId,
        ownerName: pagamento.contract.owner.name,
        totalRecebido: 0,
        taxaAdministracao: 0,
        valorRepasse: 0,
        quantidadePagamentos: 0,
      };
    }

    porProprietario[ownerId].totalRecebido += valor;
    porProprietario[ownerId].taxaAdministracao += taxa;
    porProprietario[ownerId].valorRepasse += repasse;
    porProprietario[ownerId].quantidadePagamentos += 1;
  });

  const resultado = Object.values(porProprietario).map((item) => ({
    ...item,
    totalRecebido: Number(item.totalRecebido.toFixed(2)),
    taxaAdministracao: Number(item.taxaAdministracao.toFixed(2)),
    valorRepasse: Number(item.valorRepasse.toFixed(2)),
  }));

  res.json({ taxaPercentual, proprietarios: resultado });
});

// ===== BUSCA =====

app.get("/search", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const query = String(req.query.q || "");

  if (!query.trim()) {
    return res.json({ properties: [], owners: [], tenants: [] });
  }

  const properties = await prisma.property.findMany({
    where: {
      companyId: usuario.companyId,
      address: { contains: query, mode: "insensitive" },
    },
    take: 5,
  });

  const owners = await prisma.owner.findMany({
    where: {
      companyId: usuario.companyId,
      name: { contains: query, mode: "insensitive" },
    },
    take: 5,
  });

  const tenants = await prisma.tenant.findMany({
    where: {
      companyId: usuario.companyId,
      name: { contains: query, mode: "insensitive" },
    },
    take: 5,
  });

  res.json({ properties, owners, tenants });
});

// ===== UPLOAD =====

app.post("/upload", autenticar, upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado" });
  }
  const url = `http://localhost:3333/uploads/${req.file.filename}`;
  res.json({ url });
});

// ===== SUPORTE =====

app.post("/support", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Preencha todos os campos" });
  }

  const supportMessage = await prisma.supportMessage.create({
    data: { name, email, message },
  });

  res.status(201).json(supportMessage);
});

app.get("/support", autenticar, somenteAdmin, async (req, res) => {
  const messages = await prisma.supportMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json(messages);
});

// ===== VISTORIAS =====

app.post("/inspections", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { type, propertyId, contractId, items } = req.body;

  if (!type || !propertyId || !items || items.length === 0) {
    return res.status(400).json({ error: "Preencha os dados da vistoria" });
  }

  const inspection = await prisma.inspection.create({
    data: {
      type,
      propertyId: Number(propertyId),
      contractId: contractId ? Number(contractId) : null,
      companyId: usuario.companyId,
      items: {
        create: items.map((item: any) => ({
          roomName: item.roomName,
          observation: item.observation || null,
          photoUrl: item.photoUrl || null,
        })),
      },
    },
    include: { items: true },
  });

  res.status(201).json(inspection);
});

app.get("/inspections", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const { propertyId } = req.query;

  const inspections = await prisma.inspection.findMany({
    where: {
      companyId: usuario.companyId,
      ...(propertyId ? { propertyId: Number(propertyId) } : {}),
    },
    orderBy: { date: "desc" },
    include: {
      property: true,
      items: true,
      contract: {
        include: { owner: true, tenant: true },
      },
    },
  });

  res.json(inspections);
});

app.delete("/inspections/:id", autenticar, somenteAdmin, async (req, res) => {
  const usuario = (req as any).usuario;
  const { id } = req.params;

  const existente = await prisma.inspection.findFirst({
    where: { id: Number(id), companyId: usuario.companyId },
  });

  if (!existente) {
    return res.status(404).json({ error: "Vistoria não encontrada" });
  }

  await prisma.inspectionItem.deleteMany({
    where: { inspectionId: Number(id) },
  });
  await prisma.inspection.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== PORTAL DO PROPRIETÁRIO =====

app.post("/owner-portal/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  const owner = await prisma.owner.findFirst({
    where: { email },
  });

  if (!owner || !owner.passwordHash) {
    return res
      .status(401)
      .json({ error: "Email ou senha inválidos, ou acesso não liberado" });
  }

  const senhaCorreta = await bcrypt.compare(password, owner.passwordHash);

  if (!senhaCorreta) {
    return res.status(401).json({ error: "Email ou senha inválidos" });
  }

  const token = jwt.sign(
    {
      id: owner.id,
      email: owner.email,
      tipo: "proprietario",
      companyId: owner.companyId,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  res.json({
    token,
    precisaTrocarSenha: owner.precisaTrocarSenha,
    owner: { id: owner.id, name: owner.name, email: owner.email },
  });
});

app.put(
  "/owner-portal/change-password",
  autenticarProprietario,
  async (req, res) => {
    const proprietario = (req as any).proprietario;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "A nova senha deve ter pelo menos 6 caracteres" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.owner.update({
      where: { id: proprietario.id },
      data: { passwordHash, precisaTrocarSenha: false },
    });

    res.json({ sucesso: true });
  },
);

app.get("/owner-portal/me", autenticarProprietario, async (req, res) => {
  const proprietario = (req as any).proprietario;

  const owner = await prisma.owner.findUnique({
    where: { id: proprietario.id },
    select: { id: true, name: true, email: true, phone: true, address: true },
  });

  res.json(owner);
});

// Middleware: autentica o inquilino no portal próprio
function autenticarInquilino(
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
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    if (payload.tipo !== "inquilino") {
      return res.status(401).json({ error: "Token inválido para este acesso" });
    }
    (req as any).inquilino = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

app.get("/owner-portal/contracts", autenticarProprietario, async (req, res) => {
  const proprietario = (req as any).proprietario;

  const contracts = await prisma.contract.findMany({
    where: { ownerId: proprietario.id },
    include: { property: true, tenant: true },
    orderBy: { createdAt: "desc" },
  });

  res.json(contracts);
});

app.get("/owner-portal/payouts", autenticarProprietario, async (req, res) => {
  const proprietario = (req as any).proprietario;

  const company = await prisma.company.findUnique({
    where: { id: proprietario.companyId },
  });
  const taxaPercentual = Number(company?.adminFeePercentage ?? 10);

  const pagamentosPagos = await prisma.payment.findMany({
    where: {
      contract: { ownerId: proprietario.id },
      status: "pago",
    },
    include: { contract: { include: { property: true } } },
    orderBy: { paidAt: "desc" },
  });

  const resultado = pagamentosPagos.map((p) => {
    const valor = Number(p.value);
    const taxa = valor * (taxaPercentual / 100);
    return {
      id: p.id,
      propertyAddress: p.contract.property.address,
      paidAt: p.paidAt,
      valorRecebido: valor,
      taxaAdministracao: Number(taxa.toFixed(2)),
      valorRepasse: Number((valor - taxa).toFixed(2)),
    };
  });

  res.json({ taxaPercentual, repasses: resultado });
});

app.get(
  "/owner-portal/inspections",
  autenticarProprietario,
  async (req, res) => {
    const proprietario = (req as any).proprietario;

    const inspections = await prisma.inspection.findMany({
      where: {
        contract: { ownerId: proprietario.id },
      },
      include: { property: true, items: true },
      orderBy: { date: "desc" },
    });

    res.json(inspections);
  },
);

// ===== PORTAL DO INQUILINO =====

app.post("/tenant-portal/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  const tenant = await prisma.tenant.findFirst({
    where: { email },
  });

  if (!tenant || !tenant.passwordHash) {
    return res
      .status(401)
      .json({ error: "Email ou senha inválidos, ou acesso não liberado" });
  }

  const senhaCorreta = await bcrypt.compare(password, tenant.passwordHash);

  if (!senhaCorreta) {
    return res.status(401).json({ error: "Email ou senha inválidos" });
  }

  const token = jwt.sign(
    {
      id: tenant.id,
      email: tenant.email,
      tipo: "inquilino",
      companyId: tenant.companyId,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  res.json({
    token,
    precisaTrocarSenha: tenant.precisaTrocarSenha,
    tenant: { id: tenant.id, name: tenant.name, email: tenant.email },
  });
});

app.put(
  "/tenant-portal/change-password",
  autenticarInquilino,
  async (req, res) => {
    const inquilino = (req as any).inquilino;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "A nova senha deve ter pelo menos 6 caracteres" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.tenant.update({
      where: { id: inquilino.id },
      data: { passwordHash, precisaTrocarSenha: false },
    });

    res.json({ sucesso: true });
  },
);

app.get("/tenant-portal/me", autenticarInquilino, async (req, res) => {
  const inquilino = (req as any).inquilino;

  const tenant = await prisma.tenant.findUnique({
    where: { id: inquilino.id },
    select: { id: true, name: true, email: true, phone: true },
  });

  res.json(tenant);
});

app.get("/tenant-portal/contracts", autenticarInquilino, async (req, res) => {
  const inquilino = (req as any).inquilino;

  const contracts = await prisma.contract.findMany({
    where: { tenantId: inquilino.id },
    include: { property: true, owner: true },
    orderBy: { createdAt: "desc" },
  });

  res.json(contracts);
});

app.get("/tenant-portal/payments", autenticarInquilino, async (req, res) => {
  const inquilino = (req as any).inquilino;

  const payments = await prisma.payment.findMany({
    where: { contract: { tenantId: inquilino.id } },
    include: { contract: { include: { property: true } } },
    orderBy: { dueDate: "desc" },
  });

  const hoje = new Date();

  const paymentsComAtraso = payments.map((payment) => {
    if (payment.status !== "pendente" || payment.dueDate >= hoje) {
      return {
        ...payment,
        diasAtraso: 0,
        valorAtualizado: Number(payment.value),
      };
    }

    const diasAtraso = Math.floor(
      (hoje.getTime() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const valorOriginal = Number(payment.value);
    const multa = valorOriginal * 0.02;
    const juros = valorOriginal * 0.01 * (diasAtraso / 30);
    const valorAtualizado = valorOriginal + multa + juros;

    return {
      ...payment,
      diasAtraso,
      valorAtualizado: Number(valorAtualizado.toFixed(2)),
    };
  });

  res.json(paymentsComAtraso);
});

app.post(
  "/tenant-portal/maintenances",
  autenticarInquilino,
  async (req, res) => {
    const inquilino = (req as any).inquilino;
    const { description, propertyId } = req.body;

    if (!description || !propertyId) {
      return res
        .status(400)
        .json({ error: "Descreva o problema e informe o imóvel" });
    }

    // Confirma que o inquilino realmente tem um contrato ativo nesse imóvel
    const contract = await prisma.contract.findFirst({
      where: { tenantId: inquilino.id, propertyId: Number(propertyId) },
    });

    if (!contract) {
      return res
        .status(403)
        .json({ error: "Você não tem um contrato vinculado a este imóvel" });
    }

    const maintenance = await prisma.maintenance.create({
      data: {
        description,
        estimatedCost: 0,
        propertyId: Number(propertyId),
        companyId: inquilino.companyId,
      },
    });

    res.status(201).json(maintenance);
  },
);

// Gera um PDF (2ª via) de um pagamento específico do inquilino
app.get(
  "/tenant-portal/payments/:id/pdf",
  autenticarInquilino,
  async (req, res) => {
    const inquilino = (req as any).inquilino;
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        id: Number(id),
        contract: { tenantId: inquilino.id },
      },
      include: {
        contract: { include: { property: true, owner: true, tenant: true } },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Pagamento não encontrado" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=2via-pagamento-${payment.id}.pdf`,
    );

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc
      .fontSize(18)
      .text("ImobFlow - Comprovante de Pagamento", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(12).text(`Imóvel: ${payment.contract.property.address}`);
    doc.text(`Inquilino: ${payment.contract.tenant.name}`);
    doc.text(`Proprietário: ${payment.contract.owner.name}`);
    doc.moveDown();

    doc.fontSize(14).text("Detalhes do pagamento", { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .text(`Vencimento: ${payment.dueDate.toLocaleDateString("pt-BR")}`);
    doc.text(`Valor: R$ ${Number(payment.value).toFixed(2)}`);
    doc.text(`Status: ${payment.status === "pago" ? "Pago" : "Pendente"}`);

    if (payment.paidAt) {
      doc.text(
        `Data do pagamento: ${payment.paidAt.toLocaleDateString("pt-BR")}`,
      );
    }

    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor("gray")
      .text(`Documento gerado em ${new Date().toLocaleString("pt-BR")}`);

    doc.end();
  },
);

app.get(
  "/tenant-portal/maintenances",
  autenticarInquilino,
  async (req, res) => {
    const inquilino = (req as any).inquilino;

    const contracts = await prisma.contract.findMany({
      where: { tenantId: inquilino.id },
      select: { propertyId: true },
    });

    const propertyIds = contracts.map((c) => c.propertyId);

    const maintenances = await prisma.maintenance.findMany({
      where: { propertyId: { in: propertyIds } },
      include: { property: true },
      orderBy: { openedAt: "desc" },
    });

    res.json(maintenances);
  },
);

// ===== NOTIFICAÇÕES =====

app.get("/notifications", autenticar, async (req, res) => {
  const usuario = (req as any).usuario;
  const hoje = new Date();
  const em7Dias = new Date();
  em7Dias.setDate(hoje.getDate() + 7);
  const em5Dias = new Date();
  em5Dias.setDate(hoje.getDate() + 5);

  const notificacoes: any[] = [];

  const contratosVencendo = await prisma.contract.findMany({
    where: {
      companyId: usuario.companyId,
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

  // Pagamentos que vão vencer nos próximos 5 dias (lembrete antes do atraso)
  const pagamentosProximosVencimento = await prisma.payment.findMany({
    where: {
      companyId: usuario.companyId,
      status: "pendente",
      dueDate: { gte: hoje, lte: em5Dias },
    },
    include: { contract: { include: { property: true, tenant: true } } },
  });

  pagamentosProximosVencimento.forEach((pagamento) => {
    const dias = Math.ceil(
      (pagamento.dueDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
    );
    notificacoes.push({
      tipo: "pagamento_a_vencer",
      mensagem: `Pagamento de ${pagamento.contract.tenant.name} (${pagamento.contract.property.address}) vence em ${dias} dia(s)`,
    });
  });

  const pagamentosAtrasados = await prisma.payment.findMany({
    where: {
      companyId: usuario.companyId,
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

  const manutencoesPendentes = await prisma.maintenance.findMany({
    where: { companyId: usuario.companyId, status: "pendente" },
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
  const usuario = (req as any).usuario;
  const { question } = req.body;

  try {
    const [imoveis, contratos, pagamentos, manutencoes] = await Promise.all([
      prisma.property.findMany({ where: { companyId: usuario.companyId } }),
      prisma.contract.findMany({
        where: { companyId: usuario.companyId },
        include: { property: true, tenant: true },
      }),
      prisma.payment.findMany({
        where: { companyId: usuario.companyId },
        include: { contract: { include: { property: true } } },
      }),
      prisma.maintenance.findMany({
        where: { companyId: usuario.companyId },
        include: { property: true },
      }),
    ]);

    const contexto = {
      imoveis,
      contratos,
      pagamentos,
      manutencoes,
    };

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
