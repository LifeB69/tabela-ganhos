// Tabela de Ganhos v2 — tela Mais: Instalar como app e Sobre.
import { secao, subtitulo, dataBR } from './util.js';
import { VERSAO_APP } from '../../dados/config.js';

export { VERSAO_APP };
const REPOSITORIO = 'https://github.com/LifeB69/tabela-ganhos';

// ───── Evento de instalação ─────
// O Chrome dispara 'beforeinstallprompt' cedo, às vezes antes de a pessoa abrir esta tela.
// Guardamos aqui assim que este módulo carrega; se a estrutura guardar antes (window.tgEventoInstalar), usamos o dela.
let eventoInstalar = null;
const ouvintes = new Set();
function avisar() { ouvintes.forEach((f) => f()); }
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); eventoInstalar = e; avisar(); });
  window.addEventListener('tg:instalavel', avisar);   // a casca (js/app.js) guarda o evento logo na abertura e avisa por aqui
  window.addEventListener('appinstalled', () => { eventoInstalar = null; window.tgEventoInstalar = null; avisar(); });
}
function eventoDisponivel() { return eventoInstalar || window.tgEventoInstalar || null; }
function jaInstalado() {
  try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch { return false; }
}

/** Nomes das fontes oficiais (chaves de FONTES em dados/parametros.js). Sem nome aqui = mostra o endereço do site. */
const NOMES_FONTES = {
  decreto12797: 'Decreto 12.797/2025: salário mínimo de 2026',
  senadoMinimo2027: 'Agência Senado: mínimo previsto para 2027',
  ec141: 'Emenda Constitucional 141/2026: jornada de 42 e 40 horas',
  stfLiminar: 'STF: liminar sobre a data da jornada',
  decreto13173: 'Decreto 13.173/2026: divisor do salário-hora',
  clt: 'CLT (Decreto-Lei 5.452/1943)',
  lc150: 'Lei Complementar 150/2015: emprego doméstico',
  lei605: 'Lei 605/1949: repouso semanal remunerado',
  inss: 'INSS: tabela de contribuição mensal',
  salarioFamilia: 'INSS: salário-família',
  irrf2026: 'Receita Federal: tabelas do IR de 2026',
  lei15270: 'Lei 15.270/2025: redução do IR',
  carneLeao: 'Receita Federal: Carnê-Leão',
  manualEsocialDomestico: 'Manual do eSocial Doméstico (agosto de 2026)',
  daeVencimento: 'eSocial: vencimento do DAE',
  lei8036: 'Lei 8.036/1990: FGTS',
  lei8212: 'Lei 8.212/1991: Previdência Social',
  lei10666: 'Lei 10.666/2003: retenção do autônomo',
  lei8620: 'Lei 8.620/1993: INSS do 13º',
  decreto10854: 'Decreto 10.854/2021: vale-transporte',
  lei4090: 'Lei 4.090/1962: 13º salário',
  lei4749: 'Lei 4.749/1965: prazos do 13º',
  lc123: 'Lei Complementar 123/2006: MEI',
  lc238: 'Lei Complementar 238: novos limites do MEI',
  dasMei2026: 'Simples Nacional: DAS do MEI em 2026',
  meiDiarista: 'gov.br: atividades permitidas ao MEI',
  pisoSP: 'Lei estadual 18.471/2026: piso de SP',
  pisoRS: 'Governo do RS: piso regional de 2026',
  pisoSC: 'Alesc: piso estadual de SC',
  pisoPR: 'Governo do PR: piso estadual de 2026',
  pisoRJ: 'Lei estadual 8.315/2019: piso do RJ (não verificado)',
};

function hostDe(url) { try { return new URL(url).hostname.replace(/^www\d*\./, ''); } catch { return url; } }

