/**
 * ============================================================================
 *  ARQUIVO LEGADO — NÃO É USADO PELO SISTEMA ATUAL
 * ============================================================================
 *  HISTÓRICO:
 *    Este arquivo pertence a uma versão ANTERIOR do projeto, em que existia
 *    um quarto perfil de usuário: o TRANSPORTADOR (entregador), com cadastro
 *    por CNPJ. Este model, o controller e as rotas dele ficaram na pasta,
 *    mas NÃO são usados.
 *
 *  POR QUE ESTÁ AQUI (e não na lixeira):
 *    Para servir de registro de uma etapa do desenvolvimento e para
 *    comparação de schema. Ele também mostra, na prática, um dos bugs
 *    corrigidos depois: repare que a linha de criação do model está SEM o
 *    3º parâmetro.
 *
 *  O ERRO QUE ESTE PADRÃO CAUSA (e que foi corrigido nos models atuais):
 *    mongoose.model("Transportador", schema)  →  SEM informar o nome da
 *    coleção, o Mongoose escolhe sozinho e pluraliza em inglês, criando
 *    "transportadors" (híbrido errado) no banco em vez de "transportadores".
 *    Foi exatamente esse mecanismo que gerou a coleção "administradors",
 *    citada no database/migracao.js. Os models atuais (produto.js,
 *    pedido.js, gerente.js, Administrador.js e usuarios.js) já passam o
 *    3º parâmetro com o nome correto.
 *
 *  ⚠️ ESTE MODEL NÃO É IMPORTADO por nenhum arquivo do sistema atual.
 *     Nem o server.js monta as rotas de transportador. É código morto
 *     mantido apenas como histórico do projeto.
 * ============================================================================
 */
import mongoose from "mongoose";

// O schema da versão antiga: identificação por CNPJ em vez de email/senha.
const transportadorSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    cnpj: { type: String, required: true },
    telefone: { type: String },
    email: { type: String },
    status: { type: String, default: "Ativo" },
  },
  { timestamps: true }
);

// Repare na ausência do 3º parâmetro — é o problema descrito no cabeçalho.
export default mongoose.model("Transportador", transportadorSchema);
