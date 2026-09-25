# CASA ACONCHEGO — Documentação Técnica

>lojade móveis "Casa Aconchego" (TCC). Monorepo com dois pacotes independentes:
> `api/` (back-end Node + Express + Mongoose + MongoDB) e `ui/` (front-end React + Vite).
> Análise feita por leitura do código-fonte. Nenhum trecho de código é reproduzido aqui.
> Onde algo não existe no projeto, está escrito **"não implementado"**.

---

## 1. VISÃO GERAL

**O que é.** Uma loja virtual de móveis (marketplace) com área de gestão. O visitante navega
pelo catálogo sem conta;logados compram;gerentes e administradores operam painéis próprios.
É uma SPA (uma única página HTML) com API REST separada e persistência em MongoDB.

**Problema que resolve.** Em um comércio de móveis com dados espalhados entre planilhas e
conversas, não existe vitrine padronizada para o cliente nem visão consolidada de vendas e
estoque para os responsáveis. O sistema centraliza catálogo, imagens, contas, carrinho e
pedidos em uma aplicação única, com separação de permissões por perfil.

**Tipos de usuário (3 perfis, cada um em sua própria collection).**

| Perfil | Onde a conta fica | Acesso |
| :--- | :--- | :--- |
| Visitante | — | Navega, pesquisa e filtra o catálogo. Sem carrinho. |
| Usuário (cliente) | `usuarios` | Carrinho, checkout, troca de conta, pedidos. |
| Gerente | `gerentes` | CRUD de produtos, publicação, estoque, gestão de vendas. |
| Administrador (Master) | `administradores` | Indicadores financeiros, CRUD de gerentes, configurações. |

**Objetivos declarados.** Modelar os dados em banco não relacional; construir API REST com
CRUD; autenticar por e-mail + senha + perfil; permitir navegação pública sem conta;
proteger carrinho e checkout; manter carrinho separado por conta; permitir troca de conta
e criação de conta independente; disponibilizar painel do gerente e painel Master;
tratar imagens indisponíveis e falha de conexão; validar por build, lint e consultas à API.

---

## 2. TECNOLOGIAS

### Back-end (`api/package.json`)

| Tecnologia | Versão | Função |
| :--- | :--- | :--- |
| Node.js | runtime | Executa o servidor e os scripts de banco (`.mjs`/ESM). |
| Express | ^5.2.1 | Criação do servidor HTTP, middlewares, rotas e arquivos estáticos. |
| Mongoose | ^9.9.2 | ODM: schemas, validação, relacionamentos e operações sobre o MongoDB. |
| mongodb (driver) | ^7.5.0 | Driver oficial, usado de baixo nível na migração e no seed. |
| dotenv | ^17.4.2 | Carrega variáveis de ambiente do arquivo `api/.env`. |
| cors | ^2.8.6 | Libera requisições entre origens diferentes (dev: 5173 → 3000). |
| nodemon | ^3.1.14 (dev) | Reinicia o servidor ao salvar arquivo. |

### Front-end (`ui/package.json`)

| Tecnologia | Versão | Função |
| :--- | :--- | :--- |
| React | ^19.2.8 | Interface declarativa; estado global da SPA via `useState`. |
| React DOM | ^19.2.8 | Renderização dos componentes no navegador. |
| Vite | ^5.4.19 | Servidor de desenvolvimento, proxy da API e build de produção. |
| @vitejs/plugin-react | ^4.3.4 | Transpila JSX e habilita Fast Refresh. |
| eslint | ^10.8.0 (dev) | Análise estática (`npm run lint`). |
| eslint-plugin-react-hooks | ^7.1.1 (dev) | Regras dos hooks do React. |
| eslint-plugin-react-refresh | ^0.5.3 (dev) | Regra de um componente exportado por arquivo. |
| @eslint/js / globals | ^10.0.1 / ^17.7.0 (dev) | Regras base de JS e variáveis globais de navegador. |
| @types/react, @types/react-dom | ^19.2.x (dev) | Tipos (não há TypeScript no projeto). |

