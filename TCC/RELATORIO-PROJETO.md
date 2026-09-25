# RELATÓRIO DE ANÁLISE DO PROJETO

> Documento gerado por análise estática do código-fonte (sem executar a aplicação).
> Regra aplicada: nenhum segredo, senha ou string de conexão é reproduzido aqui — apenas NOMES de chaves.

---

## 0. LOCALIZAÇÃO REAL DOS ARQUIVOS (diverge do enunciado)

O enunciado cita a raiz `TCC-SENAI-PROJETO` e uma pasta `frontend`. **Esses nomes não existem no disco.** O que existe de fato:

- Repositório git (raiz): `C:\Users\Aluno\Desktop\TCC-PASTA-CORRETA`
  - `.git/` (branch `main`)
  - `TCC/` ← **projeto real analisado neste relatório**
    - `api/` ← backend (Express + Mongoose)
    - `ui/` ← frontend (React + Vite) [equivale à pasta "frontend" citada]
    - `.gitignore`, `package.json`, `package-lock.json`
  - `TCC-PASTA-CORRETA/TCC/` ← **cópia aninhada** contendo OUTRA versão do backend (com `authController.js`, `middleware/authMiddleware.js`, `middleware/validacao.js`, model/routes `Transportador`) — diferente do projeto atual, não versionada no histórico (aparece como untracked no `git status`).

Em resumo: **frontend = `TCC/ui`** e **backend = `TCC/api`**. A cópia aninhada é relevante apenas como contexto; o backend atual NÃO possui `authController`, `middleware` nem `Transportador`.

O tema real do projeto no código é uma loja de **móveis "Casa Aconchego"** (`package.json`: `tcc-casa-aconchego`). O termo "TechStore" **não foi encontrado em nenhum arquivo** do projeto.

---

## 1. VISÃO GERAL

- **Nome do projeto:** `tcc-casa-aconchego` (loja virtual de móveis "Casa Aconchego").
- **Objetivo:** mercado/loja online de móveis com 3 perfis de usuário — **Usuário/Cliente**, **Gerente** e **Administrador (Master)** — consistente com um TCC/guia de aula de loja virtual.
- **Arquitetura:** monorepo simples com 2 pacotes: `api` (backend) e `ui` (frontend), orquestrados pelo `package.json` raiz.

### 1.1 Stack e versões (conforme `package.json`)

**Raiz (`TCC/package.json`)**
| Campo | Valor |
|---|---|
| name | `tcc-casa-aconchego` |
| scripts | `install:all`, `dev:api`, `dev:ui`, `build`, `start` |

**Backend (`TCC/api/package.json`)** — `"type": "module"` (ESM)
| Dependência | Versão |
|---|---|
| express | ^5.2.1 |
| cors | ^2.8.6 |
| dotenv | ^17.4.2 |
| mongodb | ^7.5.0 |
| mongoose | ^9.9.2 |
| nodemon (dev) | ^3.1.14 |
| scripts | `dev` → `nodemon src/server.js`; `start` → `node src/server.js` |

**Frontend (`TCC/ui/package.json`)** — `"type": "module"`
| Dependência | Versão |
|---|---|
| react | ^19.2.8 |
| react-dom | ^19.2.8 |
| vite (dev) | ^5.4.19 |
| @vitejs/plugin-react (dev) | ^4.3.4 |
| eslint (dev) | ^10.8.0 |
| eslint-plugin-react-hooks (dev) | ^7.1.1 |
| eslint-plugin-react-refresh (dev) | ^0.5.3 |
| @eslint/js (dev) | ^10.0.1 |
| globals (dev) | ^17.7.0 |
| @types/react / @types/react-dom (dev) | ^19.2.x |
| scripts | `dev`, `build`, `lint`, `preview` |

**Banco de dados:** MongoDB Atlas (servidor remoto), acessado via Mongoose na URI definida pelo `.env`.

