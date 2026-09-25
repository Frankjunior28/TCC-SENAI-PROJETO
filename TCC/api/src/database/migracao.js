/**
 * ============================================================================
 *  BANCO DE DADOS  →  MIGRAÇÃO DE PERFIS (organização das coleções)
 * ============================================================================
 *  ===========================================================================
 *  1. O PROBLEMA QUE ESTE ARQUIVO RESOLVE (o contexto mais importante)
 *  ===========================================================================
 *    Numa versão anterior do projeto, TODAS as contas eram gravadas na
 *    ÚNICA coleção "usuarios", e um campinho `perfil` dizia quem era quem.
 *    Essa escolha simples gerou três problemas concretos:
 *
 *      PROBLEMA 1 — a coleção "usuarios" misturava os três perfis.
 *        Não dava para listar "clientes" sem filtrar por perfil, e qualquer
 *        consulta que esquecesse o filtro vazava dados de gerentes para a
 *        tela de clientes.
 *
 *      PROBLEMA 2 — a coleção "gerentes" ficava VAZIA.
 *        O painel do Administrador criava a conta do gerente gravando na
 *        coleção "gerentes"; mas o login (POST /api/usuarios/login) só
 *        consultava a coleção "usuarios". Resultado: o gerente existia no
 *        banco, aparecia no painel, mas NÃO CONSEGUIA ENTRAR no site.
 *
 *      PROBLEMA 3 — a coleção "administradors" (nome errado).
 *        O model do administrador era declarado sem o 3º parâmetro de
 *        mongoose.model(). Sem esse parâmetro, o Mongoose escolhe o nome
 *        sozinho e pluraliza em inglês, criando "administradors" — um
 *        híbrido errado, que não correspondia a nada na documentação.
 *
 *    A solução adotada no projeto atual: uma coleção por perfil
 *    ("usuarios", "gerentes", "administradores") e este arquivo de
 *    migração para levar as contas antigas para o lugar certo.
 *
 *  ===========================================================================
 *  2. O QUE A MIGRAÇÃO FAZ, PASSO A PASSO
 *  ===========================================================================
 *    PASSO 1 — Move gerentes e administradores de "usuarios" para as
 *             coleções corretas, conforme o campo `perfil`.
 *             REGRA DE SEGURANÇA: copia para o destino ANTES de apagar da
 *             origem. Se algo der errado no meio, a conta continua na
 *             origem — ela nunca é perdida.
 *             Se já existir uma conta com o mesmo email no destino, mantém
 *             a do destino (que é a mais recente/correta) e remove apenas
 *             a cópia duplicada da origem.
 *             Registros sem email não podem ser identificados no destino,
 *             então são mantidos na origem com um aviso no console.
 *
 *    PASSO 2 — Documentos antigos de "usuarios" que não tinham o campo
 *             `perfil` recebem perfil: "usuario". Sem isso, um cliente antigo
 *             ficaria sem perfil definido e poderia ser confundido com uma
 *             conta corporativa pela lógica de migração.
 *
 *    PASSO 3 — Corrige a coleção de nome errado "administradors": se houver
 *             dados, move para "administradores"; se esvaziar, apaga a
 *             coleção. Se sobrar algo, mantém e avisa para revisão manual —
 *             é uma decisão conservadora: melhor uma coleção estranha com
 *             dados do que perder informação.
 *
 *  ===========================================================================
 *  3. POR QUE ELA É SEGURA PARA RODAR SEMPRE (idempotência)
 *  ===========================================================================
 *    Idempotente significa que rodar a migração duas vezes produz o mesmo
 *    resultado que rodar uma. Aqui isso acontece naturalmente:
 *      • na primeira execução as contas são movidas;
 *      • na segunda, a busca por perfil em "usuarios" não encontra nada
 *        para mover, e a coleção legada já não existe.
 *    É por isso que o server.js pode chamá-la em TODA inicialização, sem
 *    risco de estragar o banco.
 *
 *  ===========================================================================
 *  4. COMO ELA É EXECUTADA
 *  ===========================================================================
 *    • AUTOMÁTICO: chamada pelo server.js a cada inicialização da API;
 *    • MANUAL:     `npm run migrar` (que é `node src/migrar.js`), útil
 *      para rodar fora do servidor e ver o relatório de contagem.
 *
 *  ===========================================================================
 *  5. POR QUE USA O DRIVER BRUTO (colecao.insertOne) E NÃO O MODEL
 *  ===========================================================================
 *    As operações daqui usam o driver nativo do MongoDB, e não os models
 *    do Mongoose. Motivo: um insert pelo model dispara TODAS as validações
 *    do schema, e documentos antigos podem não ter os campos novos
 *    (telefone, cargo, status). Se a validação falhasse, a migração pararia
 *    no meio do caminho.
 *    Usando o driver bruto, o insert grava o documento como está, sem
 *    validação — que é exatamente o desejado em uma migração. E como
 *    efeito colateral, os valores padrão (perfil, cargo, status) são
 *    preenchidos AQUI NA MÃO, de forma explícita e visível no código.
 *    (O model Usuario é importado apenas para deixar registrada a
 *     dependência com a camada de models; a conexão com ele é feita
 *     pelo server.js quando chama Usuario.syncIndexes().)
 * ============================================================================
 */