### Infraestrutura e bibliotecas

| Item | Função |
| :--- | :--- |
| MongoDB / MongoDB Atlas | Persistência. Em desenvolvimento pode ser o MongoDB local. |
| `fetch` (nativo do navegador) | Cliente HTTP. Axios **não** é usado. |
| `localStorage` | Persistência do carrinho, com uma chave por conta. |
| CSS3 puro | Estilização, responsividade e identidade visual. Sem biblioteca de UI. |
| npm | Gerenciamento dos pacotes `api` e `ui`. |
| Git | Controle de versão. |

**Não utilizados:** React Router, Redux, Context API, Axios, JWT, bcrypt, TypeScript,
biblioteca de componentes visuais, suíte de testes. A navegação é feita por estado React e
o roteamento HTTP existe apenas no back-end.

---

## 3. BANCO DE DADOS

MongoDB (não relacional). Todos os models usam `{ timestamps: true }`, que cria
automaticamente `createdAt` e `updatedAt`. O `_id` é um ObjectId gerado pelo MongoDB.
O nome real de cada coleção é fixado no 3º parâmetro de `mongoose.model()`, para evitar
que o Mongoose invente nomes (foi assim que surgiu a coleção errada `administradors`).

### 3.1 `usuarios` — clientes

| Campo | Tipo | Regras |
| :--- | :--- | :--- |
| `nome` | String | obrigatório, `trim` |
| `email` | String | obrigatório, **único na coleção**, `lowercase`, `trim` |
| `senha` | String | obrigatório, **texto puro** |
| `telefone` | String | `default: ""` |
| `cpf` | String | `default: ""` |
| `perfil` | String | `enum: ["usuario"]`, `default: "usuario"` |

### 3.2 `gerentes`

| Campo | Tipo | Regras |
| :--- | :--- | :--- |
| `nome` | String | obrigatório, `trim` |
| `email` | String | obrigatório, **único**, `lowercase`, `trim` |
| `senha` | String | obrigatório, texto puro |
| `telefone` | String | `default: ""` |
| `cpf` | String | `default: ""` |
| `cargo` | String | `default: "Gerente"` |
| `perfil` | String | `enum: ["gerente"]` |

### 3.3 `administradores`

| Campo | Tipo | Regras |
| :--- | :--- | :--- |
| `nome` | String | obrigatório, `trim` |
| `email` | String | obrigatório, **único**, `lowercase`, `trim` |
| `senha` | String | obrigatório, texto puro |
| `cpf` | String | **obrigatório** (único perfil que exige) |
| `telefone` | String | `default: ""` |
| `cargo` | String | `default: "Administrador Master"` |
| `status` | String | `default: "Ativo"` (campo gravado, sem efeito funcional) |
| `perfil` | String | `enum: ["administrador"]` |

### 3.4 `produtos`

| Campo | Tipo | Regras |
| :--- | :--- | :--- |
| `nome` | String | obrigatório, `trim` |
| `descricao` | String | `default: ""` |
| `tipo` | String | obrigatório (categoria: Sofás, Camas, Mesas, Armários, Escritório, Decor) |
| `preco` | Number | obrigatório |
| `foto` | String | `default: ""` (imagem principal) |
| `fotos` | [String] | `default: []` (galeria) |
| `estoque` | Number | `default: 0` |
| `publicado` | Boolean | `default: true` — `false` mantém o produto como rascunho, fora da vitrine |

### 3.5 `pedidos`

| Campo | Tipo | Regras |
| :--- | :--- | :--- |
| `cliente.nome` | String | obrigatório (objeto embutido) |
| `cliente.email` | String | obrigatório (objeto embutido) |
| `itens[].produto` | String | obrigatório (nome do móvel) |
| `itens[].produtoId` | ObjectId (`ref: Produto`) | opcional — referência ao catálogo, usada no controle de estoque |
| `itens[].preco` | Number | obrigatório (preço vigente no banco no momento da compra) |
| `itens[].qtd` | Number | obrigatório, `min: 1` |
| `total` | Number | obrigatório (calculado no front) |
| `status` | String | `enum: [pendente, entregue, cancelado]`, `default: "pendente"` |

