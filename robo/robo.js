#!/usr/bin/env node
// Robô de valores da Tabela de Ganhos. Explicação em português simples: docs/ROBO.md.
//
//   node robo/robo.js                 roda de verdade: lê as fontes, grava dados/parametros-auto.js e robo/estado.json,
//                                     abre issues (se houver GITHUB_TOKEN; sem ele, só imprime)
//   node robo/robo.js --seco          lê as fontes reais e mostra o que faria, sem gravar nada nem abrir issue
//   node robo/robo.js --fixtures DIR  usa respostas gravadas (DIR/rotas.json) em vez da rede
//   node robo/robo.js --simular       = --fixtures testes/fixtures/robo/hoje --seco
//   --hoje AAAA-MM-DD                 finge outra data (para testes)
//   --raiz DIR                        grava em outra pasta (para testes)
//
// Regra do não sei: nada entra na conta sem confirmação em fonte oficial. Na dúvida, abre issue e não aplica.
import { appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PARAMETROS_MANUAIS, FONTES, mesclarAuto, vigenciaAutoValida, problemasAuto } from '../dados/parametros.js';
import {
  URLS, AUMENTO_MAXIMO_PCT, PIB_REAL_PCT, GANHO_REAL_LIMITES_PCT, ALIQUOTAS_INSS, DIAS_BATIMENTO, REPO_PADRAO,
} from './config.js';
import { criarBuscadorRede, criarBuscadorFixtures } from './rede.js';
import { resumoNormalizado, sha256 } from './texto.js';
import { urlQuadro, acharDecretoMinimo, lerDecretoMinimo, urlMinuscula, urlOficialPlanalto } from './fontes/planalto.js';
import { lerSerieMinimo, lerSerieMinimoMeses, lerInpc } from './fontes/series.js';
import { lerTabelaInss, checarTabelaInss, lerSalarioFamilia } from './fontes/inss.js';
import { decidirMinimo, projetarMinimo, derivarMeiDas, derivarAutonomo, iguais, brl } from './regras.js';
import { lerAuto, gravarAuto, lerEstado, gravarEstado, parteRelevante } from './arquivos.js';
import { abrirIssues } from './issues.js';

const RAIZ_PADRAO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Status HTTP que contam como "o conteúdo da página é este" numa fonte vigiada: 2xx (texto) e
 * 404/410 (a página não existe). Qualquer outro (0, 401, 403, 408, 429, 451, 5xx...) é recusa ou
 * falha passageira: vira erro e não mexe no hash, para não abrir issue nem fazer commit falso.
 */
export function respostaConta(r) {
  return !!r && ((r.status >= 200 && r.status < 300 && r.ok) || r.status === 404 || r.status === 410);
}

const ehDaSerieBcb = (v) => !!v && v.origem === 'robo' && /^https:\/\/api\.bcb\.gov\.br\//.test(v.fonte_url || '');

/** Data de hoje em Brasília (AAAA-MM-DD). */
export function hojeBrasilia(agora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
}

/**
 * Fontes só vigiadas: se o texto mudar, abre issue com o link. Não aplica nada.
 * As páginas do IRRF levam o ano na chave (irrf_2026, irrf_2027): na virada do ano a chave do ano
 * novo já tem o hash de quando era "ano seguinte", e a do ano depois começa do zero, sem issue falsa.
 */
export function listaVigias(ano) {
  return [
    { chave: `irrf_${ano}`, rotulo: `IRRF: tabelas de ${ano} (Receita Federal)`, url: URLS.irrfAno(ano) },
    { chave: `irrf_${ano + 1}`, rotulo: `IRRF: página das tabelas de ${ano + 1} (Receita Federal)`, url: URLS.irrfAno(ano + 1) },
    { chave: 'irrf_indice', rotulo: 'IRRF: índice de tabelas (Receita Federal)', url: URLS.irrfIndice },
    { chave: 'piso_SP', rotulo: 'Piso estadual de SP', url: FONTES.pisoSP },
    { chave: 'piso_RS', rotulo: 'Piso estadual do RS', url: FONTES.pisoRS },
    { chave: 'piso_SC', rotulo: 'Piso estadual de SC', url: FONTES.pisoSC },
    { chave: 'piso_PR', rotulo: 'Piso estadual do PR', url: FONTES.pisoPR },
    { chave: 'piso_RJ', rotulo: 'Piso estadual do RJ', url: FONTES.pisoRJ },
  ];
}

