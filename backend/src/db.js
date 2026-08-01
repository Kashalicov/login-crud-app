const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

// Usa banco em memória durante os testes (NODE_ENV=test) para isolar cada execução.
const dbPath =
  process.env.NODE_ENV === "test"
    ? ":memory:"
    : path.join(__dirname, "..", "database.sqlite");

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tarefas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    concluida INTEGER NOT NULL DEFAULT 0,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
  );
`);

function seedDadosExemplo() {
  const jaExiste = db.prepare("SELECT id FROM usuarios WHERE email = ?").get("demo@exemplo.com");
  if (jaExiste) return;

  const senhaHash = bcrypt.hashSync("demo1234", 10);
  const resultado = db
    .prepare("INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)")
    .run("Usuário Demo", "demo@exemplo.com", senhaHash);

  const tarefas = [
    ["Revisar proposta comercial", "Enviar para o cliente até sexta", 0],
    ["Configurar ambiente de testes", null, 0],
    ["Responder e-mails pendentes", null, 1],
  ];
  const inserirTarefa = db.prepare(
    "INSERT INTO tarefas (usuario_id, titulo, descricao, concluida) VALUES (?, ?, ?, ?)"
  );
  for (const [titulo, descricao, concluida] of tarefas) {
    inserirTarefa.run(resultado.lastInsertRowid, titulo, descricao, concluida);
  }
}

if (process.env.NODE_ENV !== "test") {
  seedDadosExemplo();
}

module.exports = db;