### 3.6 Relacionamentos

- **1 cliente → N pedidos.** Sem chave estrangeira: o pedido guarda uma cópia de `nome` e
  `email` do comprador (padrão *embedding* do MongoDB).
- **N pedidos ↔ N produtos.** Representado pela lista `itens` do pedido.
- **Desnormalização deliberada:** o pedido copia nome e preço do produto em vez de só
  referenciar o `_id`, para preservar o histórico financeiro mesmo após o preço mudar.
- **E-mail único por coleção, não global:** a mesma pessoa pode ser cliente e gerente ao
  mesmo tempo, porque são coleções diferentes.

### 3.7 Estrutura legada

- **`administradors`** (nome errado gerado pelo Mongoose): tratada pela rotina de migração,
  que move os dados para `administradores` e remove a coleção antiga. Corrigido.
- **`transportadores`**: model, controller e routes existem no código, mas **não são
  montados no servidor** e **não são importados** por nenhum arquivo. Código morto.
  O arquivo `TransportadorRoutes.js` ainda importa `transportadorController.js` (minúscula),
  enquanto o arquivo em disco é `TransportadorController.js` — quebraria em sistema de
  arquivos sensível a caixa.

### 3.8 Scripts de banco

| Script | Função |
| :--- | :--- |
| `src/seed.js` | Popula 12 produtos se a coleção estiver vazia; completa fotos de produtos antigos sem imagem. Idempotente. |
| `src/database/migracao.js` | Move gerentes/administradores de `usuarios` para as coleções corretas; normaliza perfis; limpa `administradors`. Idempotente. Roda sozinho no startup. |
| `src/migrar.js` | Executa a migração fora do servidor e imprime relatório por collection. |
| `src/sincronizar-fotos.js` | Sobrescreve as fotos dos 12 produtos do catálogo. Manual. |
| `inspecionar-banco.mjs` | Diagnóstico **somente leitura**: bancos, collections, contagem e agrupamento por perfil. |

---

## 4. BACK-END

### 4.1 Estrutura de pastas

```text
api/
├── .env                      # não existe no repositório (ignorado pelo Git)
├── package.json
├── inspecionar-banco.mjs     # diagnóstico somente leitura
└── src/
    ├── server.js             # ponto de entrada: middlewares, rotas, conexão
    ├── seed.js               # catálogo inicial + carga
    ├── migrar.js             # migração manual
    ├── sincronizar-fotos.js  # atualização manual de mídias
    ├── database/
    │   ├── connection.js     # conexão com o MongoDB
    │   └── migracao.js       # migração de perfis e coleção legada
    ├── models/               # 5 schemas ativos + 1 legado
    ├── controllers/          # 5 ativos + 1 legado
    └── routes/               # 5 ativos + 1 legado
```

Arquitetura em três camadas (MVC): `routes` (endpoint → controller) → `controllers`
(regra de negócio e validação) → `models` (acesso ao banco via Mongoose).

### 4.2 Inicialização (`server.js`), em ordem

1. `dotenv.config()` lê `api/.env` (MONGO_URI, PORT).
2. `cors()` e `express.json()` como middlewares globais.
3. Montagem das 5 collections de rotas com prefixo `/api`.
4. `express.static(ui/dist)` + fallback de SPA: qualquer `GET` que não comece com `/api`
   devolve o `index.html` (permite o roteamento no front sem react-router).
5. Conexão com o banco → migração de perfis → `syncIndexes()` → seed.
6. O servidor **sobe mesmo se o banco falhar** (`.finally`), entrando em *modo demonstração*.