**Notas de stack:** não há TypeScript, JWT, bcrypt, Redux, Context API global, react-router, axios ou biblioteca de UI. Autenticação é lógica manual por email/CPF (sem hash de senha) e o "roteamento" de telas é feito por `useState` no `App.jsx`.

---

## 2. ESTRUTURA DE PASTAS

```
TCC/
├─ package.json / package-lock.json      # orquestrador raiz (scripts dev:api, dev:ui, build, start)
├─ .gitignore                            # ignora node_modules, dist, *.env
├─ api/                                  # BACKEND — API REST Node/Express
│  ├─ package.json
│  ├─ .env                               # define variáveis de ambiente (NOMES na seção 3.5)
│  ├─ src/
│  │  ├─ server.js                       # bootstrap: express, middlewares, montagem de rotas, conexão mongo
│  │  ├─ seed.js                         # cria/atualiza 12 produtos iniciais no banco
│  │  ├─ controllers/                    # lógica das rotas (CRUD básico por recurso)
│  │  ├─ models/                         # schemas Mongoose por entidade
│  │  ├─ routes/                         # Roteadores Express (definem método + path + controller)
│  │  └─ database/
│  │     └─ connection.js                # função connectDatabase — NÃO utilizada pelo server.js
│  └─ node_modules/                      # ignorado no git
└─ ui/                                   # FRONTEND — SPA React (Vite)
   ├─ package.json / vite.config.js / eslint.config.js / index.html / README.md
   ├─ public/
   │  ├─ favicon.svg, icons.svg
   │  └─ images/produtos/*.jpg           # ~30 imagens dos produtos
   └─ src/
      ├─ main.jsx                        # entrypoint React (createRoot + <App/>)
      ├─ App.jsx                         # estado global + roteamento por useState
      ├─ App.css / index.css             # estilos (index.css = 1171 linhas, principal)
      ├─ constants.js                    # PERFIS, TIPOS, CATEGORIAS, PRODUTOS_FALLBACK, formatarPreco
      ├─ assets/                         # hero.png, react.svg, vite.svg
      ├─ services/
      │  └─ api.js                       # cliente HTTP (fetch) + mensagens de erro amigáveis
      └─ components/                     # telas e componentes de UI
```

### 2.1 Papel das pastas relevantes do backend

| Pasta | Papel |
|---|---|
| `api/src/controllers/` | Funções que recebem `req/res` e executam CRUD via Mongoose; uma por recurso (usuarios, gerentes, administradores, produtos, pedidos). |
| `api/src/models/` | Definições de schema Mongoose (1 arquivo por coleção). |
| `api/src/routes/` | Roteadores Express que ligam método+path a um controller. |
| `api/src/database/` | Contém `connection.js` (helper de conexão) — **existe mas não é importado em lugar nenhum** (o `server.js` conecta direto). |
| `api/src/seed.js` | Popula o banco com 12 produtos se a coleção estiver vazia; também atualiza `fotos`/`foto` de produtos existentes. |

---

## 3. BACKEND (`TCC/api`)

### 3.1 `controllers/` (5 arquivos)

| Arquivo | Funções exportadas |
|---|---|
| `usuarioController.js` | `listarUsuarios`, `buscarUsuarioPorId`, `criarUsuario`, `loginUsuario`, `atualizarUsuario`, `deletarUsuario` |
| `gerenteController.js` | `listarGerentes`, `buscarGerentePorId`, `criarGerente`, `atualizarGerente`, `deletarGerente` |
| `AdministradorController.js` | `listarAdministradores`, `criarAdministrador`, `obterAdministrador`, `atualizarAdministrador`, `deletarAdministrador` |
| `produtoController.js` | `listarProdutos`, `buscarProdutoPorId`, `criarProduto`, `atualizarProduto`, `deletarProduto` |
| `pedidoController.js` | `listarPedidos` (sorted by createdAt desc), `buscarPedidoPorId`, `criarPedido`, `atualizarStatusPedido`, `deletarPedido` |

