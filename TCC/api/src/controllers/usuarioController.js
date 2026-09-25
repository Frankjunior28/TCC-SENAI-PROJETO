/**
 * ============================================================================
 *  API  →  CONTROLLER DE USUÁRIOS (cadastro, login e CRUD)
 * ============================================================================
 *  ---------------------------------------------------------------------------
 *  1. O QUE É UM CONTROLLER (camada Controller da arquitetura MVC)
 *  ---------------------------------------------------------------------------
 *    É a função que atende uma requisição HTTP. Ela:
 *      • RECEBE o `req` (a requisição: método, caminho, corpo JSON, params);
 *      • CONVERSA com o banco através dos models do Mongoose;
 *      • VALIDA as regras de negócio (email repetido, campos faltando...);
 *      • DEVOLVE o `res` (a resposta) em JSON, com um código HTTP correto.
 *
 *    Ele é chamado pelas rotas de src/routes/usuarioRoutes.js, que só
 *    ligam "endpoint → função". Nenhuma lógica de negócio mora na rota.
 *
 *  ---------------------------------------------------------------------------
 *  2. A REGRA DE OURO DESTE ARQUIVO: CADA PERFIL NA SUA COLEÇÃO
 *  ---------------------------------------------------------------------------
 *    O campo `perfil` que chega no corpo da requisição escolhe o MODEL
 *    (e portanto a COLEÇÃO) que será usado:
 *
 *        perfil "usuario"       → coleção "usuarios"
 *        perfil "gerente"       → coleção "gerentes"
 *        perfil "administrador" → coleção "administradores"
 *
 *    Esse único mapa (MODELOS_POR_PERFIL) faz cadastro E login funcionarem
 *    para os três perfis sem misturar nada. Antes, tudo caía na coleção
 *    "usuarios" e o gerente criado pelo painel do Master não entrava no site.
 *
 *  ---------------------------------------------------------------------------
 *  3. ENDPOINTS ATENDIDOS POR ESTE ARQUIVO
 *  ---------------------------------------------------------------------------
 *    GET    /api/usuarios        → listarUsuarios      (lista só clientes)
 *    GET    /api/usuarios/:id    → buscarUsuarioPorId
 *    POST   /api/usuarios        → criarUsuario        (cadastro de QUALQUER perfil)
 *    POST   /api/usuarios/login  → loginUsuario        (entra em QUALQUER perfil)
 *    PUT    /api/usuarios/:id    → atualizarUsuario
 *    DELETE /api/usuarios/:id    → deletarUsuario
 *
 *  ---------------------------------------------------------------------------
 *  4. OS CÓDIGOS HTTP USADOS AQUI (é bom saber citar na defesa)
 *  ---------------------------------------------------------------------------
 *    200 → deu certo (leitura ou atualização)
 *    201 → recurso criado com sucesso
 *    400 → requisição inválida (falta campo, perfil desconhecido)
 *    401 → credencial não confere (login errado)
 *    404 → registro não encontrado pelo id
 *    409 → CONFLITO: email já cadastrado neste perfil
 *    500 → erro interno inesperado
 *
 *  ---------------------------------------------------------------------------
 *  5. SEGURANÇA
 *  ---------------------------------------------------------------------------
 *    Nenhuma resposta deste arquivo devolve o campo `senha`: ela é removida
 *    pelo helper `semSenha` ou pelo `.select("-senha")` do Mongoose.
 *    PENDÊNCIA CONHECIDA: a senha é gravada em TEXTO PURO no banco. O ideal
 *    seria hash (bcrypt/argon2) — está registrado como melhoria futura.
 *    Pendência maior ainda: as rotas NÃO têm middleware de autenticação,
 *    então qualquer cliente HTTP pode chamar qualquer uma delas.
 * ============================================================================
 */
import Usuario from "../models/usuarios.js";       // coleção "usuarios"      (clientes)
import Gerente from "../models/gerente.js";         // coleção "gerentes"      (gerentes)
import Administrador from "../models/Administrador.js"; // coleção "administradores"

// ---------------------------------------------------------------------------
// FUNÇÕES AUXILIARES (reaproveitadas por todos os handlers deste arquivo)
// ---------------------------------------------------------------------------

/**
 * MAPA: perfil → model (e portanto → coleção).
 * Trocar de perfil aqui é trocar de coleção. É o único ponto do backend
 * que decide isso, o que evita a duplicação que existia antes.
 */
const MODELOS_POR_PERFIL = {
  usuario: Usuario,
  gerente: Gerente,
  administrador: Administrador,
};

