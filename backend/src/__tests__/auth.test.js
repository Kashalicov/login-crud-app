process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";

const request = require("supertest");
const app = require("../app");

describe("POST /api/auth/registrar", () => {
  it("cria um novo usuário e retorna um token", async () => {
    const resposta = await request(app).post("/api/auth/registrar").send({
      nome: "Maria Teste",
      email: `maria-${Date.now()}@exemplo.com`,
      senha: "senha123",
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toHaveProperty("token");
    expect(resposta.body.usuario).toHaveProperty("nome", "Maria Teste");
  });

  it("rejeita registro sem senha", async () => {
    const resposta = await request(app).post("/api/auth/registrar").send({
      nome: "Sem Senha",
      email: "semsenha@exemplo.com",
    });

    expect(resposta.status).toBe(400);
  });

  it("rejeita e-mail duplicado", async () => {
    const email = `duplicado-${Date.now()}@exemplo.com`;
    await request(app)
      .post("/api/auth/registrar")
      .send({ nome: "Primeiro", email, senha: "senha123" });

    const resposta = await request(app)
      .post("/api/auth/registrar")
      .send({ nome: "Segundo", email, senha: "outrasenha" });

    expect(resposta.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  it("autentica um usuário com credenciais corretas", async () => {
    const email = `login-${Date.now()}@exemplo.com`;
    await request(app)
      .post("/api/auth/registrar")
      .send({ nome: "Login Teste", email, senha: "senha123" });

    const resposta = await request(app)
      .post("/api/auth/login")
      .send({ email, senha: "senha123" });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveProperty("token");
  });

  it("rejeita senha incorreta", async () => {
    const email = `senhaerrada-${Date.now()}@exemplo.com`;
    await request(app)
      .post("/api/auth/registrar")
      .send({ nome: "Teste", email, senha: "senhacerta" });

    const resposta = await request(app)
      .post("/api/auth/login")
      .send({ email, senha: "senhaerrada" });

    expect(resposta.status).toBe(401);
  });
});
