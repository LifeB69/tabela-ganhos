// Acesso aos parâmetros legais datados (dados/parametros.js).
import PARAMETROS, { PARAMETROS_VERSAO, DATA_CONFERENCIA, FONTES } from '../../dados/parametros.js';

export { PARAMETROS, PARAMETROS_VERSAO, DATA_CONFERENCIA, FONTES };

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

/** true se for uma data ISO AAAA-MM-DD existente no calendário. */
export function dataValida(d) {
  if (typeof d !== 'string' || !RE_DATA.test(d)) return false;
  const [a, m, dia] = d.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, dia));
  return dt.getUTCFullYear() === a && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === dia;
}

function diaAnterior(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d - 1));
  return dt.toISOString().slice(0, 10);
}

/** Lista todos os parâmetros (cópia rasa). */
export function listarParametros() {
  return PARAMETROS.slice();
}

function definicao(chave) {
  return PARAMETROS.find((p) => p.chave === chave) || null;
}

/**
 * Vigências de um parâmetro, já com as datas de marco ajustadas pelos overrides.
 * overrides.jornada_datas = { jornada_42: 'AAAA-MM-DD', jornada_40: 'AAAA-MM-DD' } muda a data
 * em que entram as vigências marcadas com esse marco (e encerra a anterior na véspera).
 */
export function listarVigencias(chave, overrides = {}) {
  const def = definicao(chave);
  if (!def) return [];
  let vig = def.vigencias.map((v) => ({ ...v }));
  const datas = overrides && overrides.jornada_datas;
  if (datas && typeof datas === 'object') {
    vig = vig.map((v) => (v.marco && dataValida(datas[v.marco]) ? { ...v, vigente_desde: datas[v.marco], data_editada_por_usuario: true } : v));
    // reencadeia vigente_ate das vigências que antecedem um marco ajustado
    const ordenadas = vig.slice().sort((a, b) => a.vigente_desde.localeCompare(b.vigente_desde));
    for (let i = 0; i < ordenadas.length - 1; i++) {
      const prox = ordenadas[i + 1];
      if (prox.data_editada_por_usuario && ordenadas[i].vigente_ate !== null) {
        ordenadas[i].vigente_ate = diaAnterior(prox.vigente_desde);
      }
    }
    vig = ordenadas;
  }
  return vig;
}

/**
 * Devolve a vigência aplicável na data, como objeto
 * { chave, rotulo, unidade, valor, vigente_desde, vigente_ate, status, fonte_url, lei, observacao, ... }
 * ou null se não houver.
 * Por padrão só usa status 'vigente' (o que é 'previsto' ou 'nao_verificado' não entra no cálculo).
 * opcoes.incluirPrevistos / opcoes.incluirNaoVerificados ampliam a busca (para telas de informação).
 * overrides[chave] = valor troca o valor (marcado editado_por_usuario).
 */
export function getParam(chave, dataISO, overrides = {}, opcoes = {}) {
  const def = definicao(chave);
  if (!def || !dataValida(dataISO)) return null;
  const permitidos = new Set(['vigente']);
  if (opcoes.incluirPrevistos) permitidos.add('previsto');
  if (opcoes.incluirNaoVerificados) permitidos.add('nao_verificado');

  const candidatas = listarVigencias(chave, overrides)
    .filter((v) => permitidos.has(v.status))
    .filter((v) => v.vigente_desde <= dataISO && (v.vigente_ate === null || v.vigente_ate >= dataISO))
    .sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde));
  let escolhida = candidatas[0] || null;

  if (overrides && Object.prototype.hasOwnProperty.call(overrides, chave)) {
    const base = escolhida || def.vigencias[def.vigencias.length - 1];
    escolhida = { ...base, valor: overrides[chave], editado_por_usuario: true, valor_oficial: escolhida ? escolhida.valor : null };
  }
  if (!escolhida) return null;
  return { chave: def.chave, rotulo: def.rotulo, unidade: def.unidade, uf: def.uf, ...escolhida };
}

/** Valor da vigência aplicável (atalho). */
export function valorParam(chave, dataISO, overrides = {}, opcoes = {}) {
  const p = getParam(chave, dataISO, overrides, opcoes);
  return p ? p.valor : null;
}

/**
 * Mudanças com início depois de dataISO (inclui previstas e não verificadas, com o status),
 * ordenadas por data. limiteISO opcional restringe a janela.
 */
export function listarMudancasFuturas(dataISO, limiteISO = null, overrides = {}) {
  const lista = [];
  for (const def of PARAMETROS) {
    for (const v of listarVigencias(def.chave, overrides)) {
      if (v.vigente_desde > dataISO && (!limiteISO || v.vigente_desde <= limiteISO)) {
        const anterior = getParam(def.chave, diaAnterior(v.vigente_desde), overrides);
        lista.push({
          chave: def.chave,
          rotulo: def.rotulo,
          unidade: def.unidade,
          vigente_desde: v.vigente_desde,
          valor_atual: anterior ? anterior.valor : null,
          valor_novo: v.valor,
          status: v.status,
          fonte_url: v.fonte_url,
          lei: v.lei,
          observacao: v.observacao,
        });
      }
    }
  }
  return lista.sort((a, b) => a.vigente_desde.localeCompare(b.vigente_desde) || a.chave.localeCompare(b.chave));
}

/** Contagem de dias entre duas datas ISO (b − a). */
export function diasEntre(aISO, bISO) {
  const [a1, m1, d1] = aISO.split('-').map(Number);
  const [a2, m2, d2] = bISO.split('-').map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
}

export const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB',
  'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];

/**
 * Como getParam, mas se não houver vigência oficial na data (ex.: data anterior a 2026, quando o
 * app não tem a tabela daquele ano) devolve a vigência oficial mais próxima com
 * fora_da_vigencia: true, para o motor avisar em vez de falhar.
 */
export function getParamComReserva(chave, dataISO, overrides = {}) {
  const p = getParam(chave, dataISO, overrides);
  if (p) return p;
  const def = PARAMETROS.find((x) => x.chave === chave);
  if (!def) return null;
  const oficiais = listarVigencias(chave, overrides).filter((v) => v.status === 'vigente');
  if (!oficiais.length) return null;
  const antes = oficiais.filter((v) => v.vigente_desde > dataISO).sort((a, b) => a.vigente_desde.localeCompare(b.vigente_desde));
  const escolhida = antes[0] || oficiais.sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde))[0];
  let r = { chave: def.chave, rotulo: def.rotulo, unidade: def.unidade, uf: def.uf, ...escolhida, fora_da_vigencia: true };
  if (overrides && Object.prototype.hasOwnProperty.call(overrides, chave)) {
    r = { ...r, valor: overrides[chave], editado_por_usuario: true };
  }
  return r;
}