/** Lista dos perfis aceitos — são justamente as chaves do mapa acima. */
const PERFIS = Object.keys(MODELOS_POR_PERFIL);

/**
 * Remove a senha de um documento antes de responder.
 * @param {object} doc documento do Mongoose (ou objeto simples)
 * @returns {object} cópia do documento SEM o campo `senha`
 *
 * COMO FUNCIONA:
 *   const objeto = doc.toObject ? doc.toObject() : doc;
 *     → se for um documento do Mongoose, converte para objeto JS comum;
 *       se já for objeto simples, usa como está.
 *   const { senha, ...resto } = objeto;
 *     → DESTRUCTURING: separa o campo `senha` do resto. Tudo que sobrar
 *       vai para `resto`. É um padrão moderno que evita ter que apagar
 *       a propriedade com `delete objeto.senha`.
 */
const semSenha = (doc) => {
  const objeto = doc.toObject ? doc.toObject() : doc;
  const { senha, ...resto } = objeto;
  return resto;
};

/**
 * Normaliza o email: minúsculas e sem espaços nas pontas.
 * Faz o mesmo que o `lowercase: true` do schema, mas ANTES da consulta,
 * para que a verificação de duplicidade compare as duas Strings da mesma forma.
 */
const normalizarEmail = (email) => String(email || "").toLowerCase().trim();

/**
 * Deixa só os dígitos de um valor.
 * Usado para comparar CPF com ou sem máscara: "123.456.789-00" e
 * "12345678900" precisam ser reconhecidos como o mesmo CPF.
 */
const somenteDigitos = (valor) => String(valor || "").replace(/\D/g, "");
//  /\D/g → expressão regular: substitui TODO caractere que não é dígito por
//           string vazia. O `g` = global (repete para todos).

// ===========================================================================
// GET /api/usuarios — lista as contas de CLIENTE (coleção "usuarios")
// ===========================================================================
/**
 * COMO FUNCIONA:
 *   Usuario.find()          → busca todos os documentos da coleção;
 *   .select("-senha")       → projeta o resultado TIRANDO o campo senha
 *                            (o sinal "-" significa "excluir este campo");
 *   res.status(200).json()  → responde 200 com a lista em JSON.
 * O `try/catch` envolve tudo: se o banco cair, o catch devolve 500 em vez
 * de deixar a requisição pendurar.
 */
export const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select("-senha");
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar usuários", error: error.message });
  }
};

// ===========================================================================
// GET /api/usuarios/:id — busca um cliente pelo identificador
// ===========================================================================
/**
 * `req.params.id` é o valor do `:id` na rota (/api/usuarios/:id → "66f...").
 *
 * COMO FUNCIONA:
 *   Usuario.findById(id)  → busca pelo _id (ObjectId do MongoDB);
 *   se não achar → 404 "Usuário não encontrado" (com `return`, para o
 *   código abaixo não executar e tentar responder de novo);
 *   se achar → 200 com o documento.
 */
export const buscarUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select("-senha");
    if (!usuario) return res.status(404).json({ message: "Usuário não encontrado" });
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar usuário", error: error.message });
  }
};

// ===========================================================================
// POST /api/usuarios — CADASTRO de qualquer um dos três perfis
// ===========================================================================
/**
 * CORPO ESPERADO (exemplo de cliente):
 *   { nome, email, senha, telefone, cpf, perfil: "gerente" }
 *
 * PASSO A PASSO:
 *   1) Lê o `perfil` do corpo. Se vier preenchido e não existir no mapa,
 *      devolve 400 — evita gravar em uma coleção inesperada.
 *      Se vier vazio, assume "usuario" (o cadastro mais comum).
 *   2) Escolhe o Model pelo perfil. DAQUI EM DIANTE o código não sabe mais
 *      qual é o perfil: ele só fala com o Model, e o Model cuida da coleção.
 *      É essa abstração que faz o mesmo handler atender os três perfis.
 *   3) Normaliza o email e procura se JÁ EXISTE aquela conta NA COLEÇÃO
 *      daquele perfil. Se existir → 409 (conflito).
 *      Note que o mesmo email pode existir em outra coleção sem conflito:
 *      a pessoa pode ser cliente e gerente ao mesmo tempo.
 *   4) Grava com Model.create(). O Mongoose valida os `required` e o `enum`
 *      do schema (ex.: administrador sem CPF é barrado aqui).
 *      O `perfil` é REFORÇADO no objeto enviado ao banco, ou seja, o cliente
 *      não tem poder de escolher o valor: ele é garantido pelo servidor.
 *   5) Responde 201 Created com o documento, já sem a senha.
 *
 * TRATAMENTO DO CATCH:
 *   error.code === 11000 é o código de DUPLICATA do MongoDB. Ele aparece
 *   quando dois cadastros com o mesmo email chegam quase juntos (corrida):
 *   a verificação do passo 3 passaria nas duas, mas o índice único do banco
 *   barra a segunda. O catch transforma isso em 409, a mesma resposta do
 *   passo 3 — assim o usuário vê uma mensagem consistente nos dois casos.
 */
