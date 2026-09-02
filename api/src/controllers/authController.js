import { gerarToken } from "../middleware/auth.js";
import Usuario from "../models/usuarios.js";
import Gerente from "../models/gerente.js";
import Entregador from "../models/entregadores.js";

const modelPorPapel = {
  gerente: Gerente,
  usuario: Usuario,
  entregador: Entregador,
};

export const login = async (req, res, next) => {
  try {
    const { papel, email, senha } = req.body;

    if (!modelPorPapel[papel]) {
      return res.status(400).json({ message: "Papel inválido" });
    }

    const Model = modelPorPapel[papel];
    const conta = await Model.findOne({ email }).select("+senha");

    if (!conta || !(await conta.compararSenha(senha))) {
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }

    const token = gerarToken(conta, papel);

    res.status(200).json({
      token,
      papel,
      id: conta._id,
      nome: conta.nome,
    });
  } catch (error) {
    next(error);
  }
};

export const registrar = async (req, res, next) => {
  try {
    const { papel } = req.body;

    if (!modelPorPapel[papel]) {
      return res.status(400).json({ message: "Papel inválido" });
    }

    const Model = modelPorPapel[papel];
    const novaConta = new Model(req.body);
    await novaConta.save();

    const token = gerarToken(novaConta, papel);

    res.status(201).json({
      token,
      papel,
      id: novaConta._id,
      nome: novaConta.nome,
    });
  } catch (error) {
    next(error);
  }
};
