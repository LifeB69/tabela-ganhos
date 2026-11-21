// Vitrine de componentes (só para teste e para os agentes das telas verem o visual de cada peça).
import * as motor from '../js/motor/index.js';
import * as ui from '../js/ui/index.js';
import { verificar } from './verificar-ui.js';

const q = new URLSearchParams(location.search);
const raiz = document.getElementById('tela');
const data = '2026-11-20';
const dom = motor.calcularDomestico({ salario: '1.621,00', uf: 'SP' }, data);
const dia = motor.calcularDiarista({ valorDiaria: '200', diasDaSemana: [1, 3, 5], mesmaResidencia: true }, data);
const pisos = motor.tabelaPisos(data).resultado.linhas;
const r = dom.resultado;

const conta = ui.listaConta(dom.passos.filter((p) => ['inss_total', 'irrf_total', 'liquido', 'encargos', 'dae', 'custo_mensal'].includes(p.id)),
  { aberto: true, idsTotal: ['custo_mensal'], idsDesconto: ['inss_total', 'irrf_total'] });

ui.trocar(raiz, ui.h('section', { class: 'tela' },
  ui.cabecalhoTela({ titulo: 'Vitrine', sub: 'Todos os componentes, com os números de 2026.' }),
  ui.h('div', { class: 'bloco' },
    ui.segmentos({ rotulo: 'Modo de cálculo', variante: 'colado', valor: 'domestico', opcoes: [
      { valor: 'porHora', texto: 'Por hora' }, { valor: 'diarista', texto: 'Diarista' }, { valor: 'domestico', texto: 'Doméstico' }] }),
    ui.botao({ texto: 'Não sei qual é o meu', variante: 'texto' }),
    ui.h('div', { class: 'grade-2' },
      ui.campoDinheiro({ rotulo: 'Salário mensal', valor: 162100, dica: 'O valor combinado, antes dos descontos.', largo: true }),
      ui.campoSelecao({ rotulo: 'Estado', valor: 'SP', opcoes: motor.UFS.map((u) => ({ valor: u, texto: u })) }),
      ui.campoNumero({ rotulo: 'Dependentes', valor: 0, min: 0, max: 10, unidade: 'dependentes' })),
    ui.seletorDias({ valor: [1, 3, 5], dica: 'Toque nos dias em que a pessoa trabalha.' }),
    ui.campoDinheiro({ rotulo: 'Valor com erro', valor: 'abc' })),
  ui.cartaoResultado({
    titulo: 'Você paga por mês', meta: 'nov/2026', valorCentavos: r.custo_mensal, extenso: true,
    linhas: [
      { rotulo: 'A pessoa recebe', detalhe: 'líquido, já sem o INSS dela', valorCentavos: r.liquido, grande: true },
      { rotulo: 'Guia DAE', detalhe: 'vence em 18/12/2026', valorCentavos: r.dae, grande: true },
    ],
    acoes: [{ texto: 'Salvar', icone: 'guardar', aoClicar: () => ui.toast('Salvo.', { desfazer: () => {} }) }, { texto: 'Compartilhar', icone: 'compartilhar', aoClicar: () => {} }],
  }),
  ui.alertas([...dom.alertas, ...dia.alertas]),
  conta,
  ui.h('div', { class: 'bloco bloco--papel' },
    ui.h('h2', { class: 'bloco-titulo' }, 'Selos e botões'),
    ui.h('div', { class: 'linha' }, ui.TIPOS_SELO.map((t) => ui.selo(t))),
    ui.h('div', { class: 'grupo-botoes' }, ui.botao({ texto: 'Primário', variante: 'primario' }), ui.botao({ texto: 'Secundário' }), ui.botao({ texto: 'Apagar', variante: 'perigo', icone: 'lixeira' })),
    ui.segmentos({ rotulo: 'Filtro', variante: 'chips', valor: 'todos', opcoes: [{ valor: 'todos', texto: 'Todos' }, { valor: 'diarista', texto: 'Diarista' }, { valor: 'domestico', texto: 'Doméstico' }] })),
  ui.tabela({
    legenda: 'Piso do doméstico por estado (2026)', fixarPrimeira: true, zebra: true,
    colunas: [{ rotulo: 'UF' }, { rotulo: 'Piso', numerica: true }, { rotulo: 'Por hora', numerica: true }, { rotulo: 'Situação' }],
    linhas: pisos.map((l) => [l.uf, motor.formatarBRL(l.usado_no_calculo), motor.formatarBRL(l.hora), l.status === 'vigente' ? 'Vigente' : ui.selo(l.status === 'previsto' ? 'previsto' : 'nao_verificado')]),
  }),
  ui.estadoVazio({ titulo: 'Nenhum cálculo salvo ainda', texto: 'Quando você salvar um cálculo, ele aparece aqui.', acao: { texto: 'Fazer um cálculo', href: '#calcular' } }),
));

if (q.get('folha') === '1') {
  ui.folha({ titulo: 'Salvar cálculo', conteudo: [ui.campoTexto({ rotulo: 'Título', valor: 'Diarista da Ana' }), ui.campoTexto({ rotulo: 'Notas', multilinha: true })],
    acoes: [{ texto: 'Cancelar' }, { texto: 'Salvar', variante: 'primario' }] });
}
if (q.get('dialogo') === '1') ui.confirmar({ titulo: 'Apagar tudo?', texto: 'Isto apaga os cálculos e as configurações deste aparelho. Não dá para desfazer.', confirmar: 'Apagar tudo', perigo: true });
if (q.get('toast') === '1') ui.toast('Cálculo apagado.', { desfazer: () => {}, duracao: 60000 });
if (q.get('verificar') === '1') setTimeout(() => verificar(), 300);
