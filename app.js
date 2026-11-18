import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.dirname(fileURLToPath(import.meta.url));

// repo: objeto com listar/buscar/criar (veja posts.js)
export function criarApp(repo) {
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(raiz, "views"));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(raiz, "public")));

  app.locals.resumo = (texto, limite = 160) =>
    texto.length > limite ? texto.slice(0, limite).trimEnd() + "..." : texto;
  app.locals.data = (iso) => new Date(iso).toLocaleDateString("pt-BR", { dateStyle: "long" });

  const rota = (fn) => (req, res, next) => fn(req, res, next).catch(next);

  app.get("/", rota(async (req, res) => res.render("home", { titulo: "Início", posts: await repo.listar() })));
  app.get("/sobre", (req, res) => res.render("sobre", { titulo: "Sobre" }));
  app.get("/contato", (req, res) => res.render("contato", { titulo: "Contato" }));

  app.get("/publicar", (req, res) => res.render("publicar", { titulo: "Publicar", erro: null, valores: {} }));
  app.post("/publicar", rota(async (req, res) => {
    const titulo = (req.body.titulo || "").trim();
    const conteudo = (req.body.conteudo || "").trim();
    if (titulo.length < 3 || conteudo.length < 10 || titulo.length > 150 || conteudo.length > 20000) {
      return res.status(400).render("publicar", {
        titulo: "Publicar",
        erro: "O título precisa ter de 3 a 150 caracteres e o conteúdo de 10 a 20.000.",
        valores: { titulo, conteudo },
      });
    }
    const post = await repo.criar({ titulo, conteudo });
    res.redirect(`/posts/${post.slug}`);
  }));

  // Parâmetro de rota: /posts/:slug
  app.get("/posts/:slug", rota(async (req, res) => {
    const post = await repo.buscar(req.params.slug);
    if (!post) return res.status(404).render("404", { titulo: "Não encontrado" });
    res.render("post", { titulo: post.titulo, post });
  }));

  app.use((req, res) => res.status(404).render("404", { titulo: "Não encontrado" }));
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send("Erro interno. Tente novamente.");
  });
  return app;
}
