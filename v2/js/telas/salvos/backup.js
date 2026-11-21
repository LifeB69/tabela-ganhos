// Tabela de Ganhos v2 — tela Salvos: arquivos (backup JSON, CSV) e leitura de backup para a prévia.
// Tudo fica no aparelho: o arquivo é gerado no navegador (Blob) e baixado com <a download>.
import { normalizarSalvo, FORMATO_BACKUP, VERSAO_FORMATO } from '../../dados/armazem.js';

const LIMITE_BYTES = 5 * 1024 * 1024;   // o mesmo de armazem.importarTudo
const LIMITE_SALVOS = 5000;

// Datas do lembrete de backup ficam na config (config.backup): entram no backup e saem com "Apagar tudo".
/** Data (ISO) do último backup feito neste aparelho, ou null. */
export function ultimoBackup(ctx) { return (ctx.config.backup || {}).ultimo || null; }
/** Marca agora como a data do último backup (também usada pela tela Mais). */
export function marcarBackup(ctx, quando = new Date()) { return ctx.salvarConfig({ backup: { ultimo: quando.toISOString() } }); }
export function adiadoAte(ctx) { return (ctx.config.backup || {}).lembreteAdiadoAte || null; }
export function adiarLembrete(ctx, dias, agora = new Date()) {
  return ctx.salvarConfig({ backup: { lembreteAdiadoAte: new Date(agora.getTime() + dias * 86400000).toISOString() } });
}

/**
 * Baixa um texto como arquivo. Usa um <a download> com endereço blob: (o construtor h() bloqueia "blob:"
 * de propósito, então o link é criado direto aqui, com um endereço que nós mesmos geramos).
 */
export function baixarArquivo(texto, nome, tipo) {
  const blob = new Blob([texto], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.hidden = true;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/**
 * Lê o arquivo escolhido e prepara a prévia. Nada é gravado aqui.
 * @param {File} arquivo
 * @returns {Promise<{ ok: true, dados: object, salvos: object[], ilegiveis: number, exportadoEm: string|null, temConfig: boolean }
 *                  | { ok: false, erro: string }>}
 */
export async function lerBackup(arquivo) {
  const falha = (erro) => ({ ok: false, erro });
  if (!arquivo) return falha('Nenhum arquivo escolhido.');
  if (arquivo.size > LIMITE_BYTES) return falha('O arquivo é grande demais para ser um backup deste app.');
  let texto;
  try { texto = await arquivo.text(); } catch { return falha('Não deu para ler o arquivo. Tente de novo.'); }
  let dados;
  try { dados = JSON.parse(texto); } catch { return falha('Este arquivo não é um backup da Tabela de Ganhos. Escolha o arquivo .json que o app baixou.'); }
  if (!dados || typeof dados !== 'object' || Array.isArray(dados) || dados.formato !== FORMATO_BACKUP) {
    return falha('Este arquivo não é um backup da Tabela de Ganhos. Escolha o arquivo .json que o app baixou.');
  }
  const v = Number(dados.versao_formato);
  if (!Number.isInteger(v) || v < 1) return falha('O backup está com um formato desconhecido.');
  if (v > VERSAO_FORMATO) return falha('Este backup foi feito por uma versão mais nova do app. Atualize o app e tente de novo.');
  const brutos = Array.isArray(dados.salvos) ? dados.salvos : [];
  const salvos = [];
  let ilegiveis = Math.max(0, brutos.length - LIMITE_SALVOS);
  for (const s of brutos.slice(0, LIMITE_SALVOS)) {
    const n = normalizarSalvo(s, { manterDatas: true });
    if (n) salvos.push(n); else ilegiveis += 1;
  }
  const exportadoEm = typeof dados.exportado_em === 'string' && !Number.isNaN(Date.parse(dados.exportado_em)) ? dados.exportado_em : null;
  const temConfig = !!dados.config && typeof dados.config === 'object' && !Array.isArray(dados.config);
  return { ok: true, dados, salvos, ilegiveis, exportadoEm, temConfig };
}
