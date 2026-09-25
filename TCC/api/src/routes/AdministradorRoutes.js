/**
 * ============================================================================
 *  API  →  ROTAS DE ADMINISTRADORES (prefixo: /api/administradores)
 * ============================================================================
 *  ---------------------------------------------------------------------------
 *  O QUE É UMA ROTA
 *  ---------------------------------------------------------------------------
 *    É a tabela que liga um ENDPOINT a uma função do controller:
 *        método HTTP + caminho → função do controller
 *    Só encaminha; a lógica de negócio está em
 *    controllers/AdministradorController.js.
 *
 *  ---------------------------------------------------------------------------
 *  COMO O PREFIXO É ACRESCENTADO
 *  ---------------------------------------------------------------------------
 *    Os caminhos aqui são curtos ("/", "/:id"). O prefixo
 *    "/api/administradores" vem do server.js:
 *        app.use("/api/administradores", administradorRoutes);
 *
 *  ---------------------------------------------------------------------------
 *  OS 5 ENDPOINTS (CRUD de administradores, coleção "administradores")
 *  ---------------------------------------------------------------------------
 *    GET    /api/administradores     → listarAdministradores
 *    POST   /api/administradores     → criarAdministrador
 *    GET    /api/administradores/:id → obterAdministrador
 *    PUT    /api/administradores/:id → atualizarAdministrador
 *    DELETE /api/administradores/:id → deletarAdministrador
 *
 *  ---------------------------------------------------------------------------
 *  ⚠️ STATUS ATUAL: ESTAS ROTAS EXISTEM, MAS O FRONTEND NÃO AS USA
 *  ---------------------------------------------------------------------------
 *    Não existe nenhuma função de administradores em
 *    ui/src/services/api.js, e o painel Master gerencia apenas pedidos e
 *    contas de gerentes. São rotas prontas, testáveis pelo Postman ou pelo
 *    console do navegador, mas sem tela que as invoque na interface.
 *    Está registrado na documentação do TCC como pendência/evolução: ou o
 *    painel Master passa a consumir este CRUD, ou o recurso é removido.
 *
 *    O que JÁ FUNCIONA é o LOGIN do administrador: ele ocorre em
 *    POST /api/usuarios/login, que procura nesta coleção quando o perfil
 *    escolhido é "administrador". Ou seja, um administrador consegue entrar
 *    no site e abrir o painel Master mesmo sem este CRUD existir.
 *
 *  ---------------------------------------------------------------------------
 *  POR QUE A ORDEM DESTA ARQUIVO É MENOS ÓBVIA QUE A DOS OUTROS
 *  ---------------------------------------------------------------------------
 *    Repare que o POST vem ANTES do GET "/:id" (ao contrário dos demais
 *    arquivos de rotas, em que o GET "/:id" aparece antes do POST). Isso é
 *    seguro porque o Express compara o caminho INTEIRO do pedido com o
 *    padrão completo da rota: um POST em "/api/administradores" não casa
 *    com o padrão "/:id", porque aquele caminho só existe para requisições
 *    com um segmento depois da barra final. Além disso, mesmo havendo
 *    sobreposição, o Express respeita a ordem de declaração e usa a
 *    primeira rota que casar.
 *
 *  ⚠️ AUTORIZAÇÃO: nenhuma rota tem middleware de proteção. Pendência de
 *     segurança registrada na documentação (solução proposta: JWT).
 * ============================================================================
 */
import { Router } from "express";
import {
  listarAdministradores,
  criarAdministrador,
  obterAdministrador,
  atualizarAdministrador,
  deletarAdministrador,
} from "../controllers/AdministradorController.js";

// Mini-aplicativo que guarda as rotas deste recurso.
const router = Router();

// Declarações de rota, uma por endpoint:
router.get("/", listarAdministradores);     // lista todas as contas de administrador
router.post("/", criarAdministrador);       // cria conta de administrador
router.get("/:id", obterAdministrador);     // busca 1 administrador pelo id
router.put("/:id", atualizarAdministrador); // edita a conta
router.delete("/:id", deletarAdministrador); // remove a conta

export default router;
