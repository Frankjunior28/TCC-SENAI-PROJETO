import Produto from "../models/product.js";

// CREATE (POST)
export const criarProduto = async (req, res) => {
  try {
    const novoProduto = await Produto.create(req.body);
    res.status(201).json(novoProduto);
  } catch (error) {
    res.status(400).json({ message: "Erro ao criar produto", error: error.message });
  }
};

// READ ALL (GET)
export const listarProdutos = async (req, res) => {
  try {
    const produtos = await Produto.find();
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar produtos", error: error.message });
  }
};

// READ ONE (GET por ID)
export const buscarProdutoPorId = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ message: "Produto não encontrado" });
    res.json(produto);
  } catch (error) {
    res.status(500).json({ message: "ID inválido", error: error.message });
  }
};

// UPDATE (PUT)
export const atualizarProduto = async (req, res) => {
  try {
    const produtoAtualizado = await Produto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(produtoAtualizado);
  } catch (error) {
    res.status(400).json({ message: "Erro ao atualizar produto", error: error.message });
  }
};

// DELETE (DELETE)
export const deletarProduto = async (req, res) => {
  try {
    await Produto.findByIdAndDelete(req.params.id);
    res.json({ message: "Produto removido com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar produto", error: error.message });
  }
};