/**
 * ============================================================================
 *  API  →  ROTAS DE USUÁRIOS (prefixo: /api/usuarios)
 * ============================================================================
 *  ---------------------------------------------------------------------------
 *  O QUE É UMA ROTA
 *  ---------------------------------------------------------------------------
 *    É a tabela que liga um ENDPOINT a uma função do controller:
 *        método HTTP + caminho → função do controller
 *    A rota NÃO tem lógica de negócio — só encaminha. Validações e consultas
 *    ao banco ficam em controllers/usuarioController.js.
 *
 *  ---------------------------------------------------------------------------
 *  COMO O PREFIXO É ACRESCENTADO
 *  ---------------------------------------------------------------------------
 *    Os caminhos aqui são curtos ("/", "/login", "/:id"). O prefixo
 *    "/api/usuarios" vem do server.js:
 *        app.use("/api/usuarios", usuarioRoutes);
 *
 *  ---------------------------------------------------------------------------
 *  OS 6 ENDPOINTS
 *  ---------------------------------------------------------------------------
 *    GET    /api/usuarios       → listarUsuarios     (lista só clientes)
 *    GET    /api/usuarios/:id   → buscarUsuarioPorId (":id" = parâmetro)
 *    POST   /api/usuarios       → criarUsuario       (CADASTRO de qualquer perfil)
 *    POST   /api/usuarios/login → loginUsuario       (LOGIN de qualquer perfil)
 *    PUT    /api/usuarios/:id   → atualizarUsuario   (edita)
 *    DELETE /api/usuarios/:id   → deletarUsuario     (remove)
 *
 *  ---------------------------------------------------------------------------
 *  POR QUE ESTE ARQUIVO É DIFERENTE DOS OUTROS
 *  ---------------------------------------------------------------------------
 *    Ele é o ÚNICO ponto de entrada de AUTENTICAÇÃO do sistema, e atende
 *    os TRÊS PERFIS. A rota "/login" não pertence a um recurso específico:
 *    ela descobre em qual coleção a conta está olhando o campo `perfil` que
 *    a tela de login enviou. O mesmo vale para o "/": o cadastro cria a
 *    conta na coleção do perfil informado no corpo da requisição.
 *    É por isso que `criarUsuario` e `loginUsuario` ficam em
 *    usuarioController.js e não em um controller por perfil.
 *
 *  ---------------------------------------------------------------------------
 *  ⚠️ UM DETALHE SOBRE A ORDEM DAS DECLARAÇÕES (pergunta clássica de banca)
 *  ---------------------------------------------------------------------------
 *    "/login" é declarado DEPOIS de "/:id". À primeira vista parece um erro,
 *    porque "/:id" também casa com "/login". Mas o Express NÃO casa por
 *    trecho: ele compara o caminho INTEIRO do pedido com o caminho inteiro
 *    do padrão da rota. Como o pedido é "/api/usuarios/login" e o padrão é
 *    "/api/usuarios/:id", os caminhos são diferentes — ":id" casa com
 *    UM segmento, e "login" não é um id válido.
 *    Mesmo que existisse ambiguidade, a ordem em que as rotas são declaradas
 *    resolve: o Express testa na ordem e usa a primeira que casar.
 *    (Um caso REAL de conflito seria declarar "/:id" ANTES de "/login" em
 *     uma API onde o parâmetro aceita qualquer texto.)
 *
 *  ---------------------------------------------------------------------------
 *  ⚠️ AUTORIZAÇÃO
 *  ---------------------------------------------------------------------------
 *    Nenhuma rota tem middleware de proteção — inclusive o "/login", que é
 *    justamente a que cria a sessão no frontend. Isso significa que o
 *    controle de acesso do projeto está TODO no frontend: o App.jsx decide
 *    qual tela mostrar conforme o `perfil`, mas a API aceita qualquer
 *    chamada. É uma das pendências de segurança listadas na documentação
 *    do TCC, cuja solução proposta é JWT + middlewares de autorização.
 * ============================================================================
 */
import { Router } from "express";
import {
  listarUsuarios,
  buscarUsuarioPorId,
  criarUsuario,
  loginUsuario,
  atualizarUsuario,
  deletarUsuario,
} from "../controllers/usuarioController.js";

// Mini-aplicativo que guarda as rotas deste recurso.
const router = Router();

// ---------------------------------------------------------------------------
// DECLARAÇÕES DE ROTA
// ---------------------------------------------------------------------------
router.get("/", listarUsuarios);        // lista as contas de cliente
router.get("/:id", buscarUsuarioPorId); // busca 1 cliente pelo id
router.post("/", criarUsuario);         // cadastro (grava na coleção do perfil enviado)
router.post("/login", loginUsuario);    // login (procura na coleção do perfil)
router.put("/:id", atualizarUsuario);   // atualiza dados do cliente
router.delete("/:id", deletarUsuario);  // exclui o cliente

export default router;
