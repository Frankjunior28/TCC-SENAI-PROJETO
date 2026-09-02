import { Router } from "express";
import {
  listarProdutos,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  deletarProduto
} from "../controllers/produtosController.js";
import { validarProduto } from "../middleware/validacoes.js";
import { autenticar, autorizar } from "../middleware/auth.js";

const router = Router();

router.get("/", listarProdutos);
router.get("/:id", buscarProdutoPorId);
router.post("/", autenticar, autorizar("gerente"), validarProduto, criarProduto);
router.put("/:id", autenticar, autorizar("gerente"), validarProduto, atualizarProduto);
router.delete("/:id", autenticar, autorizar("gerente"), deletarProduto);

export default router;