function diasDesdeUltimoCommit(raiz, agora) {
  try {
    const t = Number(execFileSync('git', ['-C', raiz, 'log', '-1', '--format=%ct'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim());
    return Number.isFinite(t) && t > 0 ? Math.floor((agora.getTime() - t * 1000) / 86400000) : null;
  } catch {
    return null;
  }
}

/**
 * Uma rodada do robô. Não lança exceção por falha de fonte (registra e segue);
 * lança só se dados/parametros-auto.js estiver ilegível (aí não grava nada).
 */
export async function executar({
  raiz = RAIZ_PADRAO, hoje = null, agora = new Date(), seco = false, buscar = null, fixtures = null,
  token = null, repo = REPO_PADRAO, log = console.log, diasCommit = undefined,
} = {}) {
  hoje = hoje || hojeBrasilia(agora);
  buscar = buscar || (fixtures ? criarBuscadorFixtures(fixtures) : criarBuscadorRede({ log }));
  const ano = Number(hoje.slice(0, 4));
  const mes = Number(hoje.slice(5, 7));

  const autoAntes = lerAuto(raiz);   // lança se corrompido: melhor parar do que estragar
  const estadoAntes = lerEstado(raiz);
  const auto = JSON.parse(JSON.stringify(autoAntes));
  const estado = JSON.parse(JSON.stringify(estadoAntes));
  estado.erros = [];
  estado.valores = estado.valores || {};
  estado.fontes = estado.fontes || {};

  const rel = { hoje, seco, fontes: {}, aplicado: [], previsto: [], avisos: [], erros: [], issues: [], publicar: false, motivos: [] };
  const issues = [];
  const erro = (onde, msg) => { rel.erros.push(`${onde}: ${msg}`); estado.erros.push({ onde, erro: msg, em: hoje }); };
  const aviso = (msg) => rel.avisos.push(msg);
  const issue = (titulo, corpo) => issues.push({ titulo, corpo });
  const fonte = (chave, r, extra = {}) => {
    rel.fontes[chave] = { url: r.url, status: r.status, ok: r.ok, erro: r.erro || null, ...extra };
  };

  // ── Acesso aos parâmetros como o app os vê (manuais + robô) ──
  const params = () => mesclarAuto(PARAMETROS_MANUAIS, auto);
  const vigencias = (chave) => (params().find((p) => p.chave === chave) || { vigencias: [] }).vigencias;
  const oficialEm = (chave, desde) => vigencias(chave).find((v) => v.status === 'vigente' && v.vigente_desde === desde) || null;
  const oficialAntes = (chave, dataISO) => vigencias(chave).filter((v) => v.status === 'vigente' && v.vigente_desde < dataISO)
    .sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde))[0] || null;
  const oficialAte = (chave, dataISO) => vigencias(chave).filter((v) => v.status === 'vigente' && v.vigente_desde <= dataISO)
    .sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde))[0] || null;
  const autoDe = (chave, desde) => (auto.vigencias[chave] || []).find((v) => v.vigente_desde === desde) || null;
  /** Grava (ou troca) a vigência do robô de mesma data. Uma 'vigente' apaga a 'previsto' do robô de mesma data. */
  const gravar = (chave, vig) => {
    if (!vigenciaAutoValida(vig)) throw new Error(`vigência inválida para ${chave}`);
    const lista = (auto.vigencias[chave] || []).filter((v) => v.vigente_desde !== vig.vigente_desde);
    lista.push({ ...vig, conferido_pelo_robo_em: hoje });
    lista.sort((a, b) => a.vigente_desde.localeCompare(b.vigente_desde));
    auto.vigencias[chave] = lista;
  };
  /** Grava só se o valor ou a fonte mudaram (não reescreve à toa). */
  const gravarSeMudou = (chave, vig, rotulo) => {
    const atual = autoDe(chave, vig.vigente_desde);
    if (atual && atual.status === vig.status && iguais(atual.valor, vig.valor) && atual.fonte_url === vig.fonte_url && atual.lei === vig.lei) return false;
    gravar(chave, vig);
    (vig.status === 'vigente' ? rel.aplicado : rel.previsto).push(`${rotulo}: ${vig.vigente_desde} → ${JSON.stringify(vig.valor)}`);
    return true;
  };

  // ── 1. Salário mínimo: decreto (Planalto) + conferência na série 1619 do BCB ──
  try {
    const urlSerie = URLS.bcbMinimo(ano - 1, ano + 1);
    const rs = await buscar(urlSerie, { aceitar: 'application/json' });
    const serie = rs.ok ? lerSerieMinimo(rs.texto) : null;
    const meses = rs.ok ? lerSerieMinimoMeses(rs.texto) : null;
    fonte('bcb_sgs_1619', rs, { anos: serie });
    if (rs.ok && !serie) erro('bcb_sgs_1619', 'resposta em formato inesperado');
    else if (!rs.ok) erro('bcb_sgs_1619', rs.erro);
    if (serie) estado.valores.bcb_minimo = serie;

    // Conferência do que já está no app, MÊS A MÊS (o mínimo já mudou no meio do ano por MP:
    // fevereiro de 2020 e maio de 2023). Só confere anos em que o app já tem o mínimo de janeiro;
    // o ano novo sem mínimo no app é decidido abaixo. Não aplica nada sozinho: abre issue.
    for (const Y of [ano - 1, ano, ano + 1]) {
      const of = oficialEm('salario_minimo', `${Y}-01-01`);
      if (!of || !meses) continue;
      if (serie && serie[Y] != null && serie[Y] !== of.valor.mensal) {
        issue(`Robô: salário mínimo de ${Y} no app difere do Banco Central`,
          `O app usa ${brl(of.valor.mensal)} (${of.lei}) e a série 1619 do BCB (${urlSerie}) traz ${brl(serie[Y])}. Nada foi mudado. Confira.`);
      }
      const diferentes = [];
      for (let m = 2; m <= 12; m++) {
        const chaveMes = `${Y}-${String(m).padStart(2, '0')}`;
        if (meses[chaveMes] == null) continue;
        const noApp = oficialAte('salario_minimo', `${chaveMes}-01`);
        if (noApp && meses[chaveMes] !== noApp.valor.mensal) diferentes.push(`${chaveMes.slice(5)}/${Y}: BCB ${brl(meses[chaveMes])}, app ${brl(noApp.valor.mensal)}`);
      }
      if (diferentes.length) {
        issue(`Robô: salário mínimo mudou no meio de ${Y} (Banco Central)`,
          `A série 1619 do BCB (${urlSerie}) traz valor diferente do que o app usa nestes meses:\n- ${diferentes.join('\n- ')}\n\nPode ser medida provisória ou decreto com vigência fora de janeiro. O robô não aplica isso sozinho: confira o ato no Planalto e acrescente a vigência à mão em dados/parametros.js.`);
      }
    }

    // Alvos: ano sem mínimo oficial OU com mínimo que o robô aplicou só pela série do BCB (aí o
    // robô continua procurando o decreto, para trocar diário e horário pelos oficiais).
    const alvos = [];
    const precisaDecreto = (Y) => { const of = oficialEm('salario_minimo', `${Y}-01-01`); return !of || ehDaSerieBcb(of); };
    if (precisaDecreto(ano)) alvos.push(ano);
    if (mes >= 11 && precisaDecreto(ano + 1)) alvos.push(ano + 1);
    for (const Y of alvos) {
      const dec = await procurarDecreto(Y);
      const d = decidirMinimo({
        ano: Y, decreto: dec.lido ? dec : null, motivoDecreto: dec.motivo, valorSerie: serie ? serie[Y] ?? null : null,
        urlSerie, anterior: oficialAntes('salario_minimo', `${Y}-01-01`), aumentoMaximoPct: AUMENTO_MAXIMO_PCT,
      });
      rel.fontes[`minimo_${Y}`] = { decisao: d.acao, resumo: d.resumo, decreto_url: dec.url || null };
      if (d.acao === 'aplicar') {
        gravarSeMudou('salario_minimo', d.vigencia, `Salário mínimo de ${Y}`);
        estado.valores[`minimo_${Y}`] = { mensal: d.vigencia.valor.mensal, fonte: d.vigencia.fonte_url };
      } else if (d.acao === 'issue') issue(d.titulo, d.corpo);
      else aviso(`mínimo de ${Y}: ${d.resumo}`);
    }
  } catch (e) { erro('salario_minimo', e.message); }

  async function procurarDecreto(Y) {
    const motivos = [];
    for (const anoQuadro of [Y - 1, Y]) {
      if (anoQuadro > ano) continue;
      const url = urlQuadro(anoQuadro);
      const rq = await buscar(url);
      if (rq.ok && !urlOficialPlanalto(rq.url_final || url)) {
        fonte(`planalto_quadro_${anoQuadro}`, rq, { url_final: rq.url_final });
        motivos.push(`quadro de ${anoQuadro} redirecionou para fora do Planalto`);
        issue(`Robô: quadro de decretos de ${anoQuadro} redirecionou para fora do Planalto`, `Pedi ${url} e a resposta veio de ${rq.url_final}. Não usei nada dessa resposta.`);
        continue;
      }
      const achados = rq.ok ? acharDecretoMinimo(rq.texto, rq.url_final || url, Y) : [];
      fonte(`planalto_quadro_${anoQuadro}`, rq, { decretos_do_minimo: achados.map((a) => a.url) });
      if (!rq.ok) {
        motivos.push(`quadro de ${anoQuadro}: ${rq.erro}`);
        if (rq.status !== 404) erro(`planalto_quadro_${anoQuadro}`, rq.erro);   // 404 = quadro do ano ainda não existe
        continue;
      }
      if (!achados.length) { motivos.push(`quadro de ${anoQuadro} sem decreto do mínimo de ${Y}`); continue; }
      for (const a of achados) {
        if (!urlOficialPlanalto(a.url)) {
          motivos.push(`link do decreto fora do Planalto: ${a.url}`);
          issue(`Robô: link do decreto do mínimo de ${Y} aponta para fora do Planalto`, `O quadro ${url} tem o link ${a.url} (${a.ementa}). Só aceito texto de https://www.planalto.gov.br/ccivil_03/_ato…/. Nada aplicado.`);
          continue;
        }
        let rd = await buscar(a.url);
        if (!rd.ok && rd.status === 404) rd = await buscar(urlMinuscula(a.url));
        fonte(`planalto_decreto_${Y}`, rd, { url_final: rd.url_final });
        if (!rd.ok) { motivos.push(`decreto ${a.numero || a.url}: ${rd.erro}`); erro(`planalto_decreto_${Y}`, rd.erro); continue; }
        if (!urlOficialPlanalto(rd.url_final || rd.url)) {
          motivos.push(`decreto ${a.numero || a.url} redirecionou para fora do Planalto: ${rd.url_final}`);
          issue(`Robô: decreto do mínimo de ${Y} redirecionou para fora do Planalto`, `Pedi ${a.url} e a resposta veio de ${rd.url_final}. Não usei nada dessa resposta.`);
          continue;
        }
        const lido = lerDecretoMinimo(rd.texto);
        if (lido.ok && lido.vigente_desde.startsWith(String(Y))) return { lido, url: rd.url_final || a.url, numero: lido.numero || a.numero };
        motivos.push(`decreto ${a.numero || a.url}: ${lido.motivo || `vigência ${lido.vigente_desde}`}`);
        if (lido.mensal) issue(`Robô: não consegui ler direito o decreto do mínimo de ${Y}`, `Achei ${a.url} (${a.ementa}), mas: ${lido.motivo || `a vigência lida foi ${lido.vigente_desde}`}. Nada aplicado a partir do decreto.`);
      }
    }
    return { lido: null, motivo: motivos.join('; ') || 'não procurado' };
  }

  // ── 2. INSS do empregado (página do INSS) ──
  try {
    const r = await buscar(URLS.inss);
    if (!r.ok) { fonte('inss', r); erro('inss', r.erro); } else {
      const t = lerTabelaInss(r.texto);
      fonte('inss', r, { lido: t.ok ? { ano: t.ano, mes: t.mes, faixas: t.faixas, teto: t.teto, portaria: t.portaria } : null, motivo: t.motivo });
      estado.fontes.inss = { url: URLS.inss, hash: sha256(resumoNormalizado(r.texto)), status: r.status, lido_em: hoje };
      if (!t.ok) {
        issue('Robô: não consegui ler a tabela de contribuição do INSS', `Página: ${URLS.inss}\nMotivo: ${t.motivo}\nNada foi aplicado. A página pode ter mudado de formato.`);
      } else {
        estado.valores.inss = { ano: t.ano, teto: t.teto, faixas: t.faixas.map((f) => [f.ate, f.aliquota_pct]) };
        const desde = `${t.ano}-01-01`;
        const valor = { faixas: t.faixas.map((f) => ({ ate: f.ate, aliquota_pct: f.aliquota_pct })), teto: t.teto };
        const existente = oficialEm('inss_empregado', desde);
        const ultima = oficialAte('inss_empregado', `${ano + 1}-12-31`);
        if (existente) {
          if (!iguais(existente.valor, valor)) {
            issue(`Robô: tabela do INSS de ${t.ano} na página difere do app`, `A página ${URLS.inss} traz ${JSON.stringify(valor)}; o app usa ${JSON.stringify(existente.valor)} (${existente.lei}). Nada foi mudado.`);
          }
        } else if (ultima && desde < ultima.vigente_desde) {
          aviso(`página do INSS mostra ${t.ano}, mais antiga que a do app`);
        } else if (t.mes !== 1) {
          issue(`Robô: tabela do INSS com competência fora de janeiro (${t.mes}/${t.ano})`, `Página: ${URLS.inss}. Não apliquei: o robô só aplica tabela que vale desde janeiro.`);
        } else {
          const anterior = oficialAntes('inss_empregado', desde);
          const minimo = oficialEm('salario_minimo', desde);
          const problemas = checarTabelaInss(t, { anterior: anterior && anterior.valor, minimo: minimo ? minimo.valor.mensal : null, aliquotas: ALIQUOTAS_INSS, aumentoMaximoPct: AUMENTO_MAXIMO_PCT });
          if (anterior && iguais(anterior.valor, valor)) problemas.push('valores iguais aos do ano anterior');
          if (problemas.length === 1 && /ainda não foi aplicado/.test(problemas[0])) {
            aviso(`INSS de ${t.ano} publicado, esperando o mínimo oficial de ${t.ano} para conferir a 1ª faixa`);
          } else if (problemas.length) {
            issue(`Robô: tabela do INSS de ${t.ano} não passou nas checagens`, `Página: ${URLS.inss}\nLido: ${JSON.stringify(valor)}\n\nProblemas:\n- ${problemas.join('\n- ')}\n\nNada aplicado. Confira a portaria e, se estiver certa, atualize dados/parametros.js à mão.`);
          } else {
            gravarSeMudou('inss_empregado', {
              valor, vigente_desde: desde, vigente_ate: null, status: 'vigente', fonte_url: URLS.inss,
              lei: `${t.portaria || 'Portaria Interministerial MPS/MF'} (competência 01/${t.ano})`,
              observacao: `Tabela lida pelo robô na página do INSS: faixas até ${t.faixas.map((f) => brl(f.ate)).join(', ')}; alíquotas ${ALIQUOTAS_INSS.join('%, ')}%. Vale desde a competência janeiro de ${t.ano}.`,
            }, `INSS de ${t.ano}`);
          }
        }
      }
    }
  } catch (e) { erro('inss', e.message); }

  // ── 3. Salário-família (página do INSS) ──
  try {
    const r = await buscar(URLS.salarioFamilia);
    if (!r.ok) { fonte('salario_familia', r); erro('salario_familia', r.erro); } else {
      const s = lerSalarioFamilia(r.texto);
      fonte('salario_familia', r, { lido: s.ok ? { vigente_desde: s.vigente_desde, limite_remuneracao: s.limite_remuneracao, cota_por_filho: s.cota_por_filho, normativo: s.normativo } : null, motivo: s.motivo });
      estado.fontes.salario_familia = { url: URLS.salarioFamilia, hash: sha256(resumoNormalizado(r.texto)), status: r.status, lido_em: hoje };
      if (!s.ok) {
        issue('Robô: não consegui ler a página do salário-família', `Página: ${URLS.salarioFamilia}\nMotivo: ${s.motivo}\nNada foi aplicado.`);
      } else {
        estado.valores.salario_familia = { vigente_desde: s.vigente_desde, cota: s.cota_por_filho, limite: s.limite_remuneracao };
        const valor = { cota_por_filho: s.cota_por_filho, limite_remuneracao: s.limite_remuneracao };
        const existente = oficialEm('salario_familia', s.vigente_desde);
        const anterior = oficialAntes('salario_familia', s.vigente_desde);
        if (existente) {
          if (!iguais(existente.valor, valor)) issue(`Robô: salário-família de ${s.vigente_desde.slice(0, 4)} na página difere do app`, `Página ${URLS.salarioFamilia}: ${JSON.stringify(valor)}; app: ${JSON.stringify(existente.valor)}. Nada mudado.`);
        } else if (anterior && s.vigente_desde > anterior.vigente_desde) {
          const p = [];
          if (!s.vigente_desde.endsWith('-01-01')) p.push(`vigência ${s.vigente_desde} não é 1º de janeiro`);
          for (const k of ['cota_por_filho', 'limite_remuneracao']) {
            const v = ((valor[k] - anterior.valor[k]) / anterior.valor[k]) * 100;
            if (!(v >= 0 && v <= AUMENTO_MAXIMO_PCT)) p.push(`${k} variou ${v.toFixed(2)}%`);
          }
          if (iguais(anterior.valor, valor)) p.push('valores iguais aos do ano anterior');
          if (p.length) issue(`Robô: salário-família de ${s.vigente_desde.slice(0, 4)} não passou nas checagens`, `Página ${URLS.salarioFamilia}: ${JSON.stringify(valor)}\n- ${p.join('\n- ')}\nNada aplicado.`);
          else {
            gravarSeMudou('salario_familia', {
              valor, vigente_desde: s.vigente_desde, vigente_ate: null, status: 'vigente', fonte_url: URLS.salarioFamilia,
              lei: s.normativo ? s.normativo.replace(/\s+/g, ' ') : 'Portaria Interministerial MPS/MF',
              observacao: `Lido pelo robô na página do INSS: cota de ${brl(valor.cota_por_filho)} por filho para remuneração até ${brl(valor.limite_remuneracao)}.`,
            }, `Salário-família de ${s.vigente_desde.slice(0, 4)}`);
          }
        }
      }
    }
  } catch (e) { erro('salario_familia', e.message); }

  // ── 4. Valores que a lei amarra ao mínimo (só para mínimos aplicados pelo robô) ──
  try {
    for (const Y of [ano, ano + 1]) {
      const desde = `${Y}-01-01`;
      const min = oficialEm('salario_minimo', desde);
      if (!min || min.origem !== 'robo') continue;
      const m = min.valor.mensal;
      // DAS do MEI
      const meiOf = oficialEm('mei_das', desde);
      if (!meiOf || meiOf.origem === 'robo') {
        const ant = oficialAntes('mei_das', desde);
        const valor = derivarMeiDas(m, ant && ant.valor);
        gravarSeMudou('mei_das', {
          valor, vigente_desde: desde, vigente_ate: null, status: 'vigente', fonte_url: min.fonte_url,
          lei: `LC 123, art. 18-A, §3º, V; Lei 8.212, art. 21, §2º, II, a (5% do mínimo de ${Y}: ${min.lei})`,
          observacao: `Calculado pelo robô: 5% de ${brl(m)} = ${brl(valor.inss)} de INSS + R$ 1 (comércio/indústria) e/ou R$ 5 (serviços): ${brl(valor.inss + valor.icms)}, ${brl(valor.inss + valor.iss)} ou ${brl(valor.inss + valor.icms + valor.iss)}.`,
        }, `DAS do MEI de ${Y}`);
      }
      // Contribuinte individual / facultativo: base mínima = mínimo; base máxima = teto do INSS DO ANO.
      // Sem a portaria do ano aplicada, não grava (o teto do ano anterior não é o do ano novo).
      const autOf = oficialEm('autonomo', desde);
      const inssDoAno = oficialEm('inss_empregado', desde);
      if (!inssDoAno) aviso(`autônomo de ${Y}: esperando a tabela do INSS de ${Y} (teto) para gravar`);
      if (inssDoAno && (!autOf || autOf.origem === 'robo')) {
        const ant = oficialAntes('autonomo', desde);
        if (ant) {
          const valor = derivarAutonomo(m, inssDoAno.valor.teto, ant.valor);
          gravarSeMudou('autonomo', {
            valor, vigente_desde: desde, vigente_ate: null, status: 'vigente', fonte_url: inssDoAno.fonte_url,
            lei: `Lei 8.212, arts. 21 e 30, II; mínimo de ${Y} (${min.lei}); teto: ${inssDoAno.lei}`,
            observacao: `Calculado pelo robô: ${valor.normal_pct}% sobre a renda entre ${brl(m)} e ${brl(valor.base_maxima)} (${brl(Math.round(m * valor.normal_pct / 100))} a ${brl(Math.round(valor.base_maxima * valor.normal_pct / 100))}), ${valor.simplificado_pct}% sobre o mínimo no plano simplificado (${brl(Math.round(m * valor.simplificado_pct / 100))}) ou 5% do mínimo para facultativo de baixa renda (${brl(Math.round(m * 5 / 100))}).`,
          }, `Autônomo de ${Y}`);
        }
      }
      // Retenção do autônomo por empresa: teto só muda com a portaria (INSS do ano aplicado)
      const inssAno = oficialEm('inss_empregado', desde);
      const retOf = oficialEm('autonomo_retencao_empresa', desde);
      if (inssAno && (!retOf || retOf.origem === 'robo')) {
        const ant = oficialAntes('autonomo_retencao_empresa', desde);
        if (ant) {
          const valor = { ...ant.valor, teto_base: inssAno.valor.teto };
          gravarSeMudou('autonomo_retencao_empresa', {
            valor, vigente_desde: desde, vigente_ate: null, status: 'vigente', fonte_url: inssAno.fonte_url,
            lei: `Lei 10.666/2003, art. 4º; Lei 8.212, art. 22, III; teto: ${inssAno.lei}`,
            observacao: `Calculado pelo robô: empresa retém ${valor.aliquota_pct}% até o teto de ${brl(valor.teto_base)} (máx. ${brl(Math.round(valor.teto_base * valor.aliquota_pct / 100))}) e paga ${valor.patronal_pct}% patronal.`,
          }, `Retenção do autônomo de ${Y}`);
        }
      }
    }
  } catch (e) { erro('derivados', e.message); }

  // ── 5. Projeção do mínimo do ano seguinte com o INPC de novembro (só 'previsto') ──
  try {
    const r = await buscar(URLS.sidraInpc, { aceitar: 'application/json' });
    const inpc = r.ok ? lerInpc(r.texto) : null;
    fonte('ibge_inpc', r, { lido: inpc });
    if (!r.ok) erro('ibge_inpc', r.erro);
    else if (!inpc) erro('ibge_inpc', 'resposta em formato inesperado');
    else {
      estado.valores.inpc_12m = { periodo: inpc.periodo, pct: inpc.pct };
      if (inpc.mes === 11) {
        const Y = inpc.ano + 1;
        const desde = `${Y}-01-01`;
        const base = oficialEm('salario_minimo', `${Y - 1}-01-01`);
        const pib = PIB_REAL_PCT[Y - 2];
        if (oficialEm('salario_minimo', desde)) aviso(`mínimo de ${Y} já oficial; sem projeção`);
        else if (!base) aviso(`sem mínimo oficial de ${Y - 1} para projetar ${Y}`);
        else if (pib === undefined) aviso(`falta o PIB de ${Y - 2} em robo/config.js para projetar ${Y}`);
        else {
          const p = projetarMinimo(base.valor.mensal, inpc.pct, pib, GANHO_REAL_LIMITES_PCT);
          gravarSeMudou('salario_minimo', {
            valor: { mensal: p.mensal }, vigente_desde: desde, vigente_ate: null, status: 'previsto', fonte_url: URLS.sidraInpc,
            lei: 'Projeção pela Lei 14.663/2023 e Lei 15.077/2024 (não é o valor oficial)',
            observacao: `PROJEÇÃO do robô, não é o valor oficial e não entra na conta: ${brl(base.valor.mensal)} × (1 + ${String(inpc.pct).replace('.', ',')}% do INPC de 12 meses até novembro de ${inpc.ano}) × (1 + ${String(p.ganho_real_pct).replace('.', ',')}% de ganho real pelo PIB de ${Y - 2}), arredondado para o real de cima = ${brl(p.mensal)}. O valor oficial sai por decreto.`,
          }, `Projeção do mínimo de ${Y}`);
        }
      }
    }
  } catch (e) { erro('ibge_inpc', e.message); }

  // ── 6. Fontes só vigiadas (IRRF e pisos estaduais) ──
  const vigias = listaVigias(ano);
  // chaves antigas do IRRF (de anos que saíram da lista, e as do formato velho irrf_ano_*) saem do estado
  for (const k of Object.keys(estado.fontes)) {
    if (/^irrf_(\d{4}|ano_atual|ano_seguinte)$/.test(k) && !vigias.some((v) => v.chave === k)) delete estado.fontes[k];
  }
  for (const v of vigias) {
    try {
      const r = await buscar(v.url);
      const guardado = estado.fontes[v.chave];
      const ant = guardado && (!guardado.url || guardado.url === v.url) ? guardado : null;   // URL nova = primeira leitura
      if (!respostaConta(r)) { fonte(v.chave, r); erro(v.chave, r.erro || `HTTP ${r.status}`); continue; }
      const pdf = /pdf/i.test(r.tipo);
      const resumo = r.ok ? (pdf ? null : resumoNormalizado(r.texto)) : `HTTP ${r.status}`;
      if (r.ok && !pdf && resumo.length < 50) { fonte(v.chave, r); erro(v.chave, 'página vazia ou quase vazia'); continue; }
      const hash = r.ok && pdf ? sha256(r.bytes) : sha256(resumo);
      const mudou = !!(ant && ant.hash && ant.hash !== hash);
      fonte(v.chave, r, { hash: hash.slice(0, 16), mudou, primeira_vez: !(ant && ant.hash) });
      estado.fontes[v.chave] = { url: v.url, hash, status: r.status, lido_em: hoje, mudou_em: mudou ? hoje : (ant && ant.mudou_em) || null };
      if (mudou) {
        issue(`Robô: mudou a página "${v.rotulo}"`,
          `O texto de ${v.url} mudou (status ${ant.status} → ${r.status}). O robô não aplica isso sozinho: confira se saiu tabela ou lei nova e atualize dados/parametros.js à mão.`);
      }
    } catch (e) { erro(v.chave, e.message); }
  }

  // ── Conferência final: o que vai ser gravado tem de mesclar sem sobreposição ──
  let autoValido = true;
  try {
    for (const lista of Object.values(auto.vigencias)) for (const v of lista) if (!vigenciaAutoValida(v)) throw new Error('vigência inválida');
    const recusadas = problemasAuto(PARAMETROS_MANUAIS, auto);
    if (recusadas.length) {
      const txt = recusadas.map((x) => `${x.chave} ${x.vigente_desde || ''}: ${x.problemas.join('; ')}`);
      issue('Robô: valores não passaram na conferência final', `O robô ia gravar vigências que não passam nas regras do parâmetro (dados/parametros.js, problemasAuto):\n- ${txt.join('\n- ')}\n\nNada foi gravado.`);
      throw new Error(`conferência por parâmetro: ${txt.join(' | ')}`);
    }
    for (const p of params()) {
      const of = p.vigencias.filter((v) => v.status === 'vigente');
      for (let i = 0; i < of.length - 1; i++) if (of[i].vigente_ate === null || of[i].vigente_ate >= of[i + 1].vigente_desde) throw new Error(`sobreposição em ${p.chave}`);
    }
  } catch (e) { autoValido = false; erro('conferencia_final', e.message); }

  const autoMudou = autoValido && !iguais(autoAntes.vigencias, auto.vigencias);
  if (autoMudou) { rel.publicar = true; rel.motivos.push('valores novos'); }

  estado.ultima_execucao = agora.toISOString();
  const dias = diasCommit !== undefined ? diasCommit : (seco ? null : diasDesdeUltimoCommit(raiz, agora));
  if (dias !== null && dias > DIAS_BATIMENTO) { estado.ultimo_batimento = hoje; rel.motivos.push(`batimento (${dias} dias sem commit)`); }
  if (parteRelevante(estado) !== parteRelevante(estadoAntes)) { rel.publicar = true; rel.motivos.push('estado das fontes'); }

  if (!seco) {
    if (autoMudou) { auto.gerado_em = agora.toISOString(); auto.gerado_em_brasilia = hoje; gravarAuto(raiz, auto); }
    gravarEstado(raiz, estado);
    rel.issues = await abrirIssues(issues, { token, repo, log });
  } else {
    rel.issues = issues.map((i) => ({ titulo: i.titulo, situacao: 'seco (não aberta)', corpo: i.corpo }));
  }
  rel.auto = auto;
  rel.estado = estado;
  return rel;
}

