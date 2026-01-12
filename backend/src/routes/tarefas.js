const express = require("express");

const db = require("../db");
const { autenticar } = require("../middleware/auth");

const router = express.Router();

router.use(autenticar);

// Listar tarefas do usuário autenticado
router.get("/", (req, res) => {
  const tarefas = db
    .prepare("SELECT * FROM tarefas WHERE usuario_id = ? ORDER BY criado_em DESC")
    .all(req.usuarioId);

  res.json(tarefas);
});

// Criar tarefa
router.post("/", (req, res) => {
  const { titulo, descricao } = req.body;

  if (!titulo || !titulo.trim()) {
    return res.status(400).json({ erro: "O título é obrigatório." });
  }

  const resultado = db
    .prepare("INSERT INTO tarefas (usuario_id, titulo, descricao) VALUES (?, ?, ?)")
    .run(req.usuarioId, titulo.trim(), descricao || "");

  const tarefa = db
    .prepare("SELECT * FROM tarefas WHERE id = ?")
    .get(resultado.lastInsertRowid);

  res.status(201).json(tarefa);
});

// Buscar tarefa por id (garante que pertence ao usuário)
function buscarTarefaDoUsuario(id, usuarioId) {
  return db
    .prepare("SELECT * FROM tarefas WHERE id = ? AND usuario_id = ?")
    .get(id, usuarioId);
}

// Atualizar tarefa
router.put("/:id", (req, res) => {
  const tarefa = buscarTarefaDoUsuario(req.params.id, req.usuarioId);

  if (!tarefa) {
    return res.status(404).json({ erro: "Tarefa não encontrada." });
  }

  const titulo = req.body.titulo !== undefined ? req.body.titulo : tarefa.titulo;
  const descricao =
    req.body.descricao !== undefined ? req.body.descricao : tarefa.descricao;
  const concluida =
    req.body.concluida !== undefined ? (req.body.concluida ? 1 : 0) : tarefa.concluida;

  db.prepare(
    "UPDATE tarefas SET titulo = ?, descricao = ?, concluida = ? WHERE id = ?"
  ).run(titulo, descricao, concluida, tarefa.id);

  const tarefaAtualizada = db
    .prepare("SELECT * FROM tarefas WHERE id = ?")
    .get(tarefa.id);

  res.json(tarefaAtualizada);
});

// Excluir tarefa
router.delete("/:id", (req, res) => {
  const tarefa = buscarTarefaDoUsuario(req.params.id, req.usuarioId);

  if (!tarefa) {
    return res.status(404).json({ erro: "Tarefa não encontrada." });
  }

  db.prepare("DELETE FROM tarefas WHERE id = ?").run(tarefa.id);

  res.status(204).send();
});

module.exports = router;
