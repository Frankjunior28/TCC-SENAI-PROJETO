/**
 * ============================================================================
 *  API  →  CONTROLLER DE ADMINISTRADORES (coleção "administradores")
 * ============================================================================
 *  ---------------------------------------------------------------------------
 *  O QUE É UM CONTROLLER
 *  ---------------------------------------------------------------------------
 *    Função que atende uma requisição HTTP: recebe o `req`, conversa com o
 *    banco pelo model Mongoose `Administrador`, valida as regras de negócio
 *    e devolve a resposta em JSON. É chamada pelas rotas de
 *    src/routes/AdministradorRoutes.js.
 *
 *  ---------------------------------------------------------------------------
 *  ⚠️ SITUAÇÃO ATUAL DESTE RECURSO — IMPORTANTE CONHECER
 *  ---------------------------------------------------------------------------
 *    A rota EXISTE e funciona no backend, mas o FRONTEND NÃO CONSOME ESTE
 *    CRUD. Não há nenhuma função de administradores em
 *    ui/src/services/api.js, e o painel Master (AdministradorScreen.jsx)
 *    gerencia apenas pedidos e contas de gerentes.
 *    Ou seja: estas cinco rotas são a parte "completa" do CRUD, pronta para
 *    ser usada, mas ainda sem tela que a invoque. O LOGIN do administrador,
 *    por outro lado, já funciona: ele acontece em
 *    POST /api/usuarios/login, que procura nesta coleção (veja o mapa
 *    MODELOS_POR_PERFIL em usuarioController.js).
 *    Está registrado na documentação do TCC como pendência/evolução futura.
 *
 *  ---------------------------------------------------------------------------
 *  ENDPOINTS
 *  ---------------------------------------------------------------------------
 *    GET    /api/administradores     → listarAdministradores
 *    POST   /api/administradores     → criarAdministrador
 *    GET    /api/administradores/:id → obterAdministrador
 *    PUT    /api/administradores/:id → atualizarAdministrador
 *    DELETE /api/administradores/:id → deletarAdministrador
 *
 *  ---------------------------------------------------------------------------
 *  PADRÕES ADOTADOS AQUI (iguais aos demais controllers)
 *  ---------------------------------------------------------------------------
 *    • email normalizado (minúsculas) e único → 409 se repetir;
 *    • `perfil: "administrador"` forçado no create — o cliente não escolhe;
 *    • o campo `senha` nunca é devolvido em resposta;
 *    • as mensagens de erro usam a chave `message`, que é a chave que o
 *      frontend lê em `montarMensagem()` (ui/src/services/api.js).
 *      Manter essa chave padronizada é o que permite que o mesmo
 *      tradutor de erros funcione para todos os endpoints.
 * ============================================================================
 */
import Administrador from "../models/Administrador.js";

// ---------------------------------------------------------------------------
// FUNÇÕES AUXILIARES
// ---------------------------------------------------------------------------

/**
 * Remove a senha do documento antes de responder.
 * `doc.toObject()` converte o documento do Mongoose em objeto simples;
 * o destructuring `const { senha, ...resto }` separa a senha do restante.
 */
const semSenha = (doc) => {
  const objeto = doc.toObject ? doc.toObject() : doc;
  const { senha, ...resto } = objeto;
  return resto;
};

/** Normaliza o email (minúsculas, sem espaços) antes de gravar ou comparar. */
const normalizarEmail = (email) => String(email || "").toLowerCase().trim();

// ===========================================================================
// GET /api/administradores — lista as contas de administrador
// ===========================================================================
/**
 * Administrador.find()    → todos os documentos da coleção;
 * .select("-senha")       → remove a senha do resultado;
 * 200 + JSON              → a resposta vai para o navegador sem a senha.
 */
export const listarAdministradores = async (req, res) => {
  try {
    const administradores = await Administrador.find().select("-senha");
    res.status(200).json(administradores);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar administradores", error: error.message });
  }
};