Ordem obrigatória: a **migração roda antes** do `syncIndexes()`. Com as contas antigas
misturadas em uma única coleção, o índice único de e-mail falharia.

### 4.3 Rotas da API

Todas montadas sem middleware de autenticação.

**`/api/usuarios`**

| Método | Endpoint | Função | Descrição |
| :--- | :--- | :--- | :--- |
| GET | `/api/usuarios` | `listarUsuarios` | Lista clientes (sem senha) |
| GET | `/api/usuarios/:id` | `buscarUsuarioPorId` | Obtém um cliente |
| POST | `/api/usuarios` | `criarUsuario` | Cadastro — grava na coleção do `perfil` enviado |
| POST | `/api/usuarios/login` | `loginUsuario` | Login — procura na coleção do `perfil` |
| PUT | `/api/usuarios/:id` | `atualizarUsuario` | Atualiza cliente (`perfil` imutável) |
| DELETE | `/api/usuarios/:id` | `deletarUsuario` | Remove cliente |

**`/api/gerentes`**

| Método | Endpoint | Função | Descrição |
| :--- | :--- | :--- | :--- |
| GET | `/api/gerentes` | `listarGerentes` | Lista gerentes |
| GET | `/api/gerentes/:id` | `buscarGerentePorId` | Obtém um gerente |
| POST | `/api/gerentes` | `criarGerente` | Cria conta de gerente |
| PUT | `/api/gerentes/:id` | `atualizarGerente` | Atualiza gerente |
| DELETE | `/api/gerentes/:id` | `deletarGerente` | Remove gerente |

**`/api/administradores`**

| Método | Endpoint | Função | Descrição |
| :--- | :--- | :--- | :--- |
| GET | `/api/administradores` | `listarAdministradores` | Lista administradores |
| POST | `/api/administradores` | `criarAdministrador` | Cria administrador (exige CPF) |
| GET | `/api/administradores/:id` | `obterAdministrador` | Obtém um administrador |
| PUT | `/api/administradores/:id` | `atualizarAdministrador` | Atualiza administrador |
| DELETE | `/api/administradores/:id` | `deletarAdministrador` | Remove administrador |

> Essas 5 rotas existem e funcionam, mas **nenhuma função no front-end as consome**.

**`/api/produtos`**

| Método | Endpoint | Função | Descrição |
| :--- | :--- | :--- | :--- |
| GET | `/api/produtos` | `listarProdutos` | Lista todos (inclui rascunhos; quem filtra é o front) |
| GET | `/api/produtos/:id` | `buscarProdutoPorId` | Obtém um produto |
| POST | `/api/produtos` | `criarProduto` | Cadastra produto |
| PUT | `/api/produtos/:id` | `atualizarProduto` | Edita dados, mídia ou publicação |
| DELETE | `/api/produtos/:id` | `deletarProduto` | Exclui produto |

**`/api/pedidos`**

| Método | Endpoint | Função | Descrição |
| :--- | :--- | :--- | :--- |
| GET | `/api/pedidos` | `listarPedidos` | Lista pedidos, mais recente primeiro |
| GET | `/api/pedidos/:id` | `buscarPedidoPorId` | Obtém um pedido |
| POST | `/api/pedidos` | `criarPedido` | Checkout: valida estoque, grava e dá baixa |
| PUT | `/api/pedidos/:id` | `atualizarStatusPedido` | Altera **somente** o status |
| DELETE | `/api/pedidos/:id` | `deletarPedido` | Exclui pedido e devolve o estoque |

**`/api/transportadores`** — as 5 rotas existem no arquivo, mas **não são montadas no
servidor** (não há rota ativa). Legado.

### 4.4 Autenticação

**Implementado de forma simplificada, sem token.**

- Login por **e-mail + senha + perfil**. O campo `perfil` escolhe a collection onde a conta
  é buscada, por um mapa `perfil → model` no controller de usuários.
