/**
 * ============================================================================
 *  UI  →  main.jsx — PONTO DE ENTRADA DO REACT
 * ============================================================================
 *  COMO FUNCIONA:
 *    1. O index.html carrega este arquivo (<script type="module" src="/src/main.jsx">);
 *    2. `createRoot(document.getElementById("root"))` pega a <div id="root">
 *       do index.html e diz "aqui dentro o React vai renderizar";
 *    3. `.render(<StrictMode><App/></StrictMode>)` desenha o App na tela.
 *
 *    • <StrictMode> é uma ferramenta de DESENVOLVIMENTO: roda efeitos duas
 *      vezes para revelar problemas (em produção não tem efeito).
 *    • Todos os estilos globais vêm de `./index.css`.
 *    • A partir daqui, a árvore inteira é App.jsx (estado + telas).
 * ============================================================================
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Monta a SPA dentro da div #root do index.html
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
