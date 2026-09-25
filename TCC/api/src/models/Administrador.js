/**
 * ============================================================================
 *  BANCO DE DADOS  →  MODEL DA COLEÇÃO "administradores"
 * ============================================================================
 *  O QUE FICA NESTA COLEÇÃO:
 *    Somente contas de PERFIL "administrador" — o "Master" da plataforma,
 *    responsável pelos indicadores financeiros, pela gestão das contas de
 *    gerentes e pelas configurações técnicas.
 *
 *  ---------------------------------------------------------------------------
 *  A CORREÇÃO MAIS IMPORTANTE QUE ESTE ARQUIVO CONTÉM
 *  ---------------------------------------------------------------------------
 *    O model era declarado apenas como `mongoose.model("Administrador", schema)`,
 *    SEM o 3º parâmetro. Nessas condições o Mongoose escolhe o nome da coleção
 *    sozinho e, como a palavra está em inglês, ele gerava "administradors"
 *    (um híbrido errado, com "administra" + "dors").
 *    Consequência real: o painel Master lia e gravava numa coleção que não
 *    tinha nada a ver com o nome documentado no projeto.
 *
 *    A correção está no 3º parâmetro de mongoose.model(): o nome da coleção
 *    foi fixado explicitamente em "administradores".
 *    A coleção antiga "administradors", se existir, é esvaziada e removida
 *    automaticamente pela migração (ver database/migracao.js, Passo 3).
 *
 *  DIFERENÇAS EM RELAÇÃO AOS OUTROS MODELOS DE CONTA:
 *    • `cpf` é OBRIGATÓRIO (required: true) — só este perfil exige CPF;
 *    • tem o campo `status` ("Ativo"/"Inativo"), usado para controle interno;
 *    • `cargo` vem preenchido como "Administrador Master".
 * ============================================================================
 */
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// O MOLDE DO DOCUMENTO DE ADMINISTRADOR
// ---------------------------------------------------------------------------
const administradorSchema = new mongoose.Schema(
  {
    // ---- NOME: obrigatório, sem espaços nas pontas ----
    nome: { type: String, required: true, trim: true },

    // ---- EMAIL: único dentro desta coleção e normalizado ----
    email: {
      type: String,
      required: true,
      unique: true, // não pode repetir dentro de "administradores"
      lowercase: true, // "Admin@X.com" vira "admin@x.com"
      trim: true,
    },

    // ---- SENHA: credencial de acesso (email + senha, como nos demais perfis) ----
    senha: { type: String, required: true },
    //  PENDÊNCIA DE SEGURANÇA: texto puro. O ideal é hash (bcrypt/argon2).
    //  Registrado como melhoria futura na documentação do TCC.

    // ---- CPF: OBRIGATÓRIO NESTE PERFIL ----
    cpf: { type: String, required: true },
    //  Se o CPF faltar, o próprio Mongoose barra a gravação. O controller
    //  AdministradorController.js traduz essa falha de validação em
    //  HTTP 400 devolvendo a mensagem do schema ao navegador.
    //  (Nos outros perfis o CPF é opcional e só identifica o titular.)

    // ---- DADOS COMPLEMENTARES ----
    telefone: { type: String, default: "" },

    // ---- CARGO e STATUS ----
    cargo: { type: String, default: "Administrador Master" },
    //  Rótulo do perfil, exibido em cabeçalhos e no painel Master.
    status: { type: String, default: "Ativo" },
    //  Controle interno da conta. Hoje é gravado e listado, mas a interface
    //  não desativa contas por status — é um campo preparado para a
    //  evolução futura descrita na documentação.

    // ---- PERFIL: trava o documento nesta coleção ----
    perfil: { type: String, enum: ["administrador"], default: "administrador" },
    //  enum com UM só valor → um documento desta coleção não pode se passar
    //  por cliente ou gerente. É a garantia de integridade do banco.
  },
  { timestamps: true }
  //  Cria e mantém `createdAt` e `updatedAt` automaticamente.
);

// ---------------------------------------------------------------------------
// LIGAR O MOLDE À COLEÇÃO CORRETA E EXPORTAR
// ---------------------------------------------------------------------------
//  mongoose.model("Administrador", administradorSchema, "administradores")
//                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                          ESTE é o 3º parâmetro: o nome REAL
//                                          da coleção. É ele que impede a
//                                          criação da coleção "administradors".
//
//  ÍNDICE ÚNICO: vem do `unique: true` do campo email. Não se declara
//  `administradorSchema.index()` de novo (geraria "Duplicate schema index").
//  A sincronização dos índices é feita no startup por
//  `Administrador.syncIndexes()` (server.js e migrar.js).
const Administrador = mongoose.model("Administrador", administradorSchema, "administradores");

export default Administrador;
