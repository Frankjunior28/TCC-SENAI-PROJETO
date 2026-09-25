/**
 * ============================================================================
 *  SCRIPT DE DIAGNÓSTICO DO BANCO  →  node inspecionar-banco.mjs  (npm run banco)
 * ============================================================================
 *  ---------------------------------------------------------------------------
 *  1. PARA QUE SERVE
 *  ---------------------------------------------------------------------------
 *    É uma ferramenta de LEITURA, criada para responder a perguntas que
 *    surgiram durante o desenvolvimento:
 *      • "A conexão está indo para o banco CERTO?" — imprime o nome do banco
 *        e o host em que se conectou. Foi assim que se descobriu que o Atlas
 *        estava selecionando o banco "test" em vez de "tcc";
 *      • "Quais coleções existem e quantos documentos há em cada uma?";
 *      • "A coleção 'usuarios' está misturando cliente, gerente e
 *        administrador?" — o agrupamento por perfil revela isso;
 *      • "Quais contas existem, e com qual perfil?"
 *
 *  ---------------------------------------------------------------------------
 *  2. GARANTIA MAIS IMPORTANTE: É SOMENTE LEITURA
 *  ---------------------------------------------------------------------------
 *    Nenhuma linha deste arquivo executa insert, update, delete ou drop.
 *    Ele só pergunta. Pode ser rodado a qualquer momento, contra qualquer
 *    banco, sem risco de alteração de dados. Esse é o motivo de as operações
 *    de escrita ficarem no seed, na migração e no sincronizar-fotos — e
 *    nunca aqui.
 *
 *  ---------------------------------------------------------------------------
 *  3. POR QUE A EXTENSÃO É .mjs E NÃO .js
 *  ---------------------------------------------------------------------------
 *    O package.json da api já declara "type": "module", o que tornaria .js
 *    suficiente. Mas um ".mjs" funciona como módulos ESEMPRE, independentemente
 *    da configuração do pacote. Manter a extensão explícita deixa este
 *    arquivo (e o inspecionar-banco.mjs) funcionando mesmo que o
 *    package.json seja alterado por outra pessoa. É uma garantia de
 *    robustez, não uma exigência.
 *
 *  ---------------------------------------------------------------------------
 *  4. AS OPERAÇÕES DO MONGODB USADAS AQUI
 *  ---------------------------------------------------------------------------
 *    • listDatabases()          → lista os bancos do servidor (requer
 *                                  permissão; o erro é capturado e
 *                                  reportado sem derrubar o script);
 *    • db.collections()         → lista as coleções do banco atual;
 *    • countDocuments()         → conta os documentos de uma coleção;
 *    • aggregate([...])         → pergunta agrupada (contagem por perfil);
 *    • find({}, { projection }) → busca documentos, escolhendo quais campos
 *                                  serão trazidos (a "projeção").
 *
 *  ---------------------------------------------------------------------------
 *  5. POR QUE A AMOSTRA DE CONTAS NÃO TRAZ A SENHA
 *  ---------------------------------------------------------------------------
 *    A projeção usada é { nome: 1, email: 1, perfil: 1, cpf: 1 } — o
 *    operador "1" significa "INCLUA este campo". Como a projeção é de
 *    inclusão, o _id vem junto automaticamente e nenhum outro campo é
 *    trazido. A senha nunca chega a ser lida.
 *    Detalhe técnico que vale citar: em projeções de inclusão não se pode
 *    combinar "campos a incluir" com "senha: 0" (exclusão) ao mesmo tempo —
 *    o MongoDB rejeita a combinação. Por isso o caminho seguro é listar
 *    apenas o que se quer ver.
 * ============================================================================
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

// Carrega o .env da pasta api/ independentemente de onde o comando foi
// executado: o caminho é resolvido a partir da URL deste próprio arquivo.
dotenv.config({ path: fileURLToPath(new URL("./.env", import.meta.url)) });

// Variável de ambiente tem prioridade; MongoDB local é o plano B
// (mesma string de fallback do server.js e do database/connection.js).
const URI = process.env.MONGO_URI || "mongodb://localhost:27017/tcc";

// O try/catch wraps TUDO: qualquer falha (URI inválida, senha errada, rede
// indisponível) encerra o script com mensagem e código de saída 1, em vez
// de exibir um stack trace confuso.
try {
  console.log("Conectando...");

  // mongoose.connect() devolve uma Promise com a instância do Mongoose.
  // A conexão em si fica em `.connection`; o objeto de banco (com as
  // coleções) fica em `.connection.db`.
  const mongooseInstance = await mongoose.connect(URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongooseInstance.connection.db;
  const nomeBanco = mongooseInstance.connection.name;
  const host = mongooseInstance.connection.host;

  // Estas duas linhas são a resposta à pergunta "está indo para o banco certo?".
  console.log(`Conectado no banco: ${nomeBanco} @ ${host}\n`);

  // -------------------------------------------------------------------------
  // 1) BANCOS EXISTENTES NO SERVIDOR
  // -------------------------------------------------------------------------
  // db.admin().listDatabases() só funciona para quem tem permissão no Atlas.
  // Por isso o resultado está dentro de um próprio try/catch: se o usuário
  // da string de conexão não tiver esse privilégio, o script avisa e
  // continua, em vez de encerrar.
  try {
    const { databases } = await db.admin().listDatabases();
    console.log("Bancos no servidor:");
    databases.forEach((d) => console.log(`  - ${d.name}`));
  } catch (e) {
    console.log(`(sem permissão para listar bancos: ${e.message})`);
  }

  // -------------------------------------------------------------------------
  // 2) COLEÇÕES E QUANTIDADE DE DOCUMENTOS
  // -------------------------------------------------------------------------
  // db.collections() devolve objetos com o nome de cada coleção; é
  // necessário converter em lista (toArray) para poder percorrer com for.
  console.log(`\nColeções do banco "${nomeBanco}":`);
  const colecoes = await db.collections();
  if (colecoes.length === 0) console.log("  (banco vazio — nenhuma coleção)");
  for (const c of colecoes) {
    // db.collection(nome) acessa uma coleção; countDocuments() conta.
    const total = await db.collection(c.collectionName).countDocuments();
    console.log(`  - ${c.collectionName}: ${total} documento(s)`);
  }

  // -------------------------------------------------------------------------
  // 3) A COLEÇÃO "usuarios" ESTÁ MISTURANDO PERFIS?
  // -------------------------------------------------------------------------
  // Só faz sentido consultar se a coleção existir.
  const existeUsuarios = colecoes.some((c) => c.collectionName === "usuarios");

  if (existeUsuarios) {
    // AGREGAÇÃO que agrupa por perfil e conta:
    //   $group  → agrupa os documentos por um campo;
    //   $ifNull → quem não tem o campo "perfil" entra no grupo "(sem perfil)";
    //   $sum: 1 → em cada documento do grupo, soma 1 (ou seja, conta).
    // É o diagnóstico que revelou a bagunça descrita em database/migracao.js.
    console.log('\nColeção "usuarios" agrupada por campo "perfil":');
    const porPerfil = await db
      .collection("usuarios")
      .aggregate([{ $group: { _id: { $ifNull: ["$perfil", "(sem perfil)"] }, total: { $sum: 1 } } }])
      .toArray();
    porPerfil.forEach((p) => console.log(`  - ${p._id}: ${p.total}`));

    // AMOSTRA das contas, SEM a senha.
    // A projeção é de INCORSIÃO (campos com valor 1): só esses campos
    // vêm no resultado, e o _id é incluído automaticamente.
    // Não se pode misturar campos de inclusão com exclusão ("senha: 0")
    // na mesma projeção — o MongoDB rejeita a combinação.
    console.log("\nAmostra da coleção usuarios (sem senha):");
    const amostra = await db
      .collection("usuarios")
      .find({}, { projection: { nome: 1, email: 1, perfil: 1, cpf: 1 } })
      .limit(20) // no máximo 20 contas na amostra
      .toArray();
    amostra.forEach((u) =>
      console.log(`  - [${u.perfil || "?"}] ${u.nome || "?"} | ${u.email || "?"}`)
    );
  }

  // -------------------------------------------------------------------------
  // 4) ENCERRAMENTO
  // -------------------------------------------------------------------------
  await mongoose.disconnect();
  console.log("\nLeitura concluída. Nada foi alterado.");
  process.exit(0); // código 0 = sucesso
} catch (erro) {
  // Falha no nível principal (conexão, por exemplo): encerra com código 1.
  console.error("Falha na leitura:", erro.message);
  process.exit(1);
}
