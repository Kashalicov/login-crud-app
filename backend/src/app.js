const express = require("express");
const cors = require("cors");

const db = require("./db");
const authRoutes = require("./routes/auth");
const tarefasRoutes = require("./routes/tarefas");

const app = express();

app.use(cors());
app.use(express.json());

// Garante as tabelas antes da primeira requisição (no server.js isso já
// acontece antes de abrir a porta; aqui cobre os testes, que usam só o app).
app.use((req, res, next) => {
  db.iniciar().then(() => next(), next);
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/tarefas", tarefasRoutes);

// Handler de erro genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor." });
});

module.exports = app;
