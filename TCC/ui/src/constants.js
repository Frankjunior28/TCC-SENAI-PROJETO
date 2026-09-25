/** Configurações globais da loja. */

/** Perfis e campos usados nos formulários de conta. */
export const PERFIS = {
  usuario: {
    label: "Usuário",
    campos: [
      { name: "nome", label: "Nome", type: "text", placeholder: "Seu nome completo" },
      { name: "email", label: "Email", type: "email", placeholder: "seu@email.com" },
      { name: "senha", label: "Senha", type: "password", placeholder: "Sua senha" },
      { name: "telefone", label: "Número de telefone", type: "tel", placeholder: "(00) 00000-0000" },
    ],
  },
  gerente: {
    label: "Gerente",
    campos: [
      { name: "nome", label: "Nome", type: "text", placeholder: "Seu nome completo" },
      { name: "email", label: "Email", type: "email", placeholder: "seu@empresa.com" },
      { name: "senha", label: "Senha", type: "password", placeholder: "Sua senha" },
      { name: "telefone", label: "Número de telefone", type: "tel", placeholder: "(00) 00000-0000" },
      { name: "cpf", label: "CPF", type: "text", placeholder: "000.000.000-00" },
    ],
  },
  administrador: {
    label: "Administrador",
    campos: [
      { name: "nome", label: "Nome", type: "text", placeholder: "Seu nome completo" },
      { name: "email", label: "Email", type: "email", placeholder: "seu@empresa.com" },
      { name: "senha", label: "Senha", type: "password", placeholder: "Sua senha" },
      { name: "telefone", label: "Telefone", type: "tel", placeholder: "(00) 00000-0000" },
      { name: "cpf", label: "CPF", type: "text", placeholder: "000.000.000-00" },
    ],
  },
};

export const TIPOS = Object.keys(PERFIS);
export const CATEGORIAS = ["Sofás", "Camas", "Mesas", "Armários", "Escritório", "Decor"];

/**
 * Texto exibido quando a quantidade pedida passa do estoque disponível.
 *
 * Por que uma constante compartilhada: o mesmo aviso é mostrado em três
 * lugares diferentes (ao adicionar no carrinho, ao aumentar a quantidade
 * dentro do carrinho e ao tentar finalizar a compra). Se cada um
 * escrevesse o texto por conta própria, uma correção de redação teria de
 * ser aplicada em todos — e é exatamente assim que mensagens divergem
 * entre telas.
 *
 * O mesmo texto também existe no backend, em
 * api/src/controllers/pedidoController.js (constante MSG_ESTOQUE), para
 * que a resposta da API e a mensagem da interface não se contradigam.
 */
export const MSG_ESTOQUE = "Limite de estoque atingido";

/**
 * Catálogo local. Cada produto recebe uma fotografia específica e coerente;
 * a galeria não mistura móveis diferentes como se fossem ângulos do mesmo item.
 */
export const PRODUTOS_FALLBACK = [
  {
    id: "sof-ret-1",
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
    id: "pol-1",
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
    id: "cam-q-1",
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
    id: "cab-1",
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
    id: "mes-6-1",
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
    id: "mes-lat-1",
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
    id: "gua-6-1",
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
    id: "com-4-1",
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
    id: "est-liv-1",
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
    id: "esc-3-1",
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
    id: "cad-erg-1",
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
    id: "rack-tv-1",
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

/** Converte número em moeda brasileira: 1899.9 → "R$ 1.899,90". */
export const formatarPreco = (valor) =>
  (Number(valor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
