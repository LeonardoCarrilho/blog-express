import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { criarRepositorio } from "./posts.js";

const raiz = path.dirname(fileURLToPath(import.meta.url));

export function criarApp({ arquivo = path.join(raiz, "data", "posts.json") } = {}) {
  const repo = criarRepositorio(arquivo);
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(raiz, "views"));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(raiz, "public")));

  app.locals.resumo = (texto, limite = 160) =>
    texto.length > limite ? texto.slice(0, limite).trimEnd() + "..." : texto;
  app.locals.data = (iso) => new Date(iso).toLocaleDateString("pt-BR", { dateStyle: "long" });

  app.get("/", (req, res) => res.render("home", { titulo: "Início", posts: repo.listar() }));
  app.get("/sobre", (req, res) => res.render("sobre", { titulo: "Sobre" }));
  app.get("/contato", (req, res) => res.render("contato", { titulo: "Contato" }));

  app.get("/publicar", (req, res) => res.render("publicar", { titulo: "Publicar", erro: null, valores: {} }));
  app.post("/publicar", (req, res) => {
    const titulo = (req.body.titulo || "").trim();
    const conteudo = (req.body.conteudo || "").trim();
    if (titulo.length < 3 || conteudo.length < 10) {
      return res.status(400).render("publicar", {
        titulo: "Publicar",
        erro: "O título precisa de pelo menos 3 caracteres e o conteúdo de pelo menos 10.",
        valores: { titulo, conteudo },
      });
    }
    const post = repo.criar({ titulo, conteudo });
    res.redirect(`/posts/${post.slug}`);
  });

  // Parâmetro de rota: /posts/:slug
  app.get("/posts/:slug", (req, res) => {
    const post = repo.buscar(req.params.slug);
    if (!post) return res.status(404).render("404", { titulo: "Não encontrado" });
    res.render("post", { titulo: post.titulo, post });
  });

  app.use((req, res) => res.status(404).render("404", { titulo: "Não encontrado" }));
  return app;
}
