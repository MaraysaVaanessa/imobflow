import "dotenv/config";

import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();
const PORT = 3333;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

// ===== IMÓVEIS =====

app.post("/properties", autenticar, async (req, res) => {
  const { address, type, rentValue, bedrooms, bathrooms } = req.body;

  const property = await prisma.property.create({
    data: { address, type, rentValue, bedrooms, bathrooms },
  });

  res.status(201).json(property);
});

app.get("/properties", autenticar, async (req, res) => {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json(properties);
});

app.put("/properties/:id", autenticar, async (req, res) => {
  const { id } = req.params;
  const { address, type, rentValue, bedrooms, bathrooms, status } = req.body;

  const property = await prisma.property.update({
    where: { id: Number(id) },
    data: { address, type, rentValue, bedrooms, bathrooms, status },
  });

  res.json(property);
});

app.delete("/properties/:id", autenticar, async (req, res) => {
  const { id } = req.params;

  await prisma.property.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== PROPRIETÁRIOS =====

app.post("/owners", autenticar, async (req, res) => {
  const { name, phone, email, cpf, address } = req.body;

  const owner = await prisma.owner.create({
    data: { name, phone, email, cpf, address },
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
  const { name, phone, email, cpf, address } = req.body;

  const owner = await prisma.owner.update({
    where: { id: Number(id) },
    data: { name, phone, email, cpf, address },
  });

  res.json(owner);
});

app.delete("/owners/:id", autenticar, async (req, res) => {
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

app.delete("/tenants/:id", autenticar, async (req, res) => {
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

app.delete("/contracts/:id", autenticar, async (req, res) => {
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

app.delete("/payments/:id", autenticar, async (req, res) => {
  const { id } = req.params;

  await prisma.payment.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

// ===== MANUTENÇÕES =====

app.post("/maintenances", autenticar, async (req, res) => {
  const { description, estimatedCost, propertyId } = req.body;

  const maintenance = await prisma.maintenance.create({
    data: {
      description,
      estimatedCost,
      propertyId,
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
  const { description, estimatedCost, status } = req.body;

  const maintenance = await prisma.maintenance.update({
    where: { id: Number(id) },
    data: { description, estimatedCost, status },
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

app.delete("/maintenances/:id", autenticar, async (req, res) => {
  const { id } = req.params;

  await prisma.maintenance.delete({ where: { id: Number(id) } });

  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
