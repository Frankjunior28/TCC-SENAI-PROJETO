import mongoose from "mongoose";

const produtoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    preco: { type: Number, required: true },
    descricao: { type: String },
    quantidade: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Produto = mongoose.model("produtos", produtoSchema);

export default Produto;