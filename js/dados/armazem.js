// Tabela de Ganhos v2 — armazenamento local (só no aparelho; nada vai para a rede).
//
// Ordem de tentativa: IndexedDB (base "tabela-ganhos", stores "config" e "salvos")
//   -> localStorage (chaves "tg2-config" e "tg2-salvos")
//   -> memória (janela anônima com tudo bloqueado: funciona, mas some ao fechar).
// Leituras nunca lançam erro (devolvem o padrão). Escritas lançam Error com mensagem em português
// simples, para a tela mostrar num toast.
import { PARAMETROS_VERSAO } from '../motor/index.js';
import {
  CONFIG_PADRAO, VERSAO_FORMATO_CONFIG, dataNaFaixa, normalizarConfig, mesclarConfig, aparencia, converterV1, textoLimpo, copiar, limparEntrada,
} from './config.js';

export const NOME_BASE = 'tabela-ganhos';
export const VERSAO_BASE = 1;                 // versão do esquema do IndexedDB
export const VERSAO_FORMATO = 1;              // versão do formato dos dados (config, salvos, backup)
export const FORMATO_BACKUP = 'tabela-ganhos-backup';
export const MODOS = ['porHora', 'inverso', 'diarista', 'domestico'];
export const CHAVE_ESPELHO = 'tg2-aparencia';
const CHAVES_V1 = { tema: 'tg-theme', visao: 'tg-view', calc: 'tg-calc' };
const CHAVES_LS = { config: 'tg2-config', salvos: 'tg2-salvos' };
const LIMITE_BACKUP_BYTES = 5 * 1024 * 1024;
const LIMITE_SALVOS = 5000;

// ───────────── utilidades ─────────────
function ehObjeto(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function agoraISO() { return new Date().toISOString(); }
function isoValido(v) { return typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v)); }
function novoId() {
  try { if (globalThis.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID(); } catch { /* segue */ }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function lsLer(chave) { try { return globalThis.localStorage ? localStorage.getItem(chave) : null; } catch { return null; } }
function lsGravar(chave, valor) { try { localStorage.setItem(chave, valor); return true; } catch { return false; } }
function lsApagar(chave) { try { localStorage.removeItem(chave); } catch { /* nada */ } }
function erro(mensagem, causa) { const e = new Error(mensagem); if (causa) e.cause = causa; return e; }

// ───────────── saneamento do salvo ─────────────
// limparEntrada mora em config.js (a config também guarda entradas: config.calcular).
export { limparEntrada };

/**
 * Valida e completa um salvo. Todo texto vira texto puro (nunca HTML).
 * Esquema: { id, titulo, notas, etiquetas[], fixado, modo, entrada, resumo{rotulo, valor_centavos},
 *            data_referencia, parametros_versao, criado_em, editado_em }
 * @returns {object|null} salvo válido, ou null se não der para aproveitar (modo desconhecido)
 */
export function normalizarSalvo(s, { manterDatas = true } = {}) {
  if (!ehObjeto(s) || !MODOS.includes(s.modo)) return null;
  const agora = agoraISO();
  const etiquetas = Array.isArray(s.etiquetas)
    ? [...new Set(s.etiquetas.map((t) => textoLimpo(t, 40).trim()).filter(Boolean))].slice(0, 20)
    : [];
  const resumo = ehObjeto(s.resumo) ? s.resumo : {};
  // Só número de verdade: Number(null) e Number('') dão 0, e um salvo sem valor viraria "R$ 0,00".
  const valor = typeof resumo.valor_centavos === 'number' ? resumo.valor_centavos : NaN;
  const id = typeof s.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(s.id) ? s.id : novoId();
  const criado = manterDatas && isoValido(s.criado_em) ? s.criado_em : agora;
  return {
    id,
    titulo: textoLimpo(s.titulo, 120).trim() || 'Cálculo sem título',
    notas: textoLimpo(s.notas, 5000),
    etiquetas,
    fixado: s.fixado === true,
    modo: s.modo,
    entrada: limparEntrada(s.entrada),
    resumo: {
      rotulo: textoLimpo(resumo.rotulo, 120),
      valor_centavos: Number.isSafeInteger(valor) ? valor : null,
    },
    data_referencia: dataNaFaixa(s.data_referencia) ? s.data_referencia : null,
    parametros_versao: textoLimpo(s.parametros_versao || PARAMETROS_VERSAO, 20),
    criado_em: criado,
    editado_em: manterDatas && isoValido(s.editado_em) ? s.editado_em : agora,
  };
}

// ───────────── back-ends ─────────────
function promessa(req) {
  return new Promise((ok, falha) => { req.onsuccess = () => ok(req.result); req.onerror = () => falha(req.error); });
}

function abrirIDB(tempoLimite = 2500) {
  return new Promise((ok, falha) => {
    let fim = false;
    const timer = setTimeout(() => { if (!fim) { fim = true; falha(erro('IndexedDB demorou demais')); } }, tempoLimite);
    try {
      if (!globalThis.indexedDB) throw erro('Sem IndexedDB');
      const req = indexedDB.open(NOME_BASE, VERSAO_BASE);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('config')) db.createObjectStore('config');
        if (!db.objectStoreNames.contains('salvos')) db.createObjectStore('salvos', { keyPath: 'id' });
      };
      req.onsuccess = () => {
        if (fim) { try { req.result.close(); } catch { /* nada */ } return; }
        fim = true; clearTimeout(timer); ok(req.result);
      };
      req.onerror = () => { if (!fim) { fim = true; clearTimeout(timer); falha(req.error || erro('Falha ao abrir')); } };
      req.onblocked = () => { /* outra aba com versão antiga: o tempo limite resolve */ };
    } catch (e) { fim = true; clearTimeout(timer); falha(e); }
  });
}

