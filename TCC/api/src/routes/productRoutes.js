import { Router } from "express";

const router = Router();

console.log("Arquivo productRoutes carregado");

const products = [
    {
        id: 1,
        name: "Notebook Gamer",
        price: 5000
    }
];

router.get("/", (req, res) => {
    console.log("Entrou na rota GET /products");

    res.json(products);
});

export default router;
