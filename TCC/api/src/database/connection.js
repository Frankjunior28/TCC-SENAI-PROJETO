/**
 * ============================================================================
 *  BANCO DE DADOS  →  CONEXÃO COM O MONGODB
 * ============================================================================
 *  ---------------------------------------------------------------------------
 *  1. POR QUE ESTE ARQUIVO EXISTE
 *  ---------------------------------------------------------------------------
 *    Ele concentra TODO o código que fala com o banco pela primeira vez.
 *    Sem ele, cada parte do sistema precisaria repetir o `mongoose.connect`.
 *    Como efeito colateral positivo, existe UM único lugar onde está a
 *    decisão de usar o MongoDB do Atlas (.env) ou o MongoDB local.
 *
 *  ---------------------------------------------------------------------------
 *  2. O QUE ACONTECE QUANDO ELE É CHAMADO
 *  ---------------------------------------------------------------------------
 *    1) Lê a string de conexão de `process.env.MONGO_URI` — variável
 *       preenchida pelo dotenv a partir do arquivo api/.env, carregado
 *       no server.js. Se o .env não existir, cai no MongoDB local.
 *    2) Chama `mongoose.connect(uri, ...)` para abrir a conexão.
 *    3) Devolve `true` quando conectou e `false` quando falhou.
 *
 *    COMO O MONGUE SABE A SENHA DO ATLAS:
 *    A string MONGO_URI do .env contém usuário e senha do cluster. Por isso
 *    o arquivo .env é está no .gitignore e NUNCA deve ser versionado nem
 *    citado na documentação.
 *
 *  ---------------------------------------------------------------------------
 *  3. POR QUE NÃO FAZ process.exit(1) COMO ANTES — DECISÃO DE PROJETO
 *  ---------------------------------------------------------------------------
 *    Versões anteriores deste arquivo encerravam o processo quando a conexão
 *    falhava. Hoje ele apenas devolve `false`.
 *    O motivo: o server.js precisa SABER se conectou para decidir o que
 *    fazer a seguir — se conectou, roda a migração de perfis, sincroniza os
 *    índices e executa o seed; se não conectou, entra em "modo demonstração".
 *    Com `process.exit(1)`, o servidor nem subiria, e o site ficaria
 *    completamente inacessível quando o Atlas estivesse instável.
 *    O comportamento de "modo demonstração" (abrir a vitrine com o catálogo
 *    de fallback e um aviso, sem salvar nada) já existia e foi mantido.
 *
 *  ---------------------------------------------------------------------------
 *  4. O PARÂMETRO serverSelectionTimeoutMS
 *  ---------------------------------------------------------------------------
 *    `{ serverSelectionTimeoutMS: 15000 }` define 15 segundos como tempo
 *    máximo para o Mongoose encontrar um servidor disponível. Sem esse
 *    limite, a tentativa de conexão poderia ficar pendurada indefinidamente
 *    (é o famoso "buffering timed out after 10000ms" que aparece quando a
 *    URI está errada ou o processo foi iniciado antes do .env existir).
 *    Com o limite, a falha acontece rápido e o modo demonstração assume.
 *
 *  ---------------------------------------------------------------------------
 *  5. POR QUE `await mongoose.connect(...)` DENTRO DE UM try/catch
 *  ---------------------------------------------------------------------------
 *    `connect()` é assíncrono: devolve uma Promise. Sem o `await`, o
 *    código continuaria antes de a conexão estar pronta, e o `return true`
 *    seria falso. Com o `await`, a execução só prossegue quando a conexão
 *    realmente se resolveu — e o `catch` transforma qualquer erro (URI
 *    inválida, senha errada, DNS, firewall) em um `return false` controlado.
 *
 *  ONDE É USADO: importado pelo src/server.js (na inicialização) e também
 *  pelos scripts manuais src/migrar.js e src/sincronizar-fotos.js.
 * ============================================================================
 */
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// STRING DE CONEXÃO PADRÃO, usada quando não há .env.
// Mesma string de fallback do server.js — MongoDB rodando na máquina local,
// porta padrão 27017, banco chamado "tcc".
// ---------------------------------------------------------------------------
const MONGO_URI_PADRAO = "mongodb://localhost:27017/tcc";

/**
 * Abre a conexão com o MongoDB.
 * @returns {Promise<boolean>} true se conectou, false se falhou
 */
const connectDatabase = async () => {
  try {
    // Variável de ambiente tem prioridade; a string local é o plano B.
    const uri = process.env.MONGO_URI || MONGO_URI_PADRAO;

    // 15 s é o tempo máximo para localizar um servidor antes de desistir.
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });

    console.log("✅ Banco de dados conectado com sucesso!");
    return true;
  } catch (error) {
    // Erro de conexão NÃO é fatal: quem decide o que fazer é o server.js.
    console.error("❌ Erro na conexão com o MongoDB:", error.message);
    return false; // server.js decide: sobe em modo demonstração
  }
};

export default connectDatabase;