Comportamentos relevantes:
- `criarUsuario` valida email único **por perfil** (`Usuario.findOne({ email, perfil })`) → 409 se existir; retorna 201 sem `senha`.
- `loginUsuario`: `perfil` opcional no filtro; se perfil corporativo (`gerente`/`administrador`) valida **CPF** (remove máscara), senão valida `senha`; nunca devolve `senha` na resposta. **Não usa hash nem token.**
- `criarPedido` valida `cliente.nome/email` e ≥1 item; `atualizarStatusPedido` só aceita `pendente | entregue | cancelado`.
- Mudanças feitas nesta sessão: `Transportador*` removido, substituído por `Administrador*`; `criarUsuario`/`loginUsuario` passaram a considerar o campo `perfil`.

### 3.2 `models/` (5 arquivos) — schemas Mongoose

**`usuarios.js` → coleção `usuarios`**
| Campo | Tipo | Observações |
|---|---|---|
| nome | String | required |
| email | String | required |
| senha | String | required |
| telefone | String | default `""` |
| cpf | String | default `""` |
| perfil | String | default `"usuario"` |
| timestamps | — | `createdAt` / `updatedAt` |
| **índice** | — | `usuarioSchema.index({ email: 1, perfil: 1 }, { unique: true })` — email único POR perfil |

**`gerente.js` → coleção `gerentes`**
| Campo | Tipo | Observações |
|---|---|---|
| nome | String | required |
| email | String | required, unique (global nesta coleção) |
| senha | String | required |
| cpf | String | default `""` |
| cargo | String | default `"Gerente"` |
| timestamps | — | — |

**`Administrador.js` → coleção `administradores`**
| Campo | Tipo | Observações |
|---|---|---|
| nome | String | required |
| email | String | required, unique |
| senha | String | required |
| cpf | String | required |
| telefone | String | opcional |
| cargo | String | default `"Administrador Master"` |
| status | String | default `"Ativo"` |
| timestamps | — | — |

**`produto.js` → coleção `produtos`**
| Campo | Tipo | Observações |
|---|---|---|
| nome | String | required |
| descricao | String | default `""` |
| tipo | String | required (categorias: Sofás, Camas, Mesas, Armários, Escritório, Decor) |
| preco | Number | required |
| foto | String | default `""` |
| fotos | [String] | default `[]` |
| estoque | Number | default `0` |
| publicado | Boolean | default `true` |
| timestamps | — | — |

**`pedido.js` → coleção `pedidos`**
| Campo | Tipo | Observações |
|---|---|---|
| cliente.nome | String | required |
| cliente.email | String | required |
| itens[].produto | String | required |
| itens[].preco | Number | required |
| itens[].qtd | Number | required, min 1 |
| total | Number | required |
| status | String | enum `pendente/entregue/cancelado`, default `pendente` |
| timestamps | — | — |

### 3.3 `routes/` (5 arquivos) — métodos, paths e controllers

Todos os routers são montados no `server.js` com prefixo `/api`. **Nenhuma rota exige autenticação** (não há middleware de auth em nenhum roteador).

**`usuarioRoutes.js` → prefixo `/api/usuarios`**
| Método | Path | Controller | Auth |
|---|---|---|---|
| GET | `/api/usuarios` | `listarUsuarios` | — (sem auth) |
| GET | `/api/usuarios/:id` | `buscarUsuarioPorId` | — |
| POST | `/api/usuarios` | `criarUsuario` | — |
| POST | `/api/usuarios/login` | `loginUsuario` | — |
| PUT | `/api/usuarios/:id` | `atualizarUsuario` | — |
| DELETE | `/api/usuarios/:id` | `deletarUsuario` | — |

**`gerenteRoutes.js` → prefixo `/api/gerentes`**
| Método | Path | Controller | Auth |
|---|---|---|---|
| GET | `/api/gerentes` | `listarGerentes` | — |
| GET | `/api/gerentes/:id` | `buscarGerentePorId` | — |
| POST | `/api/gerentes` | `criarGerente` | — |
| PUT | `/api/gerentes/:id` | `atualizarGerente` | — |
| DELETE | `/api/gerentes/:id` | `deletarGerente` | — |

