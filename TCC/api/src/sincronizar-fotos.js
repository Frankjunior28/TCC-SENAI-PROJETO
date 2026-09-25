/**
 * ============================================================================
 *  ATUALIZAÇÃO MANUAL DAS FOTOS  →  node src/sincronizar-fotos.js  (npm run fotos)
 * ============================================================================
 *  ---------------------------------------------------------------------------
 *  1. O PROBLEMA QUE ESTE SCRIPT RESOLVE
 *  ---------------------------------------------------------------------------
 *    Durante o desenvolvimento, a primeira versão do catálogo usava imagens
 *    reutilizadas: o mesmo arquivo aparecia em vários produtos, e alguns
 *    não correspondiam ao móvel (um rack de TV com foto de sofá, por
 *    exemplo). A correção exigia substituir as fotos de todos os produtos
 *    de uma vez, e isso no banco já preenchido.
 *
 *    Editar 12 produtos pela interface do painel do gerente seria possível,
 *    mas lento e sujeito a erro humano. Este script faz a mesma coisa de
 *    forma determinística: ele lê o catálogo canônico (PRODUTOS_SEED, em
 *    src/seed.js) e escreve os caminhos de imagem corretos no banco.
 *
 *  ---------------------------------------------------------------------------
 *  2. POR QUE ELE USA O DRIVER BRUTO E NÃO O MODEL
 *  ---------------------------------------------------------------------------
 *    A atualização é feita com `mongoose.connection.collection("produtos")`
 *    e o método `updateOne` direto, sem passar pelo model `Produto`.
 *    Motivo prático: assim o script depende MENOS do schema. Se um dia o
 *    campo `foto` for renomeado, este script continua funcionando — ele
 *    apenas escreve dois campos com nomes que ele próprio define.
 *    (O mesmo cuidado vale para o filtro: o produto é localizado pelo NOME,
 *    e não pelo _id, porque os ids mudam a cada re-seed do banco.)
 *
 *  ---------------------------------------------------------------------------
 *  3. POR QUE ELE NÃO USA insertMany NEM apaga tudo
 *  ---------------------------------------------------------------------------
 *    É uma atualização PONETUAL: para cada produto do catálogo, escreve
 *    apenas `foto` e `fotos`. Nenhum documento é criado e nenhum é apagado.
 *    Assim, se o gerente tiver cadastrado produtos extras no painel, eles
 *    permanecem intocados. É o mesmo princípio do seed, aplicados a uma
 *    operação de manutenção.
 *
 *  ---------------------------------------------------------------------------
 *  4. DIFERENÇA PARA O QUE O SEED TAMBÉM FAZ
 *  ---------------------------------------------------------------------------
 *    Os dois cuidam de fotos, mas com escopos diferentes:
 *      • o SEED (automático, no startup) só completa produtos que estão
 *        TOTALMENTE sem foto, e apenas se a coleção estiver vazia ou se
 *        houver produto sem imagem;
 *      • este SCRIPT (manual) sobrescreve as fotos de TODOS os 12 produtos
 *        do catálogo, independentemente do estado atual.
 *    Ou seja: o seed é conservador e automático; este script é intencional
 *    e sob demanda.
 * ============================================================================
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import connectDatabase from "./database/connection.js";
import { PRODUTOS_SEED } from "./seed.js"; // o catálogo canônico

// Lê api/.env. O flag `quiet: true` impede o dotenv de imprimir um aviso
// caso o arquivo não exista — neste script o .env é obrigatório (sem ele
// a conexão cai no MongoDB local), então o aviso não agregaria nada.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });

/** Fluxo principal do script. */
const main = async () => {
  // 1) Conexão — aqui a falha É fatal (diferente do server.js, que sobe
  //    em modo demonstração). Um script de manutenção sem banco não tem
  //    motivo para continuar rodando.
  const conectado = await connectDatabase();
  if (!conectado) {
    console.error("Não foi possível conectar ao banco. Atualização abortada.");
    process.exit(1);
  }

  // 2) Percorre o catálogo e escreve as fotos de cada produto
  let atualizados = 0; // contador de sucesso

  for (const produto of PRODUTOS_SEED) {
    // Filtro: { nome } — localiza o documento pelo nome do móvel.
    // Update: { $set: { foto, fotos } } — escreve só esses dois campos.
    // Sem `fotos` no $set, as demais propriedades do documento permanecem.
    const resultado = await mongoose.connection.collection("produtos").updateOne(
      { nome: produto.nome },
      { $set: { foto: produto.foto, fotos: produto.fotos } }
    );

    // modifiedCount > 0 significa que o banco realmente mudou (a foto era
    // diferente). Se a foto já era a mesma, o MongoDB conta como
    // matchedCount e não como modifiedCount — por isso a comparação correta
    // para contar alterações efetivas é com modifiedCount.
    if (resultado.modifiedCount > 0) atualizados += 1;
  }

  // 3) Relatório final
  console.log(`📸 Fotos sincronizadas: ${atualizados} produto(s) atualizado(s).`);

  // 4) Desconexão. Sem process.exit(0) explícito aqui: quando não há mais
  //    nenhuma requisição pendente, o Node encerra o processo sozinho.
  await mongoose.disconnect();
};

// Tratamento de falha inesperada.
main().catch((erro) => {
  console.error("Falha ao sincronizar fotos:", erro.message);
  process.exit(1);
});
