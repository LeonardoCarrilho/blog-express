import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { criarApp } from "../app.js";
import { slugify } from "../posts.js";

let servidor, base, pasta;

before(async () => {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), "blog-"));
  const app = criarApp({ arquivo: path.join(pasta, "posts.json") });
  await new Promise((ok) => (servidor = app.listen(0, ok)));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
after(() => {
  servidor.close();
  fs.rmSync(pasta, { recursive: true, force: true });
});

const publicar = (titulo, conteudo) =>
  fetch(`${base}/publicar`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ titulo, conteudo }),
    redirect: "manual",
  });

test("slugify remove acentos e espaços", () => {
  assert.equal(slugify("Olá, Mundo do Node.js!"), "ola-mundo-do-node-js");
});

test("publica, lista com resumo e abre o post pelo slug", async () => {
  const texto = "Conteúdo ".repeat(40);
  const r = await publicar("Meu primeiro artigo", texto);
  assert.equal(r.status, 302);
  assert.equal(r.headers.get("location"), "/posts/meu-primeiro-artigo");

  const home = await (await fetch(base)).text();
  assert.match(home, /Meu primeiro artigo/);
  assert.match(home, /\.\.\./);
  assert.match(home, /Leia mais/);

  const post = await fetch(`${base}/posts/meu-primeiro-artigo`);
  assert.equal(post.status, 200);
});

test("títulos repetidos geram slugs diferentes", async () => {
  await publicar("Repetido", "conteúdo suficiente aqui");
  const r = await publicar("Repetido", "conteúdo suficiente aqui");
  assert.equal(r.headers.get("location"), "/posts/repetido-2");
});

test("valida dados e escapa HTML", async () => {
  assert.equal((await publicar("a", "b")).status, 400);
  const r = await publicar("<script>x</script>", "conteúdo com <b>tags</b>");
  const html = await (await fetch(base + r.headers.get("location"))).text();
  assert.doesNotMatch(html, /<script>x<\/script>/);
});

test("404 para post inexistente", async () => {
  assert.equal((await fetch(`${base}/posts/nao-existe`)).status, 404);
});
