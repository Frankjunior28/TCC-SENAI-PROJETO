export function tratarErro(err, req, res, next) {
  console.error("Erro:", err.message);

  if (err.name === "CastError") {
    return res.status(400).json({ message: "ID invalido" });
  }

  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `Valor duplicado para o campo: ${campo}` });
  }

  if (err.name === "ValidationError") {
    const mensagens = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: "Erro de validacao", erros: mensagens });
  }

  res.status(err.status || 500).json({
    message: err.message || "Erro interno do servidor",
  });
}
