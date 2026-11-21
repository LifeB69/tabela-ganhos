# Arquitetura da interface: Tabela de Ganhos v2

Contrato para quem constrói as telas (Calcular, Tabela, Salvos, Leis, Mais). Versão de 2026-11-20 (UTC).
Leia junto: `docs/PLANO.md` (o que cada tela faz), `docs/MOTOR.md` (as contas) e `design/REFERENCIAS.md` (os três visuais).

---

## 1. Princípios

- **Sem etapa de build.** HTML, CSS e JavaScript puros, com módulos ES nativos. O navegador lê os arquivos direto.
- **Sem backend, sem rastreador, sem nada de fora.** Fontes, ícones e scripts estão no próprio site. A CSP do `index.html` bloqueia qualquer outra origem.
- **Dados só no aparelho.** IndexedDB, com reserva em localStorage e em memória.
- **Sem script nem estilo em linha.** A CSP é `script-src 'self'; style-src 'self'`: nada de `<script>` no HTML, `onclick=""`, `style=""` ou `el.setAttribute('style', …)`. Use classes. (`el.style.x = …` pelo CSSOM funciona, mas evite: prefira classe.)
- **Nunca `innerHTML` com texto.** Use `ctx.ui.h()` e os componentes: todo texto entra como texto. Isso vale em dobro para o que vem do usuário (título, notas, etiquetas) e de backup importado.
- **O motor não muda.** Erros que você achar no motor vão para `docs/PENDENCIAS-UI.md`.
- **Visual padrão: A, "Talão e carimbo"** (a proposta marcada "Recomendada"), com troca para B "Carteira azul" e C "Bobina da somadora" em Mais → Aparência. A tarefa calculada pedia B como padrão; a mensagem do dono ("A recomendado mas com opção de trocar nas configurações") vence. Para mudar o padrão, troque só `VISUAL_PADRAO` em `js/dados/config.js` e o `data-visual` inicial em `index.html` e em `js/pre-tema.js`. O esqueleto de `js/telas/mais.js` já traz a escolha de **visual e tema**; o agente das Configurações deve manter essas duas escolhas (e acrescentar letra grande, alto contraste e menos animação via `ctx.salvarConfig`).

---

## 2. Pastas e donos

```
index.html               casca (cabeçalho, 5 abas, <main id="tela">, aviso legal)       ESTRUTURA
manifest.webmanifest, sw.js, icon-*.png                                                  ESTRUTURA
fontes/*.woff2 + LICENCAS.md   fontes hospedadas (OFL), subconjunto latin                ESTRUTURA
css/tokens.css           cores, tipo e forma dos 3 visuais × claro/escuro + ajustes       ESTRUTURA
css/base.css             reset, casca, estrutura de tela, utilidades                      ESTRUTURA
css/componentes.css      componentes de js/ui/                                            ESTRUTURA
css/impressao.css        impressão / PDF                                                  ESTRUTURA
css/telas/<nome>.css     CSS próprio de cada tela (criado pelo agente da tela)            CADA TELA
js/pre-tema.js           aplica a aparência antes da 1ª pintura                           ESTRUTURA
js/app.js                inicialização, roteador, ctx                                     ESTRUTURA
js/compartilhar.js       link #c=, texto de WhatsApp, copiar                              ESTRUTURA
js/dados/armazem.js      IndexedDB / localStorage / memória                               ESTRUTURA
js/dados/config.js       config padrão, validação, migração da v1                         ESTRUTURA
js/ui/*.js               componentes (index.js reexporta tudo)                            ESTRUTURA
js/telas/<nome>.js       uma tela por arquivo: calcular, tabela, salvos, leis, mais       CADA TELA
js/telas/<nome>/…        submódulos da tela, se precisar (ex.: js/telas/calcular/diarista.js)  CADA TELA
js/motor/*.js, dados/parametros.js   motor e parâmetros legais                            NÃO TOCAR
testes/*.test.mjs        testes do motor e da camada de dados (node --test)
testes/vitrine.html      todos os componentes com dados reais (para ver e testar)
testes/verificar-ui.js   checagem automática: contraste, alvos de 44 px, rolagem lateral
testes/moldura.html      mostra o app num iframe de largura exata (o Chrome sem janela não abre < 500 px)
legado/index-v1.html     cópia do app v1, só para consulta
```

**Cada agente de tela mexe só em:** `js/telas/<sua-tela>.js`, `js/telas/<sua-tela>/…` e `css/telas/<sua-tela>.css`. Se precisar de algo nos arquivos de ESTRUTURA (um componente novo, um token, um ícone), descreva o pedido no seu relatório em vez de editar; se for indispensável, acrescente sem mudar o que já existe e avise.

---

## 3. Ciclo de vida de uma tela

```js
// js/telas/salvos.js
export async function montar(raiz, ctx) { … }        // obrigatório
export function desmontar() { … }                     // opcional: tire ouvintes globais, timers
export async function aoMudarRota(rota, ctx) { … }   // opcional: troca de sub-rota sem remontar
```

- O roteador importa `js/telas/<nome>.js` **sob demanda** quando a aba é aberta.
- `raiz` é um `<div class="tela-raiz" data-tela="<nome>">` vazio, já dentro de `<main id="tela">`. Monte tudo dentro dele.
- Comece **sempre** com `ctx.ui.cabecalhoTela({ titulo, sub })`. Ele cria o `<h1 id="titulo-tela" tabindex="-1" data-titulo-tela>`. Ao trocar de aba, o roteador põe o foco nesse h1, rola para o topo, muda o `document.title` e anuncia "Tela X" para leitor de tela. Na primeira abertura do app o foco não é movido.
- Envolva a tela em `<section class="tela" aria-labelledby="titulo-tela">`.
- Carregue o seu CSS no começo: `await ctx.carregarCss('css/telas/<nome>.css');` (caminho relativo ao `index.html`; carrega uma vez só; resolve mesmo se o arquivo faltar).
- Se `montar` lançar erro, o roteador mostra "Não deu para abrir esta tela" com "Tentar de novo".
- Ao sair da tela, o roteador chama `desmontar()` e troca o conteúdo do `<main>`. Folhas e diálogos abertos são fechados sozinhos quando a rota muda.

