/**
 * ============================================================================
 *  API  →  ROTAS DE PRODUTOS (prefixo: /api/produtos)
 * ============================================================================
 *  ---------------------------------------------------------------------------
 *  O QUE É UMA ROTA (camada Router da arquitetura MVC)
 *  ---------------------------------------------------------------------------
 *    É a tabela que liga um ENDPOINT a uma função do controller:
 *
 *        método HTTP + caminho  →  função do controller
 *
 *    A rota NÃO tem lógica de negócio. Ela apenas encaminha. Toda a lógica
 *    (consulta ao banco, validação, escolha do código HTTP) está em
 *    controllers/produtoController.js.
 *
 *    É essa separação que deixa o backend organizado: se a regra de negócio
 *    mudar, mexe-se em um controller; se um endpoint novo for necessário,
 *    mexe-se em um arquivo de rotas, sem risco de quebrar os outros.
 *
 *  ---------------------------------------------------------------------------
 *  COMO O PREFIXO É ACRESCENTADO
 *  ---------------------------------------------------------------------------
 *    Neste arquivo os caminhos são curtos ("/", "/:id"). O prefixo "/api/produtos"
 *    é adicionado pelo server.js, na montagem:
 *
 *        app.use("/api/produtos", produtoRoutes);
 *
 *    O prefixo é declarado em UM SÓ LUGAR justamente para não repetir
 *    "/api/produtos" em cada rota. Assim, o caminho completo de cada
 *    endpoint é: prefixo do servidor + caminho do router.
 *
 *  ---------------------------------------------------------------------------
 *  OS 5 ENDPOINTS (o CRUD completo da loja)
 *  ---------------------------------------------------------------------------
 *    GET    /api/produtos      → listarProdutos      (vitrine e painéis)
 *    GET    /api/produtos/:id  → buscarProdutoPorId  (tela de detalhe)
 *    POST   /api/produtos      → criarProduto        (painel do Gerente)
 *    PUT    /api/produtos/:id  → atualizarProduto    (editar / publicar)
 *    DELETE /api/produtos/:id  → deletarProduto      (excluir)
 *
 *  O QUE SIGNIFICA CADA PARTE DE UM ENDPOINT:
 *    /api/produtos  → prefixo (definido no server.js)
 *    GET            → método HTTP = a ação desejada
 *    /:id           → parâmetro: o valor que vier depois do "/" é passado
 *                     ao controller em `req.params.id`
 *
 *  ---------------------------------------------------------------------------
 *  QUEM CHAMA CADA UM (por dentro de ui/src/services/api.js)
 *  ---------------------------------------------------------------------------
 *    fetchProdutos   → GET    /api/produtos
 *    createProduto   → POST   /api/produtos
 *    updateProduto   → PUT    /api/produtos/:id
 *    deleteProduto   → DELETE /api/produtos/:id
 *    (buscarProdutoPorId não é usado pelo frontend: a tela de detalhe
 *     trabalha com o produto que já está em memória, escolhido na vitrine)
 *
 *  ⚠️ AUTORIZAÇÃO: nenhuma rota tem middleware de proteção. Qualquer cliente
 *     HTTP consegue chamar qualquer uma delas. É uma pendência de segurança
 *     registrada na documentação (a solução apontada é JWT).
 * ============================================================================
 */
import { Router } from "express";
import {
  listarProdutos,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  deletarProduto,
} from "../controllers/produtoController.js";

// O Router do Express é um "mini-aplicativo": guarda as rotas deste recurso
// para depois ser montado no servidor com um prefixo.
const router = Router();

// ---------------------------------------------------------------------------
// AS DECLARAÇÕES DE ROTA (uma por endpoint)
// ---------------------------------------------------------------------------

// Lista todos os produtos. GET não tem corpo: os dados vão na URL.
router.get("/", listarProdutos);

// Busca um produto pelo id. O valor depois do "/" chega como req.params.id.
router.get("/:id", buscarProdutoPorId);

// Cadastra um produto. O corpo JSON (nome, tipo, preco...) chega como req.body.
router.post("/", criarProduto);

// Edita um produto existente.
router.put("/:id", atualizarProduto);

// Exclui um produto.
router.delete("/:id", deletarProduto);

// Devolve o router pronto para ser montado no Express.
export default router;