// ===========================================================================
// POST /api/administradores — cria uma conta de administrador (Master)
// ===========================================================================
/**
 * DIFERENÇA PARA OS OUTROS PERFIS: o CPF É OBRIGATÓRIO.
 *   Quem esquecer o CPF não recebe erro daqui, mas sim do schema
 *   (models/Administrador.js tem `cpf: { required: true }`). O Mongoose
 *   lança a exceção de validação, e o `catch` abaixo a transforma em
 *   HTTP 400 devolvendo `error.message` — a mensagem escrita pelo próprio
 *   Mongoose, que aponta exatamente qual campo faltou.
 *   Ou seja: a regra está declarada UMA VEZ no model e vale para todos os
 *   caminhos de escrita no banco.
 *
 * PASSO A PASSO:
 *   1) Normaliza o email;
 *   2) Procura duplicidade na coleção → 409 se existir;
 *   3) Grava com `perfil: "administrador"` forçado pelo servidor;
 *   4) Responde 201 sem a senha.
 *   5) O catch trata o 11000 (índice único violado por corrida) e os demais erros.
 */
export const criarAdministrador = async (req, res) => {
  try {
    const email = normalizarEmail(req.body.email);

    const existe = await Administrador.findOne({ email });
    if (existe) return res.status(409).json({ message: "Email já cadastrado para este perfil" });

    const novo = await Administrador.create({ ...req.body, email, perfil: "administrador" });
    res.status(201).json(semSenha(novo));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email já cadastrado para este perfil" });
    }
    res.status(400).json({ message: "Erro ao criar administrador", error: error.message });
  }
};

// ===========================================================================
// GET /api/administradores/:id — busca um administrador pelo identificador
// ===========================================================================
/**
 * req.params.id é o ":id" da rota. Devolve 404 quando o id não existe,
 * encerrando o handler com `return` para não tentar responder de novo.
 */
export const obterAdministrador = async (req, res) => {
  try {
    const administrador = await Administrador.findById(req.params.id).select("-senha");
    if (!administrador) return res.status(404).json({ message: "Administrador não encontrado" });
    res.status(200).json(administrador);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar administrador", error: error.message });
  }
};

// ===========================================================================
// PUT /api/administradores/:id — atualiza a conta de um administrador
// ===========================================================================
/**
 * CAMPOS PROTEGIDOS:
 *   const { _id, perfil, ...dados } = req.body;
 *     → `_id`    é controlado pelo banco;
 *     → `perfil` é imutável: alterá-lo tiraria o documento desta coleção;
 *     → `...dados` é o restante, que é o que será gravado.
 *
 * A formatação quebrada em várias linhas (o `Administrador.findByIdAndUpdate`
 * e o `{ new: true }` em linhas separadas) é intencional: deixa a chamada
 * mais legível e mostra que a terceira opção `{ new: true }` não se
 * confunde com o corpo da atualização.
 */
export const atualizarAdministrador = async (req, res) => {
  try {
    const { _id, perfil, ...dados } = req.body; // perfil é imutável
    if (dados.email !== undefined) dados.email = normalizarEmail(dados.email);

    const atualizado = await Administrador.findByIdAndUpdate(req.params.id, dados, {
      new: true,
    }).select("-senha");
    if (!atualizado) return res.status(404).json({ message: "Administrador não encontrado" });
    res.status(200).json(atualizado);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email já cadastrado para este perfil" });
    }
    res.status(400).json({ message: "Erro ao atualizar administrador", error: error.message });
  }
};

// ===========================================================================
// DELETE /api/administradores/:id — remove a conta de administrador
// ===========================================================================
/**
 * findByIdAndDelete() apaga em uma única operação e devolve o documento
 * removido (ou null, se não existia) — o que permite responder 404.
 */
export const deletarAdministrador = async (req, res) => {
  try {
    const deletado = await Administrador.findByIdAndDelete(req.params.id);
    if (!deletado) return res.status(404).json({ message: "Administrador não encontrado" });
    res.status(200).json({ message: "Administrador removido com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar administrador", error: error.message });
  }
};
