import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDatabase from "./database/connection.js";
import { tratarErro } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import produtoRoutes from "./routes/produtosRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import gerenteRoutes from "./routes/gerenteRoutes.js";
import entregadorRoutes from "./routes/entregadorRoutes.js";
import vendasRoutes from "./routes/vendasRoutes.js";

dotenv.config();

const app = express();

const origensPermitidas = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:5173"];

app.use(cors({ origin: origensPermitidas }));

app.use(express.json());

connectDatabase();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ message: "API Gestao de Produtos rodando" });
});

app.use("/auth", authRoutes);
app.use("/produtos", produtoRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/gerentes", gerenteRoutes);
app.use("/entregadores", entregadorRoutes);
app.use("/vendas", vendasRoutes);

app.use(tratarErro);

app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
