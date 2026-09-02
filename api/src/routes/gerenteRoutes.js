import { Router } from "express";
import {
  listarGerentes,
  buscarGerentePorId,
  criarGerente,
  atualizarGerente,
  deletarGerente
} from "../controllers/gerenteController.js";
import { validarGerente } from "../middleware/validacoes.js";
import { autenticar, autorizar } from "../middleware/auth.js";

const router = Router();

router.get("/", autenticar, autorizar("gerente"), listarGerentes);
router.get("/:id", autenticar, autorizar("gerente"), buscarGerentePorId);
router.post("/", autenticar, autorizar("gerente"), validarGerente, criarGerente);
router.put("/:id", autenticar, autorizar("gerente"), atualizarGerente);
router.delete("/:id", autenticar, autorizar("gerente"), deletarGerente);

export default router;
