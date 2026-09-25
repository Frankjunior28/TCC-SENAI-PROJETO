/**
 * ============================================================================
 *  ARQUIVO LEGADO — NÃO É USADO PELO SISTEMA ATUAL
 * ============================================================================
 *  HISTÓRICO:
 *    Rotas do perfil TRANSPORTADOR, que existiu em uma versão anterior do
 *    projeto. O arquivo ficou na pasta, mas o server.js NÃO o importa:
 *    o perfil foi substituído por GERENTE, que passou a cuidar também das
 *    vendas e das entregas.
 *
 *  ⚠️ DUAS COISAS QUE DIFEREM DOS ARQUIVOS DE ROTAS VIGENTES
 *  ---------------------------------------------------------------------------
 *  1) O NOME DO IMPORT ESTÁ ERRADO DE PROPÓSITO NESTE ARQUIVO ANTIGO:
 *        "../controllers/transportadorController.js"  (com "n" no final)
 *     enquanto o arquivo real no disco é "TransportadorController.js"
 *     (com "N" maiúsculo). Em Linux/macOS, nomes de arquivo diferenciam
 *     maiúsculas de minúsculas, então ESTE IMPORT QUEBRARIA se fosse
 *     executado. É mais uma evidência de que o arquivo é resíduo de uma
 *     versão apagada — e a razão pela qual ele não pode simplesmente ser
 *     "reativado" sem correção.
 *
 *  2) OS MÉTODOS HTTP ESTÃO FORA DE ORDEM:
 *     o GET "/:id" aparece DEPOIS do POST "/". Como explicado nos demais
 *     arquivos de rotas, isso NÃO gera conflito, porque o Express compara
 *     caminhos completos: um POST em ".../transportadores" não casa com o
 *     padrão "/:id". Ainda assim, a convenção adotada no projeto é declarar
 *     primeiro as leituras e depois as escritas.
 *
 *  O QUE UMA ROTA FAZ (o mesmo mecanismo de todas):
 *     método HTTP + caminho → função do controller
 *     O prefixo "/api/transportadores" seria acrescido pelo servidor, caso
 *     estas rotas fossem montadas — o que não acontece.
 * ============================================================================
 */
import { Router } from "express";
import {
  listarTransportadores,
  criarTransportador,
  obterTransportador,
  atualizarTransportador,
  deletarTransportador,
} from "../controllers/transportadorController.js"; // ⚠️ ver observação 1 no cabeçalho

const router = Router();

router.get("/", listarTransportadores);
router.post("/", criarTransportador);
router.get("/:id", obterTransportador);
router.put("/:id", atualizarTransportador);
router.delete("/:id", deletarTransportador);

export default router;
