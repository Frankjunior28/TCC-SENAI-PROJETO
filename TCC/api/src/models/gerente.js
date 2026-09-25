/**
 * ============================================================================
 *  BANCO DE DADOS  →  MODEL DA COLEÇÃO "gerentes"
 * ============================================================================
 *  O QUE FICA NESTA COLEÇÃO:
 *    Somente contas de PERFIL "gerente" — os responsáveis por manter o
 *    catálogo (cadastrar, editar, publicar, controlar estoque e vendas).
 *
 *  QUEM CRIA CONTAS DE GERENTE (duas fontes, e as duas funcionam no login):
 *    1) O painel do Administrador (AdministradorScreen.jsx, aba
 *       "Contas de gerentes") → chama POST /api/gerentes, que grava aqui;
 *    2) O cadastro do próprio site, com a aba "Gerente" selecionada
 *       (LoginScreen.jsx) → chama POST /api/usuarios com `perfil: "gerente"`,
 *       e o usuarioController encaminha a gravação para ESTE model.
 *
 *  POR QUE ESTA COLEÇÃO SEPARADA EXISTE (o problema que ela resolve):
 *    Antes, o gerente era gravado na coleção "usuarios" com o campo `perfil`.
 *    Mas o login (POST /api/usuarios/login) só consultava "usuarios", e o
 *    gerente criado pelo painel do Master vivia na coleção "gerentes" — que
 *    o login não lia. Resultado: gerente cadastrado pelo administrador
 *    existia no banco, porém NÃO conseguia entrar no site.
 *    Hoje o login procura na coleção do perfil escolhido (ver
 *    controllers/usuarioController.js, mapa MODELOS_POR_PERFIL), então as
 *    duas formas de criação levam ao mesmo lugar e ambas autenticam.
 *
 *  DIFERENÇAS EM RELAÇÃO AO MODEL DE USUÁRIOS:
 *    • tem o campo `cargo` (o texto que aparece no painel Master);
 *    • o `cpf` aqui é apenas DADO DE IDENTIFICAÇÃO, não credencial de
 *      acesso — o login de todos os perfis é por email + senha.
 * ============================================================================
 */
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// O MOLDE DO DOCUMENTO DE GERENTE
// ---------------------------------------------------------------------------
const gerenteSchema = new mongoose.Schema(
  {
    // ---- NOME: obrigatório, sem espaços nas pontas ----
    nome: { type: String, required: true, trim: true },

    // ---- EMAIL: único dentro desta coleção e normalizado ----
    email: {
      type: String,
      required: true,
      unique: true, // não pode repetir dentro de "gerentes"
      lowercase: true, // evita duplicata por diferença de maiúscula
      trim: true,
    },

    // ---- SENHA: credencial usada no login (email + senha) ----
    senha: { type: String, required: true },
    //  PENDÊNCIA DE SEGURANÇA: gravada em texto puro. O ideal seria hash
    //  (bcrypt/argon2). Registrado como melhoria futura na documentação.

    // ---- DADOS COMPLEMENTARES ----
    telefone: { type: String, default: "" },
    cpf: { type: String, default: "" },
    //  O CPF aqui é DADO DE IDENTIFICAÇÃO, não é mais usado como senha
    //  (as versões antigas do login exigiam CPF para perfis corporativos;
    //  hoje o padrão é email + senha para os três perfis).

    // ---- CARGO: rótulo exibido no painel do administrador ----
    cargo: { type: String, default: "Gerente" },
    //  default → se o painel Master criar a conta sem informar cargo, o banco
    //  preenche "Gerente" sozinho. A tela AdministradorScreen já mostra
    //  `gerente.cargo || "Gerente"` ao listar as contas.

    // ---- PERFIL: trava o documento nesta coleção ----
    perfil: { type: String, enum: ["gerente"], default: "gerente" },
    //  enum com UM só valor → um documento desta coleção não consegue se
    //  passar por outro perfil. É a garantia de integridade do banco.
  },
  { timestamps: true }
  //  Cria e mantém `createdAt` e `updatedAt` automaticamente em cada conta.
);

// ---------------------------------------------------------------------------
// LIGAR O MOLDE À COLEÇÃO "gerentes" E EXPORTAR
// ---------------------------------------------------------------------------
//  mongoose.model("Gerente", gerenteSchema, "gerentes")
//    → 3º parâmetro fixa o nome real da coleção, evitando que o Mongoose
//      invente outro nome (ele pluraliza em inglês e erraria: "gerentes" é
//      o nome correto em português).
//
//  ÍNDICE ÚNICO: criado pelo `unique: true` do campo email acima. Não se
//  declara `gerenteSchema.index()` de novo, para não gerar o aviso
//  "Duplicate schema index". A sincronização acontece no startup com
//  `Gerente.syncIndexes()` (server.js e migrar.js).
const Gerente = mongoose.model("Gerente", gerenteSchema, "gerentes");

export default Gerente;
