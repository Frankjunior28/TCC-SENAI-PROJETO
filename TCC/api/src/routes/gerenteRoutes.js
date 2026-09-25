/**
 * ============================================================================
 *  API  →  ROTAS DE GERENTES (prefixo: /api/gerentes)
 * ============================================================================
 *  ---------------------------------------------------------------------------
 *  O QUE É UMA ROTA
 *  ---------------------------------------------------------------------------
 *    É a tabela que liga um ENDPOINT a uma função do controller:
 *        método HTTP + caminho → função do controller
 *    Só encaminha; a lógica de negócio está em
 *    controllers/gerenteController.js.
 *
 *  ---------------------------------------------------------------------------
 *  COMO O PREFIXO É ACRESCENTADO
 *  ---------------------------------------------------------------------------
 *    Os caminhos aqui são curtos ("/", "/:id"). O prefixo "/api/gerentes" vem
 *    do server.js:
 *        app.use("/api/gerentes", gerenteRoutes);
 *
 *  ---------------------------------------------------------------------------
 *  OS 5 ENDPOINTS (CRUD de gerentes, coleção "gerentes")
 *  ---------------------------------------------------------------------------
 *    GET    /api/gerentes     → listarGerentes      (painel Master)
 *    GET    /api/gerentes/:id → buscarGerentePorId
 *    POST   /api/gerentes     → criarGerente        (painel Master cria conta)
 *    PUT    /api/gerentes/:id → atualizarGerente
 *    DELETE /api/gerentes/:id → deletarGerente      (painel Master exclui)
 *
 *  ---------------------------------------------------------------------------
 *  POR QUE NÃO EXISTE "/api/gerentes/login" NESTE ARQUIVO
 *  ---------------------------------------------------------------------------
 *    O login é ÚNICO para os três perfis e fica em
 *    POST /api/usuarios/login (usuarioRoutes.js). O motivo é a separação de
 *    coleções: como cada perfil mora em uma coleção diferente, o handler de
 *    login precisa decidir qual coleção consultar conforme o `perfil`
 *    recebido — o que ele só consegue fazer se estiver no controller que já
 *    conhece os três models (o mapa MODELOS_POR_PERFIL).
 *    Colocar um login por controller obrigaria a duplicar a lógica de
 *    comparação de credencial em três lugares.
 *    Na prática: o gerente criado por estas rotas (POST /api/gerentes) já
 *    consegue entrar no site, porque o login busca o email na coleção
 *    "gerentes" quando o perfil escolhido é "gerente".
 *
 *  ---------------------------------------------------------------------------
 *  ⚠️ AUTORIZAÇÃO
 *  ---------------------------------------------------------------------------
 *    Nenhuma rota tem middleware de proteção. Na prática, o painel Master
 *    (AdministradorScreen.jsx) é o único chamador dessas rotas, mas a API
 *    não verifica isso. É uma pendência de segurança registrada na
 *    documentação do TCC (a solução apontada é JWT).
 * ============================================================================
 */
import { Router } from "express";
import {
  listarGerentes,
  buscarGerentePorId,
  criarGerente,
  atualizarGerente,
  deletarGerente,
} from "../controllers/gerenteController.js";

// Mini-aplicativo que guarda as rotas deste recurso.
const router = Router();

// Declarações de rota, uma por endpoint:
router.get("/", listarGerentes);        // lista todas as contas de gerente
router.get("/:id", buscarGerentePorId); // busca 1 gerente pelo id
router.post("/", criarGerente);         // cria conta de gerente
router.put("/:id", atualizarGerente);   // edita a conta
router.delete("/:id", deletarGerente);  // remove a conta

export default router;