### Rotas

| Hash | Tela | `ctx.rota` |
|---|---|---|
| vazio, `#calcular` | calcular | `{ tela: 'calcular', sub: null }` |
| `#tabela`, `#salvos`, `#leis`, `#mais` | a aba | `sub: null` |
| `#leis/glossario`, `#leis/faq/dsr`, `#mais/backup` | a aba | `sub: 'glossario'` etc. (até 4 partes, `[a-z0-9-]`) |
| `#salvos?etiqueta=casa` | salvos | `params: URLSearchParams` |
| `#calcular?salvo=<id>` | calcular | abre o salvo (Salvos, busca de Leis) |
| `#calcular?modo=porHora\|diarista\|domestico` | calcular | abre nesse modo ("Usar na calculadora" de Leis) |
| `#calcular?de=tabela&valorHora=<centavos>&horasDia=<n>&dias=<n>` | calcular | Por hora preenchido, com o aviso "Números vindos da Tabela" |
| `#c=<código>` | calcular | `compartilhado: { ok: true, estado: { modo, entrada, data } }` ou `{ ok: false, erro }` |
| qualquer outra coisa | calcular | `desconhecida: true` |

- `ctx.rota` = `{ tela, sub, params, compartilhado, hash, desconhecida? }`.
- Trocar de tela: links normais (`<a href="#leis/glossario">`) ou `ctx.navegar('#leis/glossario')`. Use `ctx.navegar('#calcular', { substituir: true })` para não criar entrada no histórico (por exemplo, depois de abrir um link `#c=` já aplicado).
- O botão voltar do celular funciona porque tudo é hash.
- Sem `aoMudarRota`, uma troca de sub-rota **remonta** a tela. Com `aoMudarRota`, a tela decide o que fazer (o foco não é movido; mova você para o título da seção nova, se fizer sentido).

**Calcular e o link compartilhado:** quando `ctx.rota.compartilhado?.ok`, preencha o modo e os campos com `estado.entrada`, use `estado.data` como data do cálculo (se houver) e mostre um alerta `info` "Cálculo aberto por um link". Com `ok: false`, mostre `ctx.toast(compartilhado.erro)` e abra a calculadora normal.

---

## 4. `ctx`: o contexto passado às telas

| Membro | Tipo | O que faz |
|---|---|---|
| `ctx.config` | getter → objeto | **Cópia** da configuração atual (mudar a cópia não muda nada). |
| `ctx.salvarConfig(parcial)` | `async (object) => config` | Mescla e grava. `padroes`, `opcoesNaoVerificadas`, `calcular`, `tabela`, `backup` e `overrides` são mesclados por chave; `overrides: { chave: null }` apaga a chave. Aplica a aparência na hora e dispara `window` → `'tg:config'` com `detail: { config, mudou: [chaves] }`. |
| `ctx.rota` | getter | Rota atual (seção 3). |
| `ctx.navegar(hash, { substituir? })` | função | Vai para outra rota. |
| `ctx.armazem` | objeto | API de dados (seção 6). |
| `ctx.motor` | módulo | Tudo de `js/motor/index.js` (`calcularPorHora`, `calcularDiarista`, `calcularDomestico`, `tabelaMinimo`, `tabelaPisos`, `formatarBRL`, `parseDinheiro`, `UFS`, `DATA_CONFERENCIA`, `PARAMETROS_VERSAO`…). |
| `ctx.ui` | módulo | Componentes (seção 5). |
| `ctx.toast(msg, { desfazer?, duracao? })` | função | Aviso curto embaixo; com `desfazer`, mostra o botão "Desfazer". |
| `ctx.anunciar(msg)` | função | Fala uma frase curta para leitor de tela (região viva `#anuncio`). |
| `ctx.carregarCss(href)` | `async` | Carrega o CSS da tela uma vez. |
| `ctx.dataReferencia()` | `() => 'AAAA-MM-DD'` | Hoje, ou a data fixada em Configurações. **Passe sempre ao motor.** |
| `ctx.hoje()` | `() => 'AAAA-MM-DD'` | Hoje no fuso do aparelho. |
| `ctx.arredondamentoCentavos()` | `() => 0 \| 50 \| 100 \| 500` | Para `calcularPorHora(…, { arredondamento })`. |
| `ctx.overrides()` | `() => object` | Valores editados à mão, para `{ overrides }` do motor. |
| `ctx.nomes` | objeto | Nomes para mostrar: `nomes.modo.porHora` = "Por hora", `nomes.visual.a` = "Talão e carimbo", `nomes.tema`, `nomes.arredondamento`. |
| `ctx.versaoApp` | texto | Versão do app (`VERSAO_APP` de `js/dados/config.js`; igual a `VERSAO` do `sw.js`). |
| `ctx.compartilhar` | objeto | `gerarLink`, `lerLink`, `textoWhatsApp`, `linkWhatsApp`, `copiar`, `compartilharNativo` (seção 7). |

**Exemplo de cálculo dentro de uma tela:**