// ───────────── Instalar ─────────────
export function montarInstalar(ctx) {
  const { ui } = ctx;
  const { h } = ui;
  const estado = h('div', { class: 'mais-instalar-estado' });

  async function instalar() {
    const ev = eventoDisponivel();
    if (!ev) return;
    try {
      ev.prompt();
      const escolha = await ev.userChoice;
      eventoInstalar = null; window.tgEventoInstalar = null;
      ctx.toast(escolha && escolha.outcome === 'accepted' ? 'Pronto. O app aparece na tela inicial.' : 'Instalação cancelada. Dá para instalar depois.');
    } catch {
      ctx.toast('Não deu para instalar agora. Use o menu do navegador.');
    }
    desenhar();
  }

  function desenhar() {
    if (jaInstalado()) {
      estado.replaceChildren(h('p', { class: 'mais-ok' }, ui.icone('ok', { tamanho: 'p' }), ' O app já está instalado neste aparelho.'));
    } else if (eventoDisponivel()) {
      estado.replaceChildren(ui.botao({ texto: 'Instalar o app', icone: 'baixar', variante: 'primario', aoClicar: instalar }));
    } else {
      estado.replaceChildren();
    }
  }
  ouvintes.add(desenhar);
  desenhar();

  const elemento = secao({ id: 'instalar', titulo: 'Instalar como app', sub: 'Fica com ícone na tela inicial e abre sem internet. Não ocupa quase nada e não pede nenhuma permissão.' },
    estado,
    h('div', { class: 'mais-passos-grade' },
      h('div', { class: 'mais-passos' },
        subtitulo('Android (Chrome)'),
        h('ol', { class: 'mais-ol' },
          h('li', null, 'Toque no menu ', h('strong', null, '⋮'), ' no canto de cima.'),
          h('li', null, 'Toque em ', h('strong', null, 'Instalar app'), ' ou ', h('strong', null, 'Adicionar à tela inicial'), '.'),
          h('li', null, 'Confirme.'))),
      h('div', { class: 'mais-passos' },
        subtitulo('iPhone (Safari)'),
        h('ol', { class: 'mais-ol' },
          h('li', null, 'Toque em ', h('strong', null, 'Compartilhar'), ' (o quadrado com a seta para cima).'),
          h('li', null, 'Toque em ', h('strong', null, 'Adicionar à Tela de Início'), '.'),
          h('li', null, 'Toque em ', h('strong', null, 'Adicionar'), '.')))));
  return { elemento, desmontar() { ouvintes.delete(desenhar); } };
}

// ───────────── Sobre ─────────────
export function montarSobre(ctx) {
  const { ui, motor } = ctx;
  const { h } = ui;
  const fontes = Object.entries(motor.FONTES)
    .map(([k, url]) => ({ url, nome: NOMES_FONTES[k] || hostDe(url) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  const elemento = secao({ id: 'sobre', titulo: 'Sobre' },
    h('dl', { class: 'mais-ficha' },
      h('div', null, h('dt', null, 'Versão do app'), h('dd', null, VERSAO_APP)),
      h('div', null, h('dt', null, 'Leis conferidas em'), h('dd', null, dataBR(motor.DATA_CONFERENCIA))),
      h('div', null, h('dt', null, 'Tabela de valores'), h('dd', null, `versão de ${dataBR(motor.PARAMETROS_VERSAO)}`)),
      h('div', null, h('dt', null, 'Armazenamento'), h('dd', null, ctx.armazem.temporario ? 'só nesta janela (some ao fechar)' : 'neste aparelho'))),

    subtitulo('Aviso legal'),
    h('div', { class: 'mais-texto' },
      h('p', null, 'A Tabela de Ganhos faz estimativas educativas. Não substitui contador, advogado nem o eSocial.'),
      h('p', null, 'As contas seguem as leis e tabelas oficiais listadas abaixo, na data indicada. Convenção ou acordo coletivo da categoria, decisão judicial ou regra nova podem mudar os valores. Confira sempre antes de pagar ou de assinar.'),
      h('p', null, 'Os alertas sobre vínculo de emprego dizem só que ', h('em', null, 'pode'), ' haver vínculo. Quem decide é a Justiça do Trabalho, olhando o caso real.'),
      h('p', null, 'Este app não é do governo e não tem ligação com o INSS, a Receita Federal ou o eSocial.')),

    subtitulo('Privacidade'),
    h('div', { class: 'mais-texto' },
      h('p', null, h('strong', null, 'Nada sai do seu aparelho.'), ' O app não tem servidor, não pede cadastro e não usa rastreador nem propaganda.'),
      h('p', null, 'Os cálculos e as configurações ficam guardados só neste navegador. Um link compartilhado leva só números, nunca nomes ou notas.')),

    subtitulo('Fontes oficiais'),
    h('p', null, 'Leis, decretos e páginas oficiais usados nas contas. Cada valor também mostra a sua fonte em Tabela legal e na aba Leis.'),
    h('details', { class: 'mais-detalhes' },
      h('summary', null, `Ver as ${fontes.length} fontes`),
      h('ul', { class: 'mais-fontes', role: 'list' }, fontes.map((f) => h('li', null, ui.linkExterno(f.url, f.nome, { icone: ui.icone('externo', { tamanho: 'p' }) }))))),

    subtitulo('Código aberto'),
    h('p', null, 'Qualquer pessoa pode ler o código do app e conferir que ele não envia nada.'),
    ui.linkExterno(REPOSITORIO, 'Ver o código no GitHub', { classe: 'mais-link-solto', icone: ui.icone('externo', { tamanho: 'p' }) }),
    h('p', { class: 'campo-dica' }, 'Letras: Barlow, Libre Franklin, Noto Sans e Red Hat, com licença aberta (SIL OFL), guardadas no próprio app.'));
  return { elemento };
}
