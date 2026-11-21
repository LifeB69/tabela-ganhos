// Tabela de Ganhos v2 — tela Calcular: Salvar, Compartilhar, Copiar resultado e Imprimir.
import { dataBR } from './util.js';

/** Etiquetas digitadas com vírgula: "casa, 2026" -> ['casa', '2026'] (sem repetidas). */
export function lerEtiquetas(texto) {
  return [...new Set(String(texto || '').split(/[,;\n]/).map((t) => t.trim().slice(0, 40)).filter(Boolean))].slice(0, 20);
}

/**
 * Folha "Salvar cálculo": título obrigatório, notas e etiquetas. Grava no esquema de docs/ARQUITETURA-UI.md (seção 6).
 * @param {object} ctx
 * @param {{ modo, entrada, data, resumo, tituloSugerido, salvoAberto }} info
 * @returns {Promise<object|null>} o salvo gravado, ou null se cancelou
 */
export async function abrirSalvar(ctx, { modo, entrada, data, resumo, tituloSugerido, salvoAberto }) {
  const { ui, motor } = ctx;
  const titulo = ui.campoTexto({
    // O título sugerido já vem escrito (e selecionado ao abrir): o caso comum é um toque só em "Salvar".
    rotulo: 'Título', valor: salvoAberto ? salvoAberto.titulo : (tituloSugerido || ''), maximo: 120,
    dica: 'Pode trocar. Ex.: Diarista de terça. Fica só neste aparelho.',
  });
  titulo.input.required = true;
  const notas = ui.campoTexto({ rotulo: 'Notas (opcional)', valor: salvoAberto ? salvoAberto.notas : '', multilinha: true, maximo: 5000 });
  const etiquetas = ui.campoTexto({
    rotulo: 'Etiquetas (opcional)', valor: salvoAberto ? salvoAberto.etiquetas.join(', ') : '', maximo: 400,
    dica: 'Separe com vírgula. Ex.: casa, 2026',
  });
  const como = salvoAberto ? ui.segmentos({
    rotulo: 'Como salvar', variante: 'igual', valor: 'atualizar',
    opcoes: [{ valor: 'atualizar', texto: 'Atualizar o salvo' }, { valor: 'novo', texto: 'Salvar como novo' }],
  }) : null;
  let gravado = null;

  const f = ui.folha({
    titulo: 'Salvar cálculo',
    conteudo: ui.h('div', { class: 'calc-folha pilha', dataset: { tela: 'calcular' } },
      ui.h('p', { class: 'texto-2' }, `${resumo.rotulo}: ${Number.isFinite(resumo.valor_centavos) ? motor.formatarBRL(resumo.valor_centavos) : '—'} · conta de ${dataBR(data)}`),
      como, titulo, notas, etiquetas),
    acoes: [
      { texto: 'Cancelar' },
      {
        texto: 'Salvar', variante: 'primario',
        aoClicar: async () => {
          const t = titulo.input.value.trim();
          if (!t) { titulo.mostrarErro('Escreva um título para achar o cálculo depois.'); titulo.input.focus(); return false; }
          const atualizar = salvoAberto && (!como || como.valor === 'atualizar');
          const salvo = {
            ...(atualizar ? { id: salvoAberto.id, fixado: salvoAberto.fixado } : { fixado: false }),
            titulo: t,
            notas: notas.input.value,
            etiquetas: lerEtiquetas(etiquetas.input.value),
            modo,
            entrada,
            resumo,
            data_referencia: data,
            parametros_versao: motor.PARAMETROS_VERSAO,
          };
          try {
            gravado = await ctx.armazem.salvarSalvo(salvo);
          } catch (e) {
            ctx.toast(e.message || 'Não deu para salvar.');
            return false;
          }
          return undefined;
        },
      },
    ],
  });
  await f.fechado;
  if (gravado) {
    ctx.toast(ctx.armazem.temporario
      ? 'Cálculo salvo. Atenção: neste navegador os salvos somem ao fechar o app.'
      : `Cálculo "${gravado.titulo}" salvo. Ele está na aba Salvos.`);
  }
  return gravado;
}

/**
 * Folha "Compartilhar": link só com números, texto pronto para WhatsApp e cópia.
 * @param {object} ctx
 * @param {{ modo, entrada, data, compart: { titulo, linhas, nota? } }} info
 */
export function abrirCompartilhar(ctx, { modo, entrada, data, compart }) {
  const { ui } = ctx;
  const c = ctx.compartilhar;
  let link;
  try { link = c.gerarLink({ modo, entrada, data }); } catch (e) { ctx.toast(e.message || 'Não deu para criar o link.'); return null; }
  const texto = c.textoWhatsApp({ titulo: compart.titulo, linhas: compart.linhas, data, link, nota: compart.nota || null });

  const campoLink = ui.campoTexto({ rotulo: 'Link do cálculo', valor: link, maximo: 4000, dica: 'Leva só os números da conta. Não leva título, notas nem nomes.' });
  campoLink.input.readOnly = true;
  campoLink.input.addEventListener('focus', () => campoLink.input.select());

  const copiarEAvisar = async (t, msg) => { ctx.toast((await c.copiar(t)) ? msg : 'Não deu para copiar. Selecione e copie à mão.'); };
  const whatsapp = ui.linkExterno(c.linkWhatsApp(texto), 'Enviar pelo WhatsApp', { classe: 'botao botao--primario calc-botao-link' });
  whatsapp.prepend(ui.icone('enviar'));

  const botoes = ui.h('div', { class: 'grupo-botoes' },
    whatsapp,
    ui.botao({ texto: 'Copiar link', icone: 'copiar', aoClicar: () => copiarEAvisar(link, 'Link copiado.') }),
    ui.botao({ texto: 'Copiar texto', icone: 'copiar', aoClicar: () => copiarEAvisar(texto, 'Texto copiado.') }),
    typeof navigator !== 'undefined' && navigator.share ? ui.botao({
      texto: 'Mais opções do celular', icone: 'compartilhar',
      aoClicar: async () => {
        const r = await c.compartilharNativo({ titulo: compart.titulo, texto, url: link });
        if (r === 'copiado') ctx.toast('Texto copiado.');
        else if (r === 'falhou') ctx.toast('Não deu para compartilhar.');
      },
    }) : null);

  const previa = ui.h('details', { class: 'calc-previa' },
    ui.h('summary', { class: 'calc-mais-resumo' }, ui.h('span', null, 'Ver o texto que vai'), ui.icone('seta')),
    ui.h('pre', { class: 'calc-texto' }, texto));

  return ui.folha({
    titulo: 'Compartilhar',
    conteudo: ui.h('div', { class: 'calc-folha pilha', dataset: { tela: 'calcular' } }, botoes, campoLink, previa,
      ui.h('p', { class: 'texto-2' }, 'Nada é enviado sem você tocar em enviar no WhatsApp.')),
    acoes: [{ texto: 'Fechar' }],
  });
}

/** Copia o resultado como texto (o mesmo do WhatsApp, sem link). */
export async function copiarResultado(ctx, { data, compart }) {
  const texto = ctx.compartilhar.textoWhatsApp({ titulo: compart.titulo, linhas: compart.linhas, data, nota: compart.nota || null });
  ctx.toast((await ctx.compartilhar.copiar(texto)) ? 'Resultado copiado. Cole onde quiser.' : 'Não deu para copiar.');
}
