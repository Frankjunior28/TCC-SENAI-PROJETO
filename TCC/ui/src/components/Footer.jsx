export function Footer() {
  return (
    <footer className="rodape">
      <div className="rodape-inner">
        <div>
          <span className="rodape-marca">CASA ACONCHEGO</span>
          <p>Móveis escolhidos para transformar espaços em histórias.</p>
        </div>
        <span className="rodape-copy">© {new Date().getFullYear()} · Todos os direitos reservados</span>
      </div>
    </footer>
  );
}
