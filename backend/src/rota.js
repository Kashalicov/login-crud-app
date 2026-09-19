// Express 4 não captura promises rejeitadas: sem isso, um erro de banco numa
// rota async derrubaria o processo em vez de cair no handler de erro (500).
module.exports = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
