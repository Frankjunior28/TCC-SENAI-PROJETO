/**
 * ============================================================================
 *  API  →  SERVIDOR EXPRESS (ponto de entrada do backend)
 * ============================================================================
 *  Este é o ARQUIVO QUE SOBE O SERVIDOR. Tudo o que o backend faz começa
 *  aqui: carregar a configuração, montar as rotas, conectar ao banco e
 *  iniciar a escuta na porta.
 *
 *  ===========================================================================
 *  1. A ORDEM DE EXECUÇÃO (o que o arquivo faz, na sequência)
 *  ===========================================================================
 *    1. dotenv.config()       → lê o arquivo api/.env (MONGO_URI, PORT);
 *    2. express()             → cria o servidor HTTP;
 *    3. Middlewares globais:
 *         • cors()        → permite que o navegador acesse a API a partir de
 *                           outra origem (em dev, o site roda na porta 5173
 *                           e a API na 3000);
 *         • express.json()→ converte o corpo JSON das requisições em req.body;
 *    4. Monta as ROTAS da API, cada uma com seu prefixo:
 *         /api/usuarios        → cadastro/login/CRUD de clientes
 *         /api/gerentes        → CRUD de gerentes
 *         /api/administradores → CRUD de administradores
 *         /api/produtos        → CRUD de produtos
 *         /api/pedidos         → CRUD de pedidos
 *    5. Serve o FRONTEND compilado (ui/dist) como arquivos estáticos e, para
 *       qualquer GET que NÃO comece com /api, devolve o index.html. É isso
 *       que permite à SPA React funcionar mesmo sem react-router.
 *    6. Conecta no MongoDB e só então:
 *         • roda a MIGRAÇÃO de perfis (organiza as coleções de contas);
 *         • sincroniza os ÍNDICES (email único em cada coleção);
 *         • roda o SEED dos 12 produtos iniciais;
 *         • inicia o servidor na porta configurada.
 *       Se o banco falhar → sobe em MODO DEMONSTRAÇÃO: o site abre, mas
 *       contas/produtos/vendas não são salvos (aviso no console e na UI).
 *
 *  ===========================================================================
 *  2. A ARQUITETURA QUE ESTE ARQUIVO ORGANIZA (MVC, no backend)
 *  ===========================================================================
 *    Um pedido HTTP percorre sempre o mesmo caminho, atravessando estas
 *    camadas na ordem:
 *
 *        Navegador (fetch)
 *              │
 *              ▼
 *        server.js                 ← este arquivo: middlewares + montagem
 *              │
 *              ▼
 *        routes/*.js               ← identifica o endpoint e o controller
 *              │
 *              ▼
 *        controllers/*.js          ← regra de negócio + validações
 *              │
 *              ▼
 *        models/*.js (Mongoose)    ← fala com o banco (MongoDB)
 *              │
 *              ▼
 *              res.json(...)        ← a resposta volta subindo o mesmo caminho
 *
 *  ===========================================================================
 *  3. POR QUE O SERVIDOR TAMBÉM ENTREGA O FRONTEND
 *  ===========================================================================
 *    Em produção, em vez de usar dois servidores separados, o Express serve
 *    os dois: os arquivos do site (pasta ui/dist) E as rotas da API, na MESMA
 *    porta. Vantagens: um só endereço para o usuário, nenhuma configuração
 *    de CORS em produção, e um único comando (`npm start`) sobe tudo.
 * ============================================================================
 */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import gerenteRoutes from "./routes/gerenteRoutes.js";
import administradorRoutes from "./routes/AdministradorRoutes.js";
import produtoRoutes from "./routes/produtoRoutes.js";
import pedidoRoutes from "./routes/pedidoRoutes.js";
import { seedProdutos } from "./seed.js";
import connectDatabase from "./database/connection.js";
import migrarPerfis from "./database/migracao.js";
import Usuario from "./models/usuarios.js";
import Gerente from "./models/gerente.js";
import Administrador from "./models/Administrador.js";

