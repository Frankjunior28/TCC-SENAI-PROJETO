import { Router } from "express";
import {
  listarGerentes,
  buscarGerentePorId,
  criarGerente,
  atualizarGerente,
  deletarGerente
} from "../controllers/gerenteController.js";

const router = Router();

router.get("/", listarGerentes);
router.get("/:id", buscarGerentePorId);
router.post("/", criarGerente);
router.put("/:id", atualizarGerente);
router.delete("/:id", deletarGerente);

export default router;