// Armazenamento dos posts: MongoDB (produção/Vercel) ou arquivo JSON (desenvolvimento local).
// As duas implementações têm a mesma interface assíncrona: listar, buscar, criar.
import fs from "node:fs";
import path from "node:path";

export const slugify = (texto) =>
  texto
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function slugLivre(titulo, existe) {
  const base = slugify(titulo) || "post";
  let slug = base;
  for (let n = 2; await existe(slug); n++) slug = `${base}-${n}`;
  return slug;
}

export function repositorioArquivo(arquivo) {
  let posts = [];
  if (arquivo && fs.existsSync(arquivo)) posts = JSON.parse(fs.readFileSync(arquivo, "utf-8"));
  const salvar = () => {
    if (!arquivo) return;
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
    fs.writeFileSync(arquivo, JSON.stringify(posts, null, 2));
  };
  return {
    listar: async () => [...posts].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    buscar: async (slug) => posts.find((p) => p.slug === slug),
    async criar({ titulo, conteudo }) {
      const slug = await slugLivre(titulo, async (s) => posts.some((p) => p.slug === s));
      const post = { slug, titulo: titulo.trim(), conteudo: conteudo.trim(), criadoEm: new Date().toISOString() };
      posts.push(post);
      salvar();
      return post;
    },
  };
}

export async function repositorioMongo(uri) {
  const mongoose = (await import("mongoose")).default;
  // Reaproveita a conexão entre execuções da função serverless.
  globalThis.__blogConexao ??= mongoose.connect(uri);
  await globalThis.__blogConexao;

  const Post =
    mongoose.models.Post ||
    mongoose.model("Post", new mongoose.Schema({
      slug: { type: String, required: true, unique: true },
      titulo: { type: String, required: true },
      conteudo: { type: String, required: true },
      criadoEm: { type: String, required: true },
    }));

  return {
    listar: () => Post.find({}, "-_id -__v").sort({ criadoEm: -1 }).lean(),
    buscar: (slug) => Post.findOne({ slug }, "-_id -__v").lean(),
    async criar({ titulo, conteudo }) {
      const slug = await slugLivre(titulo, (s) => Post.exists({ slug: s }));
      const post = { slug, titulo: titulo.trim(), conteudo: conteudo.trim(), criadoEm: new Date().toISOString() };
      await Post.create(post);
      return post;
    },
  };
}