// ---------------------------------------------------------------------------
// 1) CARREGAR AS VARIÁVEIS DE AMBIENTE
// ---------------------------------------------------------------------------
// Lê o arquivo .env e transforma cada linha "CHAVE=valor" em process.env.
// O caminho é montado a partir da URL deste arquivo (import.meta.url), não
// do diretório onde o comando foi digitado. Isso garante que ele SEMPRE
// encontre o api/.env, mesmo se o Node for iniciado a partir da raiz do
// projeto. (O MONGO_URI e a PORT vivem aqui; o .env é ignorado pelo Git
// porque pode conter a senha do banco Atlas.)
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

// Cria a instância do Express — o objeto que representa o servidor HTTP.
const app = express();

// ---------------------------------------------------------------------------
// 2) MIDDLEWARES GLOBAIS (rodam em TODA requisição, na ordem)
// ---------------------------------------------------------------------------
// Um middleware é uma função que roda entre a chegada da requisição e o
// controller. Ele pode inspecionar, alterar ou simplesmente deixar passar.

// cors() → insere os cabecalhos que autorizam o acesso de outra origem.
// Em desenvolvimento, o site roda em http://localhost:5173 (Vite) e a API
// em http://localhost:3000 (Express): sem o CORS, o navegador bloquearia
// as chamadas por serem origens diferentes. Em produção não é necessário,
// porque site e API ficam na mesma origem/porta.
app.use(cors());

// express.json() → lê o corpo da requisição e o converte de JSON (texto)
// para um objeto JavaScript, disponibilizando-o como req.body.
// Sem ele, todo controller teria que fazer o parse manual do corpo.
app.use(express.json());

// ---------------------------------------------------------------------------
// 3) MONTAGEM DAS ROTAS (o prefixo completo fica AQUI; o resto, nos routers)
// ---------------------------------------------------------------------------
// app.use(prefixo, router) associa um conjunto de rotas a um caminho base.
// Os caminhos curtos declarados dentro de cada arquivo de rotas ganham
// este prefixo. Ex.: o "/:id" de produtoRoutes vira "/api/produtos/:id".
app.use("/api/usuarios", usuarioRoutes);           // contas de cliente + cadastro/login
app.use("/api/gerentes", gerenteRoutes);           // coleção "gerentes"
app.use("/api/administradores", administradorRoutes); // coleção "administradores"
app.use("/api/produtos", produtoRoutes);           // coleção "produtos"
app.use("/api/pedidos", pedidoRoutes);             // coleção "pedidos"

// ---------------------------------------------------------------------------
// 4) SERVIR O FRONTEND COMPILADO (ui/dist) + O SUPORTE DE SPA
// ---------------------------------------------------------------------------
// Descobre o caminho absoluto da pasta deste módulo para, a partir dele,
// localizar a pasta ui/dist (que fica um nível acima de api/src).
//   import.meta.url       → URL deste arquivo;
//   fileURLToPath()       → converte a URL em caminho do sistema de arquivos;
//   path.dirname()        → extrai só a pasta;
//   path.resolve(a, "../../ui/dist") → junta os trechos e resolve os "..".
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_PATH = path.resolve(__dirname, "../../ui/dist");

// express.static() entrega os arquivos do build (JS, CSS, imagens) como
// se fossem arquivos comuns. É daqui que saem o index.html e os produtos
// da pasta /images/produtos.
app.use(express.static(DIST_PATH));

// SUPORTE DE SPA (é o que permite navegar sem recarregar a página):
// A aplicação React não muda a URL quando troca de tela (não há
// react-router). Se alguém der F5 em /api/pedidos ou em qualquer rota
// interna, o Express precisa devolver o index.html para o React subir e
// escolher a tela certa. Esta função faz exatamente isso:
//   • se for GET e o caminho NÃO comecar com /api → devolve o index.html;
//   • caso contrário, chama next() — e aí sim uma rota /api sem match cai
//     no 404 padrão do Express (o que é o comportamento correto: uma rota
//     de API inexistente NÃO deve receber a página HTML do site).
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    return res.sendFile(path.join(DIST_PATH, "index.html"));
  }
  next();
});

