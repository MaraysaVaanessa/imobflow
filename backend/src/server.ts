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

  res.json({
    imoveis: totalImoveis,
    contratos: 0,
    proprietarios: totalProprietarios,
    inquilinos: totalInquilinos,
  });
});

// CREATE: Rota de cadastro de imóvel
app.post("/properties", autenticar, async (req, res) => {
  const { address, type, rentValue, bedrooms, bathrooms } = req.body;

  const property = await prisma.property.create({
    data: {
      address,
      type,
      rentValue,
      bedrooms,
      bathrooms,
    },
  });

  res.status(201).json(property);
});

// READ: Rota de listagem de imóveis
app.get("/properties", autenticar, async (req, res) => {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json(properties);
});

// UPDATE: Rota de edição de imóvel
app.put("/properties/:id", autenticar, async (req, res) => {
  const { id } = req.params;
  const { address, type, rentValue, bedrooms, bathrooms, status } = req.body;

  const property = await prisma.property.update({
    where: { id: Number(id) },
    data: {
      address,
      type,
      rentValue,
      bedrooms,
      bathrooms,
      status,
    },
  });

  res.json(property);
});

// DELETE: Rota de exclusão de imóvel
app.delete("/properties/:id", autenticar, async (req, res) => {
  const { id } = req.params;

  await prisma.property.delete({
    where: { id: Number(id) },
  });

  res.status(204).send();
});

// CREATE: Rota de cadastro de inquilino
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

// READ: Rota de listagem de inquilinos
app.get("/tenants", autenticar, async (req, res) => {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json(tenants);
});

// UPDATE: Rota de edição de inquilino
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

// DELETE: Rota de exclusão de inquilino
app.delete("/tenants/:id", autenticar, async (req, res) => {
  const { id } = req.params;

  await prisma.tenant.delete({
    where: { id: Number(id) },
  });

  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// CREATE: Rota de cadastro de proprietário
app.post("/owners", autenticar, async (req, res) => {
  const { name, phone, email, cpf, address } = req.body;

  const owner = await prisma.owner.create({
    data: {
      name,
      phone,
      email,
      cpf,
      address,
    },
  });

  res.status(201).json(owner);
});

// READ: Rota de listagem de proprietários
app.get("/owners", autenticar, async (req, res) => {
  const owners = await prisma.owner.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json(owners);
});

// UPDATE: Rota de edição de proprietário
app.put("/owners/:id", autenticar, async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, cpf, address } = req.body;

  const owner = await prisma.owner.update({
    where: { id: Number(id) },
    data: {
      name,
      phone,
      email,
      cpf,
      address,
    },
  });

  res.json(owner);
});

// DELETE: Rota de exclusão de proprietário
app.delete("/owners/:id", autenticar, async (req, res) => {
  const { id } = req.params;

  await prisma.owner.delete({
    where: { id: Number(id) },
  });

  res.status(204).send();
});
