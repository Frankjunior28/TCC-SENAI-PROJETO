import mongoose from "mongoose";

const vendaSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "usuarios", required: true },
    itens: [
      {
        produto: { type: mongoose.Schema.Types.ObjectId, ref: "produtos", required: true },
        nome: { type: String, required: true },
        precoUnitario: { type: Number, required: true, min: 0 },
        quantidade: { type: Number, required: true, min: 1 },
        subtotal: { type: Number, required: true, min: 0 },
      },
    ],
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pendente", "em_entrega", "entregue"],
      default: "pendente",
    },
    entregador: { type: mongoose.Schema.Types.ObjectId, ref: "entregadores", default: null },
  },
  { timestamps: true }
);

const Venda = mongoose.model("vendas", vendaSchema);

export default Venda;
