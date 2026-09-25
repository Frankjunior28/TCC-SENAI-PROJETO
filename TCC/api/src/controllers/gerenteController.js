/**
 * ============================================================================
 *  API  →  CONTROLLER DE GERENTES (coleção "gerentes")
 * ============================================================================
 *  ---------------------------------------------------------------------------
 *  O QUE É UM CONTROLLER
 *  ---------------------------------------------------------------------------
 *    Função que atende uma requisição HTTP: recebe o `req`, conversa com o
 *    banco pelo model Mongoose `Gerente`, valida as regras de negócio e
 *    devolve a resposta em JSON. É chamada pelas rotas de
 *    src/routes/gerenteRoutes.js.
 *
 *  ---------------------------------------------------------------------------
 *  QUEM USA ESTE RECURSO
 *  ---------------------------------------------------------------------------
 *    O painel do Administrador (AdministradorScreen.jsx), na aba
 *    "Contas de gerentes": lista, cria e exclui contas. É o administrador
 *    quem administra os gerentes — o gerente não cria contas.
 *
 *  ---------------------------------------------------------------------------
 *  A RELAÇÃO DESTA COLEÇÃO COM O LOGIN (o ponto mais importante)
 *  ---------------------------------------------------------------------------
 *    Gerente criado AQUI fica na coleção "gerentes" com `perfil: "gerente"`.
 *    O login do site (POST /api/usuarios/login) procura o email nessa
 *    coleção quando o perfil escolhido é "gerente" — veja o mapa
 *    MODELOS_POR_PERFIL em usuarioController.js.
 *    Ou seja: o gerente cadastrado pelo administrador CONSEGUI entrar
 *    normalmente com email e senha.
 *    Foi exatamente esse o bug da versão anterior do projeto: o gerente era
 *    gravado aqui, mas o login só lia a coleção "usuarios" — a conta
 *    existia e não conseguia entrar. Este controller e o mapa do
 *    usuarioController são as duas metades da correção.
 *
 *  ---------------------------------------------------------------------------
 *  ENDPOINTS
 *  ---------------------------------------------------------------------------
 *    GET    /api/gerentes     → listarGerentes       (painel Master)
 *    GET    /api/gerentes/:id → buscarGerentePorId
 *    POST   /api/gerentes     → criarGerente         (painel Master cria conta)
 *    PUT    /api/gerentes/:id → atualizarGerente
 *    DELETE /api/gerentes/:id → deletarGerente       (painel Master exclui)
 *
 *  OBS.: o LOGIN do gerente NÃO é atendido aqui — é
 *  POST /api/usuarios/login, que sabe procurar nesta coleção.
 *
 *  REGRA APRESENTE EM TODAS AS RESPOSTAS: o campo `senha` nunca volta.
 * ============================================================================
 */
import Gerente from "../models/gerente.js";

// ---------------------------------------------------------------------------
// FUNÇÕES AUXILIARES
// ---------------------------------------------------------------------------

/**
 * Remove a senha do documento antes de responder.
 * `doc.toObject()` converte o documento do Mongoose em objeto JS comum;
 * o destructuring `const { senha, ...resto }` separa a senha do restante.
 * É o mesmo helper usado no usuarioController — a duplicação existe
 * porque os arquivos são independentes entre si (cada controller poderia
 * ser copiado para outro projeto sem dependência dos demais).
 */
const semSenha = (doc) => {
  const objeto = doc.toObject ? doc.toObject() : doc;
  const { senha, ...resto } = objeto;
  return resto;
};

/** Normaliza o email (minúsculas, sem espaços) antes de gravar ou comparar. */
const normalizarEmail = (email) => String(email || "").toLowerCase().trim();

// ===========================================================================
// GET /api/gerentes — lista todas as contas de gerente
// ===========================================================================
/**
 * Gerente.find()          → todos os documentos da coleção "gerentes";
 * .select("-senha")       → remove o campo senha do resultado;
 * 200 + JSON              → o painel Master desenha nome, email e cargo
 *                           (a senha nunca chega ao navegador, nem para
 *                           ser escondida na interface: ela não existe
 *                           na resposta).
 */
export const listarGerentes = async (req, res) => {
  try {
    const gerentes = await Gerente.find().select("-senha");
    res.status(200).json(gerentes);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar gerentes", error: error.message });
  }
};

// ===========================================================================
// GET /api/gerentes/:id — busca um gerente pelo identificador
// ===========================================================================
/**
 * req.params.id é o ":id" da rota. Devolve 404 quando o id não existe no
 * banco, encerrando o handler com `return`.
 */