```js
const { motor, ui } = ctx;
const data = ctx.dataReferencia();
const cfg = ctx.config;
const r = motor.calcularDomestico({ salario: campo.lerCentavos(), uf: cfg.uf, grupoPR: cfg.grupoPR }, data, { overrides: ctx.overrides() });
cartao.atualizar({ valorCentavos: r.resultado.custo_mensal });
conta.atualizar(r.passos);
avisos.atualizar(r.alertas);
```

**Ouvir mudança de config** (por exemplo, o botão de tema do cabeçalho ou a config que chegou atrasada do armazenamento):

```js
const ouvir = (e) => { if (e.detail.mudou.includes('uf')) recalcular(); };
window.addEventListener('tg:config', ouvir);
export function desmontar() { window.removeEventListener('tg:config', ouvir); }
```

### Configuração (esquema)

```js
{
  visual: 'a' | 'b' | 'c',                 // padrão 'a'
  tema: 'auto' | 'claro' | 'escuro',
  letra: 'normal' | 'grande',
  contraste: 'normal' | 'alto',
  movimento: 'auto' | 'reduzido',
  uf: '' | 'SP' | …,                       // '' = não informado (usa o mínimo nacional)
  grupoPR: 'I' | 'II' | 'III' | 'IV',      // padrão 'II'
  padroes: { valorHora: '' (texto, ex. '12,00'), horasDia: 4, diasSemana: [1,2,3,4,5] (0 = domingo), modoInicial: 'porHora' | 'inverso' | 'diarista' | 'domestico' },
  arredondamento: 'nenhum' | '0,50' | '1' | '5',
  dataReferencia: 'auto' | 'AAAA-MM-DD',
  overrides: { [chave]: número (chave [A-Za-z0-9_], ex. piso_domestico_SP), jornada_datas?: { jornada_42?, jornada_40? } },
  opcoesNaoVerificadas: { [chave]: boolean },   // opções "não verificado", desligadas por padrão
  calcular: { modo?, porHora?, diarista?, domestico? },   // último estado de cada modo (entradas passadas por limparEntrada)
  tabela: { valores?: centavos[] (1 a 5), diasDe?, diasAte? (1..31), horasDe?, horasAte? (1..24), ver?: 'todos'|'minimo'|'v0'..'v4' },
  backup: { ultimo: ISO | null, lembreteAdiadoAte: ISO | null },   // lembrete de backup (Salvos e Mais)
  legadoV1?: { migrado_em, visao_tabela?, calc?: { horasDia, dias, valorHora, orcamento } }   // só se havia dados da v1
}
```

A migração da v1 (`tg-theme`, `tg-view`, `tg-calc` do localStorage) roda uma vez, na primeira abertura: tema vira `tema`, valor/hora e horas/dia viram `padroes`, e o resto fica em `legadoV1` (a tela Tabela pode usar `legadoV1.calc.dias` e `legadoV1.visao_tabela`).

---

## 5. Componentes (`ctx.ui`)

Todos devolvem **elementos DOM**. Os que têm estado trazem métodos pendurados no elemento.

### Construção

| Função | Assinatura | Notas |
|---|---|---|
| `h` | `h(tag, atributos?, ...filhos)` | `class` (texto ou lista), `dataset`, `on: { click }`, `aria-*`, `true` = atributo vazio, `false/null` = omitido. `value/checked/disabled/hidden/open/selected` viram propriedades. `href/src` passam por `urlSegura` (bloqueia `javascript:`). `style` lança erro. |
| `trocar(el, ...filhos)` | troca o conteúdo | |
| `anexar(el, filhos[])` | acrescenta | |
| `idUnico(prefixo)` | `'prefixo-7'` | para ligar rótulo e campo |
| `linkExterno(href, texto, { classe, icone })` | `<a target=_blank rel="noopener noreferrer">` + "(abre em nova aba)" para leitor de tela | |
| `icone(nome, { tamanho: 'p'\|'n'\|'g', rotulo?, classe? })` | `<svg class="icone">` | sem `rotulo` = `aria-hidden`. Nomes: `NOMES_ICONES` (calcular, tabela, salvos, leis, mais, externo, seta, voltar, avancar, nota, fixar, busca, menos, somar, compartilhar, guardar, sol, lua, copiar, fechar, lixeira, editar, imprimir, baixar, enviar, ok, info, atencao, risco, previsto, nao_verificado, vazio, construcao, pessoa, calendario). |

### Estrutura e básicos

```js
ui.cabecalhoTela({ titulo: 'Salvos', sub: 'Os cálculos que você guardou neste aparelho.' })
ui.botao({ texto: 'Salvar', icone: 'guardar', variante: 'primario', aoClicar })   // variantes: primario | secundario | texto | perigo | icone (com rotulo)
ui.botao({ variante: 'icone', icone: 'fechar', rotulo: 'Fechar', aoClicar })
ui.estadoVazio({ titulo: 'Nenhum cálculo salvo ainda', texto: '…', icone: 'vazio', acao: { texto: 'Fazer um cálculo', href: '#calcular' } })
ui.tabela({ legenda, colunas: [{ rotulo: 'UF' }, { rotulo: 'Piso', numerica: true }], linhas: [['SP', 'R$ 1.874,36']],
            fixarPrimeira: true, zebra: true, empilhada: false })   // devolve div.tabela-rolavel (rola sozinha, com foco por teclado)
ui.anunciar('Resultado: R$ 1.945,20 por mês')
```

### Campos

```js
const sal = ui.campoDinheiro({ rotulo: 'Salário mensal', valor: 162100, dica: 'O valor combinado, antes dos descontos.', largo: true,
  aoMudar: (centavos, { texto, valido }) => recalcular() });
sal.lerCentavos();   // 162100 ou null
sal.definir(200000); sal.definir('1.621,00'); sal.definir(null);
sal.mostrarErro('Preencha o salário.'); sal.mostrarErro(null);
sal.input            // o <input inputmode="decimal">
```
Aceita "1.621,00", "1621", "R$ 1621", "1621,5"; formata ao sair do campo; recusa negativo e acima de R$ 1 bilhão com mensagem. Não mostra erro enquanto a pessoa digita, só ao sair.

