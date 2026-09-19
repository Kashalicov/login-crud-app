const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// Em produção nunca cai no segredo fixo do código (qualquer um poderia forjar
// tokens). Sem JWT_SECRET, gera um aleatório por processo: reiniciar a API
// desloga todo mundo, o que é aceitável para uma demo.
function resolverSegredo() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    console.warn("[auth] JWT_SECRET não definido — usando segredo aleatório (sessões caem ao reiniciar).");
    return crypto.randomBytes(48).toString("hex");
  }
  return "dev-secret-troque-em-producao";
}

const JWT_SECRET = resolverSegredo();

function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token não informado." });
  }

  const token = cabecalho.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuarioId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}

module.exports = { autenticar, JWT_SECRET };
