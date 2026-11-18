// Armazenamento simples dos posts em um arquivo JSON.
import fs from "node:fs";
import path from "node:path";

export const slugify = (texto) =>
  texto
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function criarRepositorio(arquivo) {
  let posts = [];
  if (arquivo && fs.existsSync(arquivo)) posts = JSON.parse(fs.readFileSync(arquivo, "utf-8"));

  const salvar = () => {
    if (!arquivo) return;
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
    fs.writeFileSync(arquivo, JSON.stringify(posts, null, 2));
  };

  return {
    listar: () => [...posts].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    buscar: (slug) => posts.find((p) => p.slug === slug),
    criar({ titulo, conteudo }) {
      const base = slugify(titulo) || "post";
      let slug = base;
      for (let n = 2; posts.some((p) => p.slug === slug); n++) slug = `${base}-${n}`;
      const post = { slug, titulo: titulo.trim(), conteudo: conteudo.trim(), criadoEm: new Date().toISOString() };
      posts.push(post);
      salvar();
      return post;
    },
  };
}