- Se o `perfil` não for enviado, o login procura nas três coleções em sequência.
- Há compatibilidade legada: se a senha não vier, o **CPF** é aceito como credencial.
- O campo `perfil` da resposta é o que o front-end usa para escolher a tela.
- A senha **nunca volta** nas respostas (`select("-senha")` ou remoção por destructuring).
- **Sem JWT, sem sessão persistida, sem cookie, sem middleware de autorização.**
  O controle de acesso existe **apenas no front-end**: qualquer cliente HTTP pode chamar
  qualquer rota, inclusive criar/excluir produtos, pedidos e gerentes.

### 4.5 Tratamento de erro

Padrão consistente: `try/catch` em todos os handlers, com `message` como chave de erro
(padrão lido pelo front). Códigos usados: 200, 201 (criado), 400 (inválido), 401 (credencial),
404 (não encontrado), 409 (conflito/estoque), 500 (erro interno). Erro de índice duplicado
do MongoDB (`code: 11000`) é convertido em 409.

---

## 5. FRONT-END

### 5.1 Estrutura de pastas

```text
ui/
├── index.html               # HTML único da SPA; <div id="root">
├── vite.config.js           # plugin React + proxy /api → localhost:3000
├── eslint.config.js
├── public/
│   ├── favicon.svg, icons.svg
│   └── images/produtos/*.jpg    # ~30 fotos do catálogo
└── src/
    ├── main.jsx             # entry: createRoot + <App/>
    ├── App.jsx              # estado global + "roteamento" por useState
    ├── constants.js         # PERFIS, CATEGORIAS, PRODUTOS_FALLBACK, formatarPreco, MSG_ESTOQUE
    ├── index.css            # toda a estilização (1.900+ linhas)
    ├── services/api.js      # cliente HTTP (fetch) + tradução de erros
    ├── components/          # telas e componentes
    └── assets/
```

### 5.2 Roteamento e estado

- **Sem react-router.** O `App.jsx` guarda a tela atual em `useState("view")` e renderiza
  por condicionais. Telas: `login`, `loja`, `produto`, `carrinho`, `gerente`, `administrador`.
- **Sem Context API e sem Redux.** Todo o estado global vive no `App.jsx` e é repassado
  por props. As telas usam `useState`/`useEffect` locais.
- O login decide a tela pelo `perfil` retornado pela API.
- Visitas que tentam carrinho sem conta são levadas ao login, e a ação pendente é retomada
  depois da autenticação.

### 5.3 Telas e componentes

| Componente | Função |
| :--- | :--- |
| `App.jsx` | Coração do front: estado, navegação, carrinho, ação protegida, painel. |
| `main.jsx` | Monta a SPA dentro de `#root`. |
| `services/api.js` | Cliente HTTP. Base relativa `/api`, timeout de 12 s via `AbortController`, tradução de códigos HTTP para mensagens em português. |
| `constants.js` | Perfis e campos de formulário, categorias, catálogo de fallback (12 produtos), formatação de moeda, texto de limite de estoque. |
| `LoginScreen.jsx` | Login e cadastro com abas de perfil (Usuário/Gerente/Administrador) e de modo (Entrar/Criar conta). Campos dinâmicos por perfil. |
| `LojaScreen.jsx` | Vitrine: hero com contador, busca por nome, filtro por categoria, grade de produtos. Filtros 100% no cliente. |
| `ProductCard.jsx` | Card do produto. Exibe "Esgotado" e desabilita o botão quando `estoque = 0`; "Últimas N unidades" quando ≤ 5. |
| `ProdutoScreen.jsx` | Detalhe: galeria com miniaturas, preço, estoque, botões de compra. Desabilita ações se esgotado. |
| `CarrinhoScreen.jsx` | Itens, controle de quantidade **limitado pelo estoque**, total e checkout. Mostra o estoque real de cada item. |
| `GerenteScreen.jsx` | Painel do gerente, 2 abas: Produtos (CRUD, até 3 URLs de imagem, rascunho/publicar) e Vendas (status, excluir). |
| `AdministradorScreen.jsx` | Painel Master, 3 abas: Dados financeiros, Contas de gerentes, Configurações e integrações. 6 cards de indicadores calculados no cliente. |
| `TrocarContaModal.jsx` | Modal para entrar em conta de outro perfil ou criar conta nova, sem alterar a conta ativa. |
| `Header.jsx` | Cabeçalho comum: marca, saudação com perfil, carrinho com badge, trocar conta, sair, voltar ao painel. |
| `Footer.jsx` | Rodapé. |
| `FotoProduto.jsx` | Imagem com *fallback* visual quando a URL está ausente ou quebra (`onError`). |
| `EntregadorScreen.jsx` | **Não é importado por nenhum arquivo.** Tela de entregador de uma versão anterior. Código morto. |

