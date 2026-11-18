import path from "node:path";
import { fileURLToPath } from "node:url";
import { repositorioArquivo, repositorioMongo } from "./posts.js";

const raiz = path.dirname(fileURLToPath(import.meta.url));

// Com MONGODB_URI usa o MongoDB; sem ela, salva em data/posts.json.
export const criarRepositorio = () =>
  process.env.MONGODB_URI
    ? repositorioMongo(process.env.MONGODB_URI)
    : Promise.resolve(repositorioArquivo(path.join(raiz, "data", "posts.json")));
