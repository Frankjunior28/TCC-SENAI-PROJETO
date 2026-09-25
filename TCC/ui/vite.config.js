/**
 * ============================================================================
 *  UI  →  vite.config.js — CONFIGURAÇÃO DO VITE (servidor de desenvolvimento)
 * ============================================================================
 *  O QUE ESTE ARQUIVO FAZ:
 *    • `plugins: [react()]` → habilita o plugin do React (JSX + Fast Refresh,
 *      que recarrega o componente salvo sem perder o estado da página).
 *
 *    • `server.proxy["/api"] → http://localhost:3000` → PROXY do dev server:
 *      em desenvolvimento o site roda em http://localhost:5173 (Vite) e a API
 *      em http://localhost:3000 (Express). Como a UI chama caminhos RELATIVOS
 *      ("/api/..."), o Vite repassa essas requisições para a porta 3000 —
 *      assim não dispara erro de CORS e o mesmo endereço serve em dev e prod.
 *
 *  OBS.: em PRODUÇÃO (`npm run build`) o Express serve o build (ui/dist) e a
 *    API na MESMA porta, então o proxy não é necessário.
 * ============================================================================
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /api/* → encaminha para a API Express rodando na porta 3000
      '/api': 'http://localhost:3000',
    },
  },
})
