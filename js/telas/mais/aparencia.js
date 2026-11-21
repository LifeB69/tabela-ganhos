// Tabela de Ganhos v2 — tela Mais: Aparência (visual, tema, letra grande, alto contraste, menos animação).
// Tudo aplica na hora (ctx.salvarConfig aplica no <html> e grava).
import { CONFIG_PADRAO } from '../../dados/config.js';
import { secao, interruptor, subtitulo } from './util.js';

const DESCRICAO_VISUAL = {
  a: 'Papel de recibo, letra estreita e selo de carimbo. Verde.',
  b: 'Faixa azul-marinho no topo, como um documento. Letra larga e calma.',
  c: 'Fita de máquina de somar, números em letra de máquina e tecla amarela.',
};

/** Mini-prévia desenhada só com caixas (decorativa: o nome e a descrição dizem o que é). */
function miniPrevia(ui, v) {
  const { h } = ui;
  const partes = {
    a: [h('span', { class: 'mais-mini-topo' }), h('span', { class: 'mais-mini-linha' }), h('span', { class: 'mais-mini-linha mais-mini-linha--curta' }),
      h('span', { class: 'mais-mini-numero' }, '54,04'), h('span', { class: 'mais-mini-selo' }, 'OK')],
    b: [h('span', { class: 'mais-mini-topo' }), h('span', { class: 'mais-mini-pagina' }), h('span', { class: 'mais-mini-numero' }, '54,04'),
      h('span', { class: 'mais-mini-botao' })],
    c: [h('span', { class: 'mais-mini-fita' }, h('span', { class: 'mais-mini-numero' }, '54,04'), h('span', { class: 'mais-mini-picote' })),
      h('span', { class: 'mais-mini-tecla' })],
  }[v];
  return h('span', { class: ['mais-mini', `mais-mini--${v}`], 'aria-hidden': 'true' }, partes);
}

/**
 * @returns {{ elemento: HTMLElement, atualizar: (cfg) => void }}
 */
export function montarAparencia(ctx) {
  const { ui } = ctx;
  const { h } = ui;
  const cfg = ctx.config;
  const padrao = CONFIG_PADRAO.visual;
  const ordem = [padrao, ...['a', 'b', 'c'].filter((v) => v !== padrao)];

  // Visual: grupo de opções (rádio nativo) com mini-prévia.
  const radios = {};
  const cartoes = ordem.map((v) => {
    const id = `mais-visual-${v}`;
    const input = h('input', { type: 'radio', name: 'mais-visual', id, value: v, class: 'mais-visual-radio', checked: cfg.visual === v,
      'aria-describedby': `${id}-desc` });
    input.addEventListener('change', () => {
      if (!input.checked) return;
      ctx.salvarConfig({ visual: v });
      ctx.anunciar(`Visual ${ctx.nomes.visual[v]} aplicado.`);
    });
    radios[v] = input;
    return h('label', { class: 'mais-visual', for: id },
      miniPrevia(ui, v),
      h('span', { class: 'mais-visual-textos' },
        h('span', { class: 'mais-visual-linha' },
          input,
          h('span', { class: 'mais-visual-nome' }, ctx.nomes.visual[v])),
        v === padrao ? h('span', { class: 'mais-visual-padrao' }, 'padrão, recomendado') : null,
        h('span', { class: 'mais-visual-desc', id: `${id}-desc` }, DESCRICAO_VISUAL[v])));
  });
  const grupoVisual = h('fieldset', { class: 'mais-fieldset' },
    h('legend', { class: 'grupo-rotulo' }, 'Visual do app'),
    h('div', { class: 'mais-visuais' }, cartoes),
    h('p', { class: 'campo-dica' }, 'Muda só a aparência. As contas e os seus dados continuam iguais.'));

  const tema = ui.segmentos({
    rotulo: 'Tema',
    variante: 'colado',
    valor: cfg.tema,
    opcoes: [
      { valor: 'auto', texto: 'Automático', rotulo: 'Automático, igual ao aparelho' },
      { valor: 'claro', texto: 'Claro' },
      { valor: 'escuro', texto: 'Escuro' },
    ],
    dica: 'Automático segue o modo claro ou escuro do aparelho.',
    aoMudar: (v) => ctx.salvarConfig({ tema: v }),
  });

  const letra = interruptor({
    rotulo: 'Letra grande',
    dica: 'Aumenta o texto de todas as telas.',
    ligado: cfg.letra === 'grande',
    aoMudar: (on) => ctx.salvarConfig({ letra: on ? 'grande' : 'normal' }),
  });
  const contraste = interruptor({
    rotulo: 'Alto contraste',
    dica: 'Textos e bordas mais escuros, para ler melhor no sol.',
    ligado: cfg.contraste === 'alto',
    aoMudar: (on) => ctx.salvarConfig({ contraste: on ? 'alto' : 'normal' }),
  });
  const movimento = interruptor({
    rotulo: 'Menos animação',
    dica: 'Tira as transições. Desligado, o app segue o que o aparelho pede.',
    ligado: cfg.movimento === 'reduzido',
    aoMudar: (on) => ctx.salvarConfig({ movimento: on ? 'reduzido' : 'auto' }),
  });

  const elemento = secao({ id: 'aparencia', titulo: 'Aparência', sub: 'Muda na hora e fica guardado neste aparelho.' },
    grupoVisual,
    tema,
    h('div', { class: 'mais-lista-switch' }, subtitulo('Para ler melhor'), letra, contraste, movimento));

  return {
    elemento,
    atualizar(c) {
      for (const [v, r] of Object.entries(radios)) r.checked = c.visual === v;
      tema.definir(c.tema);
      letra.definir(c.letra === 'grande');
      contraste.definir(c.contraste === 'alto');
      movimento.definir(c.movimento === 'reduzido');
    },
  };
}