**`AdministradorRoutes.js` → prefixo `/api/administradores`**
| Método | Path | Controller | Auth |
|---|---|---|---|
| GET | `/api/administradores` | `listarAdministradores` | — |
| POST | `/api/administradores` | `criarAdministrador` | — |
| GET | `/api/administradores/:id` | `obterAdministrador` | — |
| PUT | `/api/administradores/:id` | `atualizarAdministrador` | — |
| DELETE | `/api/administradores/:id` | `deletarAdministrador` | — |

**`produtoRoutes.js` → prefixo `/api/produtos`**
| Método | Path | Controller | Auth |
|---|---|---|---|
| GET | `/api/produtos` | `listarProdutos` | — |
| GET | `/api/produtos/:id` | `buscarProdutoPorId` | — |
| POST | `/api/produtos` | `criarProduto` | — |
| PUT | `/api/produtos/:id` | `atualizarProduto` | — |
| DELETE | `/api/produtos/:id` | `deletarProduto` | — |

**`pedidoRoutes.js` → prefixo `/api/pedidos`**
| Método | Path | Controller | Auth |
|---|---|---|---|
| GET | `/api/pedidos` | `listarPedidos` | — |
| GET | `/api/pedidos/:id` | `buscarPedidoPorId` | — |
| POST | `/api/pedidos` | `criarPedido` | — |
| PUT | `/api/pedidos/:id` | `atualizarStatusPedido` | — |
| DELETE | `/api/pedidos/:id` | `deletarPedido` | — |

### 3.4 `server.js` — conteúdo relevante

- **Importações:** `express`, `cors`, `mongoose`, `dotenv`, `path`, `fileURLToPath`, os 5 roteadores, `seedProdutos` e o model `Usuario`.
- **Middlewares globais:** `cors()` e `express.json()`.
- **Rotas montadas:** `/api/usuarios`, `/api/gerentes`, `/api/administradores`, `/api/produtos`, `/api/pedidos`.
- **Estático/SPA:** serve o build do frontend em `../../ui/dist` e, para qualquer `GET` que não comece com `/api`, devolve `index.html` (suporte a SPA no servidor Express).
- **Porta:** `process.env.PORT || 3000`.
- **Conexão com o banco:** `mongoose.connect(MONGO_URI)`; no `.then()` executa `Usuario.syncIndexes()` e `seedProdutos()` e então inicia o servidor. No `.catch()` loga o erro e **mesmo assim inicia** o servidor em "modo demonstração" (o site abre, mas nada é salvo).
- **Aviso de URI de exemplo:** se `MONGO_URI` contém `TROQUE` ou `SUBSTITUA`, imprime um `console.warn` orientando a editar o `.env`.

### 3.5 Variáveis de ambiente (`api/.env`)

**Somente os NOMES das chaves (nenhum valor é reproduzido):**

| Variável | Uso |
|---|---|
| `MONGO_URI` | String de conexão do MongoDB Atlas (usada no `mongoose.connect`) |

Também é lida de `process.env` (com fallback no código, mas **não definida** no `.env`): `PORT` (fallback 3000).

> O `.env` existe em `api/.env` e está ignorado pelo `.gitignore` (`*.env`). Nenhum segredo é descrito aqui.

---

## 4. FRONTEND (`TCC/ui`)

### 4.1 Arquitetura

- **Entrypoint:** `src/main.jsx` → `createRoot(...).render(<StrictMode><App/></StrictMode>)`.
- **Roteamento:** manual via `useState('view')` no `App.jsx` (`login`, `loja`, `produto`, `carrinho`, `gerente`, `administrador`) — **não há react-router**.
- **Estado global:** `useState`/`useEffect` centralizados no `App.jsx`, passados por props. **Não há Context API nem Redux.** Persistência local do carrinho em `localStorage` (chave `"tccCarrinho"`) via efeito `useEffect(() => salvarState("tccCarrinho", carrinho), [carrinho])`.
- **Suporte offline/demonstração:** se `fetchProdutos()` falha, carrega `PRODUTOS_FALLBACK` (12 produtos em `constants.js`) e marca `offline=true`, exibindo avisos nas telas.