### 5.4 Consumo da API

- Tudo passa por `services/api.js`, que usa `fetch` nativo. Não há axios.
- **Base relativa** `/api`: em desenvolvimento o Vite faz proxy para `localhost:3000`
  (`vite.config.js`); em produção o próprio Express serve o site e a API na mesma porta.
- Timeout de 12 segundos com `AbortController`; falha de rede vira mensagem amigável.
- Erros HTTP são traduzidos para português antes de aparecer na tela.

**Funções disponíveis no cliente (14):** `fetchProdutos`, `createProduto`, `updateProduto`,
`deleteProduto`, `login`, `cadastro`, `listarPedidos`, `criarPedido`, `atualizarStatusPedido`,
`excluirPedido`, `listarGerentes`, `criarGerente`, `deletarGerente`, `mensagemClaraDeErro`.
Não há função para o CRUD de administradores.

### 5.5 Persistência local

- **Carrinho** no `localStorage`, com chave por conta: `tccCarrinho:perfil:id`. Isso impede
  que o carrinho de uma conta apareça em outra.
- Sair da conta limpa apenas a sessão em memória; o carrinho salvo permanece.
- **Catálogo de fallback:** se a API falhar, a vitrine carrega 12 produtos de
  `PRODUTOS_FALLBACK` e a tela exibe o aviso de modo demonstração.

---

## 6. FUNCIONALIDADES

| # | Funcionalidade | O que faz |
| :--- | :--- | :--- |
| 1 | **Navegação pública** | Visitante vê hero, contador de peças, busca e filtros sem ter conta. |
| 2 | **Busca e filtro** | Busca por nome e filtro por categoria, executados no navegador sobre a lista já carregada. |
| 3 | **Detalhe do produto** | Galeria com miniaturas, descrição, preço, estoque e ações de compra. |
| 4 | **Cadastro por perfil** | Cria a conta na collection correspondente ao perfil escolhido (cliente, gerente ou administrador). |
| 5 | **Login** | Autentica por e-mail + senha + perfil e abre a tela correspondente ao perfil. |
| 6 | **Troca de conta** | Modal para entrar em conta de outro perfil **ou** criar uma nova, sem apagar nem converter a conta anterior. |
| 7 | **Carrinho protegido** | Exige autenticação para abrir carrinho, adicionar ou comprar. Visitante é levado ao login e a ação é retomada depois. |
| 8 | **Carrinho por conta** | Uma chave de `localStorage` por perfil e por `_id`, evitando mistura entre contas. |
| 9 | **Controle de quantidade** | Aumenta, diminui e remove itens; item que chega a zero sai do carrinho. |
| 10 | **Controle de estoque** | Não permite ultrapassar o estoque em três pontos: botão "+" do carrinho, botão "Finalizar compra" e **validação no servidor** (que é a autoridade). Excede ou estoura → "Limite de estoque atingido". |
| 11 | **Baixa de estoque** | A venda debita as unidades no banco, com filtro atômico que impede estoque negativo em compras simultâneas. |
| 12 | **Checkout** | Envia cliente, itens e total; grava o pedido com status `pendente`; esvazia o carrinho e recarrega o catálogo. |
| 13 | **Preço vigente do banco** | O preço gravado no pedido vem do banco, não do carrinho, evitando preço desatualizado. |
| 14 | **CRUD de produtos (gerente)** | Cadastrar, editar, excluir e publicar/ocultar, com até 3 URLs de imagem e prévia. |
| 15 | **Rascunho vs publicado** | `publicado: false` mantém o produto fora da vitrine, visível só no painel do gerente. |
| 16 | **Gestão de vendas (gerente)** | Lista pedidos e permite marcar como entregue ou excluir. |
| 17 | **Devolução de estoque** | Ao excluir um pedido, as unidades voltam ao estoque. |
| 18 | **Painel financeiro (admin)** | Calcula faturamento, total de pedidos, entregues, pendentes e nº de gerentes a partir dos pedidos. |
| 19 | **Gestão de gerentes (admin)** | Cadastra, lista e exclui contas de gerente. O gerente criado já consegue fazer login. |
| 20 | **Configurações e integrações** | 6 opções técnicas/de integração com interruptor. **Somente estado de sessão — não implementa persistência.** |
| 21 | **Tratamento de falha de imagem** | URL ausente ou quebrada vira um *placeholder* (`FotoProduto`). |
| 22 | **Modo demonstração** | Sem banco, o site sobe com catálogo de fallback e aviso; nada é persistido. |
| 23 | **Diagnóstico do banco** | Script somente leitura para listar bancos, collections, contagem e divisão por perfil. |
| 24 | **Migração automática** | Organiza as collections de contas a cada startup, de forma idempotente. |
| 25 | **Sincronização de fotos** | Script manual que corrige as imagens do catálogo. |

