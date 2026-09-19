require("dotenv").config();

const app = require("./app");
const db = require("./db");

const PORT = process.env.PORT || 3333;

db.iniciar()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Falha ao preparar o banco de dados:", err);
    process.exit(1);
  });