```js
const horas = ui.campoNumero({ rotulo: 'Horas por dia', valor: 4, min: 0.5, max: 24, passo: 0.5, unidade: 'horas', aoMudar: (n) => … });
horas.lerValor(); horas.definir(6);
ui.campoTexto({ rotulo: 'Título', valor: '', maximo: 120 })            // .input
ui.campoTexto({ rotulo: 'Notas', multilinha: true, maximo: 5000 })
ui.campoTexto({ rotulo: 'Buscar', tipo: 'search' })
ui.campoSelecao({ rotulo: 'Estado', valor: 'SP', opcoes: motor.UFS.map((u) => ({ valor: u, texto: u })), aoMudar })
const modo = ui.segmentos({ rotulo: 'Modo de cálculo', variante: 'colado', valor: 'porHora',
  opcoes: [{ valor: 'porHora', texto: 'Por hora' }, { valor: 'diarista', texto: 'Diarista' }, { valor: 'domestico', texto: 'Doméstico' }], aoMudar });
modo.valor; modo.definir('diarista');
// variantes: livre | igual (colunas iguais) | colado (segmentado) | dias (7 colunas) | chips (filtros em pílula); multiplo: true para vários
ui.seletorDias({ rotulo: 'Dias da semana', valor: [1, 3, 5], aoMudar: (dias) => … })   // rótulo falado: "segunda-feira" etc.
```
Para pôr dois campos lado a lado use `<div class="grade-2">` (no visual C vira uma coluna: é a fita). `largo: true` ocupa a linha toda.

### Resultado, conta, alertas e selos

```js
const cartao = ui.cartaoResultado({
  titulo: 'Você paga por mês', meta: 'nov/2026', valorCentavos: r.resultado.custo_mensal, extenso: true,
  linhas: [{ rotulo: 'A pessoa recebe', detalhe: 'líquido, já sem o INSS dela', valorCentavos: r.resultado.liquido, grande: true },
           { rotulo: 'Guia DAE', detalhe: 'vence em 18/12/2026', valorCentavos: r.resultado.dae }],
  acoes: [{ texto: 'Salvar', icone: 'guardar', aoClicar: salvar }, { texto: 'Compartilhar', icone: 'compartilhar', aoClicar: compartilhar }],
  vazio: 'Preencha o salário',            // aparece quando valorCentavos é null
});
cartao.atualizar({ valorCentavos: 194520 });   // a 1ª ação é primária; as outras, secundárias

const conta = ui.listaConta(r.passos, { aberto: false, idsTotal: ['custo_mensal'], idsDesconto: ['inss_total', 'irrf_total'], ocultar: [] });
conta.atualizar(novosPassos);
// cada passo: rótulo … valor (R$ só para leitor de tela), fórmula, selos (previsto / não verificado / editado por você) e "lei ↗" em nova aba

const avisos = ui.alertas(r.alertas);         // ordena risco > atenção > info; ignora 'estimativa' (já está no rodapé fixo)
avisos.atualizar(novos);                      // fica hidden quando não há alertas
ui.alerta({ nivel: 'risco', titulo: 'Pode ser emprego doméstico', texto: '…', fonte_url, lei: 'LC 150, art. 1º', acoes: [{ texto: 'Ver como doméstico', aoClicar }] })
ui.selo('previsto') | ui.selo('nao_verificado') | ui.selo('editado') | ui.selo('exemplo') | ui.selo('ok') | ui.selo('info') | ui.selo('risco') | ui.selo('previsto', 'Previsto para 2027')
ui.selosDoPasso(passoOuParametro)             // lista de selos conforme status e editado_por_usuario
ui.listaResumo(linhas)                        // a lista rótulo/valor sem o cartão
```
Alerta: ícone de forma diferente por nível (círculo, triângulo, octógono) + a palavra "Para saber:", "Atenção:" ou "Risco:" + título. Nunca depende só de cor.

### Sobreposições

```js
const f = ui.folha({ titulo: 'Salvar cálculo', conteudo: [campoTitulo, campoNotas],   // ou (fechar) => Node
  acoes: [{ texto: 'Cancelar' }, { texto: 'Salvar', variante: 'primario', aoClicar: async (fechar) => { await salvar(); } }],
  tipo: 'folha' });                     // 'folha' sobe de baixo; 'dialogo' fica no meio
await f.fechado;                         // valor da ação (ou null)
// <dialog> modal, aria-labelledby, foco preso, Esc fecha, toque fora fecha (folha), foco volta para quem abriu.
// aoClicar pode devolver false para não fechar (ex.: campo com erro).

if (await ui.confirmar({ titulo: 'Apagar tudo?', texto: 'Não dá para desfazer.', confirmar: 'Apagar tudo', perigo: true })) { … }

ctx.toast('Cálculo apagado.', { desfazer: () => ctx.armazem.restaurarSalvo(apagado) });   // 8 s com desfazer, 4,5 s sem
```

Veja todos funcionando em `testes/vitrine.html` (também `?folha=1`, `?dialogo=1`, `?toast=1`).

---

## 6. Armazenamento (`ctx.armazem`)

Base IndexedDB `tabela-ganhos` (versão 1), stores `config` (chaves `principal` e `meta`) e `salvos` (chave `id`). Reserva: localStorage (`tg2-config`, `tg2-salvos`); se tudo falhar, memória. Espelho síncrono da aparência em `tg2-aparencia` (o `pre-tema.js` lê antes da primeira pintura).

