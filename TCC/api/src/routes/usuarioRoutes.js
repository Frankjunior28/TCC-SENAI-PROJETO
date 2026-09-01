import { Router } from "express";
import {
  listarUsuarios,
  buscarUsuarioPorId,
  criarUsuario,
  atualizarUsuario,
  deletarUsuario
} from "../controllers/usuariocontroller.js";

const router = Router();

router.get("/", listarUsuarios);
router.get("/:id", buscarUsuarioPorId);
router.post("/", criarUsuario);
router.put("/:id", atualizarUsuario);
router.delete("/:id", deletarUsuario);

export default router;