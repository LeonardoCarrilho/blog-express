// Ponto de entrada na Vercel: todas as rotas são reescritas para esta função (veja vercel.json).
import { criarApp } from "../app.js";
import { criarRepositorio } from "../repositorio.js";

const app = criarApp(await criarRepositorio());
export default app;
