/**
 * ============================================================================
 *  SCRIPT DE MIGRAÇÃO MANUAL  →  node src/migrar.js  (npm run migrar)
 * ============================================================================
 *  ---------------------------------------------------------------------------
 *  1. PARA QUE SERVE
 *  ---------------------------------------------------------------------------
 *    A migração de perfis (database/migracao.js) JÁ é executada sozinha pelo
 *    server.js a cada inicialização da API. Este script existe para rodar
 *    essa MESMA migração FORA do servidor, útil em três situações:
 *      • preparar o banco antes de subir a API pela primeira vez;
 *      • conferir o resultado da migração por um relatório detalhado;
 *      • rodar a migração em um ambiente onde não se quer subir a aplicação.
 *
 *  ---------------------------------------------------------------------------
 *  2. O QUE ELE FAZ, NA ORDEM
 *  ---------------------------------------------------------------------------
 *    1) Carrega o .env (dotenv) para obter a MONGO_URI;
 *    2) Conecta no banco (mesmo helper usado pelo server.js);
 *       → se não conectar, aborta com process.exit(1): aqui a falha É fatal,
 *         diferente do servidor, porque um script sem banco não tem motivo
 *         para continuar;
 *    3) Executa a migração de perfis — move gerentes e administradores que
 *       ainda estiverem na coleção "usuarios" para as coleções certas e
 *       limpa a coleção de nome errado "administradors";
 *    4) Recria os índices (o de email único em cada coleção de contas);
 *    5) Mostra um relatório com a contagem de documentos de cada coleção,
 *       o breakdown da coleção "usuarios" por perfil, e o resumo da migração;
 *    6) Desconecta do banco e encerra o processo.
 *
 *  ---------------------------------------------------------------------------
 *  3. POR QUE A ORDEM " MIGRAR ANTES DE SINCRONIZAR OS ÍNDICES" IMPORTA
 *  ---------------------------------------------------------------------------
 *    É o detalhe mais importante deste script. O índice de email é ÚNICO.
 *    Se ele fosse criado antes da migração, ainda existiriam várias contas
 *    (cliente, gerente e administrador) com o MESMO email dentro de uma
 *    única coleção "usuarios" — e a criação do índice falharia, derrubando
 *    a sincronização.
 *    Por isso a ordem é: primeiro separa as contas nas coleções
 *    (migrarPerfis), depois cria os índices (syncIndexes).
 *
 *  ---------------------------------------------------------------------------
 *  4. POR QUE É SEGURO RODAR VÁRIAS VEZES
 *  ---------------------------------------------------------------------------
 *    A migração é idempotente (ver a explicação em database/migracao.js):
 *    na segunda execução não há mais nada a mover, e ela apenas confirma
 *    os números do relatório. O script pode ser executado quantas vezes for
 *    necessário, sem risco para os dados.
 * ============================================================================
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import connectDatabase from "./database/connection.js";
import migrarPerfis from "./database/migracao.js";
import Usuario from "./models/usuarios.js";
import Gerente from "./models/gerente.js";
import Administrador from "./models/Administrador.js";

// Lê api/.env (se existir). O caminho é montado a partir da URL deste
// próprio arquivo, e não do diretório de execução — por isso funciona
// igual se o comando for rodado de dentro de api/ ou da raiz do projeto.
//   import.meta.url → o endereço do módulo atual (como URL);
//   new URL("../.env", ...) → resolve ".env" um nível acima de src/;
//   fileURLToPath()  → converte essa URL em um caminho do sistema de arquivos.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

/**
 * Monta e imprime o relatório de contagem do banco.
 * Só roda com a conexão já estabelecida.
 */
const relatorio = async () => {
  const db = mongoose.connection.db; // atalho para o banco conectado

  // IMPORTANTE: em vez de chamar countDocuments() direto, primeiro descobre
  // QUAIS coleções EXISTEM de fato. A razão é técnica: countDocuments()
  // devolve 0 tanto para uma coleção vazia quanto para uma coleção que
  // nunca foi criada — o relatório não distinguiria "vazia" de "não existe",
  // e isso falsearia a verificação da coleção legada "administradors".
  const existentes = new Set((await db.listCollections().toArray()).map((c) => c.name));

  console.log("\n📊 Situação do banco depois da migração:");
  for (const nome of ["usuarios", "gerentes", "administradores", "administradors", "produtos", "pedidos"]) {
    if (!existentes.has(nome)) {
      console.log(`   - ${nome}: (coleção não existe)`);
      continue;
    }
    const total = await db.collection(nome).countDocuments();
    console.log(`   - ${nome}: ${total} documento(s)`);
  }

  // Se a coleção "usuarios" nem existe, não há breakdown a fazer.
  if (!existentes.has("usuarios")) return;

  // AGGREGATION: pergunta ao banco "quantos documentos há de cada perfil?".
  // $group agrupa por um campo; $ifNull trata quem não tem perfil como
  // "(sem perfil)"; $sum conta os documentos de cada grupo.
  const porPerfil = await db
    .collection("usuarios")
    .aggregate([{ $group: { _id: { $ifNull: ["$perfil", "(sem perfil)"] }, total: { $sum: 1 } } }])
    .toArray();
  console.log('   Coleção "usuarios" por perfil:');
  porPerfil.forEach((p) => console.log(`     • ${p._id}: ${p.total}`));
};

/** Fluxo principal do script. */
const main = async () => {
  // 2) Conexão — aqui a falha é fatal (diferente do server.js)
  const conectado = await connectDatabase();
  if (!conectado) {
    console.error("Não foi possível conectar ao banco. Migração abortada.");
    process.exit(1);
  }

  // 3) A migração propriamente dita
  const resumo = await migrarPerfis();

  // 4) Índices — só DEPOIS da migração (ver explicação no cabeçalho)
  await Usuario.syncIndexes();
  await Gerente.syncIndexes();
  await Administrador.syncIndexes();
  console.log("🔑 Índices de email sincronizados nas 3 coleções de contas.");

  // 5) Relatório da migração
  console.log("\n🧹 Resumo da migração:");
  console.log(`   • movidos para a coleção certa: ${resumo.movidos}`);
  console.log(`   • duplicatas removidas:         ${resumo.duplicatas}`);
  console.log(`   • registros sem perfil ajustados: ${resumo.normalizados}`);
  console.log(`   • corrigidos na "administradors": ${resumo.colecaoAntigaCorrigida}`);

  // 6) Contagem detalhada por coleção
  await relatorio();

  // 6) Desconexão e encerramento com código 0 (sucesso)
  await mongoose.disconnect();
  console.log("\n✅ Migração concluída e banco desconectado.");
  process.exit(0);
};

// Tratamento de qualquer falha inesperada: imprime e encerra com código 1,
// que é o sinal de "erro" para quem chamou o script.
main().catch((erro) => {
  console.error("❌ Falha na migração:", erro.message);
  process.exit(1);
});
