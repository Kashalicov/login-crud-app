const path = require("path");
const bcrypt = require("bcryptjs");

// PostgreSQL em produção (DATABASE_URL); SQLite local e nos testes.
// As duas implementações expõem a mesma interface assíncrona:
//   all(sql, params) -> linhas | get(sql, params) -> 1ª linha | run(sql, params) -> { changes }
// O SQL é escrito com "?" e convertido para $1, $2... no Postgres.
const usarPostgres = Boolean(process.env.DATABASE_URL) && process.env.NODE_ENV !== "test";

function criarSqlite() {
  const Database = require("better-sqlite3");
  // Banco em memória nos testes (NODE_ENV=test) para isolar cada execução.
  const arquivo =
    process.env.NODE_ENV === "test" ? ":memory:" : path.join(__dirname, "..", "database.sqlite");
  const conexao = new Database(arquivo);
  conexao.pragma("journal_mode = WAL");

  return {
    async all(sql, params = []) {
      return conexao.prepare(sql).all(...params);
    },
    async get(sql, params = []) {
      return conexao.prepare(sql).get(...params);
    },
    async run(sql, params = []) {
      return { changes: conexao.prepare(sql).run(...params).changes };
    },
    async exec(sql) {
      conexao.exec(sql);
    },
    schema: `
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
    `,
  };
}

function criarPostgres() {
  const { Pool } = require("pg");
  const url = new URL(process.env.DATABASE_URL);
  // Conexão cifrada sem validar a cadeia do certificado, como o sslmode=require
  // do libpq. O parâmetro sai da URL porque o pg o interpretaria como verify-full.
  const exigeSsl = ["require", "prefer", "verify-ca", "verify-full"].includes(
    url.searchParams.get("sslmode")
  );
  url.searchParams.delete("sslmode");
  url.searchParams.delete("ssl");

  // Schema próprio num Postgres compartilhado com outros projetos (opcional).
  const schema = process.env.DB_SCHEMA;
  const pool = new Pool({
    connectionString: url.toString(),
    ssl: exigeSsl ? { rejectUnauthorized: false } : undefined,
    options: schema ? `-c search_path=${schema}` : undefined,
    max: 5,
  });

  const paraPg = (sql) => {
    let n = 0;
    return sql.replace(/\?/g, () => `$${++n}`);
  };

  return {
    async all(sql, params = []) {
      return (await pool.query(paraPg(sql), params)).rows;
    },
    async get(sql, params = []) {
      return (await pool.query(paraPg(sql), params)).rows[0];
    },
    async run(sql, params = []) {
      return { changes: (await pool.query(paraPg(sql), params)).rowCount };
    },
    async exec(sql) {
      await pool.query(sql);
    },
    schema: `
      ${schema ? `CREATE SCHEMA IF NOT EXISTS "${schema}";` : ""}
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS tarefas (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
        titulo TEXT NOT NULL,
        descricao TEXT,
        concluida INTEGER NOT NULL DEFAULT 0,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
  };
}

const db = usarPostgres ? criarPostgres() : criarSqlite();

async function seedDadosExemplo() {
  const jaExiste = await db.get("SELECT id FROM usuarios WHERE email = ?", ["demo@exemplo.com"]);
  if (jaExiste) return;

  const senhaHash = bcrypt.hashSync("demo1234", 10);
  const usuario = await db.get(
    "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?) RETURNING id",
    ["Usuário Demo", "demo@exemplo.com", senhaHash]
  );

  const tarefas = [
    ["Revisar proposta comercial", "Enviar para o cliente até sexta", 0],
    ["Configurar ambiente de testes", null, 0],
    ["Responder e-mails pendentes", null, 1],
  ];
  for (const [titulo, descricao, concluida] of tarefas) {
    await db.run(
      "INSERT INTO tarefas (usuario_id, titulo, descricao, concluida) VALUES (?, ?, ?, ?)",
      [usuario.id, titulo, descricao, concluida]
    );
  }
}

// Cria as tabelas (e os dados de exemplo fora dos testes). Chamado uma vez
// pelo server.js antes de abrir a porta, e pelo app nos testes.
let pronto;
db.iniciar = () => {
  if (!pronto) {
    pronto = (async () => {
      await db.exec(db.schema);
      if (process.env.NODE_ENV !== "test") await seedDadosExemplo();
    })();
  }
  return pronto;
};

module.exports = db;