export const criarUsuario = async (req, res) => {
  try {
    // 1) Validação do perfil recebido
    const perfilRecebido = req.body.perfil;
    if (perfilRecebido && !MODELOS_POR_PERFIL[perfilRecebido]) {
      return res.status(400).json({ message: "Perfil inválido. Use: usuario, gerente ou administrador" });
    }
    const perfil = perfilRecebido || "usuario";

    // 2) Escolha do model (= escolha da coleção)
    const Model = MODELOS_POR_PERFIL[perfil];
    const email = normalizarEmail(req.body.email);

    // 3) Verificação de duplicidade dentro da coleção do perfil
    const existe = await Model.findOne({ email });
    if (existe) {
      return res.status(409).json({ message: "Email já cadastrado para este perfil" });
    }

    // 4) Gravação — o Mongoose valida required/enum do schema
    const novo = await Model.create({ ...req.body, email, perfil });

    // 5) Resposta de sucesso, sem a senha
    res.status(201).json(semSenha(novo));
  } catch (error) {
    // 11000 = índice único violado (duplicata que escapou da checagem)
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email já cadastrado para este perfil" });
    }
    // Qualquer outro erro (campo faltando, formato inválido) → 400
    res.status(400).json({ message: "Erro ao criar usuário", error: error.message });
  }
};

// ===========================================================================
// POST /api/usuarios/login — LOGIN de qualquer um dos três perfis
// ===========================================================================
/**
 * CORPO ESPERADO: { email, senha, perfil }
 *
 * POR QUE O LOGIN TAMBÉM FICA AQUI, E NÃO EM CADA CONTROLLER:
 *    Porque a tela de login é única (LoginScreen.jsx) e serve aos três
 *    perfis. O handler precisa, portanto, saber procurar nas três coleções.
 *
 * PASSO A PASSO:
 *   1) Valida o mínimo: email obrigatório; e é preciso senha OU cpf.
 *   2) Decide em quais coleções procurar:
 *      • se o frontend mandou `perfil`, procura SÓ naquela (mais seguro e
 *        rápido: o gerente não é procurado no meio de clientes);
 *      • se não mandou, procura nas três, na ordem usuarios → gerentes →
 *        administradores.
 *   3) Para cada coleção, busca o documento pelo email:
 *      • não existe → segue para a próxima coleção;
 *      • existe → compara a senha digitada com a gravada;
 *        - confere  → conta encontrada, interrompe o laço (`break`);
 *        - não confere → CONTINUA procurando nas outras coleções, porque o
 *          mesmo email pode existir como cliente e como gerente, e o usuário
 *          escolheu o perfil certo só na interface.
 *   4) Se nenhuma coleta deu certo → 401 com mensagem genérica
 *      "Email ou senha inválidos". A mensagem é genérica DE PROPÓSITO:
 *      dizer "esse email não existe" ou "a senha está errada" ajudaria um
 *      invasor a descobrir quais emails estão cadastrados.
 *   5) Se deu certo → 200 com o documento SEM a senha e COM o campo
 *      `perfil` preenchido. Esse `perfil` é o que o frontend usa para
 *      decidir qual tela abrir: loja, painel do gerente ou painel Master.
 *
 * COMPATIBILIDADE COM VERSÕES ANTIGAS:
 *    A tela de login já pediu email + senha para todos os perfis, mas as
 *    versões anteriores usavam CPF no lugar da senha para gerente e
 *    administrador. Se a senha não vier, o código ainda aceita o CPF como
 *    credencial (comparando só os dígitos). Isso evita que builds antigos
 *    do frontend parem de funcionar.
 */