export const buscarGerentePorId = async (req, res) => {
  try {
    const gerente = await Gerente.findById(req.params.id).select("-senha");
    if (!gerente) return res.status(404).json({ message: "Gerente não encontrado" });
    res.status(200).json(gerente);
  } catch (error) {
    res.status(500).json({ message: "ID inválido", error: error.message });
  }
};

// ===========================================================================
// POST /api/gerentes — cria uma conta de gerente
// ===========================================================================
/**
 * CHAMADO POR: AdministradorScreen.jsx, ao enviar o formulário
 * "Cadastrar gerente" (nome, email, senha, cpf e cargo).
 *
 * PASSO A PASSO:
 *   1) Normaliza o email, para que a comparação de duplicidade e o índice
 *      único do banco falem sempre do mesmo jeito.
 *   2) Procura um gerente com o mesmo email. Se existir → 409 (conflito),
 *      e a tela mostra "Email já cadastrado para este perfil".
 *   3) Grava com Gerente.create(), REFORÇANDO o campo `perfil: "gerente"`.
 *      Esse detalhe é proposital: o corpo da requisição NÃO escolhe o
 *      perfil. Quem decide é o servidor, e o `enum` do schema só admite
 *      "gerente" nesta coleção. Assim, mesmo que alguém mandasse
 *      `perfil: "administrador"` no corpo, o valor forçado prevaleceria.
 *   4) Responde 201 com o documento já sem a senha.
 *
 * TRATAMENTO DO CATCH:
 *   error.code === 11000 é o código de duplicata do MongoDB. Ele aparece
 *   quando duas requisições com o mesmo email chegam quase ao mesmo tempo
 *   (condição de corrida): a verificação do passo 2 passa nas duas, mas o
 *   índice único do banco recusa a segunda. O catch converte para 409, a
 *   mesma resposta do passo 2, para que o usuário veja sempre a mesma
 *   mensagem nos dois cenários.
 */
export const criarGerente = async (req, res) => {
  try {
    const email = normalizarEmail(req.body.email);

    // 2) Duplicidade dentro da coleção "gerentes"
    const existe = await Gerente.findOne({ email });
    if (existe) return res.status(409).json({ message: "Email já cadastrado para este perfil" });

    // 3) Gravação com perfil garantido pelo servidor
    const novoGerente = await Gerente.create({ ...req.body, email, perfil: "gerente" });

    // 4) 201 Created, sem a senha
    res.status(201).json(semSenha(novoGerente));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email já cadastrado para este perfil" });
    }
    res.status(400).json({ message: "Erro ao criar gerente", error: error.message });
  }
};

// ===========================================================================
// PUT /api/gerentes/:id — atualiza a conta de um gerente
// ===========================================================================
/**
 * CAMPOS PROTEGIDOS:
 *   const { _id, perfil, ...dados } = req.body;
 *     → `_id`    é controlado pelo banco; aceitar um id do corpo poderia
 *                colidir com o documento de outra conta;
 *     → `perfil` é imutável: se mudasse, o documento deixaria de
 *                pertencer a esta coleção e quebraria a lógica de perfil.
 *     → `...dados` é o resto, e é o que será gravado.
 *
 * `{ new: true }` → o Mongoose devolve o documento já atualizado. Sem essa
 * opção, a resposta traria o estado anterior.
 */
export const atualizarGerente = async (req, res) => {
  try {
    const { _id, perfil, ...dados } = req.body; // remove campos protegidos
    if (dados.email !== undefined) dados.email = normalizarEmail(dados.email);

    const atualizado = await Gerente.findByIdAndUpdate(req.params.id, dados, { new: true }).select("-senha");
    if (!atualizado) return res.status(404).json({ message: "Gerente não encontrado" });
    res.status(200).json(atualizado);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email já cadastrado para este perfil" });
    }
    res.status(400).json({ message: "Erro ao atualizar gerente", error: error.message });
  }
};

// ===========================================================================
// DELETE /api/gerentes/:id — remove a conta de gerente
// ===========================================================================
/**
 * findByIdAndDelete() apaga e devolve o documento removido (ou null, se não
 * existia) — o que permite responder 404 corretamente.
 *
 * Na interface, a chamada só chega aqui depois de uma confirmação
 * (window.confirm em AdministradorScreen.jsx).
 */
export const deletarGerente = async (req, res) => {
  try {
    const deletado = await Gerente.findByIdAndDelete(req.params.id);
    if (!deletado) return res.status(404).json({ message: "Gerente não encontrado" });
    res.status(200).json({ message: "Gerente removido com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar gerente", error: error.message });
  }
};
