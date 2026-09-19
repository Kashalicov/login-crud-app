const express = require("express");

const db = require("../db");
const rota = require("../rota");
const { autenticar } = require("../middleware/auth");

const router = express.Router();

router.use(autenticar);

// Listar tarefas do usuário autenticado
router.get(
  "/",
  rota(async (req, res) => {
    const tarefas = await db.all(
      "SELECT * FROM tarefas WHERE usuario_id = ? ORDER BY criado_em DESC, id DESC",
      [req.usuarioId]
    );

    res.json(tarefas);
  })
);

// Criar tarefa
router.post(
  "/",
  rota(async (req, res) => {
    const { titulo, descricao } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ erro: "O título é obrigatório." });
    }

    const tarefa = await db.get(
      "INSERT INTO tarefas (usuario_id, titulo, descricao) VALUES (?, ?, ?) RETURNING *",
      [req.usuarioId, titulo.trim(), descricao || ""]
    );

    res.status(201).json(tarefa);
  })
);

// Buscar tarefa por id (garante que pertence ao usuário)
function buscarTarefaDoUsuario(id, usuarioId) {
  // Id não numérico nunca existe; evita erro de tipo no Postgres (integer).
  if (!/^\d+$/.test(String(id))) return Promise.resolve(undefined);
  return db.get("SELECT * FROM tarefas WHERE id = ? AND usuario_id = ?", [Number(id), usuarioId]);
}

// Atualizar tarefa
router.put(
  "/:id",
  rota(async (req, res) => {
    const tarefa = await buscarTarefaDoUsuario(req.params.id, req.usuarioId);

    if (!tarefa) {
      return res.status(404).json({ erro: "Tarefa não encontrada." });
    }

    const titulo = req.body.titulo !== undefined ? req.body.titulo : tarefa.titulo;
    const descricao = req.body.descricao !== undefined ? req.body.descricao : tarefa.descricao;
    const concluida =
      req.body.concluida !== undefined ? (req.body.concluida ? 1 : 0) : tarefa.concluida;

    const tarefaAtualizada = await db.get(
      "UPDATE tarefas SET titulo = ?, descricao = ?, concluida = ? WHERE id = ? RETURNING *",
      [titulo, descricao, concluida, tarefa.id]
    );

    res.json(tarefaAtualizada);
  })
);

// Excluir tarefa
router.delete(
  "/:id",
  rota(async (req, res) => {
    const tarefa = await buscarTarefaDoUsuario(req.params.id, req.usuarioId);

    if (!tarefa) {
      return res.status(404).json({ erro: "Tarefa não encontrada." });
    }

    await db.run("DELETE FROM tarefas WHERE id = ?", [tarefa.id]);

    res.status(204).send();
  })
);

module.exports = router;