---

## 7. PENDÊNCIAS E LIMITAÇÕES

### 7.1 Segurança (prioridade alta)

1. **Nenhuma autenticação no back-end.** Não há JWT, sessão ou cookie. Todas as rotas são
   abertas: qualquer cliente HTTP pode criar, editar e excluir produtos, pedidos, gerentes
   e administradores.
2. **Autorização apenas no front-end.** A tela é escolhida pelo `perfil`, mas a API não
   verifica perfil em nenhuma requisição.
3. **Senhas em texto puro** nas três collections, sem hash.
4. **Login legado aceita CPF como senha**, o que enfraquece a credencial.

### 7.2 Funcionalidades incompletas

5. **CRUD de administradores não é usado pelo front-end.** As 5 rotas existem no back-end,
   mas não há função correspondente em `services/api.js` nem tela no painel Master.
6. **Configurações e integrações não persistem.** Vivem em `useState`; recarregar a página
   perde tudo. Não há model nem endpoint.
7. **Upload de imagem não implementado.** O gerente informa até 3 URLs; não há envio de
   arquivo, validação de tipo nem compressão.
8. **Status de administrador não tem efeito.** O campo `status` é gravado e listado, mas
   não desativa contas.

### 7.3 Código morto e legado

9. `api/src/models/Transportador.js`, `controllers/TransportadorController.js` e
   `routes/TransportadorRoutes.js` — não importados por ninguém. O arquivo de rotas ainda
   importa `transportadorController.js` em minúsculas, o que quebraria em Linux/macOS.
10. `ui/src/components/EntregadorScreen.jsx` — não importado por nenhum componente.
11. `ui/src/App.css` — conteúdo herdado do template do Vite, praticamente sem uso.
12. `ui/README.md` — é o texto padrão do Vite, não descreve o projeto.
13. Logs deDepuração em código ativo (por exemplo, o `dotenv` imprime um aviso a cada
    inicialização por falta do `.env`).

### 7.4 Dados e consistência

14. **`total` do pedido é confiado ao cliente.** A validação acontece no navegador e o
    servidor usa o valor recebido. Uma versão mais segura recalcularia a soma no back-end.
15. **Busca e filtro são 100% no cliente.** Sem paginação nem filtro no servidor: o catálogo
    inteiro é baixado a cada carregamento.
