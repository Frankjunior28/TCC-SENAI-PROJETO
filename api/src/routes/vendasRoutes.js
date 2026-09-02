import { Router } from "express";
import {
  criarVenda,
  listarVendas,
  listarVendasPendentes,
  atualizarStatus,
} from "../controllers/vendasController.js";
import { autenticar, autorizar } from "../middleware/auth.js";
import { validarVenda, validarStatus } from "../middleware/validacoes.js";

const router = Router();

router.post("/", autenticar, autorizar("usuario"), validarVenda, criarVenda);
router.get("/", autenticar, autorizar("gerente"), listarVendas);
router.get("/pendentes", autenticar, autorizar("entregador"), listarVendasPendentes);
router.patch("/:id/status", autenticar, autorizar("entregador"), validarStatus, atualizarStatus);

export default router;