function backendIDB(db) {
  const tx = (store, modo) => db.transaction(store, modo).objectStore(store);
  const concluir = (t) => new Promise((ok, falha) => { t.oncomplete = () => ok(); t.onerror = () => falha(t.error); t.onabort = () => falha(t.error); });
  return {
    tipo: 'indexeddb',
    async obter(store, chave) { return promessa(tx(store, 'readonly').get(chave)); },
    async listar(store) { return promessa(tx(store, 'readonly').getAll()); },
    async gravar(store, valor, chave) {
      const t = db.transaction(store, 'readwrite');
      if (store === 'salvos') t.objectStore(store).put(valor); else t.objectStore(store).put(valor, chave);
      await concluir(t);
    },
    async gravarVarios(store, valores) {
      const t = db.transaction(store, 'readwrite');
      const s = t.objectStore(store);
      for (const v of valores) s.put(v);
      await concluir(t);
    },
    async apagar(store, chave) { const t = db.transaction(store, 'readwrite'); t.objectStore(store).delete(chave); await concluir(t); },
    async limpar(store) { const t = db.transaction(store, 'readwrite'); t.objectStore(store).clear(); await concluir(t); },
    /** Apaga tudo e grava a lista nova numa transação só: se a gravação falhar, nada é apagado. */
    async trocarTodos(store, valores) {
      const t = db.transaction(store, 'readwrite');
      const s = t.objectStore(store);
      s.clear();
      for (const v of valores) s.put(v);
      await concluir(t);
    },
  };
}

function backendMapa(tipo, carregar, guardar) {
  const ler = (store) => carregar(store) || {};
  return {
    tipo,
    async obter(store, chave) { const m = ler(store); return Object.prototype.hasOwnProperty.call(m, chave) ? copiar(m[chave]) : undefined; },
    async listar(store) { return Object.values(ler(store)).map(copiar); },
    async gravar(store, valor, chave) {
      const m = ler(store); m[store === 'salvos' ? valor.id : chave] = copiar(valor);
      if (!guardar(store, m)) throw erro('Sem espaço no aparelho');
    },
    async gravarVarios(store, valores) {
      const m = ler(store); for (const v of valores) m[v.id] = copiar(v);
      if (!guardar(store, m)) throw erro('Sem espaço no aparelho');
    },
    async apagar(store, chave) { const m = ler(store); delete m[chave]; guardar(store, m); },
    async limpar(store) { guardar(store, {}); },
    async trocarTodos(store, valores) {
      const m = {}; for (const v of valores) m[v.id] = copiar(v);
      if (!guardar(store, m)) throw erro('Sem espaço no aparelho');   // a lista antiga continua lá
    },
  };
}

