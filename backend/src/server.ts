import express from "express";

const app = express();
const PORT = 3333;

app.get("/", (req, res) => {
  res.send("ImobFlow API está funcionando!");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
