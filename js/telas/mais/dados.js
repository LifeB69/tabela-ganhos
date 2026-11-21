// Tabela de Ganhos v2 — tela Mais: Dados (fazer backup, restaurar, apagar tudo).
// Tudo acontece no aparelho: o backup é um arquivo .json gerado no navegador; nada vai para a internet.
import { secao, subtitulo, interruptor, dataBR } from './util.js';

const FORMATO = 'tabela-ganhos-backup';
const LIMITE_BYTES = 5 * 1024 * 1024;
const PALAVRA = 'APAGAR';
// A data do último backup fica em config.backup.ultimo, a mesma que a tela Salvos usa no lembrete.
// Aviso que sobrevive ao recarregar depois de "apagar tudo".
const CHAVE_AVISO = 'tg2-mais-aviso';

/** Baixa um texto como arquivo (<a download> com endereço blob: criado aqui mesmo). */
function baixarArquivo(texto, nome, tipo) {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.hidden = true;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/** Aviso guardado antes de recarregar (mostrado uma vez, depois apagado). */
export function avisoPendente() {
  let t = null;
  try { t = sessionStorage.getItem(CHAVE_AVISO); sessionStorage.removeItem(CHAVE_AVISO); } catch { /* nada */ }
  return t;
}

export function montarDados(ctx) {
  const { ui, armazem } = ctx;
  const { h } = ui;

  // ───── Backup ─────
  const ultimo = h('p', { class: 'campo-dica' });
  const desenharUltimo = () => {
    const iso = (ctx.config.backup || {}).ultimo;   // a mesma data que a tela Salvos usa no lembrete
    const d = iso && !Number.isNaN(Date.parse(iso)) ? new Date(iso) : null;
    ultimo.textContent = d
      ? `Último backup feito neste aparelho: ${dataBR(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)}.`
      : 'Nenhum backup feito ainda neste aparelho.';
  };
  desenharUltimo();

  async function fazerBackup() {
    try {
      const dados = await armazem.exportarTudo();
      const n = dados.salvos.length;
      baixarArquivo(JSON.stringify(dados, null, 2), `tabela-ganhos-backup-${ctx.hoje()}.json`, 'application/json');
      await ctx.salvarConfig({ backup: { ultimo: new Date().toISOString() } });
      desenharUltimo();
      ctx.toast(`Backup baixado com ${n} ${n === 1 ? 'cálculo' : 'cálculos'} e as configurações. Guarde o arquivo num lugar seguro.`);
    } catch (e) {
      ctx.toast(e && e.message ? e.message : 'Não deu para fazer o backup.');
    }
  }

  // ───── Restaurar ─────
  const arquivo = h('input', { type: 'file', accept: '.json,application/json', class: 'sr', tabindex: '-1', 'aria-hidden': 'true' });
  arquivo.addEventListener('change', async () => {
    const f = arquivo.files && arquivo.files[0];
    arquivo.value = '';
    if (f) await prepararRestauracao(f);
  });

  async function prepararRestauracao(f) {
    const falhar = (msg) => ctx.toast(msg);
    if (f.size > LIMITE_BYTES) { falhar('O arquivo é grande demais para ser um backup deste app.'); return; }
    let texto;
    try { texto = await f.text(); } catch { falhar('Não deu para ler o arquivo. Tente de novo.'); return; }
    let dados;
    try { dados = JSON.parse(texto); } catch { dados = null; }
    if (!dados || typeof dados !== 'object' || Array.isArray(dados) || dados.formato !== FORMATO) {
      falhar('Este arquivo não é um backup da Tabela de Ganhos. Escolha o arquivo .json que o app baixou.');
      return;
    }
    const n = Array.isArray(dados.salvos) ? dados.salvos.length : 0;
    const temConfig = !!dados.config && typeof dados.config === 'object' && !Array.isArray(dados.config);
    const quando = typeof dados.exportado_em === 'string' && !Number.isNaN(Date.parse(dados.exportado_em)) ? new Date(dados.exportado_em) : null;
    const quandoTxt = quando ? dataBR(`${quando.getFullYear()}-${String(quando.getMonth() + 1).padStart(2, '0')}-${String(quando.getDate()).padStart(2, '0')}`) : 'data desconhecida';

    const modo = ui.segmentos({
      rotulo: 'O que fazer com os cálculos que já estão aqui',
      variante: 'igual',
      valor: 'juntar',
      opcoes: [{ valor: 'juntar', texto: 'Juntar' }, { valor: 'substituir', texto: 'Substituir' }],
      dica: 'Juntar mantém os cálculos daqui e acrescenta os do arquivo. Substituir apaga os daqui antes.',
    });
    const comConfig = temConfig ? interruptor({ rotulo: 'Trazer também as configurações', dica: 'Visual, estado, padrões e valores editados.', ligado: true }) : null;

    ui.folha({
      titulo: 'Restaurar backup',
      conteudo: [
        h('ul', { class: 'mais-resumo-backup', role: 'list' },
          h('li', null, `Feito em ${quandoTxt}`),
          h('li', null, `${n} ${n === 1 ? 'cálculo salvo' : 'cálculos salvos'}`),
          h('li', null, temConfig ? 'Com as configurações' : 'Sem configurações')),
        modo, comConfig],
      acoes: [{ texto: 'Cancelar' }, {
        texto: 'Restaurar', variante: 'primario',
        aoClicar: async () => {
          if (modo.valor === 'substituir') {
            const ok = await ui.confirmar({
              titulo: 'Substituir os cálculos daqui?',
              texto: 'Os cálculos salvos neste aparelho serão apagados e trocados pelos do arquivo. Não dá para desfazer.',
              confirmar: 'Substituir', perigo: true,
            });
            if (!ok) return false;
          }
          try {
            const r = await armazem.importarTudo(dados, { modo: modo.valor, importarConfig: !!(comConfig && comConfig.input.checked) });
            if (!r.ok) { ctx.toast(r.mensagem); return undefined; }
            if (r.config_importada) await ctx.salvarConfig(await armazem.obterConfig());
            ctx.toast(`${r.mensagem}${r.config_importada ? ' Configurações aplicadas.' : ''}`);
          } catch (e) {
            ctx.toast(e && e.message ? e.message : 'Não deu para restaurar o backup.');
          }
          return undefined;
        },
      }],
    });
  }

  // ───── Apagar tudo (confirmação digitando APAGAR na própria página) ─────
  const campoApagar = ui.campoTexto({
    rotulo: `Para apagar, escreva ${PALAVRA}`,
    maximo: 20, largo: true, autocomplete: 'off',
    dica: 'Apaga os cálculos salvos, as configurações e os valores editados deste aparelho. Não dá para desfazer. Faça um backup antes.',
  });
  campoApagar.input.setAttribute('autocapitalize', 'characters');
  campoApagar.input.setAttribute('spellcheck', 'false');
  const botaoApagar = ui.botao({ texto: 'Apagar tudo', icone: 'lixeira', variante: 'perigo', aoClicar: apagarTudo });
  const confere = () => campoApagar.input.value.trim().toUpperCase() === PALAVRA;
  const pintarBotao = () => { botaoApagar.setAttribute('aria-disabled', String(!confere())); };
  campoApagar.input.addEventListener('input', () => { pintarBotao(); if (confere()) campoApagar.mostrarErro(null); });
  pintarBotao();

  async function apagarTudo() {
    if (!confere()) {
      campoApagar.mostrarErro(`Escreva ${PALAVRA} no campo para confirmar.`);
      campoApagar.input.focus();
      return;
    }
    try {
      await armazem.apagarTudo();
    } catch (e) {
      ctx.toast(e && e.message ? e.message : 'Não deu para apagar tudo.');
      return;
    }
    // armazem.apagarTudo() já tira do localStorage as chaves "tg2-" e as da v1.
    try { sessionStorage.setItem(CHAVE_AVISO, 'Tudo foi apagado deste aparelho. O app voltou ao começo.'); } catch { /* nada */ }
    // Recarrega para o app começar do zero (a config em memória ainda é a antiga).
    location.replace(`${location.pathname}${location.search}#mais`);
    location.reload();
  }

  const elemento = secao({ id: 'dados', titulo: 'Seus dados', sub: 'Tudo fica só neste aparelho. Se trocar ou perder o celular sem backup, os cálculos se perdem.' },
    subtitulo('Backup'),
    h('p', null, 'Baixa um arquivo com os cálculos salvos e as configurações. Para levar a outro aparelho, envie o arquivo para você mesmo e use Restaurar lá.'),
    ultimo,
    h('div', { class: 'grupo-botoes' },
      ui.botao({ texto: 'Fazer backup', icone: 'baixar', variante: 'primario', aoClicar: fazerBackup }),
      ui.botao({ texto: 'Restaurar de um arquivo', icone: 'enviar', aoClicar: () => arquivo.click() })),
    arquivo,
    subtitulo('Apagar tudo'),
    h('div', { class: 'mais-apagar' }, campoApagar, botaoApagar));

  return { elemento, atualizar() { desenharUltimo(); } };
}
