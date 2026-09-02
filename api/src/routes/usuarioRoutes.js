import { Router } from "express";
import {
  listarUsuarios,
  criarUsuario,
  obterUsuario,
  atualizarUsuario,
  deletarUsuario,
} from "../controllers/usuarioController.js";
import { validarUsuario } from "../middleware/validacoes.js";
import { autenticar, autorizar } from "../middleware/auth.js";

const router = Router();

router.get("/", autenticar, autorizar("gerente"), listarUsuarios);
router.get("/:id", autenticar, autorizar("gerente"), obterUsuario);
router.post("/", autenticar, autorizar("gerente"), validarUsuario, criarUsuario);
router.put("/:id", autenticar, autorizar("gerente"), atualizarUsuario);
router.delete("/:id", autenticar, autorizar("gerente"), deletarUsuario);

export default router;