### 4.2 Telas/componentes (`src/components/`)

| Arquivo | O que faz |
|---|---|
| `LoginScreen.jsx` | Login e cadastro por perfil (Usuário/Gerente/Administrador via `.tabs-perfil`). No modo login, para perfil `usuario` exige email+senha; para corporativo email+CPF. Mostra erro com `mensagemClaraDeErro`. |
| `LojaScreen.jsx` | Vitrine: lista produtos publicados, filtro por categoria (`CATEGORIAS` + "Todos") e busca por nome; aviso de modo demonstração quando offline; badge hero com nº de produtos. |
| `ProdutoScreen.jsx` | Detalhe do produto com galeria de miniaturas (`fotos[]`), preço, estoque, botões "Comprar agora" e "Adicionar ao carrinho". |
| `CarrinhoScreen.jsx` | Lista do carrinho, alterar quantidade, remover item, total, "Finalizar compra" → `api.criarPedido(...)`; exibe erro com `.aviso-erro`. |
| `GerenteScreen.jsx` | Painel do Gerente com 2 abas: **Produtos** (cadastrar/editar/publicar/excluir usando `onSalvar/onExcluir/onAlternar`) e **Vendas** (lista pedidos, marcar entregue, excluir). |
| `AdministradorScreen.jsx` | Painel Master: cards de stats (faturamento, pedidos, entregues, pendentes, gerentes, sistemas integrados) e 3 abas — **Dados financeiros** (lista pedidos), **Contas de gerentes** (criar via `api.criarGerente`, excluir via `api.deletarGerente`), **Configurações e integrações** (toggles em memória via `useState`, sem persistência). |
| `TrocarContaModal.jsx` | Modal para trocar de conta sem deslogar (perfil + email + CPF/senha), usa `api.login`. |
| `Header.jsx` | Cabeçalho: marca, saudação com nome+perfil, botões cart (com badge), "Trocar conta" e "Sair". |
| `Footer.jsx` | Rodapé simples com marca e ano. |
| `ProductCard.jsx` | Card do produto na vitrine (imagem, tipo, nome, preço, estoque, botão adicionar). |
| `FotoProduto.jsx` | Exibe imagem com fallback (placeholder 🛋️) quando não há foto ou a imagem falha (`onError`). |

Outros: `src/constants.js` (PERFIS com `label` e `campos`, `TIPOS`, `CATEGORIAS`, `PRODUTOS_FALLBACK`, `formatarPreco`), `src/services/api.js` (cliente HTTP).

### 4.3 Comunicação com o backend

- **Cliente:** `fetch` nativo (sem axios), centralizado em `src/services/api.js`.
- **Base URL:** `const API_URL = "/api"` (relativa). Em desenvolvimento o Vite usa **proxy**: `server.proxy['/api'] → http://localhost:3000` (`vite.config.js`). Em produção o próprio Express serve o build.
- **Timeout:** 12 s via `AbortController`.
- **Tratamento de erro amigável:** `mensagemClaraDeErro(erro, contexto)` + `MENSAGENS_POR_STATUS` (400/401/403/404/409/500).

**Endpoints consumidos pelo frontend (`services/api.js`):**
| Função | Endpoint |
|---|---|
| `fetchProdutos` | GET `/api/produtos` |
| `createProduto` | POST `/api/produtos` |
| `updateProduto` | PUT `/api/produtos/:id` |
| `deleteProduto` | DELETE `/api/produtos/:id` |
| `login` | POST `/api/usuarios/login` |
| `cadastro` | POST `/api/usuarios` |
| `listarPedidos` | GET `/api/pedidos` |
| `criarPedido` | POST `/api/pedidos` |
| `atualizarStatusPedido` | PUT `/api/pedidos/:id` |
| `excluirPedido` | DELETE `/api/pedidos/:id` |
| `listarGerentes` | GET `/api/gerentes` |
| `criarGerente` | POST `/api/gerentes` |
| `deletarGerente` | DELETE `/api/gerentes/:id` |