function backendLocalStorage() {
  // Teste de escrita: em alguns navegadores o localStorage existe mas recusa gravar.
  if (!lsGravar('tg2-teste', '1')) throw erro('localStorage indisponível');
  lsApagar('tg2-teste');
  return backendMapa('localstorage',
    (store) => { try { const t = lsLer(CHAVES_LS[store]); const o = t ? JSON.parse(t) : {}; return ehObjeto(o) ? o : {}; } catch { return {}; } },
    (store, m) => lsGravar(CHAVES_LS[store], JSON.stringify(m)));
}

function backendMemoria() {
  const mem = { config: {}, salvos: {} };
  return backendMapa('memoria', (store) => mem[store], (store, m) => { mem[store] = m; return true; });
}

// ───────────── núcleo ─────────────
let _backend = null;
let _abrindo = null;

function pronto() {
  if (!_abrindo) {
    _abrindo = (async () => {
      let b;
      try { b = backendIDB(await abrirIDB()); } catch {
        try { b = backendLocalStorage(); } catch { b = backendMemoria(); }
      }
      try { await migrar(b); } catch { /* migração não pode travar o app */ }
      _backend = b;
      return b;
    })();
  }
  return _abrindo;
}

/** Migrações de formato. Cada passo leva da versão N para N+1. */
async function migrar(b) {
  const meta = (await b.obter('config', 'meta')) || null;
  let versao = meta && Number.isInteger(meta.versao_formato) ? meta.versao_formato : 0;
  if (versao === 0) {
    // 0 -> 1: base nova. Se houver dados da v1 no localStorage, viram a config inicial.
    const existente = await b.obter('config', 'principal');
    if (!existente) {
      const parcial = converterV1({ tema: lsLer(CHAVES_V1.tema), visao: lsLer(CHAVES_V1.visao), calc: lsLer(CHAVES_V1.calc) });
      const cfg = parcial ? mesclarConfig(CONFIG_PADRAO, parcial) : normalizarConfig(CONFIG_PADRAO);
      await b.gravar('config', { versao_formato: VERSAO_FORMATO_CONFIG, dados: cfg }, 'principal');
      espelhar(cfg);
    }
    versao = 1;
  }
  // Futuras: if (versao === 1) { ...; versao = 2; }
  if (!meta || meta.versao_formato !== versao) await b.gravar('config', { versao_formato: versao, migrado_em: agoraISO() }, 'meta');
}

function espelhar(cfg) { lsGravar(CHAVE_ESPELHO, JSON.stringify(aparencia(cfg))); }

function ordenarSalvos(lista) {
  return lista.sort((a, b) => (b.fixado === true) - (a.fixado === true) || String(b.editado_em).localeCompare(String(a.editado_em)));
}

