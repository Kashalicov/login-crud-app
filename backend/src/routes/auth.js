const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../db");
const rota = require("../rota");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/registrar",
  rota(async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
    }

    if (senha.length < 6) {
      return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres." });
    }

    const usuarioExistente = await db.get("SELECT id FROM usuarios WHERE email = ?", [email]);

    if (usuarioExistente) {
      return res.status(409).json({ erro: "Já existe uma conta com esse e-mail." });
    }

    const senhaHash = bcrypt.hashSync(senha, 10);

    const { id } = await db.get(
      "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?) RETURNING id",
      [nome, email, senhaHash]
    );

    const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({ token, usuario: { id, nome, email } });
  })
);

router.post(
  "/login",
  rota(async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "E-mail e senha são obrigatórios." });
    }

    const usuario = await db.get("SELECT * FROM usuarios WHERE email = ?", [email]);

    if (!usuario || !bcrypt.compareSync(senha, usuario.senha_hash)) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos." });
    }

    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  })
);

module.exports = router;
