/**
 * ============================================================================
 *  UI  →  App.jsx — CORAÇÃO DO FRONTEND (estado global + "roteamento")
 * ============================================================================
 *  O QUE É ESTE ARQUIVO:
 *    O componente raiz da SPA. Guarda TODO o estado da aplicação (usuário
 *    logado, produtos, carrinho, tela atual) e decide QUAL TELA renderizar.
 *
 *  ROTEAMENTO SEM react-router:
 *    A navegação é feita com o estado `view` (um texto) e blocos condicionais
 *    no JSX ({view === "loja" && <LojaScreen/>}). Telas possíveis:
 *      "login"         → LoginScreen
 *      "loja"          → LojaScreen         (vitrine)
 *      "produto"       → ProdutoScreen      (detalhe do produto)
 *      "carrinho"      → CarrinhoScreen     (checkout)
 *      "gerente"       → GerenteScreen      (painel do gerente)
 *      "administrador" → AdministradorScreen (painel Master)
 *    Quem escolhe a tela é o PERFIL devolvido pelo login (ver `entrar`).
 *
 *  FLUXO DE LOGIN/CADASTRO:
 *    LoginScreen → aoLogin/aoCadastro → services/api.js → POST /api/usuarios[/login]
 *    → backend salva NA COLEÇÃO DO PERFIL (usuarios/gerentes/administradores)
 *    → devolve o usuário (com `perfil`) → `entrar()` abre a tela certa.
 *
 *  ESTADOS PRINCIPAIS (useState):
 *    view, perfil (aba de perfil do login), modo (login/cadastro), campos,
 *    usuarioLogado, produtos, offline, carregandoProdutos, carrinho,
 *    produtoSelecionado, toast, trocarAberto e açãoAposLogin.
 *
 *  ACESSO E PERSISTÊNCIA:
 *    • visitantes navegam; carrinho e compra exigem uma conta;
 *    • cada conta/perfil possui uma chave própria "tccCarrinho:perfil:id";
 *    • produtos → MongoDB (via API); se a API falhar, cai em PRODUTOS_FALLBACK
 *      e liga `offline` = true (modo demonstração).
 * ============================================================================
 */
import { useEffect, useState, useCallback } from "react";
import * as api from "./services/api";
import { PRODUTOS_FALLBACK, PERFIS, MSG_ESTOQUE } from "./constants";
import { LoginScreen } from "./components/LoginScreen";
import { LojaScreen } from "./components/LojaScreen";
import { ProdutoScreen } from "./components/ProdutoScreen";
import { CarrinhoScreen } from "./components/CarrinhoScreen";
import { GerenteScreen } from "./components/GerenteScreen";
import { AdministradorScreen } from "./components/AdministradorScreen";
import { TrocarContaModal } from "./components/TrocarContaModal";

/** Lê algo salvo no localStorage (se der erro ou não existir, devolve o padrão). */
const carregarState = (chave, padrao) => {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : padrao;
  } catch {
    return padrao;
  }
};

/** Guarda algo no localStorage (serializado em JSON). */
const salvarState = (chave, valor) => localStorage.setItem(chave, JSON.stringify(valor));

/** Cada conta/perfil possui um carrinho próprio, evitando mistura entre sessões. */
const chaveCarrinho = (usuario) => `tccCarrinho:${usuario.perfil}:${usuario._id}`;

/** Garante a mesma foto principal nos cards, no detalhe, no carrinho e nos painéis. */
const normalizarProduto = (produto) => {
  const fotos = Array.isArray(produto.fotos) ? produto.fotos.filter(Boolean) : [];
  return {
    ...produto,
    id: produto.id || produto._id,
    fotos,
    foto: fotos[0] || produto.foto || "",
  };
};