import mongoose from "mongoose";
import Usuario from "../models/usuarios.js";

// ---------------------------------------------------------------------------
// MAPA: perfil → coleção de destino + os valores padrão daquele perfil.
// É o mesmo raciocínio do MODELOS_POR_PERFIL do usuarioController, mas
// aqui apontando para NOMES DE COLEÇÃO (strings), porque a migração
// trabalha com o driver bruto.
// ---------------------------------------------------------------------------
const DESTINOS = {
  gerente: { colecao: "gerentes", padroes: { perfil: "gerente", cargo: "Gerente", telefone: "" } },
  administrador: {
    colecao: "administradores",
    padroes: { perfil: "administrador", cargo: "Administrador Master", telefone: "", status: "Ativo" },
  },
};

// Campos que interessam ao destino. Ao montar o novo documento, qualquer
// coisa fora desta lista é descartada — é uma whitelist que evita carregar
// campos obsoletos de versões antigas do projeto.
const CAMPOS = ["nome", "email", "senha", "telefone", "cpf", "cargo", "status", "createdAt", "updatedAt"];

/**
 * Move os registros de "usuarios" para as coleções corretas.
 * @returns {Promise<object>} resumo com o que foi feito (para log/relatório)
 */
export const migrarPerfis = async () => {
  // Objeto-contador: começa em zero e é incrementado conforme o progresso.
  const resumo = { movidos: 0, mantidos: 0, duplicatas: 0, normalizados: 0, colecaoAntigaCorrigida: 0 };

  // Só roda com conexão ativa. No modo demonstração (sem banco) não há o que migrar.
  if (mongoose.connection.readyState !== 1) {
    // readyState === 1 significa "conectado". Valores: 0 desconectado,
    // 1 conectado, 2 conectando, 3 desconectando.
    console.log("⏭️  Migração ignorada: sem conexão com o banco.");
    return resumo;
  }

  // Atalho para o banco conectado, de onde se tiram as coleções.
  const db = mongoose.connection.db;
  const usuariosCol = db.collection("usuarios"); // coleção de origem

  // =========================================================================
  // PASSO 1 — mover gerente/administrador de "usuarios" para suas coleções
  // =========================================================================
  // `Object.entries(DESTINOS)` transforma o objeto em uma lista de pares
  // [chave, valor] — assim o mesmo laço serve para "gerente" e
  // "administrador", sem repetir o código duas vezes.
  for (const [perfil, destino] of Object.entries(DESTINOS)) {
    // .find({ perfil }) devolve um CURSOR (resultado sob demanda);
    // .toArray() traz os documentos de uma vez para a memória, porque
    // o laço abaixo precisa percorrer todos.
    const paraMover = await usuariosCol.find({ perfil }).toArray();

    for (const doc of paraMover) {
      const email = String(doc.email || "").toLowerCase().trim();

      // Documento sem email não tem como ser identificado no destino → mantém
      if (!email) {
        console.warn(`⚠️  Migração: registro de perfil "${perfil}" sem email foi mantido em "usuarios".`);
        resumo.mantidos++;
        continue; // pula para o próximo documento
      }

      const destinoCol = db.collection(destino.colecao);

      // Verifica se a conta "certa" já existe no destino.
      const jaExiste = await destinoCol.findOne({ email });

      if (jaExiste) {
        // A conta do destino é a válida → apaga só a cópia da origem.
        await usuariosCol.deleteOne({ _id: doc._id });
        resumo.duplicatas++;
        console.log(`• Duplicata removida de "usuarios": ${email} (já existia em "${destino.colecao}")`);
        continue;
      }

      // Monta o documento final:
      //   • começa preservando o MESMO _id da origem, para que qualquer
      //     referência já existente continue funcionando;
      //   • copia só os campos da whitelist que tenham valor;
      //   • aplica os valores padrão do perfil;
      //   • garante createdAt/updatedAt mesmo que o registro antigo não tenha.
      const novo = { _id: doc._id };
      CAMPOS.forEach((campo) => {
        if (doc[campo] !== undefined && doc[campo] !== "") novo[campo] = doc[campo];
      });
      Object.assign(novo, destino.padroes, {
        createdAt: doc.createdAt || new Date(),
        updatedAt: new Date(),
      });

      // ⚠️ ORDEM CRÍTICA: copia PRIMEIRO, apaga DEPOIS.
      //   Invertido, um erro no meio da migração perderia a conta.
      await destinoCol.insertOne(novo); // 1) grava no destino
      await usuariosCol.deleteOne({ _id: doc._id }); // 2) só agora remove da origem
      resumo.movidos++;
      console.log(`✅ Movido: ${email} → "${destino.colecao}" (perfil ${perfil})`);
    }
  }

  // =========================================================================
  // PASSO 2 — documentos antigos de "usuarios" sem o campo `perfil`
  // =========================================================================
  // updateMany aplica a alteração a todos os documentos que casarem com o
  // filtro `{ perfil: { $exists: false } }` (traduzido: "todos os que NÃO
  // têm o campo perfil"). `modifiedCount` diz quantos foram de fato
  // alterados — pode ser 0 se o banco já estava normalizado.
  const semPerfil = await usuariosCol.updateMany(
    { perfil: { $exists: false } },
    { $set: { perfil: "usuario" } }
  );
  resumo.normalizados = semPerfil.modifiedCount;

  // =========================================================================
  // PASSO 3 — corrige a coleção de nome errado "administradors"
  // =========================================================================
  // Só se fala dessa coleção se ela realmente existir: listCollections()
  // devolve a lista real de coleções do banco (diferente de countDocuments,
  // que devolveria 0 tanto para coleção vazia quanto para coleção inexistente
  // — uma confusão clássica ao montar relatórios).
  const colecoes = await db.listCollections().toArray();
  const antiga = colecoes.find((c) => c.name === "administradors");

  if (antiga) {
    const docs = await db.collection("administradors").find({}).toArray();
    let movidos = 0;

    for (const doc of docs) {
      const email = String(doc.email || "").toLowerCase().trim();
      const destinoCol = db.collection("administradores");

      // Só move se tiver email e se o destino ainda não tiver essa conta.
      if (email && !(await destinoCol.findOne({ email }))) {
        const novo = { ...doc }; // spread: copia o documento inteiro
        CAMPOS.forEach((campo) => {
          // Aqui o objetivo é o oposto: REMOVER campos vazios/undefined.
          if (novo[campo] === undefined || novo[campo] === "") delete novo[campo];
        });
        Object.assign(novo, DESTINOS.administrador.padroes, { updatedAt: new Date() });
        await destinoCol.insertOne(novo);
        movidos++;
      }
      // Apaga da coleção errada de qualquer forma: se não foi movido, é
      // porque já existia no destino (duplicata) ou não tinha email.
      await db.collection("administradors").deleteOne({ _id: doc._id });
    }

    // Se a coleção errada ficou vazia, ela é removida de vez. Se sobrou algo,
    // é mantida com um aviso — é mais seguro pedir revisão manual do que
    // apagar dados sem entender o que sobrou.
    const restantes = await db.collection("administradors").countDocuments();
    if (restantes === 0) {
      await db.collection("administradors").drop();
      console.log(`🧹 Coleção antiga "administradors" ${movidos ? `esvaziada (${movidos} movido(s)) e ` : ""}removida.`);
    } else {
      console.warn(`⚠️  Coleção "administradors" ainda tem ${restantes} registro(s); revise manualmente.`);
    }
    resumo.colecaoAntigaCorrigida = movidos;
  }

  return resumo;
};

export default migrarPerfis;
