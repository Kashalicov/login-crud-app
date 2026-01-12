const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const tarefasRoutes = require("./routes/tarefas");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/tarefas", tarefasRoutes);

// Handler de erro genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor." });
});

module.exports = app;
