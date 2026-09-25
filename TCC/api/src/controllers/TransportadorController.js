/**
 * ============================================================================
 *  ARQUIVO LEGADO — NÃO É USADO PELO SISTEMA ATUAL
 * ============================================================================
 *  HISTÓRICO:
 *    Pertence a uma versão ANTERIOR do projeto, que tinha um quarto perfil:
 *    o TRANSPORTADOR (entregador), identificado por CNPJ. O model, este
 *    controller e as rotas de transportador ficaram na pasta, mas não são
 *    importados por ninguém — o server.js não monta essas rotas.
 *
 *  POR QUE ESTE ARQUIVO MERECE ATENÇÃO NUMA DEFESA:
 *    Ele contrasta com os controllers atuais em dois pontos:
 *
 *    1) NÃO TIRA A SENHA DA RESPOSTA. Os controllers vigentes usam o helper
 *       `semSenha` ou `.select("-senha")`, garantindo que a credencial
 *       nunca volte ao navegador. Aqui, `criarTransportador` devolve
 *       `novoTransportador` inteiro — um vazamento de dado.
 *
 *    2) USA "mensagem" COM ACENTO no corpo de erro, em vez de "message".
 *       O frontend (ui/src/services/api.js) procura `data.message` e, se não
 *       achar, cai no texto genérico do código HTTP. Com esta chave, o
 *       usuário leria "Erro 500" em vez da explicação real. Foi por isso
 *       que a documentação do projeto padronizou a chave `message`.
 *
 *  COMO ESTES HANDLERS FUNCIONAM (o CRUD clássico, o mesmo padrão dos atuais):
 *    • find()                → lista;
 *    • new Model(req.body) + save() → cria e grava (o `create()` é
 *      apenas o atalho para essas duas linhas);
 *    • findById(id)          → busca um;
 *    • findByIdAndUpdate(id, body, { new: true }) → atualiza devolvendo o novo;
 *    • findByIdAndDelete(id) → apaga.
 *    Todos envolvidos em try/catch, devolvendo 404 quando o registro não
 *    existe e 400/500 em caso de erro.
 *
 *  ⚠️ ESTE ARQUIVO NÃO É IMPORTADO por nenhum arquivo do sistema atual.
 *     É código morto, mantido como registro de uma etapa do projeto.
 * ============================================================================
 */
import Transportador from "../models/Transportador.js";

// ===========================================================================
// GET /api/transportadores — lista os transportadores
// ===========================================================================
export const listarTransportadores = async (req, res) => {
  try {
    const transportadores = await Transportador.find();
    res.status(200).json(transportadores);
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao buscar transportadores", error: error.message });
  }
};

// ===========================================================================
// POST /api/transportadores — cria um transportador
// ===========================================================================
/**
 * `new Transportador(req.body)` cria um documento em memória (ainda não
 * gravado) e `.save()` confirma a gravação no banco, atribuindo o `_id`.
 * A partir daqui a variável contém o documento completo, e é ele que é
 * devolvido — sem nenhum filtro de senha (ver observação no cabeçalho).
 */
export const criarTransportador = async (req, res) => {
  try {
    const novoTransportador = new Transportador(req.body);
    await novoTransportador.save();
    res.status(201).json(novoTransportador);
  } catch (error) {
    res.status(400).json({ mensagem: "Erro ao criar transportador", error: error.message });
  }
};

// ===========================================================================
// GET /api/transportadores/:id — busca um transportador pelo identificador
// ===========================================================================
export const obterTransportador = async (req, res) => {
  try {
    const transportador = await Transportador.findById(req.params.id);
    if (!transportador) return res.status(404).json({ mensagem: "Transportador não encontrado" });
    res.status(200).json(transportador);
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao buscar transportador", error: error.message });
  }
};

// ===========================================================================
// PUT /api/transportadores/:id — atualiza um transportador
// ===========================================================================
/**
 * A DIFFERENÇA para `findByIdAndUpdate` é que este usa o objeto do Mongoose
 * (montado com `new`) e chama `.save()`, o que dispara as validações do
 * schema antes de gravar. `{ new: true }` na forma
 * `findByIdAndUpdate(id, body, { new: true })` faz o mesmo papel, devolvendo
 * o documento já atualizado em vez do estado anterior.
 */
export const atualizarTransportador = async (req, res) => {
  try {
    const transportadorAtualizado = await Transportador.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!transportadorAtualizado) return res.status(404).json({ mensagem: "Transportador não encontrado" });
    res.status(200).json(transportadorAtualizado);
  } catch (error) {
    res.status(400).json({ mensagem: "Erro ao atualizar transportador", error: error.message });
  }
};

// ===========================================================================
// DELETE /api/transportadores/:id — remove um transportador
// ===========================================================================
export const deletarTransportador = async (req, res) => {
  try {
    const transportadorDeletado = await Transportador.findByIdAndDelete(req.params.id);
    if (!transportadorDeletado) return res.status(404).json({ mensagem: "Transportador não encontrado" });
    res.status(200).json({ mensagem: "Transportador removido com sucesso" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao deletar transportador", error: error.message });
  }
};