| Método | Retorno | Erros |
|---|---|---|
| `iniciar()` | `'indexeddb' \| 'localstorage' \| 'memoria'` | — |
| `tipo`, `temporario` | getters | `temporario = true` no modo memória: avise em Salvos que os dados somem ao fechar |
| `obterConfig()` | config completa | nunca lança |
| `salvarConfig(cfg)` | config gravada | lança `Error` com mensagem em português (use `ctx.salvarConfig`, que já trata) |
| `listarSalvos()` | `salvo[]` (fixados primeiro, depois mais recentes) | nunca lança |
| `obterSalvo(id)` | `salvo \| null` | nunca lança |
| `salvarSalvo(salvo)` | salvo gravado (sem `id` = novo; atualiza `editado_em`, mantém `criado_em`) | lança com mensagem |
| `apagarSalvo(id)` | o salvo apagado (para o "desfazer") | lança com mensagem |
| `restaurarSalvo(salvo)` | salvo (mesmo `id` e datas) | lança com mensagem |
| `fixarSalvo(id, fixado)` | salvo (sem mudar `editado_em`) ou `null` | lança com mensagem |
| `exportarTudo()` | `{ formato: 'tabela-ganhos-backup', versao_formato: 1, exportado_em, parametros_versao, config, salvos }` | — |
| `importarTudo(textoOuObjeto, { modo: 'juntar'\|'substituir', importarConfig: true })` | `{ ok, mensagem, salvos_importados, ignorados, ja_aqui, ilegiveis, config_importada }` (`ignorados = ja_aqui + ilegiveis`) | formato ruim volta `ok: false` com mensagem; falha de gravação lança |
| `apagarTudo()` | — | apaga config, salvos, espelho, as chaves da v1 e toda chave `tg2-` do localStorage. **A tela confirma antes.** |

Escritas lançam `Error` com `message` pronta para o usuário: `try { … } catch (e) { ctx.toast(e.message); }`.

**Esquema do salvo:**

```js
{
  id: 'uuid', titulo: 'Diarista da Ana' (≤ 120), notas: '' (≤ 5000), etiquetas: ['casa'] (≤ 20, cada ≤ 40), fixado: false,
  modo: 'porHora' | 'inverso' | 'diarista' | 'domestico',
  entrada: { … }            // a entrada do motor, só dados simples (números, textos ≤ 200, sim/não, listas, 1 nível de objeto)
  resumo: { rotulo: 'Você paga por mês', valor_centavos: 194520 },
  data_referencia: '2026-11-20' | null, parametros_versao: '2026-11-20',
  criado_em: ISO, editado_em: ISO
}
```
Ao reabrir um salvo com `parametros_versao` diferente de `motor.PARAMETROS_VERSAO`, avise "este cálculo usou os valores de …; recalcular com os atuais?" (PLANO 4.3).

---

## 7. Compartilhar (`ctx.compartilhar`)

```js
const url = ctx.compartilhar.gerarLink({ modo: 'diarista', entrada: { valorDiaria: 20000, diasDaSemana: [2, 4], mesmaResidencia: true }, data: ctx.dataReferencia() });
// -> https://…/index.html#c=eyJ2IjoxLCJtIjoiZGlhcmlzdGEiLC…
ctx.compartilhar.lerLink(location.hash)   // { ok: true, estado: { modo, entrada, data } } | { ok: false, erro: 'O link está incompleto ou foi alterado.' }
const texto = ctx.compartilhar.textoWhatsApp({ titulo: 'Diarista: custo do mês', data, link: url,
  linhas: [{ rotulo: 'Custo do mês', valor_centavos: 160000 }, { rotulo: 'Dias', texto: '8' }] });   // já termina com o aviso legal
ctx.compartilhar.linkWhatsApp(texto)      // https://wa.me/?text=… (abre o WhatsApp; nada é enviado sem a pessoa tocar)
await ctx.compartilhar.copiar(texto)      // true/false (clipboard + reserva)
await ctx.compartilhar.compartilharNativo({ titulo, texto, url })   // 'compartilhado' | 'copiado' | 'cancelado' | 'falhou'
```

**O que entra no link** (o resto é descartado em silêncio por `gerarLink` e recusado por `lerLink`): números; sim/não; listas de números; texto numérico como `"1.621,00"` ou `"4,5"`; e só estes textos: `tipo` (`mensalista`/`horista`), `uf`, `grupoPR`, `unidade`, `metodo`, `mes` (`AAAA-MM`). Nunca título, notas, nomes, CPF ou chave Pix. Use nomes de campo do motor (`valorHora`, `horasDia`, `dias`, `diasDaSemana`, `salario`…), até 30 chaves.

---

## 8. CSS

### Ordem dos arquivos
`tokens.css` → `base.css` → `componentes.css` → (CSS das telas, inserido pelo `carregarCss` antes da impressão) → `impressao.css` (`media="print"`).

### Seletores de aparência no `<html>`
`data-visual="a|b|c"`, `data-tema="auto|claro|escuro"`, `data-letra="normal|grande"`, `data-contraste="normal|alto"`, `data-movimento="auto|reduzido"`.
Para teste, a querystring muda tudo sem salvar: `index.html?visual=c&tema=escuro&letra=grande&contraste=alto#tabela`.

### Tokens (use só estes; nunca cor solta)

