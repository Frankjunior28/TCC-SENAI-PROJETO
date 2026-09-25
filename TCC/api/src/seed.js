/**
 * ============================================================================
 *  CATÁLOGO INICIAL DA LOJA + ROTINA DE SEED
 *  ============================================================================
 *  ===========================================================================
 *  1. O QUE É "SEED" (semeadura / carga inicial)
 *  ===========================================================================
 *    É o preenchimento automático do banco com um conjunto mínimo de dados
 *    essenciais para o sistema funcionar. Sem ele, a loja abriria com uma
 *    vitrine vazia, e não haveria como demonstrar o projeto.
 *
 *  ===========================================================================
 *  2. POR QUE O CATÁLOGO ESTÁ NESTE ARQUIVO E NÃO NO MONGOOSE
 *  ===========================================================================
 *    O schema (models/produto.js) define a ESTRUTURA de um produto: quais
 *    campos existem e com que regras. Ele não diz NADA sobre quais móveis
 *    a loja vende. Essa informação é DADOS, e dados de exemplo ficam em um
 *    arquivo comum.
 *    A separação importa: o mesmo schema atende a loja com 12 ou com 12.000
 *    produtos, sem alteração nenhuma. Trocar o catálogo de exemplo é só
 *    editar a lista abaixo.
 *
 *  ===========================================================================
 *  3. A FONTE CANÔNICA DO CATÁLOGO
 *  ===========================================================================
 *    PRODUTOS_SEED é a fonte oficial dos 12 produtos iniciais, e o MESMO
 *    caminho "/images/produtos/..." é servido de duas maneiras:
 *      • em desenvolvimento, pelo Vite, a partir de `ui/public/`;
 *      • em produção, pelo Express, a partir de `ui/dist/` (que é o build
 *        do frontend, contendo a pasta `images/produtos/`).
 *    Por isso os valores guardados no banco são caminhos COMERCIAIS
 *    ("/images/produtos/sofa-luxo.jpg"), e não URLs completas da internet.
 *
 *  ===========================================================================
 *  4. O QUE A FUNÇÃO seedProdutos FAZ — DUAS SITUAÇÕES DIFERENTES
 *  ===========================================================================
 *    SITUAÇÃO A — coleção "produtos" está VAZIA (primeira execução):
 *      insertMany insere os 12 produtos de uma vez. O método é mais rápido
 *      que 12 chamadas create() separadas, porque executa uma única
 *      operação no banco.
 *
 *    SITUAÇÃO B — a coleção já tem produtos (execuções seguintes):
 *      NÃO é inserido nada de novo. A função apenas localiza produtos
 *      antigos que estejam sem foto e sem galeria, e completa esses campos
 *      com os valores do catálogo.
 *      POR QUE SÓ ESSES: o objetivo é corrigir um caso específico que
 *      aconteceu no desenvolvimento (produtos gravados antes de o campo de
 *      imagem existir), sem sobrescrever nada que o gerente tenha criado
 *      ou alterado pela interface. Uma inserção ou atualização em massa
 *      destruiria trabalho manual.
 *      O filtro com $or é uma OU lógica: traz o produto se QUALQUER das
 *      condições for verdadeira (foto vazia, galeria inexistente ou
 *      galeria vazia).
 *
 *  ===========================================================================
 *  5. POR QUE O CÓDIGO NÃO DEIXA O STARTUP QUEBRAR
 *  ===========================================================================
 *    O seed roda durante a inicialização do servidor. Se ele lançasse um
 *    erro sem ser tratado, a API inteira não subiria por causa de um
 *    detalhe de dados. Por isso o try/catch envolve a função e apenas
 *    registra a mensagem no console — a aplicação continua funcionando,
 *    apenas sem a carga inicial.
 *    (O mesmo cuidado vale para a atualização das fotos: se um produto do
 *     banco não existir mais no catálogo, o `continue` pula para o
 *     próximo em vez de interromper o laço.)
 * ============================================================================
 */
import Produto from "./models/produto.js";

/**
 * Catálogo inicial da loja Casa Aconchego: 12 móveis, cada um com uma
 * fotografia específica e coerente com o produto.
 * foto → imagem principal (aparece no card e no carrinho)
 * fotos → galeria (vira miniatura na tela de detalhe)
 * estoque → unidades disponíveis, exibido quando maior que zero
 * publicado: true → aparece na vitrine; false → vira rascunho do gerente
 */
