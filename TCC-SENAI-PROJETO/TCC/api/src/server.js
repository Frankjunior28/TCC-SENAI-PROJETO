import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDatabase from './database/connection.js';

// Importação das rotas
import produtoRoutes from './routes/produtoRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import gerenteRoutes from './routes/gerenteRoutes.js';

dotenv.config();

const app = express();

// Middlewares essenciais
app.use(cors());
app.use(express.json());

// Conexão com o Banco de Dados
connectDatabase();

// Declaração das rotas da API
app.use('/produtos', produtoRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/gerentes', gerenteRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));