| Grupo | Tokens |
|---|---|
| Fundo e superfície | `--cor-fundo` (página), `--cor-superficie` (papel/cartão/campo/barra), `--cor-superficie-2` (linha alternada, realce) |
| Texto | `--cor-texto`, `--cor-texto-2` (secundário), `--cor-rotulo` (rótulo de campo) |
| Cabeçalho | `--cor-topo`, `--cor-sobre-topo`, `--cor-sobre-topo-2`, `--cor-faixa-topo` |
| Ação | `--cor-acao` (links, bordas de botão), `--cor-sobre-acao`, `--cor-acao-fundo` (hover, destaque leve) |
| Botão principal | `--cor-primario`, `--cor-sobre-primario`, `--cor-borda-primario` (só C) |
| Escolhido | `--cor-ativo`, `--cor-sobre-ativo` (chip/segmento apertado), `--cor-indicador` (pílula da aba) |
| Números | `--cor-digitado` (o que a pessoa digitou: caneta em A), `--cor-total` (total: azul em C), `--cor-desconto` (descontos: vermelho em C) |
| Estados | `--cor-ok`; `--cor-info` + `--cor-info-fundo`; `--cor-atencao` + `--cor-atencao-fundo`; `--cor-risco` + `--cor-risco-fundo`; `--cor-selo` (carimbo em A) |
| Linhas | `--cor-borda` (≥ 3:1, campos e bordas que precisam ser vistas), `--cor-borda-leve` (divisória decorativa), `--cor-foco` |
| Sombra/véu | `--cor-sombra`, `--cor-veu` |
| Tipo | `--fonte-texto`, `--fonte-titulo`, `--fonte-numero`, `--fonte-rotulo`; `--peso-titulo`, `--peso-numero`, `--peso-marca`; `--rotulo-caixa`, `--rotulo-espaco`, `--rotulo-tamanho`, `--rotulo-peso` |
| Tamanhos | `--tam-0` 13 px, `--tam-1` 14, `--tam-2` 16, `--tam-3` 18, `--tam-4` 20, `--tam-5` 26, `--tam-campo` 20, `--tam-numero`, `--tam-numero-celular` (tudo em rem: cresce com letra grande) |
| Forma | `--raio`, `--raio-botao`, `--raio-campo`, `--raio-pilula`, `--alvo` 44 px, `--alvo-campo` 48 px, `--espaco-1..6` (4, 8, 12, 16, 24, 32), `--largura-conteudo`, `--altura-abas`, `--largura-menu` |
| Movimento | `--dur` (160 ms; vira 0 com "menos animação" ou `prefers-reduced-motion`). Toda transição usa `var(--dur)`. |

**Fontes por visual.** A: Barlow (texto) + Barlow Condensed (títulos, rótulos em caixa-alta, números grandes). B: Noto Sans (texto e todos os valores) + Libre Franklin (só títulos: **não tem dígitos tabulares**, nunca use em valores). C: Red Hat Text (texto) + Red Hat Mono (números). Valores sempre com `font-variant-numeric: tabular-nums` (o `body` já tem) e, se forem números de destaque, `font-family: var(--fonte-numero)` ou a classe `.numero`.

### Classes da casca e utilidades (base.css)

`.tela` (coluna com espaço), `.tela-cab`, `.tela-titulo`, `.tela-sub`, `.bloco` (seção), `.bloco-titulo` (h2), `.bloco-sub`, `.bloco--papel` (A: folha com borda; B: faixa cinza "página"; C: trecho de fita serrilhado), `.pilha`, `.pilha--curta`, `.linha`, `.linha--entre`, `.grade-2`, `.sr` (só leitor de tela), `.texto-2`, `.numero`, `.tabular`, `.nowrap`, `.so-impressao` (só aparece na impressão), `.nao-imprimir` (some na impressão; regra em impressao.css), `.carregando`.

### Classes dos componentes (componentes.css)
`.botao` `--primario` `--perigo` `--texto` `--icone` `--largo`, `.grupo-botoes`; `.chip` (`aria-pressed`), `.segmentos` `--igual` `--colado` `--dias`, `.chips`; `.campo` `--largo` `--erro`, `.campo-rotulo`, `.campo-caixa`, `.campo-prefixo`, `.campo-input`, `.campo-dica`, `.campo-erro`, `.campo-numero`, `.campo-passo`; `.resultado`, `.resultado-cab`, `.resultado-titulo`, `.resultado-meta`, `.resultado-numero`, `.resultado-moeda`, `.resultado-extenso`, `.resultado-acoes`; `.resumo`, `.resumo-linha` `--grande` `--desconto`, `.resumo-rotulo`, `.resumo-detalhe`, `.resumo-valor`; `.conta`, `.conta-resumo`, `.conta-lista`, `.conta-item` `--total` `--desconto`, `.conta-linha`, `.conta-rotulo`, `.conta-valor`, `.conta-formula`, `.conta-lei`; `.alerta` `--info` `--atencao` `--risco`, `.alertas`; `.selo` `--previsto` `--nao-verificado` `--editado` `--ok` `--info` `--risco`; `.tabela-rolavel`, `.tabela` `--fixa-1` `--zebra` `--empilhada`, `.num`, `.col-destaque`, `.col-minimo`; `.folha` `--dialogo`; `.toast`; `.vazio`.

### CSS de cada tela
- Arquivo `css/telas/<nome>.css`, carregado por `ctx.carregarCss('css/telas/<nome>.css')`.
- **Todo seletor começa com** `[data-tela="<nome>"]` (o roteador põe esse atributo na raiz da tela). Ex.: `[data-tela="tabela"] .conversor { … }`. Assim uma tela nunca vaza para outra.
- Use só tokens. Ajuste por visual com `[data-visual="c"] [data-tela="tabela"] …` quando precisar. Teste os 3 visuais × claro/escuro.
- Não redefina as classes de componentes; crie as suas com prefixo da tela (`.calc-…`, `.tab-…`, `.salvos-…`, `.leis-…`, `.mais-…`).
- Layout em celular primeiro; `@media (min-width: 900px)` para o computador (o menu vira lateral nessa largura).

