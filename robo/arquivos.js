// Leitura e escrita de dados/parametros-auto.js e robo/estado.json (escrita atômica: temporário + rename).
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const CAMINHO_AUTO = 'dados/parametros-auto.js';
export const CAMINHO_ESTADO = 'robo/estado.json';

const CABECALHO = `// Gerado pelo robô (robo/robo.js). NÃO edite à mão: o robô reescreve este arquivo.
// Só entram aqui valores conferidos em fonte oficial ('vigente') ou projeções marcadas 'previsto'
// (que não entram na conta). dados/parametros.js mescla estas vigências nas escritas à mão.
// Para desligar o robô, veja docs/ROBO.md.
`;

export function autoVazio() {
  return { formato: 1, gerado_em: null, gerado_em_brasilia: null, vigencias: {} };
}

/** Lê o arquivo do robô. Lança erro se existir mas estiver ilegível (o robô então não grava nada). */
export function lerAuto(raiz) {
  const arq = join(raiz, CAMINHO_AUTO);
  if (!existsSync(arq)) return autoVazio();
  const txt = readFileSync(arq, 'utf8');
  const m = /export\s+default\s+(\{[\s\S]*\})\s*;?\s*$/.exec(txt);
  if (!m) throw new Error(`${CAMINHO_AUTO} não tem "export default {...}"`);
  const obj = JSON.parse(m[1]);
  if (!obj || typeof obj !== 'object' || typeof obj.vigencias !== 'object' || obj.vigencias === null) throw new Error(`${CAMINHO_AUTO} sem "vigencias"`);
  return obj;
}

export function textoAuto(auto) {
  return `${CABECALHO}export default ${JSON.stringify(auto, null, 2)};\n`;
}

function gravarAtomico(arq, conteudo) {
  const tmp = `${arq}.tmp-${process.pid}`;
  writeFileSync(tmp, conteudo);
  renameSync(tmp, arq);
}

export function gravarAuto(raiz, auto) {
  gravarAtomico(join(raiz, CAMINHO_AUTO), textoAuto(auto));
}

export function estadoVazio() {
  return { formato: 1, ultima_execucao: null, ultimo_batimento: null, fontes: {}, valores: {}, erros: [] };
}

export function lerEstado(raiz) {
  const arq = join(raiz, CAMINHO_ESTADO);
  if (!existsSync(arq)) return estadoVazio();
  try {
    const e = JSON.parse(readFileSync(arq, 'utf8'));
    return { ...estadoVazio(), ...e, fontes: e.fontes || {}, valores: e.valores || {} };
  } catch {
    return estadoVazio();   // estado é só memória: corrompido, recomeça (não toca nos valores)
  }
}

export function gravarEstado(raiz, estado) {
  gravarAtomico(join(raiz, CAMINHO_ESTADO), `${JSON.stringify(estado, null, 2)}\n`);
}

/** Parte do estado que justifica um commit (sem hora de execução nem erros passageiros). */
export function parteRelevante(estado) {
  const fontes = {};
  for (const [k, v] of Object.entries(estado.fontes || {})) if (v && v.hash) fontes[k] = { hash: v.hash, status: v.status };
  return JSON.stringify({ fontes, valores: estado.valores || {}, ultimo_batimento: estado.ultimo_batimento || null });
}
