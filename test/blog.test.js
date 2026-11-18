import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { criarApp } from "../app.js";
import { slugify, repositorioArquivo, repositorioMongo } from "../posts.js";

test("slugify remove acentos e espaços", () => {
  assert.equal(slugify("Olá, Mundo do Node.js!"), "ola-mundo-do-node-js");
});

// Os mesmos testes rodam com as duas formas de armazenamento.
function suite(nome, preparar, limpar) {
  describe(nome, () => {
    let servidor, base;

    before(async () => {
      const app = criarApp(await preparar());
      await new Promise((ok) => (servidor = app.listen(0, ok)));
      base = `http://127.0.0.1:${servidor.address().port}`;
    });
    after(async () => {
      servidor.close();
      await limpar();
    });

    const publicar = (titulo, conteudo) =>
      fetch(`${base}/publicar`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ titulo, conteudo }),
        redirect: "manual",
      });

    test("publica, lista com resumo e abre o post pelo slug", async () => {
      const r = await publicar("Meu primeiro artigo", "Conteúdo ".repeat(40));
      assert.equal(r.status, 302);
      assert.equal(r.headers.get("location"), "/posts/meu-primeiro-artigo");

      const home = await (await fetch(base)).text();
      assert.match(home, /Meu primeiro artigo/);
      assert.match(home, /\.\.\./);
      assert.match(home, /Leia mais/);
      assert.equal((await fetch(`${base}/posts/meu-primeiro-artigo`)).status, 200);
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
  });
}

let pasta;
suite(
  "armazenamento em arquivo",
  async () => {
    pasta = fs.mkdtempSync(path.join(os.tmpdir(), "blog-"));
    return repositorioArquivo(path.join(pasta, "posts.json"));
  },
  async () => fs.rmSync(pasta, { recursive: true, force: true })
);

let mongo;
suite(
  "armazenamento no MongoDB",
  async () => {
    mongo = await MongoMemoryServer.create();
    return repositorioMongo(mongo.getUri());
  },
  async () => {
    await mongoose.disconnect();
    await mongo.stop();
  }
);
