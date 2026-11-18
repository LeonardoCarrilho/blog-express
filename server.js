import { criarApp } from "./app.js";
import { criarRepositorio } from "./repositorio.js";

const porta = process.env.PORT || 3000;
criarApp(await criarRepositorio()).listen(porta, () => console.log(`Blog rodando em http://localhost:${porta}`));
