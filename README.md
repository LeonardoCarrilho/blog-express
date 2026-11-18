# 📝 Diário do Dev — Blog com Express

Blog pessoal renderizado no servidor com **Node.js, Express, EJS e MongoDB**.

## Funcionalidades
- Páginas Início, Sobre, Contato e Publicar com layout compartilhado (partials do EJS)
- Publicação de artigos com validação no servidor
- URL amigável para cada artigo com **parâmetros de rota** (`/posts/:slug`), sem acentos e sem repetição
- Resumo dos artigos na página inicial com link "Leia mais"
- Artigos salvos no MongoDB (`MONGODB_URI`) ou, sem configuração, em `data/posts.json`
- Página 404 e HTML escapado contra XSS
- Testes de integração com `node:test` (`npm test`)

## Como rodar
```bash
npm install
npm start
```
Acesse http://localhost:3000

Projeto do módulo 34 do curso Full Stack Turbo (TipsCode).