**Importante:** NÃO existem funções no `services/api.js` para o CRUD de administradores (`/api/administradores`) — a rota existe no backend, mas o frontend nunca a chama.

### 4.4 Gerenciamento de estado

- `App.jsx`: `view`, `perfil`, `modo`, `campos`, `usuarioLogado`, `produtos`, `offline`, `carregandoProdutos`, `carrinho` (hydrated de `localStorage`), `produtoSelecionado`, `toast`, `trocarAberto`.
- Demais telas usam `useState`/`useEffect` locais (ex.: `aba`, `form`, `pedidos`, `erro`, `carregando`).
- **Sem Context/Redux/Zustand.** Navegação por condicional `{view === "..." && <Screen/>}`.

### 4.5 Estilos

- `index.css` (1171 linhas) contém toda a estilização (inclui classes `cards-stats`, `tabs-gerente`, `form-produto`, `linha-produto`, `badge-*`, `aviso-erro`, `toast`, `modal-*`, etc.).
- `App.css` (184 linhas) — conteúdo básico do template Vite.
- Fonte de dados visuais: `public/images/produtos/*.jpg` (~30 imagens).

---

## 5. FLUXO ATUAL

### 5.1 Funcionando de ponta a ponta

1. **Cadastro/Login** → `POST /api/usuarios` / `POST /api/usuarios/login`. Perfis `usuario` (email+senha), `gerente` e `administrador` (email+CPF) são persistidos na coleção `usuarios` com o campo `perfil`. Unicidade de email passa a ser por perfil (índice `{email, perfil}`).
   - **Atenção:** o login corporativo busca na coleção `usuarios`; datas de login funcionam apenas para contas criadas pelo cadastro do site. Contas criadas na coleção `gerentes` (via Painel Master) **não conseguem logar** — ver seção 6.
2. **Exibição da loja** → `GET /api/produtos` (seed garante 12 produtos). Filtro por categoria e busca por nome no frontend (client-side).
3. **Carrinho** → estado em `localStorage`; checkout chama `POST /api/pedidos` com cliente + itens + total; pedido ganha `status: "pendente"`.
4. **Painel do Gerente** → CRUD completo em `api/produtos` (criar/editar/publicar/excluir) e gestão de vendas (`GET/PUT/DELETE /api/pedidos`). Mudanças refletem na loja após `recarregarProdutos()`.
5. **Painel Master (Administrador)** → lista financeira (pedidos), criação/exclusão de gerentes (`POST/DELETE /api/gerentes`) e toggles de configurações/integrações (apenas na sessão).
6. **Modo demonstração** → se o backend/bd falha, a loja roda com `PRODUTOS_FALLBACK` e `offline=true` (avisos visuais; carrinho conclui localmente sem salvar).

### 5.2 Pela metade / ainda não conectado

- **CRUD de Administradores (`/api/administradores`) não consumido pelo frontend** — rota existe no backend, mas nenhum trecho do `ui` chama `api.criarAdministrador`/`listarAdministradores` etc.
- **Duplicidade de modelos de conta:** cadastro/login do site usam a coleção `usuarios` (campo `perfil`), enquanto existem coleções dedicadas `gerentes` e `administradores` (model + controller + rotas). As contas criadas pelo Painel Master na coleção `gerentes` **não passam** pelo `loginUsuario` (que consulta só `usuarios`), então não entram no site.
- **`database/connection.js` não utilizado** — o `server.js` conecta via `mongoose.connect(MONGO_URI)` direto.
- **Configurações/integrações do AdministradorScreen são só estado local** (sem persistência nem endpoint).
- **Sem autorização/roles:** toda rota é livre; a tela certa é escolhida apenas por `usuario.perfil` retornado do backend.
- **Senhas em texto puro** no banco (sem hash); segurança básica.

