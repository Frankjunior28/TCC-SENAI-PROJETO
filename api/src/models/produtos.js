import mongoose from "mongoose";

const produtoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    preco: { type: Number, required: true, min: [0, "O preco nao pode ser negativo"] },
    descricao: { type: String, trim: true, default: "" },
    quantidade: { type: Number, default: 0, min: [0, "A quantidade nao pode ser negativa"] },
  },
  { timestamps: true }
);

const Produto = mongoose.model("produtos", produtoSchema);

export default Produto;
