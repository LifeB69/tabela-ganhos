// Issues no GitHub pela API REST, com GITHUB_TOKEN. Sem token (rodando local), só imprime.
// Não duplica: se já há issue ABERTA com o mesmo título e o rótulo do robô, não abre outra.
import { USER_AGENT, REPO_PADRAO, ROTULO_ISSUE } from './config.js';

const API = 'https://api.github.com';

function cabecalhos(token) {
  return {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'user-agent': USER_AGENT,
  };
}

/** Abre as issues que ainda não existem. Devolve [{ titulo, situacao: 'aberta' | 'ja_existia' | 'impressa' | 'erro', url?, erro? }]. */
export async function abrirIssues(lista, { token = null, repo = REPO_PADRAO, log = console.log } = {}) {
  const saida = [];
  if (!lista.length) return saida;
  if (!token) {
    for (const i of lista) {
      log(`[issue não aberta: sem GITHUB_TOKEN] ${i.titulo}\n${i.corpo}\n`);
      saida.push({ titulo: i.titulo, situacao: 'impressa', corpo: i.corpo });
    }
    return saida;
  }
  let abertas = [];
  try {
    const res = await fetch(`${API}/repos/${repo}/issues?state=open&labels=${encodeURIComponent(ROTULO_ISSUE)}&per_page=100`, { headers: cabecalhos(token), signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    abertas = (await res.json()).filter((i) => !i.pull_request).map((i) => i.title);
  } catch (e) {
    // Sem a lista não dá para garantir que não duplica: não abre nada nesta rodada.
    for (const i of lista) saida.push({ titulo: i.titulo, situacao: 'erro', erro: `não consegui listar as issues: ${e.message}` });
    return saida;
  }
  const vistos = new Set();
  for (const i of lista) {
    if (abertas.includes(i.titulo) || vistos.has(i.titulo)) { saida.push({ titulo: i.titulo, situacao: 'ja_existia' }); continue; }
    vistos.add(i.titulo);
    try {
      const corpo = `${i.corpo}\n\n---\nAberta pelo robô de valores (robo/, docs/ROBO.md). Feche quando resolver.`;
      const res = await fetch(`${API}/repos/${repo}/issues`, {
        method: 'POST',
        headers: { ...cabecalhos(token), 'content-type': 'application/json' },
        body: JSON.stringify({ title: i.titulo, body: corpo, labels: [ROTULO_ISSUE] }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      saida.push({ titulo: i.titulo, situacao: 'aberta', url: j.html_url });
    } catch (e) {
      saida.push({ titulo: i.titulo, situacao: 'erro', erro: e.message });
    }
  }
  return saida;
}