// ───────────── API pública ─────────────
export const armazem = {
  /** 'indexeddb' | 'localstorage' | 'memoria' (depois da primeira chamada). */
  get tipo() { return _backend ? _backend.tipo : null; },

  /** true se os dados somem ao fechar a janela (modo memória). */
  get temporario() { return !!_backend && _backend.tipo === 'memoria'; },

  /** Garante a base aberta e migrada; devolve o tipo de armazenamento. */
  async iniciar() { const b = await pronto(); return b.tipo; },

  /** @returns {Promise<object>} config completa e válida (nunca lança). */
  async obterConfig() {
    try {
      const b = await pronto();
      const reg = await b.obter('config', 'principal');
      return normalizarConfig(reg && reg.dados);
    } catch { return normalizarConfig(CONFIG_PADRAO); }
  },

  /** Grava a config inteira (normalizada) e atualiza o espelho da aparência. @returns {Promise<object>} */
  async salvarConfig(cfg) {
    const limpa = normalizarConfig(cfg);
    espelhar(limpa);
    try {
      const b = await pronto();
      await b.gravar('config', { versao_formato: VERSAO_FORMATO_CONFIG, dados: limpa }, 'principal');
    } catch (e) { throw erro('Não deu para guardar as configurações neste aparelho.', e); }
    return limpa;
  },

  /** @returns {Promise<object[]>} salvos, fixados primeiro, depois do mais recente (nunca lança). */
  async listarSalvos() {
    try {
      const b = await pronto();
      const lista = (await b.listar('salvos')).map((s) => normalizarSalvo(s)).filter(Boolean);
      return ordenarSalvos(lista);
    } catch { return []; }
  },

  /** @returns {Promise<object|null>} */
  async obterSalvo(id) {
    try {
      const b = await pronto();
      const s = await b.obter('salvos', String(id));
      return s ? normalizarSalvo(s) : null;
    } catch { return null; }
  },

  /**
   * Cria ou atualiza um salvo. Sem id = novo. Atualiza editado_em; mantém criado_em de quem já existe.
   * @returns {Promise<object>} o salvo como ficou gravado
   */
  async salvarSalvo(salvo) {
    const b = await pronto();
    const anterior = salvo && salvo.id ? await b.obter('salvos', String(salvo.id)).catch(() => null) : null;
    const s = normalizarSalvo({ ...salvo, criado_em: anterior ? anterior.criado_em : undefined, editado_em: undefined }, { manterDatas: true });
    if (!s) throw erro('Este cálculo não tem um modo válido para salvar.');
    try { await b.gravar('salvos', s); } catch (e) { throw erro('Não deu para salvar neste aparelho. Libere espaço ou faça um backup.', e); }
    return s;
  },

  /** Apaga e devolve o salvo apagado (para o "desfazer" chamar restaurarSalvo). @returns {Promise<object|null>} */
  async apagarSalvo(id) {
    const b = await pronto();
    const s = await b.obter('salvos', String(id)).catch(() => null);
    try { await b.apagar('salvos', String(id)); } catch (e) { throw erro('Não deu para apagar.', e); }
    return s ? normalizarSalvo(s) : null;
  },

  /** Devolve um salvo apagado exatamente como era (mesmo id e datas). */
  async restaurarSalvo(salvo) {
    const s = normalizarSalvo(salvo, { manterDatas: true });
    if (!s) throw erro('Não deu para desfazer.');
    const b = await pronto();
    try { await b.gravar('salvos', s); } catch (e) { throw erro('Não deu para desfazer.', e); }
    return s;
  },

  /** Fixa ou desafixa sem mudar a data de edição (a ordem "mais recentes" não muda). @returns {Promise<object|null>} */
  async fixarSalvo(id, fixado) {
    const b = await pronto();
    const s = await b.obter('salvos', String(id)).catch(() => null);
    if (!s) return null;
    const n = normalizarSalvo({ ...s, fixado: fixado === true }, { manterDatas: true });
    try { await b.gravar('salvos', n); } catch (e) { throw erro('Não deu para fixar.', e); }
    return n;
  },

  /** Backup completo em objeto JSON (o chamador transforma em arquivo). */
  async exportarTudo() {
    return {
      formato: FORMATO_BACKUP,
      versao_formato: VERSAO_FORMATO,
      exportado_em: agoraISO(),
      parametros_versao: PARAMETROS_VERSAO,
      config: await this.obterConfig(),
      salvos: await this.listarSalvos(),
    };
  },

  /**
   * Restaura um backup. Aceita o texto do arquivo ou o objeto já lido. Todo texto é tratado como texto.
   * @param {string|object} fonte
   * @param {{ modo?: 'juntar'|'substituir', importarConfig?: boolean }} opcoes
   * @returns {Promise<{ ok: boolean, mensagem: string, salvos_importados: number, ignorados: number, config_importada: boolean }>}
   */
  async importarTudo(fonte, { modo = 'juntar', importarConfig = true } = {}) {
    const falha = (mensagem) => ({ ok: false, mensagem, salvos_importados: 0, ignorados: 0, config_importada: false });
    let dados = fonte;
    if (typeof fonte === 'string') {
      if (fonte.length > LIMITE_BACKUP_BYTES) return falha('O arquivo é grande demais para ser um backup deste app.');
      try { dados = JSON.parse(fonte); } catch { return falha('Este arquivo não é um backup da Tabela de Ganhos.'); }
    }
    if (!ehObjeto(dados) || dados.formato !== FORMATO_BACKUP) return falha('Este arquivo não é um backup da Tabela de Ganhos.');
    const v = Number(dados.versao_formato);
    if (!Number.isInteger(v) || v < 1) return falha('O backup está com um formato desconhecido.');
    if (v > VERSAO_FORMATO) return falha('Este backup foi feito por uma versão mais nova do app. Atualize o app e tente de novo.');

    const lista = Array.isArray(dados.salvos) ? dados.salvos.slice(0, LIMITE_SALVOS) : [];
    const validos = [];
    let ignorados = Array.isArray(dados.salvos) ? Math.max(0, dados.salvos.length - lista.length) : 0;
    for (const s of lista) { const n = normalizarSalvo(s, { manterDatas: true }); if (n) validos.push(n); else ignorados++; }

    // Substituir por um arquivo sem nenhum cálculo legível apagaria tudo e não poria nada no lugar.
    if (modo === 'substituir' && !validos.length) {
      return falha(`${lista.length ? 'O arquivo não tem nenhum cálculo que dê para ler' : 'O arquivo não tem nenhum cálculo salvo'}. Os cálculos deste aparelho não foram mexidos.`);
    }

    const b = await pronto();
    let jaAqui = 0;   // modo juntar: já estavam aqui iguais ou mais novos
    try {
      let paraGravar = validos;
      if (modo === 'substituir') {
        await b.trocarTodos('salvos', validos);   // apagar e gravar juntos (tudo ou nada)
        paraGravar = [];
      } else {
        const atuais = new Map((await b.listar('salvos')).map((s) => [s.id, s]));
        paraGravar = validos.filter((s) => {
          const atual = atuais.get(s.id);
          if (atual && String(atual.editado_em) >= String(s.editado_em)) { jaAqui++; return false; }
          return true;
        });
      }
      if (paraGravar.length) await b.gravarVarios('salvos', paraGravar);
      let configImportada = false;
      if (importarConfig && ehObjeto(dados.config)) { await this.salvarConfig(dados.config); configImportada = true; }
      const n = modo === 'substituir' ? validos.length : paraGravar.length;
      return {
        ok: true,
        mensagem: `${n} ${n === 1 ? 'cálculo restaurado' : 'cálculos restaurados'}`
          + `${jaAqui ? `; ${jaAqui} já ${jaAqui === 1 ? 'estava' : 'estavam'} aqui` : ''}`
          + `${ignorados ? `; ${ignorados} não ${ignorados === 1 ? 'pôde' : 'puderam'} ser ${ignorados === 1 ? 'lido' : 'lidos'}` : ''}.`,
        salvos_importados: n, ignorados: ignorados + jaAqui, ja_aqui: jaAqui, ilegiveis: ignorados, config_importada: configImportada,
      };
    } catch (e) { throw erro('Não deu para restaurar o backup neste aparelho.', e); }
  },

  /** Apaga TUDO deste app no aparelho (config, salvos, espelho e chaves da v1). A tela confirma antes. */
  async apagarTudo() {
    const b = await pronto();
    try { await b.limpar('salvos'); await b.limpar('config'); } catch (e) { throw erro('Não deu para apagar tudo.', e); }
    // Espelho, reserva do localStorage, chaves da v1 e qualquer outra chave "tg2-" das telas.
    const chaves = new Set([CHAVE_ESPELHO, CHAVES_LS.config, CHAVES_LS.salvos, ...Object.values(CHAVES_V1)]);
    try {
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('tg2-')) chaves.add(k); }
    } catch { /* sem localStorage */ }
    for (const k of chaves) lsApagar(k);
    await b.gravar('config', { versao_formato: VERSAO_FORMATO, migrado_em: agoraISO() }, 'meta').catch(() => {});
  },
};

/** Só para testes: troca o back-end (ex.: memória) e zera o estado. */
export function _usarBackendParaTeste(tipo = 'memoria') {
  _backend = null;
  _abrindo = tipo === 'memoria'
    ? (async () => { const b = backendMemoria(); await migrar(b); _backend = b; return b; })()
    : null;
}
