import jwt from "jsonwebtoken";

export function gerarToken(dados, papel) {
  return jwt.sign({ id: dados._id, papel }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: decoded.id, papel: decoded.papel };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
}

export function autorizar(...papeis) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    if (!papeis.includes(req.usuario.papel)) {
      return res.status(403).json({ message: "Acesso negado para este papel" });
    }
    next();
  };
}