export const PRODUTOS_SEED = [
  {
    nome: "Sofá Retrátil 3 Lugares",
    descricao: "Sofá retrátil e reclinável com espuma de alta densidade, tecido nobre e base em madeira de eucalipto.",
    tipo: "Sofás",
    preco: 1899.9,
    foto: "/images/produtos/sofa-luxo.jpg",
    fotos: ["/images/produtos/sofa-luxo.jpg"],
    estoque: 12,
    publicado: true,
  },
  {
    nome: "Poltrona de Leitura",
    descricao: "Poltrona de leitura com formas acolhedoras, braços largos e revestimento premium.",
    tipo: "Sofás",
    preco: 1099.0,
    foto: "/images/produtos/poltrona-1.jpg",
    fotos: ["/images/produtos/poltrona-1.jpg"],
    estoque: 10,
    publicado: true,
  },
  {
    nome: "Cama Box Queen",
    descricao: "Conjunto box e colchão Queen com molas ensacadas, combinando firmeza, conforto e sofisticação.",
    tipo: "Camas",
    preco: 1549.9,
    foto: "/images/produtos/cama-1.jpg",
    fotos: ["/images/produtos/cama-1.jpg"],
    estoque: 8,
    publicado: true,
  },
  {
    nome: "Cabeceira Casal Estofada",
    descricao: "Cabeceira para cama de casal com acabamento estofado, capa removível e toque aveludado.",
    tipo: "Camas",
    preco: 459.9,
    foto: "/images/produtos/cama-2.jpg",
    fotos: ["/images/produtos/cama-2.jpg"],
    estoque: 14,
    publicado: true,
  },
  {
    nome: "Mesa de Jantar 6 Lugares",
    descricao: "Mesa de jantar em madeira maciça com tampo liso, acabamento artesanal e espaço amplo para seis lugares.",
    tipo: "Mesas",
    preco: 2199.9,
    foto: "/images/produtos/mesa-jantar-luxo.jpg",
    fotos: ["/images/produtos/mesa-jantar-luxo.jpg"],
    estoque: 6,
    publicado: true,
  },
  {
    nome: "Mesa Lateral de Centro",
    descricao: "Mesa de centro redonda com tampo de vidro fosco e estrutura em madeira selecionada.",
    tipo: "Mesas",
    preco: 329.9,
    foto: "/images/produtos/mesa-5.jpg",
    fotos: ["/images/produtos/mesa-5.jpg"],
    estoque: 18,
    publicado: true,
  },
  {
    nome: "Guarda-roupa 6 Portas",
    descricao: "Guarda-roupa em MDP com seis portas, prateleiras, gavetas e acabamento contemporâneo.",
    tipo: "Armários",
    preco: 2499.0,
    foto: "/images/produtos/guarda-roupa-luxo.jpg",
    fotos: ["/images/produtos/guarda-roupa-luxo.jpg"],
    estoque: 5,
    publicado: true,
  },
  {
    nome: "Cômoda com 4 Gavetas",
    descricao: "Cômoda auxiliar com gavetas deslizantes e puxadores metálicos para organizar o ambiente com elegância.",
    tipo: "Armários",
    preco: 899.9,
    foto: "/images/produtos/comoda-luxo.jpg",
    fotos: ["/images/produtos/comoda-luxo.jpg"],
    estoque: 9,
    publicado: true,
  },
  {
    nome: "Estante de Livros 5 Prateleiras",
    descricao: "Estante com cinco prateleiras ajustáveis em madeira, versátil para salas, bibliotecas e escritórios.",
    tipo: "Escritório",
    preco: 649.9,
    foto: "/images/produtos/estante-luxo.jpg",
    fotos: ["/images/produtos/estante-luxo.jpg"],
    estoque: 11,
    publicado: true,
  },
  {
    nome: "Escrivaninha com Gavetas",
    descricao: "Escrivaninha compacta com gavetas e passagem para cabos, ideal para um home office refinado.",
    tipo: "Escritório",
    preco: 799.9,
    foto: "/images/produtos/escrivaninha-luxo.jpg",
    fotos: ["/images/produtos/escrivaninha-luxo.jpg"],
    estoque: 15,
    publicado: true,
  },
  {
    nome: "Cadeira de Escritório Ergonômica",
    descricao: "Cadeira ergonômica com ajuste, apoio lombar e base robusta para jornadas de trabalho mais confortáveis.",
    tipo: "Escritório",
    preco: 499.9,
    foto: "/images/produtos/cadeira-ergonomica-luxo.jpg",
    fotos: ["/images/produtos/cadeira-ergonomica-luxo.jpg"],
    estoque: 20,
    publicado: true,
  },
  {
    nome: "Rack para TV e Som",
    descricao: "Rack de linhas contemporâneas com compartimentos para equipamentos, videogame e sistema de som.",
    tipo: "Decor",
    preco: 749.9,
    foto: "/images/produtos/rack-tv-luxo.jpg",
    fotos: ["/images/produtos/rack-tv-luxo.jpg"],
    estoque: 7,
    publicado: true,
  },
];

/**
 * Garante que o catálogo inicial exista no banco.
 * Chamada pelo server.js logo após conectar e sincronizar os índices.
 */
export const seedProdutos = async () => {
  try {
    // Conta os documentos já existentes na coleção "produtos".
    const count = await Produto.countDocuments();

    // ---- SITUAÇÃO A: coleção vazia → insere o catálogo completo ----
    if (count === 0) {
      // insertMany grava vários documentos em uma única ida ao banco.
      await Produto.insertMany(PRODUTOS_SEED);
      console.log(`🌱 Seed executado: ${PRODUTOS_SEED.length} produtos cadastrados.`);
      return; // nada mais a fazer
    }

    // ---- SITUAÇÃO B: já existem produtos → só completa fotos faltantes ----
    // $or = OU lógico. Traz o produto se pelo menos uma condição for verdadeira:
    //   • foto é string vazia ou null;
    //   • o campo `fotos` não existe no documento;
    //   • o campo `fotos` existe, mas é uma lista de tamanho zero.
    const semFotos = await Produto.find({
      $or: [
        { foto: { $in: ["", null] } },
        { fotos: { $exists: false } },
        { fotos: { $size: 0 } },
      ],
    });

    for (const produto of semFotos) {
      // Localiza no catálogo o produto de mesmo nome.
      const catalogo = PRODUTOS_SEED.find((item) => item.nome === produto.nome);
      // Se o produto do banco não existe mais no catálogo (ex.: o gerente
      // criou um produto novo e depois limpou as imagens dele), ele é
      // ignorado — nada é inventado para ele.
      if (!catalogo) continue;

      // $set altera só os campos indicados, preservando o resto do documento.
      await Produto.updateOne(
        { _id: produto._id },
        { $set: { foto: catalogo.foto, fotos: catalogo.fotos } }
      );
    }
  } catch (error) {
    // Um problema no seed NÃO pode derrubar a aplicação: o site continua
    // no ar, apenas sem a carga inicial de produtos.
    console.error("❌ Erro no seed de produtos:", error.message);
  }
};

export default seedProdutos;
