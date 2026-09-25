/**
 * ============================================================================
 *  BANCO DE DADOS  →  MODEL DA COLEÇÃO "produtos"
 * ============================================================================
 *  O QUE FICA NESTA COLEÇÃO:
 *    Os móveis da loja Casa Aconchego. Os 12 primeiros são inseridos
 *    automaticamente pelo seed (ver src/seed.js) sempre que a coleção
 *    estiver vazia.
 *
 *  QUEM ESCREVE NESTA COLEÇÃO:
 *    • o seed, no startup da API (src/seed.js → Produto.insertMany);
 *    • o painel do Gerente:
 *        POST   /api/produtos      → cadastra (criarProduto)
 *        PUT    /api/produtos/:id  → edita ou publica (atualizarProduto)
 *        DELETE /api/produtos/:id  → exclui (deletarProduto)
 *
 *  QUEM LÊ NESTA COLEÇÃO:
 *    • a vitrine da loja (LojaScreen.jsx) e a tela de detalhe
 *      (ProdutoScreen.jsx), via GET /api/produtos;
 *    • o painel do Gerente, para a lista de produtos cadastrados.
 *
 *  CAMPO QUE CONTROLA A VITRINE: `publicado`
 *    published: true  → o produto APARECE na loja (aparece para o cliente);
 *    published: false → o produto vira RASCUNHO: fica gravado no banco e
 *                      visível apenas para o gerente, mas some da vitrine.
 *    No painel do Gerente existem dois botões que usam exatamente isso:
 *    "Salvar rascunho" (grava com false) e "Publicar no site" (grava com true).
 *    Quem filtra os rascunhos é o FRONTEND, em LojaScreen.jsx:
 *        produtos.filter((p) => p.publicado)
 *    O backend não esconde rascunhos, porque o painel precisa vê-los.
 * ============================================================================
 */
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// O MOLDE DO DOCUMENTO DE PRODUTO
// ---------------------------------------------------------------------------
const produtoSchema = new mongoose.Schema(
  {
    // ---- NOME: obrigatório, sem espaços nas pontas ----
    nome: { type: String, required: true, trim: true },
    //  Exemplo gravado pelo seed: "Sofá Retrátil 3 Lugares".

    // ---- DESCRIÇÃO: texto livre, opcional ----
    descricao: { type: String, default: "" },
    //  default: "" → sem descrição, o campo fica vazio em vez de ausente.
    //  É exibido na tela de detalhe (ProdutoScreen.jsx) e no tooltip do card.

    // ---- TIPO: a categoria usada nos filtros da vitrine ----
    tipo: { type: String, required: true },
    //  CATEGORIAS: Sofás, Camas, Mesas, Armários, Escritório, Decor.
    //  A lista oficial fica em `ui/src/constants.js` (constante CATEGORIAS) e é
    //  a mesma que alimenta o <select> do formulário do Gerente. É
    //  obrigatório para que todo produto entre em algum filtro da vitrine.

    // ---- PREÇO: número em reais ----
    preco: { type: Number, required: true },
    //  O formulário do Gerente converte o texto digitado com Number() antes
    //  de enviar. Na tela, o valor é formatado como moeda brasileira por
    //  `formatarPreco()` (constants.js) → "R$ 1.899,90".

    // ---- FOTO PRINCIPAL ----
    foto: { type: String, default: "" },
    //  Guarda UMA imagem (a que aparece no card e no carrinho).
    //  A UI normaliza o catálogo com `normalizarProduto()` (App.jsx), que
    //  garante que `foto` seja sempre a primeira da galeria — assim o card,
    //  o detalhe, o carrinho e os painéis mostram a mesma imagem.

    // ---- GALERIA: array de imagens para a tela de detalhe ----
    fotos: { type: [String], default: [] },
    //  [String] → campo do tipo LISTA de textos.
    //  No detalhe do produto (ProdutoScreen.jsx) cada item vira uma miniatura
    //  clicável. Se a galeria estiver vazia, a tela usa o campo `foto`.
    //  O painel do Gerente aceita no máximo 3 URLs (foto1, foto2, foto3).

    // ---- ESTOQUE: unidades disponíveis ----
    estoque: { type: Number, default: 0 },
    //  Aparece como "✓ N unidades em estoque" no detalhe e "Em estoque"
    //  no card, quando maior que zero.
    //  PENDÊNCIA CONHECIDA: o checkout ainda não valida nem dá baixa nesse
    //  valor (o pedidoController não mexe no estoque) — está listado como
    //  melhoria futura na documentação.

    // ---- PUBLICADO: define a visibilidade na vitrine ----
    publicado: { type: Boolean, default: true },
    //  Boolean → true/false de verdade, não string "true"/"false".
    //  default: true → produto criado sem informar nada já aparece na loja.
  },
  { timestamps: true }
  //  Cria e mantém `createdAt` e `updatedAt` automaticamente.
  //  O `createdAt` é o que permite ao painel ordenar produtos recém-criados
  //  e ao pedidoController ordenar vendas da mais recente para a mais antiga.
);

// ---------------------------------------------------------------------------
// LIGAR O MOLDE À COLEÇÃO "produtos" E EXPORTAR
// ---------------------------------------------------------------------------
//  3º parâmetro = nome real da coleção no MongoDB.
//  Esta coleção não tem índice único: nada no schema impede dois produtos
//  com o mesmo nome (e o seed depende disso, pois ele localiza o produto
//  pelo `nome` ao sincronizar as fotos).
const Produto = mongoose.model("Produto", produtoSchema, "produtos");

export default Produto;
