/**
 * ============================================================================
 *  BANCO DE DADOS  →  MODEL DA COLEÇÃO "pedidos"
 * ============================================================================
 *  O QUE FICA NESTA COLEÇÃO:
 *    Um documento = UMA COMPRA FINALIZADA no carrinho (o checkout).
 *    Quando o cliente clica em "Finalizar compra", o CarrinhoScreen.jsx
 *    envia cliente + itens + total para POST /api/pedidos e este model
 *    grava o registro.
 *
 *  RELACIONAMENTOS (a modelagem do banco, seção 6.2 da documentação):
 *    • 1 CLIENTE → VÁRIOS PEDIDOS: um usuário pode comprar várias vezes.
 *      No MongoDB não existe chave estrangeira; o vínculo é feito guardando
 *      o nome e o email do comprador DENTRO do próprio pedido (campo
 *      `cliente`, um objeto embutido). É o padrão "incorporação" (embedding).
 *    • 1 PRODUTO → VÁRIOS PEDIDOS: um mesmo móvel pode estar em_many pedidos.
 *      Relação de N para N, representada pela lista `itens` do pedido.
 *
 *  ⚠️ POR QUE O PEDIDO COPIA nome/preço do produto em vez de só guardar o id:
 *    É uma decisão de modelagem (desnormalização). Se o preço ou o nome do
 *    produto mudar amanhã, o histórico de pedidos anteriores continua
 *    mostrando o valor que foi realmente cobrado ao cliente. Num sistema
 *    financeiro, preservar o histórico é mais importante que eliminar
 *    repetição de dados.
 *
 *  O CICLO DE VIDA DO PEDIDO (campo `status`):
 *    "pendente"  → estado inicial, gravado AUTOMATICAMENTE pelo schema no
 *                  momento da criação (é o `default`). O checkout não
 *                  envia status nenhum.
 *    "entregue"  → o gerente (ou o administrador) marcou a venda como
 *                  concluída, pelo botão "✅ Entregar".
 *    "cancelado" → a venda foi anulada.
 *    O `enum` abaixo REJEITA qualquer outro valor, protegendo o banco de
 *    valores digitados errado. O pedidoController ainda valida a lista de
 *    novo antes de gravar (validação dupla: cliente e banco).
 * ============================================================================
 */
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// O MOLDE DO DOCUMENTO DE PEDIDO
// ---------------------------------------------------------------------------
const pedidoSchema = new mongoose.Schema(
  {
    // ---- CLIENTE: objeto embutido com quem comprou ----
    cliente: {
      nome: { type: String, required: true },
      email: { type: String, required: true },
    },
    //  "Objeto embutido" (objeto aninhado no schema) = um subdocumento que
    //  fica DENTRO do pedido, não uma coleção separada. É o jeito do MongoDB
    //  de resolver o relacionamento 1-para-N sem usar tabelas.
    //  Os dois campos são obrigatórios: o pedidoController também checa isso
    //  antes de gravar, devolvendo HTTP 400 com "Informe os dados do cliente".

    // ---- ITENS: lista de produtos comprados ----
    itens: [
      {
        produto: { type: String, required: true },
        // Referência ao produto do catálogo. NÃO é obrigatória porque os
        // pedidos gravados antes desta versão não a tinham — o campo
        // opcional mantém o histórico antigo válido.
        // Para que serve: é por ela que o pedidoController localiza o
        // documento exato em "produtos" para conferir e dar baixa no estoque.
        produtoId: { type: mongoose.Schema.Types.ObjectId, ref: "Produto" },
        preco: { type: Number, required: true },
        qtd: { type: Number, required: true, min: 1 },
      },
    ],
    //  Array de objetos → cada posição da lista é um item do pedido.
    //    produto    → NOME do móvel (copiado do carrinho, não o id)
    //    produtoId  → id do móvel na coleção "produtos"; é opcional para não
    //                 invalidar os pedidos antigos, mas é o que permite ao
    //                 pedidoController conferir e baixar o estoque
    //    preco      → preço unitário no momento da compra
    //    qtd        → quantidade, com min: 1 (o Mongoose recusa qtd: 0 ou -1)
    //  O pedidoController remapeia os itens recebidos do frontend e grava
    //  somente esses campos, descartando qualquer coisa extra que o
    //  navegador tenha enviado (proteção contra campo indevido).

    // ---- TOTAL: soma da compra em reais ----
    total: { type: Number, required: true },
    //  Calculado no carrinho pelo navegador com
    //  carrinho.reduce((soma, item) => soma + item.preco * item.qtd, 0)
    //  e enviado no corpo da requisição.
    //  PONTUALIDADE A SER EXPLICADA NA DEFESA: hoje o backend confia no
    //  total enviado pelo cliente. Uma versão mais segura recalcularia o
    //  total aqui no servidor, a partir dos preços guardados no banco.
    //  Está registrado como melhoria futura.

    // ---- STATUS: ciclo de vida da venda ----
    status: {
      type: String,
      enum: ["pendente", "entregue", "cancelado"], // lista branca de valores
      default: "pendente", // entra como pendente sem ninguém pedir
    },
    //  PATCH da venda (PUT /api/pedidos/:id) passa apenas por este campo:
    //  o pedidoController monta { status } e o Mongoose grava.
  },
  { timestamps: true }
  //  `createdAt` é essencial aqui: o painel do gerente e o do administrador
  //  listam as vendas e o pedidoController usa `.sort({ createdAt: -1 })`
  //  para mostrar a venda MAIS RECENTE primeiro.
);

// ---------------------------------------------------------------------------
// LIGAR O MOLDE À COLEÇÃO "pedidos" E EXPORTAR
// ---------------------------------------------------------------------------
//  3º parâmetro = nome real da coleção no MongoDB.
//  Sem índice único: cada compra gera um documento novo, com `_id` próprio
//  gerado pelo MongoDB no formato ObjectId.
const Pedido = mongoose.model("Pedido", pedidoSchema, "pedidos");

export default Pedido;
