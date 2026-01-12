process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";

const request = require("supertest");
const app = require("../app");

async function criarUsuarioEObterToken() {
  const email = `usuario-${Date.now()}-${Math.random()}@exemplo.com`;
  const resposta = await request(app)
    .post("/api/auth/registrar")
    .send({ nome: "Usuário Tarefas", email, senha: "senha123" });

  return resposta.body.token;
}

describe("Rotas de tarefas (protegidas)", () => {
  it("bloqueia acesso sem token", async () => {
    const resposta = await request(app).get("/api/tarefas");
    expect(resposta.status).toBe(401);
  });

  it("cria e lista tarefas do usuário autenticado", async () => {
    const token = await criarUsuarioEObterToken();

    const criar = await request(app)
      .post("/api/tarefas")
      .set("Authorization", `Bearer ${token}`)
      .send({ titulo: "Estudar Node.js", descricao: "Revisar rotas Express" });

    expect(criar.status).toBe(201);
    expect(criar.body.titulo).toBe("Estudar Node.js");

    const listar = await request(app)
      .get("/api/tarefas")
      .set("Authorization", `Bearer ${token}`);

    expect(listar.status).toBe(200);
    expect(listar.body.length).toBe(1);
  });

  it("rejeita criação de tarefa sem título", async () => {
    const token = await criarUsuarioEObterToken();

    const resposta = await request(app)
      .post("/api/tarefas")
      .set("Authorization", `Bearer ${token}`)
      .send({ descricao: "sem título" });

    expect(resposta.status).toBe(400);
  });

  it("atualiza uma tarefa existente", async () => {
    const token = await criarUsuarioEObterToken();

    const criar = await request(app)
      .post("/api/tarefas")
      .set("Authorization", `Bearer ${token}`)
      .send({ titulo: "Tarefa original" });

    const atualizar = await request(app)
      .put(`/api/tarefas/${criar.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ concluida: true });

    expect(atualizar.status).toBe(200);
    expect(atualizar.body.concluida).toBe(1);
  });

  it("não permite atualizar tarefa de outro usuário", async () => {
    const tokenA = await criarUsuarioEObterToken();
    const tokenB = await criarUsuarioEObterToken();

    const criar = await request(app)
      .post("/api/tarefas")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ titulo: "Tarefa do usuário A" });

    const tentativa = await request(app)
      .put(`/api/tarefas/${criar.body.id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ titulo: "Tentando alterar" });

    expect(tentativa.status).toBe(404);
  });

  it("exclui uma tarefa", async () => {
    const token = await criarUsuarioEObterToken();

    const criar = await request(app)
      .post("/api/tarefas")
      .set("Authorization", `Bearer ${token}`)
      .send({ titulo: "Tarefa a excluir" });

    const excluir = await request(app)
      .delete(`/api/tarefas/${criar.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(excluir.status).toBe(204);

    const listar = await request(app)
      .get("/api/tarefas")
      .set("Authorization", `Bearer ${token}`);

    expect(listar.body.length).toBe(0);
  });
});
