import { Router } from "express";
import { login, registrar } from "../controllers/authController.js";
import { validarLogin } from "../middleware/validacoes.js";

const router = Router();

router.post("/login", validarLogin, login);
router.post("/registro", registrar);

export default router;
