import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
  },
  { timestamps: true }
);

const Usuario = mongoose.model("usuarios", usuarioSchema);

export default Usuario;