export const loginUsuario = async (req, res) => {
  try {
    // 1) Separação dos campos do corpo da requisição
    const { email, senha, cpf, perfil } = req.body;
    const emailNorm = normalizarEmail(email);
    const senhaDigitada = String(senha || "");

    if (!emailNorm) return res.status(400).json({ message: "Informe o email" });
    if (!senhaDigitada && !cpf) return res.status(400).json({ message: "Informe a senha" });

    // 2) Coleções que serão consultadas
    let perfis = PERFIS;
    if (perfil) {
      if (!MODELOS_POR_PERFIL[perfil]) {
        return res.status(400).json({ message: "Perfil inválido" });
      }
      perfis = [perfil]; // restringe a busca ao perfil escolhido
    }

    // 3) Procura e valida a credencial
    let conta = null;
    for (const p of perfis) {
      const doc = await MODELOS_POR_PERFIL[p].findOne({ email: emailNorm });
      if (!doc) continue; // não existe nesta coleção → tenta a próxima

      const senhaCorreta = Boolean(doc.senha) && doc.senha === senhaDigitada;
      const cpfCorreto =
        !senhaDigitada && Boolean(doc.cpf) && somenteDigitos(cpf) === somenteDigitos(doc.cpf);

      if (senhaCorreta || cpfCorreto) {
        conta = { doc, perfil: p }; // guarda o documento E o perfil achado
        break; // credencial ok → para de procurar
      }
      // Email existe, mas a credencial não bateu: segue para o próximo perfil.
    }

    // 4) Nenhuma coleção devolveu credencial válida
    if (!conta) {
      return res.status(401).json({ message: "Email ou senha inválidos" });
    }

    // 5) Sucesso: devolve o documento sem senha, com o perfil garantido
    const resposta = { ...semSenha(conta.doc), perfil: conta.perfil };
    res.status(200).json(resposta);
  } catch (error) {
    res.status(500).json({ message: "Erro ao realizar login", error: error.message });
  }
};

// ===========================================================================
// PUT /api/usuarios/:id — atualiza uma conta de cliente
// ===========================================================================
/**
 * POR QUE ESTE UPDATE SÓ FUNCIONA NA COLEÇÃO "usuarios":
 *    A rota é /api/usuarios/:id, e este handler usa SEMPRE o model Usuario.
 *    Ou seja: ele edita contas de cliente. Gerentes e administradores têm
 *    seus próprios endpoints (/api/gerentes/:id e /api/administradores/:id).
 *
 * CAMPOS PROTEGIDOS (não podem ser alterados por esta rota):
 *    const { _id, perfil, ...dados } = req.body;
 *      → `_id`    : o identificador do documento é controlado pelo banco;
 *                   se o cliente mandasse outro, criaria um documento
 *                   com id conflitante.
 *      → `perfil` : é IMUTÁVEL. Se pudesse mudar, um cliente poderia se
 *                   promover a gerente por esta rota, sem passar pela
 *                   coleção correta nem pela validação do model certo.
 *      → `...dados`: o RESTO do corpo. É esse resto que vai para o banco.
 *
 * `{ new: true }` → faz o Mongoose devolver o documento JÁ ATUALIZADO.
 *   Sem essa opção, viria o estado antigo e o frontend receberia dados velhos.
 */
export const atualizarUsuario = async (req, res) => {
  try {
    const { _id, perfil, ...dados } = req.body;
    if (dados.email !== undefined) dados.email = normalizarEmail(dados.email);

    const atualizado = await Usuario.findByIdAndUpdate(req.params.id, dados, { new: true }).select("-senha");
    if (!atualizado) return res.status(404).json({ message: "Usuário não encontrado" });
    res.status(200).json(atualizado);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email já cadastrado para este perfil" });
    }
    res.status(400).json({ message: "Erro ao atualizar usuário", error: error.message });
  }
};

// ===========================================================================
// DELETE /api/usuarios/:id — remove a conta de cliente
// ===========================================================================
/**
 * findByIdAndDelete() faz as duas coisas em uma única operação no banco:
 * procura pelo id e apaga. Devolve o documento apagado, ou null se não
 * existia. É por isso que o `if (!deletado)` funciona como teste de 404.
 *
 * Observação para a defesa: este endpoint apaga a CONTA, mas não apaga
 * os pedidos já feitos por ela — os pedidos guardam uma cópia do nome e
 * do email, então o histórico de vendas permanece intacto. Esse é um
 * efeito colateral da modelagem com "incorporação" (embedding).
 */
export const deletarUsuario = async (req, res) => {
  try {
    const deletado = await Usuario.findByIdAndDelete(req.params.id);
    if (!deletado) return res.status(404).json({ message: "Usuário não encontrado" });
    res.status(200).json({ message: "Usuário removido com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar usuário", error: error.message });
  }
};
