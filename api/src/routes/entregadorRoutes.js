import { Router } from "express";
import {
  listarEntregadores,
  buscarEntregadorPorId,
  criarEntregador,
  atualizarEntregador,
  deletarEntregador,
} from "../controllers/entregadorController.js";
import { autenticar, autorizar } from "../middleware/auth.js";
import { validarEntregador } from "../middleware/validacoes.js";

const router = Router();

router.get("/", autenticar, autorizar("gerente"), listarEntregadores);
router.get("/:id", autenticar, autorizar("gerente"), buscarEntregadorPorId);
router.post("/", autenticar, autorizar("gerente"), validarEntregador, criarEntregador);
router.put("/:id", autenticar, autorizar("gerente"), atualizarEntregador);
router.delete("/:id", autenticar, autorizar("gerente"), deletarEntregador);

export default router;