function lerArgs(argv) {
  const a = { seco: false, fixtures: null, hoje: null, raiz: null };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--seco') a.seco = true;
    else if (x === '--simular') { a.seco = true; a.fixtures = a.fixtures || join(RAIZ_PADRAO, 'testes/fixtures/robo/hoje'); }
    else if (x === '--fixtures') a.fixtures = resolve(argv[++i]);
    else if (x === '--hoje') a.hoje = argv[++i];
    else if (x === '--raiz') a.raiz = resolve(argv[++i]);
    else if (x === '--ajuda' || x === '-h') { a.ajuda = true; }
    else throw new Error(`opção desconhecida: ${x}`);
  }
  return a;
}

async function principal() {
  let args;
  try { args = lerArgs(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(2); }
  if (args.ajuda) { console.log('Uso: node robo/robo.js [--seco] [--simular] [--fixtures DIR] [--hoje AAAA-MM-DD] [--raiz DIR]'); return; }
  let rel;
  try {
    rel = await executar({
      raiz: args.raiz || RAIZ_PADRAO, hoje: args.hoje, seco: args.seco, fixtures: args.fixtures,
      token: process.env.GITHUB_TOKEN || null, repo: process.env.GITHUB_REPOSITORY || REPO_PADRAO,
    });
  } catch (e) {
    console.error(`Robô parou sem gravar nada: ${e.message}`);
    process.exit(2);
  }
  const { auto, estado, ...resumo } = rel;
  console.log(JSON.stringify(resumo, null, 2));
  if (process.env.GITHUB_OUTPUT && !args.seco) {
    appendFileSync(process.env.GITHUB_OUTPUT, `publicar=${rel.publicar}\nmotivo=${rel.motivos.join(', ') || 'nada'}\n`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
