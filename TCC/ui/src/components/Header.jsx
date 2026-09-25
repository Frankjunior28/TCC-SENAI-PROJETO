/**
 * ============================================================================
 *  UI  →  Header.jsx — CABEÇALHO COMPARTILHADO DE TODAS AS TELAS
 * ============================================================================
 *  O QUE ESTE COMPONENTE FAZ:
 *    • Marca da loja (logo + nome Casa Aconchego);
 *    • Saudação "Olá, {nome} · {perfil}" — pega nome e perfil do usuário
 *      logado (o `perfil` veio do backend conforme a coleção de onde a
 *      conta foi lida: usuario/gerente/administrador);
 *    • Ações (recebidas via props, cada tela liga o que precisa):
 *        onCarrinho + itensCarrinho → botão 🛒 com badge de quantidade
 *                                      (só na LojaScreen);
 *        extra                      → botão extra (ex.: "🏪 Ver loja" do painel);
 *        onTrocarConta              → botão 🔁 Trocar conta (abre o modal);
 *        onSair                     → botão Sair (volta para o login).
 *
 *  PROPS: usuario, onCarrinho, itensCarrinho, extra, onSair, onTrocarConta.
 * ============================================================================
 */
import { PERFIS } from "../constants";

export function Header({
  usuario,
  onCarrinho,
  itensCarrinho = 0,
  extra,
  onEntrar,
  onVoltarPainel,
  onIrParaLoja,
  onSair,
  onTrocarConta,
}) {
  return (
    <header className="cabecalho">
      <div className="cabecalho-inner">
        {/* Marca (não recarrega a página) */}
        <a className="brand" href="#top" onClick={(e) => { e.preventDefault(); onIrParaLoja?.(); }}>
          <img className="brand-logo" src="/favicon.svg" alt="Casa Aconchego" />
          <span className="brand-nome">
            Casa <span>Aconchego</span>
          </span>
        </a>

        {/* Saudação com nome + rótulo do perfil */}
        <div className="cabecalho-info">
          {usuario ? (
            <span className="saudacao">
              Olá, <strong>{usuario.nome}</strong> · {PERFIS[usuario.perfil]?.label || "Cliente"}
            </span>
          ) : (
            <span className="saudacao visitante">Navegando como visitante</span>
          )}
          {extra}
        </div>

        {/* Botões de ação */}
        <div className="cabecalho-acoes">
          {onCarrinho && (
            <button type="button" onClick={onCarrinho} className="btn btn-primario">
              Carrinho
              {itensCarrinho > 0 && <span className="badge-carrinho">{itensCarrinho}</span>}
            </button>
          )}
          {!usuario && onEntrar && (
            <button type="button" onClick={onEntrar} className="btn btn-primario">
              Entrar
            </button>
          )}
          {usuario && ["gerente", "administrador"].includes(usuario.perfil) && onVoltarPainel && (
            <button type="button" onClick={onVoltarPainel} className="btn btn-escuro">
              Voltar ao painel
            </button>
          )}
          {usuario && onTrocarConta && (
            <button type="button" onClick={onTrocarConta} className="btn btn-secundario" title="Entrar em outra conta (Usuário, Gerente ou Administrador)">
              Trocar conta
            </button>
          )}
          {usuario && onSair && (
            <button type="button" onClick={onSair} className="btn btn-secundario">
              Sair
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