16. **Nenhum backup, log de auditoria ou relatório analítico.**
17. A delete de pedido devolve o estoque, mas **cancelamento de pedido (status
    `cancelado`) não devolve** — as unidades permanecem abatidas. Decisão de negócio ainda
    não definida.

### 7.5 Qualidade e testes

18. **Não há suíte de testes automatizados.** Nenhum `*.test.*`, `*.spec.*` ou pasta
    `__tests__`; nenhum script de teste nos `package.json`.
19. **A validação feita no desenvolvimento foi manual** (build, lint, `node --check`,
    consultas diretas à API e renderização de componentes), não registrada como suíte.
20. **Sem CI/CD, sem Docker, sem monitoramento.**
21. Acessibilidade inicial apenas: `label`, `role`, `aria-modal`, `alt` e `tabIndex` nos
    elementos principais. Sem teste de contraste ou navegação completa por teclado.
22. Sem tratamento de `unhandledRejection` nem `process.on("uncaughtException")`.

### 7.6 Configuração

23. **`api/.env` não existe** e não há `.env.example`. Sem ele, o sistema cai no MongoDB
    local (`localhost:27017/tcc`) e usa a porta 3000.
24. `ui/dist` (build de produção) está versionado no Git, apesar de estar no `.gitignore`.
25. Existe uma cópia aninhada do projeto em `TCC-PASTA-CORRETA/TCC` com outra versão do
    back-end, não versionada — risco de confusão e de commit acidental.

---

## 8. COMO RODAR

### 8.1 Pré-requisitos

- Node.js instalado.
- MongoDB acessível: local (padrão `mongodb://localhost:27017/tcc`) ou cluster do Atlas.

### 8.2 Instalação

Na raiz do projeto, instala as dependências dos dois pacotes de uma vez:

```bash
npm run install:all
```

Equivale a `npm install` dentro de `api/` e de `ui/`.

### 8.3 Configuração (variáveis de ambiente)

Arquivo **`api/.env`** (não versionado, pois pode conter credenciais).

| Variável | Finalidade | Padrão se ausente |
| :--- | :--- | :--- |
| `MONGO_URI` | String de conexão do MongoDB | `mongodb://localhost:27017/tcc` |
| `PORT` | Porta da API | `3000` |

> O `.env` é opcional. Sem ele, a API usa o MongoDB local. Não há `.env.example` no
> projeto, e o valor de `MONGO_URI` **não deve ser documentado nem versionado**.

### 8.4 Execução em desenvolvimento

Dois terminais, a partir da raiz:

```bash
npm run dev:api     # sobe a API com nodemon  → http://localhost:3000
npm run dev:ui      # sobe a interface Vite   → http://localhost:5173
```

Acesse **http://localhost:5173** (o Vite faz proxy de `/api` para a porta 3000).

### 8.5 Build e execução em produção

```bash
npm run build       # gera o bundle de produção em ui/dist
npm start           # sobe a API, que também serve o site e a API na mesma porta
```

Depois do build, basta acessar **http://localhost:3000** — o Express serve a interface e a
API na mesma porta, e o proxy do Vite deixa de ser necessário.

### 8.6 Scripts de banco

Executar de dentro de `api/`, ou a partir da raiz:

```bash
npm run migrar      # migração de perfis + índices, com relatório por collection
npm run fotos       # sincroniza as fotos dos 12 produtos do catálogo
npm run banco       # diagnóstico somente leitura (bancos, collections, contagem)
```

### 8.7 Qualidade

```bash
npm --prefix ui run lint      # análise estática do front-end
```

Verificação de sintaxe dos arquivos do back-end (sem script próprio no projeto):

```bash
node --check src/server.js
```

### 8.8 Contas para teste

O seed popula apenas produtos. **Não há seed de contas** — é preciso criar os usuários
pelo cadastro da tela de login ou pelo painel Master.