---

## 6. PENDÊNCIAS E PRÓXIMOS PASSOS

### 6.1 Markers de código (TODO/FIXME/etc.)

- **Não há** nenhum `TODO`, `FIXME`, `XXX` ou `HACK` no código-fonte (`api/src` e `ui/src`). A única ocorrência de busca foi um falso positivo dentro do `package-lock.json` (hash de integridade).
- Existe um `console.warn` em `server.js:43-48` alertando se `MONGO_URI` ainda contém host de exemplo (`TROQUE`/`SUBSTITUA`) — atualmente o `.env` já está preenchido (chave `MONGO_URI` definida; valor não reproduzido aqui).

### 6.2 Conhecidos / incompletos

1. **Login de gerentes criados pelo Painel Master não funciona** (coleções diferentes — ver 5.2). Decidir se o login passa a consultar também `gerentes` (e `administradores`) ou se todos os perfis passam a ser criados só em `usuarios`.
2. **Rotas sem autenticação/autorização**: qualquer cliente HTTP pode criar/editar/excluir produtos, pedidos, gerentes e administradores. Recomenda-se introduzir token (JWT) e middleware de proteção (a cópia aninhada contém exemplos `authMiddleware.js`/`validacao.js` que podem servir de referência).
3. **Senhas armazenadas sem hash** — implementar hash (ex.: `bcryptjs`) no cadastro e comparar no login.
4. **`administradores` não integrado ao frontend** — decidir se a tela Master passa a usar o CRUD `/api/administradores` ou se esse recurso será removido.
5. **Configurações/integrações do Master não persistem** — não há modelo nem endpoint; hoje vivem em `useState` do `AdministradorScreen`.
6. **`database/connection.js` órfão** — ou é removido, ou passa a ser usado (e o `server.js` continuaria chamando `process.exit(1)` ao falhar, o que mudaria o comportamento atual de "modo demonstração").
7. **Visualização de produtos sem estoque / checkout sem validação de estoque** — `criarPedido` não verifica `estoque` nem o decrementa.
8. **ProdutoScreen "Comprar agora"** adiciona ao carrinho e navega — é só um atalho, sem compra direta.
9. **Sem testes automatizados** (`__tests__` e `*.test.*` não encontrados). Não há suíte configurada em nenhum `package.json`.
10. **README do frontend é o template padrão do Vite** (`ui/README.md` não descreve o projeto).
11. **Cópia aninhada `TCC-PASTA-CORRETA/TCC`** contém uma versão diferente do backend (com `authController`, `middleware`, model/routes `Transportador`) que aparece como **untracked** no git — risco de confusão/commits acidentais; recomenda-se limpar ou ignorar explicitamente.
12. **Arquivos obsoletos removidos nesta sessão:** `TransportadorController.js`, `Transportador.js`, `TransportadorRoutes.js` (api), `EntregadorScreen.jsx` (ui) — confirmar que nenhum outro arquivo ainda referencia esses nomes (busca atual: nenhuma ocorrência em `*.js/*.jsx`).
13. **Build `ui/dist` rastreado no git** (aparece nas mudanças do `git status`) — embora `.gitignore` tenha sido criado com `dist/`, os arquivos antigos ainda estão no índice do git.

---

## 7. RESUMO EXECUTIVO

- Projeto "Casa Aconchego": SPA React (Vite) + API Express (ESM) + MongoDB Atlas, com 3 perfis de usuário e painéis de Gerente e Administrador (Master).
- O fluxo compra/venda/gestão funciona de ponta a ponta contra o backend real; há fallback offline para a vitrine.
- Principais lacunas: ausência de autenticação/autorização e hash de senha, login de gerentes criados pelo Master, CRUD de administradores sem uso no frontend, configurações do Master sem persistência e nenhum teste automatizado.
- Localização real diverge do enunciado: não há `TCC-SENAI-PROJETO`/`frontend` no disco; o projeto é `TCC-PASTA-CORRETA/TCC` com `api` + `ui`.