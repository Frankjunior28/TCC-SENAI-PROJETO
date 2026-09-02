import mongoose from "mongoose";
import Venda from "../models/vendas.js";
import Produto from "../models/produtos.js";

export const criarVenda = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { itens } = req.body;
    const itensProcessados = [];

    for (const item of itens) {
      const produto = await Produto.findById(item.produto).session(session);
      if (!produto) {
        await session.abortTransaction();
        return res.status(404).json({ message: `Produto não encontrado: ${item.produto}` });
      }

      if (produto.quantidade < item.quantidade) {
        await session.abortTransaction();
        return res.status(400).json({
          message: `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.quantidade}`,
        });
      }

      produto.quantidade -= item.quantidade;
      await produto.save({ session });

      itensProcessados.push({
        produto: produto._id,
        nome: produto.nome,
        precoUnitario: produto.preco,
        quantidade: item.quantidade,
        subtotal: produto.preco * item.quantidade,
      });
    }

    const total = itensProcessados.reduce((acc, i) => acc + i.subtotal, 0);
    const venda = await Venda.create(
      [{ usuario: req.usuario.id, itens: itensProcessados, total }],
      { session }
    );

    await session.commitTransaction();
    res.status(201).json(venda[0]);
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const listarVendas = async (req, res, next) => {
  try {
    const vendas = await Venda.find()
      .populate("usuario", "nome email")
      .populate("entregador", "nome")
      .sort({ createdAt: -1 });
    res.status(200).json(vendas);
  } catch (error) {
    next(error);
  }
};

export const listarVendasPendentes = async (req, res, next) => {
  try {
    const vendas = await Venda.find({ status: "pendente" })
      .populate("usuario", "nome email")
      .sort({ createdAt: -1 });
    res.status(200).json(vendas);
  } catch (error) {
    next(error);
  }
};

export const atualizarStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { id: entregadorId } = req.usuario;

    const venda = await Venda.findById(id);
    if (!venda) return res.status(404).json({ message: "Venda não encontrada" });

    if (venda.status === "entregue") {
      return res.status(400).json({ message: "Venda já entregue" });
    }

    venda.status = status;
    venda.entregador = entregadorId;
    await venda.save();

    res.status(200).json(venda);
  } catch (error) {
    next(error);
  }
};
