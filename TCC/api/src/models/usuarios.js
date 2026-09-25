/**
 * ============================================================================
 *  BANCO DE DADOS  →  MODEL DA COLEÇÃO "usuarios"
 * ============================================================================
 *  O QUE É UM "MODEL" (camada Model da arquitetura MVC):
 *    É o "molde" de um documento do banco. Descreve quais campos existem,
 *    de que tipo cada um é e quais regras devem ser obedecidas.
 *    O Mongoose valida essas regras ANTES de gravar no MongoDB — ou seja,
 *    um dado inválido nunca chega ao banco, é barrado pelo próprio model.
 *
 *  ESTE ARQUIVO É RESPONSÁVEL POR:
 *    1. Descrever os campos da conta de cliente (nome, email, senha...);
 *    2. Fixar o nome REAL da coleção no banco ("usuarios");
 *    3. Criar o índice único de email (impede duas contas com o mesmo email);
 *    4. Exportar o "construtor" de documentos que os controllers usam
 *       (Usuario.find(), Usuario.create(), Usuario.findById()...).
 *
 *  POR QUE CADA PERFIL TEM SEU PRÓPRIO MODEL E SUA PRÓPRIA COLEÇÃO:
 *    Clientes ficam em "usuarios", gerentes em "gerentes" e administradores
 *    em "administradores". Antes, TODOS eram gravados em "usuarios" com um
 *    campinho `perfil` dizendo quem era quem. Isso bagunçava o banco:
 *      • a mesma coleção misturava cliente, gerente e administrador;
 *      • a coleção "gerentes" ficava vazia;
 *      • um gerente criado no painel do Master NÃO conseguia entrar no site,
 *        porque o login só consultava a coleção "usuarios";
 *    A separação em coleções independentes resolveu os três problemas.
 *
 *  O QUE ESTÁ SENDO EXPLICADO ABAIXO, LINHA A LINHA:
 *    import mongoose  → traz a biblioteca que conversa com o MongoDB
 *    new Schema({..}) → cria o molde (campos, tipos e regras)
 *    mongoose.model() → liga o molde a uma coleção e exporta o Model
 * ============================================================================
 */
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// 1) O MOLDE DO DOCUMENTO
// ---------------------------------------------------------------------------
const usuarioSchema = new mongoose.Schema(
  {
    // ---- NOME: texto obrigatório, sem espaços nas pontas ----
    nome: { type: String, required: true, trim: true },
    //  type: String    → o dado é textual
    //  required: true  → se o campo faltar, o Mongoose REJEITA a gravação
    //                    e o controller devolve HTTP 400 ao navegador
    //  trim: true      → apaga espaços em branco das pontas:
    //                    "  Joao  " vira "Joao" antes de ir para o banco

    // ---- EMAIL: a identidade da conta — único e normalizado ----
    email: {
      type: String,
      required: true,
      unique: true, // índice único: NÃO pode existir 2 contas com o mesmo email NESTA coleção
      lowercase: true, // "Joao@X.com" é gravado como "joao@x.com"
      trim: true,
    },
    //  unique: true  → cria um índice no banco. É o índice que faz o banco
    //                 recusar, sozinho, um email repetido. Se ainda assim
    //                 algo escapar, o erro chega com código 11000 e o
    //                 controller transforma em HTTP 409 (conflito).
    //  lowercase/trim → evita que a mesma pessoa crie duas contas só
    //                 mudando maiúscula/minúscula ou espaços.
    //  POR QUE "ÚNICO POR COLEÇÃO" E NÃO GLOBAL:
    //    o mesmo email pode ser cliente (coleção "usuarios") e, ao mesmo
    //    tempo, gerente (coleção "gerentes") sem conflito, porque são
    //    coleções diferentes. Isso é uma escolha de projeto do TCC.

    // ---- SENHA: credencial de acesso ----
    senha: { type: String, required: true },
    //  PENDÊNCIA DE SEGURANÇA CONHECIDA: a senha é gravada em TEXTO PURO.
    //  Qualquer pessoa com acesso de leitura ao banco enxerga a senha de
    //  todos os usuários. O correto seria aplicar HASH (bcrypt ou argon2)
    //  antes de gravar e comparar o hash no login. Está registrado como
    //  melhoria futura na documentação do TCC.

    // ---- DADOS COMPLEMENTARES: opcionais, mas nunca "undefined" ----
    telefone: { type: String, default: "" },
    //  default: "" → se o campo não for enviado, o Mongoose grava uma string
    //                vazia. Assim o documento tem sempre o campo, o que
    //                simplifica a leitura no frontend e evita "undefined".
    cpf: { type: String, default: "" },

    // ---- PERFIL: trava o documento nesta coleção ----
    perfil: { type: String, enum: ["usuario"], default: "usuario" },
    //  enum: ["usuario"] → o ÚNICO valor aceito é "usuario". Se alguma
    //    requisição tentar gravar "gerente" nesta coleção, o Mongoose
    //    rejeita com erro de validação.
    //  É essa trava que garante a integridade do banco: a coleção "usuarios"
    //  só pode conter clientes, a "gerentes" só gerentes, e assim por diante.
  },
  { timestamps: true }
  //  timestamps: true → o Mongoose cria e mantém sozinho dois campos em
  //  TODO documento: `createdAt` (data da criação) e `updatedAt` (data da
  //  última alteração). Nenhuma tela precisa gravar essas datas na mão.
  //  É o `createdAt` que o pedidoController usa para ordenar as vendas
  //  do mais novo para o mais antigo.
);

// ---------------------------------------------------------------------------
// 2) LIGAR O MOLDE À COLEÇÃO E EXPORTAR O "CONSTRUTOR"
// ---------------------------------------------------------------------------
//  mongoose.model(nomeDoModel, schema, nomeRealDaColecao)
//    → 1º: como o código chamará o model (Usuario.find, Usuario.create...)
//    → 2º: o molde criado acima
//    → 3º: o NOME REAL da coleção no MongoDB.
//
//  POR QUE PASSAR O 3º PARÂMETRO:
//    Sem ele, o Mongoose inventaria o nome sozinho (e erraria em português,
//    criando "transportadors" em vez de "transportadores"). Passando o nome
//    explicitamente, o banco fica com as coleções exatamente como o
//    projeto documenta: "usuarios", "gerentes", "administradores", "produtos".
//
//  ÍNDICE ÚNICO DE EMAIL:
//    O `unique: true` do campo acima JÁ cria o índice { email: 1 } único.
//    Por isso NÃO se declara `usuarioSchema.index()` de novo aqui — o
//    Mongoose avisaria "Duplicate schema index" no console.
//    Os índices são sincronizados no startup com `Usuario.syncIndexes()`
//    (ver src/server.js e src/migrar.js), e a ordem importa: a sincronização
//    acontece DEPOIS da migração de perfis, senão o índice único falharia
//    enquanto as contas antigas ainda estivessem juntas na coleção "usuarios".
const Usuario = mongoose.model("Usuario", usuarioSchema, "usuarios");

export default Usuario;
