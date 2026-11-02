// Scripts and the worker run outside Next.js: let them import modules marked "server-only".
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(
      "export async function resolve(s, c, n) { if (s === 'server-only') return { url: 'data:text/javascript,', shortCircuit: true }; return n(s, c); }",
    ),
);