function App() {
  // ---------------- navegação e autenticação ----------------
  const [view, setView] = useState("loja"); // tela atual (rota); começa como visitante
  const [perfil, setPerfil] = useState("usuario"); // aba de perfil no login
  const [modo, setModo] = useState("login"); // "login" ou "cadastro"
  const [campos, setCampos] = useState({}); // valores digitados no formulário
  const [usuarioLogado, setUsuarioLogado] = useState(null); // conta ativa

  // ---------------- produtos ----------------
  const [produtos, setProdutos] = useState([]); // vitrine (MongoDB ou fallback)
  const [offline, setOffline] = useState(false); // true = API/banco indisponível
  const [carregandoProdutos, setCarregandoProdutos] = useState(true); // estado de loading

  // ---------------- carrinho e UI ----------------
  const [carrinho, setCarrinho] = useState([]); // só é hidratado após entrar em uma conta
  const [produtoSelecionado, setProdutoSelecionado] = useState(null); // produto aberto
  const [toast, setToast] = useState(""); // mensagem flutuante temporária
  const [trocarAberto, setTrocarAberto] = useState(false); // modal de trocar conta
  const [acaoAposLogin, setAcaoAposLogin] = useState(null); // ação protegida retomada após autenticar

  /** Mostra um toast some sozinho depois de 2,2s. */
  const mostrarToast = useCallback((msg) => {
    setToast(msg);
  }, []);

  // Auto-limpa o toast após 2,2 segundos
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Carrega os produtos na primeira renderização (GET /api/produtos).
  // Se falhar → usa PRODUTOS_FALLBACK e liga o modo demonstração (offline).
  useEffect(() => {
    api
      .fetchProdutos()
      .then((dados) => {
        // A API devolve `_id` (MongoDB); o frontend usa `id` — copiamos
        setProdutos(dados.map(normalizarProduto));
      })
      .catch(() => {
        setProdutos(PRODUTOS_FALLBACK); // vitrine de demonstração
        setOffline(true); // avisa as telas que o banco está fora
      })
      .finally(() => setCarregandoProdutos(false));
  }, []); // [] = roda só uma vez, ao montar

  // O carrinho só é persistido para uma conta autenticada e nunca é global.
  useEffect(() => {
    if (usuarioLogado) salvarState(chaveCarrinho(usuarioLogado), carrinho);
  }, [carrinho, usuarioLogado]);

  /** Pede os produtos de novo (usado após criar/editar/excluir no painel). */
  const recarregarProdutos = async () => {
    try {
      const dados = await api.fetchProdutos();
      setProdutos(dados.map(normalizarProduto));
    } catch {
      /* mantém estado atual */
    }
  };

  /** Atualiza o estado `campos` a cada tecla digitada nos formulários. */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCampos((prev) => ({ ...prev, [name]: value }));
  };

  /** Troca a aba de perfil do login (Usuário / Gerente / Administrador). */
  const mudarPerfil = (tipo) => {
    setPerfil(tipo);
    setCampos({});
  };

  /** Abre a autenticação; uma ação protegida pode ser retomada depois do login. */
  const abrirLogin = (acao = null) => {
    setAcaoAposLogin(acao);
    setView("login");
  };

  /** Cancela a autenticação e mantém a navegação de visitante na vitrine. */
  const voltarParaLoja = () => {
    setAcaoAposLogin(null);
    setView("loja");
  };

  /**
   * Quantas unidades ainda podem ser adicionadas de um produto.
   * Se o produto não existir mais no catálogo, devolve 0 (não dá para
   * comprar o que saiu da loja). Caso contrário, devolve o estoque
   * disponível menos o que já está no carrinho.
   */
  const limiteDeEstoque = (produto, itensAtuais = carrinho) => {
    const disponivel = Number(produto?.estoque) || 0;
    const noCarrinho = itensAtuais
      .filter((item) => String(item.id) === String(produto.id))
      .reduce((soma, item) => soma + (Number(item.qtd) || 0), 0);
    return Math.max(0, disponivel - noCarrinho);
  };

  /**
   * Inclui/soma um item no carrinho, respeitando o limite de estoque.
   * @returns {boolean} true se o item entrou; false se foi bloqueado
   *
   * POR QUE A FUNÇÃO "RETORNA" ALGO:
   *   quem chama precisa saber se a ação aconteceu, para mostrar o aviso
   *   certo. Retornando um booleano, cada tela decide como avisar
   *   (o card mostra um toast, a tela de produto mostra um aviso, etc.)
   *   sem precisar repetir a regra de estoque.
   */
  const incluirNoCarrinho = (produto) => {
    if (!produto) return false;

    // Produto esgotado (ou com estoque 0) não entra no carrinho.
    if ((Number(produto.estoque) || 0) < 1) {
      mostrarToast(`${produto.nome} está sem estoque.`);
      return false;
    }

    // Já está no carrinho? Só soma se ainda houver estoque sobrando.
    const jaNoCarrinho = carrinho.some((item) => String(item.id) === String(produto.id));
    if (jaNoCarrinho && limiteDeEstoque(produto) < 1) {
      mostrarToast(`${MSG_ESTOQUE}: só há ${produto.estoque} unidade(s) em estoque.`);
      return false;
    }

    setCarrinho((prev) => {
      const existe = prev.find((item) => String(item.id) === String(produto.id));
      if (existe) {
        return prev.map((item) =>
          String(item.id) === String(produto.id) ? { ...item, qtd: item.qtd + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: produto.id,
          nome: produto.nome,
          preco: produto.preco,
          foto: produto.foto,
          fotos: produto.fotos || [],
          // Guarda o estoque junto para a tela do carrinho conseguir
          // avisar o limite sem precisar consultar o catálogo de novo.
          // (O carrinho também é salvo no localStorage, então esse dado
          //  sobrevive ao recarregar a página.)
          estoque: Number(produto.estoque) || 0,
          qtd: 1,
        },
      ];
    });
    return true;
  };

  /**
   * Ativa uma conta e carrega somente o carrinho dessa conta. Se o visitante
   * tentou uma ação protegida, ela é retomada depois da autenticação.
   */
  const entrar = (usuario) => {
    const acaoPendente = acaoAposLogin;
    setUsuarioLogado(usuario);
    setCarrinho(carregarState(chaveCarrinho(usuario), []));
    setCampos({});
    setAcaoAposLogin(null);

    const rotaPadrao =
      usuario.perfil === "gerente"
        ? "gerente"
        : usuario.perfil === "administrador"
          ? "administrador"
          : "loja";
    setView(rotaPadrao);

    if (acaoPendente?.produto && incluirNoCarrinho(acaoPendente.produto)) {
      // Só confirma se o item realmente entrou (estoque pode ter acabado).
      mostrarToast(`${acaoPendente.produto.nome} adicionado ao carrinho!`);
    }
    if (acaoPendente?.abrirCarrinho) setView("carrinho");
  };

  const aoLogin = async (credenciais) => {
    const usuario = await api.login(credenciais);
    entrar(usuario);
  };

  const aoCadastro = async (dados) => {
    const usuario = await api.cadastro({ ...dados, perfil });
    entrar({ ...usuario, perfil });
  };

  /** Troca para uma conta já existente no perfil escolhido. */
  const aoTrocarConta = async ({ perfil: perfilAlvo, email, senha }) => {
    const usuario = await api.login({ email, senha, perfil: perfilAlvo });
    setTrocarAberto(false);
    entrar(usuario);
    mostrarToast(`Conta alterada: ${PERFIS[usuario.perfil]?.label || usuario.perfil}`);
  };

  /** Cria uma conta independente no perfil escolhido dentro do modal de troca. */
  const aoCriarContaAlternativa = async (dados) => {
    const usuario = await api.cadastro(dados);
    setTrocarAberto(false);
    entrar({ ...usuario, perfil: dados.perfil });
    mostrarToast(`Conta de ${PERFIS[dados.perfil]?.label || dados.perfil} criada e ativada`);
  };

  /** Sair limpa somente a sessão em memória; o carrinho salvo da conta permanece. */
  const sair = () => {
    setUsuarioLogado(null);
    setCarrinho([]);
    setCampos({});
    setPerfil("usuario");
    setModo("login");
    setProdutoSelecionado(null);
    setAcaoAposLogin(null);
    setView("loja");
  };

  /** Adicionar/comprar exige uma conta; visitantes são levados ao login primeiro. */
  const adicionarCarrinho = (produto, abrirDepois = false) => {
    if (!usuarioLogado) {
      setModo("login");
      abrirLogin({ produto, abrirCarrinho: abrirDepois });
      mostrarToast("Entre ou crie uma conta para usar o carrinho.");
      return;
    }
    // incluirNoCarrinho devolve false quando o estoque impede a adição.
    // Nesse caso ele JÁ exibiu o aviso adequado, então aqui não se mostra
    // o "adicionado com sucesso" — nem seria correto, porque o item não
    // entrou, e o cliente receberia uma confirmação falsa.
    if (!incluirNoCarrinho(produto)) return;

    if (abrirDepois) setView("carrinho");
    mostrarToast(`${produto.nome} adicionado ao carrinho!`);
  };

  /** O ícone do carrinho também respeita o acesso de visitante. */
  const abrirCarrinho = () => {
    if (!usuarioLogado) {
      setModo("login");
      abrirLogin({ abrirCarrinho: true });
      mostrarToast("Entre ou crie uma conta para abrir o carrinho.");
      return;
    }
    setView("carrinho");
  };

  /** Gerentes e administradores retornam à área correspondente sem trocar a conta. */
  const voltarAoPainel = () => {
    if (usuarioLogado?.perfil === "gerente") setView("gerente");
    if (usuarioLogado?.perfil === "administrador") setView("administrador");
  };

  const irParaLoja = () => setView("loja");

  /**
   * SALVAR PRODUTO (painel do Gerente).
   * Sem `id` = cadastro novo (POST); com `id` = edição (PUT).
   * No modo offline, altera só o estado local (nada vai pro banco).
   */
  const aoSalvarProduto = async (dados, id) => {
    if (offline) {
      if (id) {
        setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, ...dados } : p)));
      } else {
        setProdutos((prev) => [...prev, { id: "local-" + Date.now(), ...dados }]);
      }
      return;
    }
    try {
      if (id) {
        await api.updateProduto(id, dados); // PUT /api/produtos/:id
      } else {
        await api.createProduto(dados); // POST /api/produtos
      }
      await recarregarProdutos(); // a vitrine reflete a mudança
    } catch (err) {
      alert(api.mensagemClaraDeErro(err, "salvar o produto"));
    }
  };

  /** EXCLUIR PRODUTO (painel do Gerente) → DELETE /api/produtos/:id. */
  const aoExcluirProduto = async (id) => {
    if (offline) {
      setProdutos((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    try {
      await api.deleteProduto(id);
      await recarregarProdutos();
    } catch (err) {
      alert(api.mensagemClaraDeErro(err, "excluir o produto"));
    }
  };

  /** Publicar/ocultar produto: só inverte o campo `publicado` (PUT). */
  const aoAlternarPublicacao = async (produto) => {
    const dados = { ...produto, publicado: !produto.publicado };
    delete dados.id;
    delete dados._id;
    delete dados.createdAt;
    delete dados.updatedAt;
    const id = produto.id;
    if (offline) {
      setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, ...dados } : p)));
      return;
    }
    try {
      await api.updateProduto(id, dados);
      await recarregarProdutos();
    } catch (err) {
      alert(api.mensagemClaraDeErro(err, "atualizar a publicação do produto"));
    }
  };

  return (
    <>
      {/* ---------- TELA 1: LOGIN / CADASTRO ---------- */}
      {view === "login" && (
        <LoginScreen
          perfil={perfil}
          modo={modo}
          campos={campos}
          handleChange={handleChange}
          mudarPerfil={mudarPerfil}
          setModo={setModo}
          aoLogin={aoLogin}
          aoCadastro={aoCadastro}
          onVoltarLoja={voltarParaLoja}
        />
      )}

      {/* ---------- TELA 2: VITRINE DA LOJA ---------- */}
      {view === "loja" && (
        <LojaScreen
          usuario={usuarioLogado}
          produtos={produtos}
          carrinho={carrinho}
          offline={offline}
          carregando={carregandoProdutos}
          onAbrirProduto={(p) => {
            setProdutoSelecionado(p);
            setView("produto");
          }}
          onAbrirCarrinho={abrirCarrinho}
          onAdicionarCarrinho={adicionarCarrinho}
          onEntrar={() => abrirLogin()}
          onVoltarPainel={voltarAoPainel}
          onIrParaLoja={irParaLoja}
          onSair={sair}
          onTrocarConta={() => setTrocarAberto(true)}
        />
      )}

      {/* ---------- TELA 3: DETALHE DO PRODUTO ---------- */}
      {view === "produto" && (
        <ProdutoScreen
          usuario={usuarioLogado}
          produto={produtoSelecionado}
          onComprar={() => adicionarCarrinho(produtoSelecionado, true)}
          onAdicionar={() => adicionarCarrinho(produtoSelecionado)}
          onVoltar={irParaLoja}
          onEntrar={() => abrirLogin()}
          onVoltarPainel={voltarAoPainel}
          onSair={sair}
          onTrocarConta={() => setTrocarAberto(true)}
        />
      )}

      {/* ---------- TELA 4: CARRINHO / CHECKOUT ---------- */}
      {view === "carrinho" && usuarioLogado && (
        <CarrinhoScreen
          usuario={usuarioLogado}
          carrinho={carrinho}
          setCarrinho={setCarrinho}
          // O carrinho recebe a lista de produtos ATUALIZADA para conferir
          // o estoque de hoje. Sem isso, ele se basearia apenas no valor
          // salvo no localStorage — que pode estar velho se outro cliente
          // comprou, ou se o gerente reponheu/deu baixa no estoque.
          produtos={produtos}
          // Depois de um pedido criado, recarrega o catálogo para refletir
          // o estoque que o servidor baixou.
          onPedidoCriado={recarregarProdutos}
          onVoltar={irParaLoja}
          onVoltarPainel={voltarAoPainel}
          onSair={sair}
          onTrocarConta={() => setTrocarAberto(true)}
          offline={offline}
        />
      )}

      {/* ---------- TELA 5: PAINEL DO GERENTE ---------- */}
      {view === "gerente" && usuarioLogado?.perfil === "gerente" && (
        <GerenteScreen
          usuario={usuarioLogado}
          produtos={produtos}
          onSalvar={aoSalvarProduto}
          onExcluir={aoExcluirProduto}
          onAlternar={aoAlternarPublicacao}
          onVerLoja={irParaLoja}
          onSair={sair}
          offline={offline}
          onTrocarConta={() => setTrocarAberto(true)}
        />
      )}

      {/* ---------- TELA 6: PAINEL MASTER (ADMINISTRADOR) ---------- */}
      {view === "administrador" && usuarioLogado?.perfil === "administrador" && (
        <AdministradorScreen
          usuario={usuarioLogado}
          onVerLoja={irParaLoja}
          onSair={sair}
          onTrocarConta={() => setTrocarAberto(true)}
        />
      )}

      {/* ---------- MODAL de trocar de conta (abre sobre qualquer tela) ---------- */}
      {trocarAberto && (
        <TrocarContaModal
          usuarioAtual={usuarioLogado}
          aoTrocar={aoTrocarConta}
          aoCriar={aoCriarContaAlternativa}
          aoFechar={() => setTrocarAberto(false)}
        />
      )}

      {/* ---------- Toast de confirmação ---------- */}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

export default App;
