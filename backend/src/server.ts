import "dotenv/config";

import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 3333;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Middleware: permite o Express entender dados enviados em JSON
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ImobFlow API está funcionando!");
});

// Rota de cadastro de usuário
app.post("/users", async (req, res) => {
  const { name, email, password } = req.body;

  // "Tritura" a senha antes de guardar (nunca salvamos a senha original)
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

  // 1. Busca o usuário pelo email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ error: "Email ou senha inválidos" });
  }

  // 2. Compara a senha digitada com o hash guardado
  const senhaCorreta = await bcrypt.compare(password, user.passwordHash);

  if (!senhaCorreta) {
    return res.status(401).json({ error: "Email ou senha inválidos" });
  }

  // 3. Gera o token ("atestado temporário")
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  // 4. Devolve o token e os dados básicos do usuário
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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
