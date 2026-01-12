import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Tarefas() {
  const [tarefas, setTarefas] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuario) {
      navigate("/login");
      return;
    }
    carregarTarefas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  async function carregarTarefas() {
    try {
      const { data } = await api.get("/tarefas");
      setTarefas(data);
    } catch (err) {
      setErro("Não foi possível carregar as tarefas.");
    } finally {
      setCarregando(false);
    }
  }

  async function criarTarefa(e) {
    e.preventDefault();
    if (!titulo.trim()) return;

    try {
      const { data } = await api.post("/tarefas", { titulo, descricao });
      setTarefas([data, ...tarefas]);
      setTitulo("");
      setDescricao("");
    } catch (err) {
      setErro(err.response?.data?.erro || "Erro ao criar tarefa.");
    }
  }

  async function alternarConcluida(tarefa) {
    const { data } = await api.put(`/tarefas/${tarefa.id}`, {
      concluida: !tarefa.concluida,
    });
    setTarefas(tarefas.map((t) => (t.id === tarefa.id ? data : t)));
  }

  async function excluirTarefa(id) {
    await api.delete(`/tarefas/${id}`);
    setTarefas(tarefas.filter((t) => t.id !== id));
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (carregando) return <p className="container-form">Carregando...</p>;

  return (
    <div className="container-tarefas">
      <header>
        <h1>Minhas Tarefas</h1>
        <div>
          <span>Olá, {usuario?.nome}</span>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </header>

      {erro && <p className="erro">{erro}</p>}

      <form onSubmit={criarTarefa} className="form-tarefa">
        <input
          type="text"
          placeholder="Título da tarefa"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Descrição (opcional)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <button type="submit">+ Adicionar</button>
      </form>

      <ul className="lista-tarefas">
        {tarefas.map((tarefa) => (
          <li key={tarefa.id} className={tarefa.concluida ? "concluida" : ""}>
            <label>
              <input
                type="checkbox"
                checked={!!tarefa.concluida}
                onChange={() => alternarConcluida(tarefa)}
              />
              <strong>{tarefa.titulo}</strong>
            </label>
            {tarefa.descricao && <p>{tarefa.descricao}</p>}
            <button onClick={() => excluirTarefa(tarefa.id)}>Excluir</button>
          </li>
        ))}
        {tarefas.length === 0 && <p>Nenhuma tarefa ainda. Adicione a primeira acima!</p>}
      </ul>
    </div>
  );
}
