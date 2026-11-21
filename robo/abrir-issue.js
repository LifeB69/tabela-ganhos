#!/usr/bin/env node
// Abre uma issue com o rótulo do robô (sem duplicar). Uso: node robo/abrir-issue.js "título" "texto"
// Usado pelo workflow quando os testes falham ou o robô quebra. Sem GITHUB_TOKEN, só imprime.
import { abrirIssues } from './issues.js';
import { REPO_PADRAO } from './config.js';

const [titulo, corpo = ''] = process.argv.slice(2);
if (!titulo) { console.error('Uso: node robo/abrir-issue.js "título" "texto"'); process.exit(2); }
const r = await abrirIssues([{ titulo, corpo }], { token: process.env.GITHUB_TOKEN || null, repo: process.env.GITHUB_REPOSITORY || REPO_PADRAO });
console.log(JSON.stringify(r));
