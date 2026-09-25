/**
 * ============================================================================
 *  UI  →  eslint.config.js — CONFIGURAÇÃO DO ESLINT (padrões de código)
 * ============================================================================
 *  O QUE ESTE ARQUIVO FAZ:
 *    Configura o `npm run lint` (analisador estático) do frontend:
 *      • globalIgnores(['dist'])      → ignora a pasta de build;
 *      • files: js/jsx                → aplica as regras a todo .js/.jsx;
 *      • js.configs.recommended       → regras básicas da linguagem
 *                                        (undef, ==, etc.);
 *      • reactHooks.configs...        → regras dos hooks do React
 *                                        (ex.: useEffect precisa de deps);
 *      • reactRefresh.configs.vite    → só um componente exportado por arquivo
 *                                        (necessário para o Fast Refresh);
 *      • languageOptions.globals      → variáveis globais de navegador
 *                                        (window, document, localStorage...).
 *
 *  NÃO tem relação com o funcionamento da loja — é qualidade de código.
 * ============================================================================
 */
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']), // não linta o build
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended, // regras JS recomendadas
      reactHooks.configs.flat.recommended, // regras de hooks (React)
      reactRefresh.configs.vite, // regras do Fast Refresh no Vite
    ],
    languageOptions: {
      globals: globals.browser, // window, document, localStorage...
      parserOptions: { ecmaFeatures: { jsx: true } }, // permite JSX
    },
  },
])
