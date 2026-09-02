import Joi from "joi";

const produtoSchema = Joi.object({
  nome: Joi.string().min(1).max(200).required().messages({
    "string.empty": "Nome e obrigatorio",
    "any.required": "Nome e obrigatorio",
  }),
  preco: Joi.number().min(0).required().messages({
    "number.min": "Preco nao pode ser negativo",
    "any.required": "Preco e obrigatorio",
  }),
  descricao: Joi.string().max(1000).allow("", null),
  quantidade: Joi.number().integer().min(0).default(0),
});

const usuarioSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).max(128).required().messages({
    "string.min": "Senha deve ter no minimo 6 caracteres",
  }),
});

const gerenteSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).max(128).required().messages({
    "string.min": "Senha deve ter no minimo 6 caracteres",
  }),
  telefone: Joi.string().min(8).max(20).required().messages({
    "string.empty": "Telefone e obrigatorio",
  }),
  cargo: Joi.string().max(50).default("Gerente"),
});

const entregadorSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).max(128).required().messages({
    "string.min": "Senha deve ter no minimo 6 caracteres",
  }),
  telefone: Joi.string().min(8).max(20).required().messages({
    "string.empty": "Telefone e obrigatorio",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().required(),
});

const vendaSchema = Joi.object({
  itens: Joi.array()
    .min(1)
    .items(
      Joi.object({
        produto: Joi.string().required(),
        quantidade: Joi.number().integer().min(1).required(),
      })
    )
    .required()
    .messages({
      "array.min": "O carrinho esta vazio",
      "any.required": "O carrinho e obrigatorio",
    }),
});

const statusSchema = Joi.object({
  status: Joi.string().valid("em_entrega", "entregue").required(),
});

export function validarProduto(req, res, next) {
  const { error, value } = produtoSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const mensagens = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Dados invalidos", erros: mensagens });
  }
  req.body = value;
  next();
}

export function validarUsuario(req, res, next) {
  const { error, value } = usuarioSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const mensagens = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Dados invalidos", erros: mensagens });
  }
  req.body = value;
  next();
}

export function validarGerente(req, res, next) {
  const { error, value } = gerenteSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const mensagens = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Dados invalidos", erros: mensagens });
  }
  req.body = value;
  next();
}

export function validarEntregador(req, res, next) {
  const { error, value } = entregadorSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const mensagens = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Dados invalidos", erros: mensagens });
  }
  req.body = value;
  next();
}

export function validarLogin(req, res, next) {
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const mensagens = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Dados invalidos", erros: mensagens });
  }
  req.body = value;
  next();
}

export function validarVenda(req, res, next) {
  const { error, value } = vendaSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const mensagens = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Dados invalidos", erros: mensagens });
  }
  req.body = value;
  next();
}

export function validarStatus(req, res, next) {
  const { error, value } = statusSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const mensagens = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Dados invalidos", erros: mensagens });
  }
  req.body = value;
  next();
}
