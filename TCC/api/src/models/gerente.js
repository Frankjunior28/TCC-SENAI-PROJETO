import mongoose from "mongoose";

const gerenteSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    cargo: { type: String, default: "Gerente" },
  },
  { timestamps: true }
);

const Gerente = mongoose.model("gerentes", gerenteSchema);

export default Gerente;