---

## 9. Regras de acessibilidade (obrigatórias)

1. **Contraste AA** nos 3 visuais × claro/escuro, inclusive com `contraste=alto`: texto ≥ 4,5:1 (≥ 3:1 se ≥ 24 px, ou ≥ 18,7 px em negrito); bordas de campo e chip ≥ 3:1. Os tokens já passam; cor nova = medir.
2. **Alvos de toque ≥ 44 × 44 px** (botões, links soltos, chips, `summary`). Link dentro de parágrafo pode ser menor, mas evite.
3. **Sem rolagem horizontal do corpo em 360 px.** Tabelas largas ficam dentro de `ui.tabela` (rola só ela).
4. **Foco visível** sempre (`:focus-visible` já vem da base; não tire `outline`).
5. **Rótulo real** em todo campo (os componentes fazem). Dica e erro ligados por `aria-describedby` (idem).
6. **Não depender só de cor:** alerta tem ícone + palavra; chip apertado tem `aria-pressed` e mudança de peso; desconto pode ser vermelho, mas a fórmula diz "−".
7. **Resultado que muda enquanto digita:** não use `aria-live` no cartão inteiro (fala demais). Chame `ctx.anunciar('Você paga R$ 1.945,20 por mês')` com espera de ~800 ms depois da última tecla.
8. **Movimento:** só transições curtas com `var(--dur)`; nada piscando; nada que dependa de animação para ser entendido.
9. **Letra grande:** use `rem` para tamanho de texto e de caixas que contêm texto. Confira em 360 px com `?letra=grande`.
10. **Títulos em ordem:** h1 = título da tela (vem do `cabecalhoTela`), h2 = blocos, h3 dentro de blocos.
11. **Campos de dinheiro e número:** sempre `campoDinheiro` / `campoNumero` (texto com `inputmode`, fonte ≥ 16 px para o iPhone não dar zoom). Nunca `type="number"`.
12. **Links da lei** sempre com `linkExterno` (nova aba, `rel="noopener noreferrer"`, aviso "abre em nova aba").

## 10. Regras de texto

- Português do Brasil **simples**, frases curtas, voz ativa, "você". Ex.: "Você paga por mês", "A pessoa recebe", "Guia DAE", "Mostrar a conta".
- Sigla explicada no primeiro uso da tela ou com o glossário: "DAE (a guia do eSocial)", "DSR (descanso semanal remunerado)".
- Cautela legal: "pode ser", nunca "é" ("pode ser emprego doméstico"). O motor já escreve assim; não reescreva os textos do motor.
- Dinheiro sempre com `motor.formatarBRL` ("R$ 1.621,00"); data como "20/11/2026"; hora ao usuário como "HH:MM".
- Botões com verbo: "Salvar", "Compartilhar", "Copiar para planilha", "Apagar". Confirmação diz o que acontece e se dá para desfazer.
- Erros dizem o que fazer: "Escreva só o valor, como 1.621,00."
- O aviso legal fixo ("Estimativa educativa; não substitui contador, advogado nem o eSocial.") já está no rodapé de toda tela. Não repita em cada cartão; o alerta `estimativa` do motor é escondido por padrão em `ui.alertas`.
- Nada de "IA", emoji ou exclamação.

## 11. O que NÃO tocar

- `js/motor/**`, `dados/parametros.js` e os testes do motor.
- Arquivos de outras telas (`js/telas/<outra>.js`, `css/telas/<outra>.css`).
- `index.html`, `js/app.js`, `js/ui/**`, `js/dados/**`, `js/compartilhar.js`, `css/tokens.css`, `css/base.css`, `css/componentes.css`, `css/impressao.css`, `js/pre-tema.js`, `sw.js`, `fontes/**` — peça a mudança no relatório.
- A CSP. Não adicione nada externo (CDN, fonte do Google, análise de uso).
- `legado/` (é só consulta).
- Se criar arquivos novos de tela, acrescente-os à lista `FILES` do `sw.js` (o teste `testes/pwa.test.mjs` falha se faltar algum) e suba `VERSAO` no `sw.js` junto com `VERSAO_APP` em `js/dados/config.js`.
- Não faça commit nem push.

## 12. Como testar

```sh
cd tabela-ganhos-v2
node --test testes/                                   # motor + dados + PWA (87 testes em 20/11/2026)
python3 -m http.server 8800 --bind 127.0.0.1          # numa porta livre de 8800 a 8899; mate o servidor no fim
```

- **Ver os componentes:** `http://127.0.0.1:8800/testes/vitrine.html?visual=b&tema=escuro`.
- **Checagem automática** (contraste AA, bordas 3:1, alvos de 44 px, rolagem lateral): acrescente `verificar=1` na querystring do app ou da vitrine. O resultado sai no console como `VERIFICAR OK {…}` ou `VERIFICAR FALHOU {…}`.
- **Largura exata no Chrome sem janela:** o Chrome sem janela não abre janela com menos de 500 px. Para 360 ou 390 px use a moldura:
  ```sh
  google-chrome --headless=new --disable-gpu --user-data-dir="$(mktemp -d)" --window-size=500,844 --virtual-time-budget=5000 \
    --enable-logging=stderr --v=0 --screenshot=/caminho/tela.png \
    "http://127.0.0.1:8800/testes/moldura.html?w=390&h=844&src=..%2Findex.html%3Fvisual%3Da%26verificar%3D1%23tabela" 2>log.txt
  grep -E "CONSOLE|Uncaught|Refused" log.txt
  ```
  A imagem sai com 500 px de largura; o app ocupa os primeiros 390.
