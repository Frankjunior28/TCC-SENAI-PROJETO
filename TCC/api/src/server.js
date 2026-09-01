import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDatabase from "./database/connection.js";

import produtoRoutes from "./routes/produtosRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import gerenteRoutes from "./routes/gerenteRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDatabase();

app.use("/produtos", produtoRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/gerentes", gerenteRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));