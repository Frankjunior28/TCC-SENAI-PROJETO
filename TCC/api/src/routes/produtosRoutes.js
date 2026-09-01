
import { Router } from "express";
import {
  listarProdutos,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  deletarProduto
} from "../controllers/produtosController.js";

const router = Router();

router.get("/", listarProdutos);
router.get("/:id", buscarProdutoPorId);
router.post("/", criarProduto);
router.put("/:id", atualizarProduto);
router.delete("/:id", deletarProduto);

export default router;