import Entregador from "../models/entregadores.js";

const camposPublicos = "nome email telefone createdAt";

export const listarEntregadores = async (req, res, next) => {
  try {
    const entregadores = await Entregador.find().select(camposPublicos);
    res.status(200).json(entregadores);
  } catch (error) {
    next(error);
  }
};

export const buscarEntregadorPorId = async (req, res, next) => {
  try {
    const entregador = await Entregador.findById(req.params.id).select(camposPublicos);
    if (!entregador) return res.status(404).json({ message: "Entregador não encontrado" });
    res.status(200).json(entregador);
  } catch (error) {
    next(error);
  }
};

export const criarEntregador = async (req, res, next) => {
  try {
    const novoEntregador = new Entregador(req.body);
    await novoEntregador.save();
    const { senha, ...dadosSemSenha } = novoEntregador.toObject();
    res.status(201).json(dadosSemSenha);
  } catch (error) {
    next(error);
  }
};

export const atualizarEntregador = async (req, res, next) => {
  try {
    delete req.body.senha;
    const entregadorAtualizado = await Entregador.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select(camposPublicos);
    if (!entregadorAtualizado)
      return res.status(404).json({ message: "Entregador não encontrado" });
    res.status(200).json(entregadorAtualizado);
  } catch (error) {
    next(error);
  }
};

export const deletarEntregador = async (req, res, next) => {
  try {
    const entregadorDeletado = await Entregador.findByIdAndDelete(req.params.id);
    if (!entregadorDeletado)
      return res.status(404).json({ message: "Entregador não encontrado" });
    res.status(200).json({ message: "Entregador removido com sucesso!" });
  } catch (error) {
    next(error);
  }
};
