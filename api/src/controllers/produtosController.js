import Produto from "../models/produtos.js";

export const listarProdutos = async (req, res, next) => {
  try {
    const produtos = await Produto.find();
    res.status(200).json(produtos);
  } catch (error) {
    next(error);
  }
};

export const buscarProdutoPorId = async (req, res, next) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ message: "Produto não encontrado" });
    res.status(200).json(produto);
  } catch (error) {
    next(error);
  }
};

export const criarProduto = async (req, res, next) => {
  try {
    const novoProduto = await Produto.create(req.body);
    res.status(201).json(novoProduto);
  } catch (error) {
    next(error);
  }
};

export const atualizarProduto = async (req, res, next) => {
  try {
    const produtoAtualizado = await Produto.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!produtoAtualizado) return res.status(404).json({ message: "Produto não encontrado" });
    res.status(200).json(produtoAtualizado);
  } catch (error) {
    next(error);
  }
};

export const deletarProduto = async (req, res, next) => {
  try {
    const produtoDeletado = await Produto.findByIdAndDelete(req.params.id);
    if (!produtoDeletado) return res.status(404).json({ message: "Produto não encontrado" });
    res.status(200).json({ message: "Produto removido com sucesso!" });
  } catch (error) {
    next(error);
  }
};