- **Atenção ao IndexedDB com `--virtual-time-budget`:** no Chrome sem janela com tempo virtual, operações do IndexedDB às vezes não terminam dentro do orçamento (medido em 20/11/2026: abrir a base leva ~1 s virtual e um `get` pode não voltar). O app não trava por isso (abre a tela depois de 1,2 s com a aparência do espelho e recebe a config pelo evento `tg:config`), mas um teste que **grava e lê** dados deve usar tempo real (Chrome com `--remote-debugging-port` e o protocolo DevTools) em vez de `--virtual-time-budget`.
- Teste cada tela em 360, 390 e 1280 px, nos 3 visuais × claro/escuro, e uma vez com `letra=grande` e `contraste=alto`.

---

## 13. Integração das 5 telas (20/11/2026, UTC)

Os pedidos das telas (`docs/PEDIDOS-calcular.md`, `-tabela`, `-salvos`, `-leis`, `-mais`) foram atendidos nos arquivos comuns e os arquivos de pedido foram apagados. O que mudou:

**Configuração (`js/dados/config.js`)**
- Chaves novas `calcular`, `tabela` e `backup` (esquema na seção 4), validadas em `normalizarConfig` e mescladas por chave em `mesclarConfig`. Com isso o último estado da calculadora, as preferências da comparação e a data do último backup entram no backup e saem com "Apagar tudo".
  - Calcular: `lerLembranca(ctx)` / `gravarLembranca(ctx, parcial)` em `js/telas/calcular/util.js` usam `config.calcular` (antes `localStorage['tg2-calcular']`). Só grava se mudou.
  - Tabela: `prefsIniciais` lê `config.tabela`; `salvarPrefs` chama `ctx.salvarConfig({ tabela })` (antes `tg2-tabela`).
  - Salvos e Mais: `ultimoBackup(ctx)`, `marcarBackup(ctx)`, `adiadoAte(ctx)`, `adiarLembrete(ctx, dias)` em `js/telas/salvos/backup.js` usam `config.backup` (antes `tg2-salvos-ultimo-backup` e `tg2-salvos-lembrete-adiado`). A tela Mais grava a mesma `config.backup.ultimo`.
- `overrides` e `opcoesNaoVerificadas` aceitam maiúsculas nas chaves (`/^[A-Za-z0-9_]{1,60}$/`): o botão "Editar" dos pisos de SP, RS e SC em Mais passa a aparecer.
- `limparEntrada` mudou de `armazem.js` para `config.js` (o armazém reexporta).
- `VERSAO_APP = '2.0.0'` mora em `config.js`, vai em `ctx.versaoApp` e é a que Mais → Sobre mostra.

**Armazém (`js/dados/armazem.js`)**
- `apagarTudo()` tira também toda chave `tg2-` do localStorage. A tela Mais não precisa mais varrer o localStorage (ela ainda recarrega a página para começar do zero).
- `fixarSalvo(id, fixado)` novo; a tela Salvos usa no lugar de `restaurarSalvo`.
- `importarTudo` separa "já estavam aqui" de "não puderam ser lidos" na mensagem (`ja_aqui`, `ilegiveis`).

**Casca (`js/app.js`)**
- Guarda o `beforeinstallprompt` na abertura (`window.tgEventoInstalar` + evento `tg:instalavel`).
- Registra o service worker também em `127.0.0.1` e `[::1]` (antes só `localhost` e https), para testar offline.
- Aviso "Nova versão disponível" com o botão "Atualizar" (toast que fica até o toque): aparece quando um service worker novo assume uma página que já tinha um, e a versão dele é diferente de `VERSAO_APP` da página.

**Navegação entre telas**
- Célula da Tabela → `#calcular?de=tabela&valorHora=…&horasDia=…&dias=…` (não usa mais `#c=`; o aviso é "Números vindos da Tabela").
- Salvo → `#calcular?salvo=<id>`; busca de Leis → o mesmo endereço; "Usar na calculadora" → `#calcular?modo=<id>`.
- A Calcular trata os três parâmetros em `iniciar` e em `aoMudarRota` (`abrirPelaRota`) e limpa o endereço com `ctx.navegar('#calcular', { substituir: true })`.

**PWA**
- `sw.js` reescrito: cache `ganhos-<VERSAO>` com a lista explícita de todos os arquivos do app (`addAll`, tudo ou nada), rede primeiro com `cache: 'no-cache'` para páginas e arquivos (cópia guardada sem internet ou depois de 4 s), fontes cache primeiro, nada de fora do site.
- `manifest.webmanifest`: `start_url` `./#calcular`, atalhos Calcular, Tabela e Salvos. As cores são as do visual A, o padrão (veja abaixo).
- `testes/pwa.test.mjs` confere que `FILES` bate com os arquivos em `css/`, `js/`, `dados/`, `fontes/` e os ícones, que `VERSAO` = `VERSAO_APP`, o manifest e a CSP.

**Visual padrão:** A "Talão e carimbo", com troca para B e C em Mais → Aparência. É o que o dono pediu ("A recomendado mas com opção de trocar nas configurações"). Por isso o manifest usa as cores do A (`#F6F7F2` de fundo, `#2E6B4E` de tema); a cor da barra do navegador acompanha o visual escolhido em tempo de uso (`atualizarCorDoNavegador`).

**Pedidos que ficaram para depois (opcionais):** um `ui.baixarArquivo` comum (Salvos e Mais têm cada uma o seu), os selos `ui.selo('pendente')` e `ui.selo('conta_app')`, mover as regras de impressão da Calcular para `impressao.css`, e criar em `dados/parametros.js` os números de lei que a tela Leis ainda escreve como texto (estágio, aprendiz, temporário, intermitente, tempo parcial, licença-paternidade, MEI, ISS).
