import mongoose from "mongoose";
import bcrypt from "bcrypt";

const entregadorSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    senha: { type: String, required: true, select: false },
    telefone: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

entregadorSchema.pre("save", async function (next) {
  if (!this.isModified("senha")) return next();
  this.senha = await bcrypt.hash(this.senha, 10);
  next();
});

entregadorSchema.methods.compararSenha = async function (senhaComparada) {
  return bcrypt.compare(senhaComparada, this.senha);
};

const Entregador = mongoose.model("entregadores", entregadorSchema);

export default Entregador;
