/**
 * ============================================================================
 *  API  →  ROTAS DE PEDIDOS (prefixo: /api/pedidos)
 * ============================================================================
 *  ---------------------------------------------------------------------------
 *  O QUE É UMA ROTA
 *  ---------------------------------------------------------------------------
 *    É a tabela que liga um ENDPOINT a uma função do controller:
 *        método HTTP + caminho → função do controller
 *    A rota só encaminha; a lógica de negócio (validações do checkout,
 *    consulta ao banco, códigos HTTP) está em
 *    controllers/pedidoController.js.
 *
 *  ---------------------------------------------------------------------------
 *  COMO O PREFIXO É ACRESCENTADO
 *  ---------------------------------------------------------------------------
 *    Os caminhos aqui são curtos ("/", "/:id"). O prefixo "/api/pedidos" vem
 *    do server.js, na montagem:
 *        app.use("/api/pedidos", pedidoRoutes);
 *    Declarar o prefixo em um só lugar evita repetir "/api/pedidos" em cada
 *    rota e facilita a manutenção.
 *
 *  ---------------------------------------------------------------------------
 *  OS 5 ENDPOINTS (as vendas)
 *  ---------------------------------------------------------------------------
 *    GET    /api/pedidos      → listarPedidos           (painéis Gerente/Master)
 *    GET    /api/pedidos/:id  → buscarPedidoPorId
 *    POST   /api/pedidos      → criarPedido             (checkout do carrinho)
 *    PUT    /api/pedidos/:id  → atualizarStatusPedido   (pendente → entregue)
 *    DELETE /api/pedidos/:id  → deletarPedido
 *
 *  ---------------------------------------------------------------------------
 *  POR QUE EXISTEM DUAS ROTAS DE LEITURA (uma com :id e outra sem)
 *  ---------------------------------------------------------------------------
 *    São casos de uso diferentes:
 *      • GET /api/pedidos    → a tela de vendas precisa da LISTA completa,
 *        já ordenada da mais recente para a mais antiga (a ordenação é feita
 *        pelo próprio controller com .sort({ createdAt: -1 }));
 *      • GET /api/pedidos/:id → a tela de detalhe de um pedido específico.
 *    O mesmo vale para os demais recursos: é o padrão REST — a coleção
 *    inteira e o item individual são recursos diferentes.
 *
 *  ---------------------------------------------------------------------------
 *  POR QUE A ROTA DE ATUALIZAÇÃO CHAMA SE "atualizarStatusPedido"
 *  ---------------------------------------------------------------------------
 *    Porque o handler NÃO atualiza o pedido inteiro: ele aceita e grava
 *    apenas o campo `status`. É uma rota deliberadamente restrita, que
 *    impede alterar total, itens ou dados do cliente por esta via.
 *
 *  ---------------------------------------------------------------------------
 *  QUEM CHAMA CADA UMA (por dentro de ui/src/services/api.js)
 *  ---------------------------------------------------------------------------
 *    listarPedidos         → GET    /api/pedidos
 *    criarPedido           → POST   /api/pedidos
 *    atualizarStatusPedido → PUT    /api/pedidos/:id
 *    excluirPedido         → DELETE /api/pedidos/:id
 *
 *  ⚠️ AUTORIZAÇÃO: nenhuma rota tem middleware de proteção. É uma pendência
 *     de segurança registrada na documentação (a solução apontada é JWT).
 * ============================================================================
 */
import { Router } from "express";
import {
  listarPedidos,
  buscarPedidoPorId,
  criarPedido,
  atualizarStatusPedido,
  deletarPedido,
} from "../controllers/pedidoController.js";

// Mini-aplicativo que guarda as rotas deste recurso.
const router = Router();

// Declarações de rota, uma por endpoint:
router.get("/", listarPedidos);           // lista as vendas (mais novas primeiro)
router.get("/:id", buscarPedidoPorId);   // busca uma venda pelo id
router.post("/", criarPedido);           // cria a venda no checkout
router.put("/:id", atualizarStatusPedido); // muda só o status da venda
router.delete("/:id", deletarPedido);    // exclui a venda

export default router;
