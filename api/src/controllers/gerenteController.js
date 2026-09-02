import Gerente from "../models/gerente.js";

const camposPublicos = "nome email cargo createdAt";

export const listarGerentes = async (req, res, next) => {
  try {
    const gerentes = await Gerente.find().select(camposPublicos);
    res.status(200).json(gerentes);
  } catch (error) {
    next(error);
  }
};

export const buscarGerentePorId = async (req, res, next) => {
  try {
    const gerente = await Gerente.findById(req.params.id).select(camposPublicos);
    if (!gerente) return res.status(404).json({ message: "Gerente não encontrado" });
    res.status(200).json(gerente);
  } catch (error) {
    next(error);
  }
};

export const criarGerente = async (req, res, next) => {
  try {
    const novoGerente = new Gerente(req.body);
    await novoGerente.save();
    const { senha, ...gerenteSemSenha } = novoGerente.toObject();
    res.status(201).json(gerenteSemSenha);
  } catch (error) {
    next(error);
  }
};

export const atualizarGerente = async (req, res, next) => {
  try {
    delete req.body.senha;
    const gerenteAtualizado = await Gerente.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select(camposPublicos);
    if (!gerenteAtualizado) return res.status(404).json({ message: "Gerente não encontrado" });
    res.status(200).json(gerenteAtualizado);
  } catch (error) {
    next(error);
  }
};

export const deletarGerente = async (req, res, next) => {
  try {
    const gerenteDeletado = await Gerente.findByIdAndDelete(req.params.id);
    if (!gerenteDeletado) return res.status(404).json({ message: "Gerente não encontrado" });
    res.status(200).json({ message: "Gerente removido com sucesso!" });
  } catch (error) {
    next(error);
  }
};