// ---------------------------------------------------------------------------
// 5) A PORTA E UM AVISO AMIGÁVEL SOBRE A CONFIGURAÇÃO DO ATLAS
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;

// Se a MONGO_URI ainda contiver o host de exemplo do Atlas ("TROQUE" ou
// "SUBSTITUA"), mostra um aviso explicando como pegar o endereço real.
// É uma ajuda prática para quem está configurando o projeto pela primeira
// vez, e um dos "erros mais comuns" documentados na seção de dificuldades.
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/tcc";
if (MONGO_URI.includes("TROQUE") || MONGO_URI.includes("SUBSTITUA")) {
  console.warn(
    "⚠️  MONGO_URI ainda contém o host de exemplo (TROQUE-PELO-HOST/SUBSTITUA).\n" +
      "   Edite o arquivo api/.env com o endereço real do seu MongoDB Atlas.\n" +
      "   No Atlas: Database → Connect → Drivers → copie o host entre '@' e '.mongodb.net'."
  );
}

// ---------------------------------------------------------------------------
// 6) CONEXÃO COM O BANCO + PREPARAÇÃO + INÍCIO DO SERVIDOR
// ---------------------------------------------------------------------------

/** Sobe o servidor na porta configurada. */
const iniciarServidor = () =>
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

/**
 * Prepara o banco antes de iniciar o servidor. Conecta, migra perfis,
 * sincroniza índices e roda o seed.
 */
const prepararBanco = async () => {
  // Usa a conexão (database/connection.js). Retorna true/false.
  const conectado = await connectDatabase();

  if (!conectado) {
    // Sem banco: avisa e SEGUE (não sobe a preparação), para o servidor
    // entrar em modo demonstração. O .finally abaixo garante que o
    // servidor suba de qualquer forma.
    console.warn("⚠️  Modo demonstração: o site abre, mas contas/produtos/vendas não serão salvos.");
    return;
  }

  // --- MIGRAÇÃO DE PERFIS (organiza as coleções de contas) ---
  // Idempotente: pode rodar toda vez que a API inicia sem risco.
  // Ex.: tira gerentes/administradores que ainda estejam em "usuarios".
  const resumo = await migrarPerfis();
  console.log(
    `🗂️  Migração de perfis: ${resumo.movidos} movido(s), ${resumo.duplicatas} duplicata(s) removida(s).`
  );

  // --- ÍNDICES (email único em cada coleção de contas) ---
  // syncIndexes() recria os índices declarados nos schemas, removendo os
  // que não existam mais nos schemas.
  //
  // ⚠️ POR QUE ESTA ORDEM IMPORTA: a sincronização roda DEPOIS da migração
  // de propósito. O índice de email é único; se fosse criado antes, ainda
  // haveria várias contas com o mesmo email misturadas na coleção "usuarios"
  // (cliente, gerente e administrador), e a criação do índice falharia.
  // Separando primeiro e indexando depois, o índice é criado com sucesso.
  await Usuario.syncIndexes();
  await Gerente.syncIndexes();
  await Administrador.syncIndexes();

  // --- SEED (garanta os 12 produtos iniciais, se a coleção estiver vazia) ---
  await seedProdutos();
};

// Dispara a preparação do banco.
//   .catch(...)   → se algo der ERRADO (banco caiu, seed estourou...),
//                   registra a mensagem e segue para o servidor mesmo assim
//                   (modo demonstração);
//   .finally(...) → o ".finally" roda SEMPRE, tanto no sucesso quanto no
//                   erro. É ele que garante que o servidor SUBA com ou sem
//                   banco — que é justamente a diferença para uma versão
//                   anterior que usava process.exit(1) e deixava o site
//                   totalmente fora do ar quando o Atlas estava instável.
prepararBanco()
  .catch((error) => {
    console.error("Erro no MongoDB:", error.message);
    console.warn("⚠️  Modo demonstração: o site abre, mas contas/produtos/vendas não serão salvos.");
  })
  .finally(iniciarServidor); // sobe o servidor com ou sem banco
