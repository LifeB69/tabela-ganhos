# Motor de cálculo — Tabela de Ganhos v2

Versão dos parâmetros: **2026-11-20** (conferidos em 20/11/2026, UTC). Fase 1, sem nenhuma tela.

O motor é um conjunto de **funções puras** em módulos ES nativos. Ele roda no navegador e no Node 22 sem etapa de compilação. Não acessa tela, rede nem armazenamento. Todos os valores em dinheiro são **centavos inteiros**.

```js
import { calcularDomestico, formatarBRL } from './js/motor/index.js';
const r = calcularDomestico({ salario: '1.621,00' }, '2026-11-20');
formatarBRL(r.resultado.dae); // "R$ 445,78"
```

## Arquivos

| Arquivo | O que faz |
|---|---|
| `dados/parametros.js` | Todos os números legais, cada um com uma lista de vigências: valor, data de início e de fim, status, fonte e lei. Exporta `PARAMETROS_VERSAO`, `DATA_CONFERENCIA` e `FONTES`. |
| `js/motor/parametros.js` | `getParam`, `getParamComReserva`, `listarVigencias` e `listarMudancasFuturas`, com tratamento de overrides. |
| `js/motor/dinheiro.js` | `parseDinheiro`, `formatarBRL`, `porExtenso`, `aplicarPct`, `dividirArredondando` e `arredondarPara`. |
| `js/motor/comum.js` | Envelope de saída, passos, alertas e leitura e validação das entradas. |
| `js/motor/jornada.js` | Jornada, divisor e repouso por data, salário mínimo, mínimo por hora e piso do doméstico por UF. |
| `js/motor/inss.js` | INSS progressivo do empregado. |
| `js/motor/irrf.js` | IRRF mensal: deduções legais ou desconto simplificado, mais o redutor da Lei 15.270. |
| `js/motor/porHora.js` | Modo por hora simples e o modo inverso. |
| `js/motor/diarista.js` | Modo diarista sem vínculo. |
| `js/motor/domestico.js` | Modo doméstico, mensalista ou horista, e o vencimento do DAE. |
| `js/motor/salarios.js` | Conversor, tabela do mínimo, tabela de pisos, comparação e próximas mudanças. |
| `js/motor/alertas.js` | Alertas reutilizáveis: vínculo, mínimo e piso, jornada e tempo parcial. |
| `js/motor/index.js` | Reexporta tudo. |
| `testes/*.test.mjs` | Testes com `node:test`. `testes/revisao.test.mjs` cobre os 13 problemas da revisão de 20/11/2026. |
| `testes/index.js` | Só importa os `*.test.mjs`, para `node --test testes/` funcionar no Node 22. |

### Como rodar os testes

```sh
cd tabela-ganhos-v2
node --test                      # descobre testes/*.test.mjs
node --test testes/              # carrega testes/index.js, que importa os mesmos arquivos
node --test testes/*.test.mjs    # equivalente
```

No Node 22, `node --test testes/` trata a pasta como módulo e carrega `testes/index.js`; esse arquivo importa todos os `*.test.mjs`. Resultado em 20/11/2026 (UTC), Node 22.23.5: **71 testes, 71 passam** nas três formas.

## Contrato de toda função de cálculo

```
f(entrada, dataISO, opcoes?) -> {
  entrada,                     // o que foi recebido
  resultado: { ... },          // dinheiro em centavos inteiros
  passos: [{ id, rotulo, formula, valor, fonte_url, lei, status?, unidade?, editado_por_usuario? }],
  alertas: [{ nivel: 'info'|'atencao'|'risco', codigo, titulo, texto, fonte_url, ... }],
  parametros_versao: '2026-11-20',
  data_referencia: 'AAAA-MM-DD'
}
```

- O campo `dataISO` aceita `AAAA-MM-DD` ou `AAAA-MM` (usa o dia 1º). Sem data válida, o motor usa `DATA_CONFERENCIA` e devolve o alerta `data_invalida`.
- O motor **nunca lança erro** por entrada vazia ou inválida, inclusive `entrada = null` (e `opcoes = null`). Nesse caso, devolve o alerta `entrada_invalida` com `campo` e um resultado zerado.
- Um campo de dinheiro aceita número (em **centavos**) ou texto como `"1.621,00"`, `"1621"` ou `"R$ 1621"`. Valor acima de **R$ 1 bilhão** (`LIMITE_CENTAVOS`) ou que não cabe em inteiro seguro (por exemplo, 400 dígitos) é recusado com `entrada_invalida` "Valor alto demais"; `parseDinheiro` devolve `null` nesse caso.
- Um campo numérico que vira `Infinity` é recusado. `multiplicar` e `fracao` devolvem 0 com valor não finito ou denominador 0 (proteção; a validação da entrada avisa antes).
- Um campo numérico (horas, dias) aceita número ou texto com vírgula (`"4,5"`).
- `valor` do passo vem em centavos, ou é `null` quando o passo é de horas ou dias. Nesse caso, o campo `unidade` diz `'horas'` ou `'dias'`.
- `opcoes.overrides` muda os parâmetros. Veja a seção sobre overrides abaixo.

## Funções

### Parâmetros

- `getParam(chave, dataISO, overrides?, { incluirPrevistos?, incluirNaoVerificados? })` devolve a vigência aplicável `{ chave, rotulo, unidade, valor, vigente_desde, vigente_ate, status, fonte_url, lei, observacao }` ou `null`. Por padrão, só usa vigências com status `vigente`.
- `getParamComReserva(...)` faz o mesmo, mas, se a data não tiver tabela (por exemplo, antes de 2026), devolve a vigência oficial mais próxima com `fora_da_vigencia: true`. Os modos então mostram o alerta `fora_da_vigencia`.
- `listarMudancasFuturas(dataISO, limiteISO?)` devolve `[{ chave, rotulo, vigente_desde, valor_atual, valor_novo, status, fonte_url, lei, observacao }]` em ordem de data. Inclui o que é `previsto`, com o status.

**Overrides:**
- `{ divisor_hora: 200 }`: só vale se for **menor** que o divisor legal da data, por ser o mais favorável ao empregado (Decreto 13.173/2026, art. 5º, parágrafo único). Um divisor maior é ignorado, com o alerta `divisor_maior_ignorado`.
- `{ jornada_datas: { jornada_42: '2026-12-17', jornada_40: '2027-12-17' } }`: muda a data em que entram 42 h e 40 h. A mudança arrasta junto o divisor e os 2 dias de repouso.
- `{ <chave>: valor }`: troca o valor de qualquer parâmetro, e o motor marca o passo com `editado_por_usuario: true`.

### Dinheiro

```js
parseDinheiro('1.621,00')  // 162100
parseDinheiro('R$ 1621')   // 162100
parseDinheiro('1621.50')   // 162150   (ponto com 1 ou 2 casas = decimal)
parseDinheiro('1.621')     // 162100   (ponto com 3 casas = milhar)
parseDinheiro('abc')       // null
formatarBRL(12158)         // "R$ 121,58"
porExtenso(162100)         // "mil seiscentos e vinte e um reais"
```

### `calcularInss({ salario }, data)`

```js
calcularInss({ salario: 162100 }, '2026-11-20').resultado
// { base: 162100, inss: 12158, teto: 847555, aliquota_efetiva_pct: 7.5 }
```
A conta soma as faixas em valor exato e arredonda só no fim. Os passos mostram cada faixa em reais com 4 casas (R$ 3.000,00: faixa 1 = "R$ 121,5750", faixa 2 = "R$ 115,3656", faixa 3 = "R$ 11,6592"). Em `inssProgressivo`, `faixas[].parcela_exata` fica em **centavos** com casas decimais (12157,5 = R$ 121,575). O desconto máximo é de R$ 988,09.

### `calcularIrrf({ rendimento, inss?, dependentes?, outrasDeducoes? }, data)`

Calcula duas opções: as **deduções legais** (INSS + R$ 189,59 por dependente) e o **desconto simplificado** (R$ 607,20). Em cada uma, aplica a redução da Lei 15.270 sobre o **rendimento bruto tributável** e escolhe a de **menor imposto final**. Se `inss` não for informado, a função calcula pela tabela do empregado.

| Rendimento | INSS | Opção | Imposto | Redução | IRRF |
|---|---|---|---|---|---|
| R$ 5.000,00 | 501,51 | simplificado | 312,89 | 312,89 | **0,00** |
| R$ 6.000,00 | 641,51 | legal | 564,85 | 179,75 | **385,10** |
| R$ 8.000,00 | 921,51 | legal | 1.037,85 | 0 | **1.037,85** |

Em R$ 5.000,00, as deduções legais deixariam R$ 23,78 de imposto, e o desconto simplificado zera. Por isso a escolha automática importa.

### `calcularPorHora({ valorHora, horasDia, dias | diasSemana [+ semanas], uf? }, data, { arredondamento? })`

```js
calcularPorHora({ valorHora: '12', horasDia: 4, dias: 10 }, '2026-11-20').resultado
// { valor_hora: 1200, valor_dia: 4800, horas_mes: 40, dias: 10, total: 48000, hora_minima: 737 }
```
- Com `diasSemana` e sem `semanas`, usa a média de 52 ÷ 12 semanas por mês, numa só divisão: valor × horas por semana × 52 ÷ 12, arredondado uma vez no fim (R$ 10,01 × 1,5 h × 1 dia → R$ 65,07, igual ao caminho com dias).
- Mostra o alerta `abaixo_minimo` com nível **info** e a palavra "referência", porque quem é pago por hora sem vínculo não tem mínimo por lei. Com `uf`, mostra também `abaixo_piso` em relação ao piso do doméstico por hora, no mesmo nível.
- `arredondamento` em centavos (50 = R$ 0,50) arredonda o total. O padrão é não arredondar (pergunta 13a).

`calcularPorHoraInverso({ orcamento, valorHora, dias?, horasDia? }, data)` devolve `{ horas, horas_por_dia, dias_inteiros, sobra }`, sempre arredondando para baixo para não passar do orçamento.

### `calcularDiarista(entrada, data)`

```js
calcularDiarista({ valorDiaria: '200', diasDaSemana: [2, 4], mesmaResidencia: true, mes: '2026-11' }, '2026-11-20')
// resultado: { custo_mes: 160000 (4 terças + 4 quintas), custo_mes_media: 173333, dias_no_mes: 8,
//              tem_13: false, tem_ferias: false, tem_dsr: false,
//              contribuicoes_diarista: { inss_simplificado_11: 17831, inss_normal_20: 34667, mei_das_inss: 8105, mei_das_com_iss: 8605 } }
```
- Entrada: `valorDiaria`, ou `valorHora` + `horasDia`. Os dias vêm em `diasDaSemana` (0 = domingo … 6 = sábado), que conta os dias reais do mês, ou em `diasSemana` (número), que dá só a média. `diasSemana` pode ser fracionário (0,5 = a cada 15 dias); a média do mês e do ano é calculada em BigInt e sai em centavos inteiros.
- `mes` precisa ser `AAAA-MM` com mês de 01 a 12. Mês inexistente (`2026-13`, `2026-00`) é recusado com `entrada_invalida` (`campo: 'mes'`), e o motor usa o mês da data de referência.
- O passo `sem_direitos_clt` explica que não há 13º, férias, DSR, FGTS nem VT (LC 150, art. 1º: só é doméstico quem trabalha mais de 2 dias por semana).
- A contribuição da diarista (INSS de 11% ou 20%, DAS do MEI) é **só informação** e não entra no custo de quem paga.
- Alertas:
  - `vinculo_domestico` (**risco**) com **mais de 2** dias por semana na mesma casa, inclusive média fracionária (2,5). O texto é cauteloso: "pode ser emprego doméstico".
  - `vinculo_limite` (info) com exatamente 2 dias.
  - `mei_nao_afasta_vinculo` (info).
  - `abaixo_minimo` com nível **info**, como referência.

### `calcularDomestico(entrada, data, { overrides })`

Entrada:
- `tipo`: `'mensalista'` (padrão) ou `'horista'`.
- `salario` (mensalista), ou `valorHora` + `horasSemana` (horista).
- `horasSemana`, opcional no mensalista, entre 1 e 168 (fora disso: `entrada_invalida`, e o motor ignora o campo, sem dividir por zero). Uma jornada menor que a máxima gera divisor contratual menor e confere o piso de forma proporcional. Com 25 h ou menos, o contrato é de tempo parcial.
- `uf` e `grupoPR`.
- `dependentes` e `filhosSalarioFamilia`.
- `custoVtMes`, `recusaVt` e o par `diasComVale`/`diasUteisMes`.
- `horasExtras` (50%).
- `horasDomingoFeriado` (não compensadas). Vão em dobro por padrão, ou como extra a 50% com `pagarDobroDomingoFeriado: false`.
- `horasNoturnas`, em horas de relógio no mês.

Exemplo obrigatório (R$ 1.621,00, mensalista, 20/11/2026):

| Item | Valor |
|---|---|
| INSS do empregado (7,5% × 1.621,00) | R$ 121,58 |
| IRRF | R$ 0,00 |
| Líquido | **R$ 1.499,42** |
| CPP 8% + GILRAT 0,8% + FGTS 8% + indenização 3,2% | 129,68 + 12,97 + 129,68 + 51,87 = **R$ 324,20** |
| DAE (324,20 + 121,58 + 0) | **R$ 445,78**, com vencimento em 18/12/2026 (20/12 cai num domingo) |
| Você paga por mês | R$ 1.945,20 |
| Provisão do 13º por mês + encargos | 135,08 + 27,02 |
| 1/3 de férias por mês + encargos | 45,03 + 9,01 |
| Quanto guardar por mês | R$ 216,14 |
| 13º: 1ª parcela / INSS em separado / 2ª parcela | 810,50 / 121,58 / 688,92 |
| Custo por ano | R$ 25.936,00 |

Os valores do plano (121,58 / 1.499,42 / 324,20 / 445,78) **conferem com a lei**. Nenhum ajuste foi preciso.

Outros campos do resultado:
- `jornada_semanal`, `divisor`, `valor_hora`.
- `horas_extras`, `domingo_feriado`, `adicional_noturno`, `hora_noturna_reduzida`.
- `vt_desconto`, `vt_empregador` (0 quando o empregado recusa o vale), `salario_familia`, `salario_familia_deduzido` (o que sai do DAE) e `salario_familia_reembolso` (o que passa do limite e vira pedido de reembolso).
- `encargos.base_cpp_gilrat`: a base da CPP e do GILRAT, limitada ao teto do INSS.
- `provisoes` (inclui `ferias_mais_terco`, a provisão contábil completa, e `dias_ferias`).
- `piso_aplicado`.

Alertas possíveis:
- `abaixo_minimo` e `abaixo_piso` (risco; aqui há vínculo de emprego).
- `piso_nao_verificado`, `piso_sem_vigencia`, `piso_pr_grupo`, `piso_convencao`.
- `tempo_parcial`, com `dias_ferias`.
- `acima_jornada`.
- `dsr_extras_nao_calculado`.
- `hora_reduzida_mensalista` (info): a hora noturna reduzida do mensalista não entrou na conta.
- `salario_familia_reembolso` (info).
- `segundo_repouso_nao_verificado`.
- `mudanca_jornada_42` e `jornada_42_liminar`.
- `divisor_editado` e `divisor_maior_ignorado`.
- `fora_da_vigencia`.
- `estimativa`.

`vencimentoDae(dataISO)` devolve `{ vencimento }`: o dia 20 do mês seguinte à competência, antecipado para o dia útil anterior.

### Salários e tabelas

- `converterSalario({ valor, unidade: 'hora'|'dia'|'semana'|'mes'|'ano', horasDia?, diasSemana?, metodo?: 'legal'|'calendario' }, data)` devolve hora, dia, semana, mês, ano, `ano_com_13_e_ferias` e `horas_mes`.
  - Método `legal` (padrão): mês = horas por semana × (divisor ÷ jornada), ou seja × 5, que inclui o repouso; dia = mês ÷ 30.
  - Método `calendario`: mês = semana × 52 ÷ 12; dia = um dia trabalhado.
- `tabelaMinimo(data)` devolve mensal, diário e por hora, o divisor, a jornada e os `previstos` (o mínimo de R$ 1.741 de 2027, com selo, sem uso no cálculo).
- `tabelaPisos(data)` devolve linhas de SP, RS, SC, PR e RJ, mais "demais", com `usado_no_calculo` (o maior entre piso e mínimo), `hora` (pelo divisor da data), status, fonte e lei.
- `tabelaComparacao({ valoresHora: [...até 5], horasDia, dias }, data)` monta as colunas e acrescenta a coluna fixa "Mínimo legal".
- `proximasMudancas(data, limite?)`.

### Alertas avulsos

As funções `alertasVinculoDomestico`, `alertasValorHora`, `alertasSalarioMensal`, `alertasMudancaJornada` (janela padrão de 60 dias), `alertasTempoParcialDomestico` e `alertasMudancasProximas` servem para as telas mostrarem avisos sem rodar um modo inteiro.

## Decisões e premissas

1. **Centavos e arredondamento.** Toda conta é feita em centavos inteiros. As porcentagens viram milionésimos inteiros, e as multiplicações por horas fracionárias usam BigInt, para não haver ruído de ponto flutuante. O arredondamento é "meio para cima" e acontece **uma vez no fim de cada verba**, como na folha. Exemplos: o INSS soma as faixas exatas antes de arredondar, e cada encargo (CPP, GILRAT, FGTS, indenização) é arredondado separadamente.
2. **Previsto não entra no cálculo** (pergunta 10a). O mínimo de 2027 (R$ 1.741) e os limites do MEI de 2027 e 2028 aparecem como `previsto`. Os limites do MEI ficaram como previstos porque a LC 238 condiciona a ampliação às leis orçamentárias. Para datas de 2027, o motor continua usando R$ 1.621,00 e avisa com `minimo_previsto`.
3. **Não verificado fica fora ou desligado** (pergunta 11a). Os itens estão listados na próxima seção.
4. **Jornada por data** (pergunta 9a):
   - 44 h e divisor 220 até 15/12/2026;
   - 42 h, divisor 210 e 2 dias de repouso de 16/12/2026 a 15/12/2027;
   - 40 h e divisor 200 a partir de 16/12/2027.
   
   Fontes: EC 141, arts. 6º e 10; Decreto 13.173/2026, art. 5º; liminar do STF nas ADIs 8041/8042, pendente de referendo. A data pode ser mudada com `jornada_datas`. O alerta diz que "há quem conte 17/12", sem atribuir isso à CNI.
5. **Divisor do doméstico.** Usa o mesmo padrão do CLT, conforme o Decreto 13.173, art. 1º, parágrafo único, e art. 5º. A observação diz que a LC 150 ainda fala em 220. O motor nunca aceita um divisor maior que o legal.
6. **Mínimo por hora depois de 16/12/2026.** É uma **conta do app**: o mínimo mensal proporcional, R$ 1.621,00 ÷ 210 = R$ 7,72, e ÷ 200 = R$ 8,11. O Decreto 13.173/2026, art. 5º, define só o divisor do salário-hora e não fala do mínimo por hora (texto conferido no Planalto em 20/11/2026). O decreto do mínimo (12.797/2025) ainda fixa R$ 7,37. O alerta `minimo_hora_derivado` diz isso: "Conta do app: R$ 1.621,00 ÷ 210 (divisor do salário-hora do Decreto 13.173/2026, art. 5º) = R$ 7,72 … ainda fixa R$ 7,37 por hora". Quando a referência é derivada, `abaixo_minimo` fala em "mínimo mensal proporcional (conta do app)", e não em "mínimo por hora". Nos modos sem vínculo (por hora, inverso e diarista), `abaixo_minimo` e `abaixo_piso` têm nível `info` e a palavra "referência". Na tabela de comparação, a coluna passa a se chamar "Mínimo proporcional (conta do app)".
7. **Horista doméstico.** Salário = valor/hora × horas semanais × (divisor ÷ jornada), e o fator é 5 nas três etapas (220/44, 210/42, 200/40). O fator já inclui o repouso semanal remunerado. Esta é uma conta do app, documentada no passo. Ela não cita o TST, porque a ligação com a lógica do TST não foi verificada.
8. **Piso** (pergunta 12a). O motor usa o maior entre o piso estadual e o mínimo. Com jornada menor que a máxima, o piso fica proporcional às horas. Os pisos usados são:
   - SP: R$ 1.874,36, desde 01/06/2026;
   - RS: R$ 1.884,75, desde 21/05/2026. O número da lei (16.514/2026) foi conferido em fonte secundária, e o motor marca isso;
   - SC: R$ 1.842,00, desde 01/01/2026;
   - PR: Grupo II, R$ 2.181,63, de 01/01 a 31/12/2026. O enquadramento foi deduzido pela CBO, e o usuário pode escolher outro grupo com `grupoPR`;
   - RJ: piso de 2019 só como informação, com o mínimo nacional no cálculo.
   
   Fora da vigência conferida (SP antes de junho de 2026, PR em 2027), o motor usa o mínimo e mostra o alerta `piso_sem_vigencia`.
9. **IRRF.** O motor escolhe a opção (legal ou simplificada) de menor imposto **depois** da redução. O redutor incide sobre o rendimento bruto tributável, como orienta a Receita.
10. **13º.** O INSS usa a tabela inteira sobre o 13º bruto, em separado (Lei 8.620/93, art. 7º, §2º), e é descontado na 2ª parcela. A 1ª parcela, metade do 13º, sai sem INSS. O IRRF do 13º usa deduções legais e a redução da Lei 15.270. O desconto simplificado no 13º não foi aplicado, porque não foi verificado. O motor dá um valor de 13º anual cheio, sem proporcionais por mês trabalhado (isso fica para a Fase 2).
11. **Provisões e custo anual.**
    - O salário do mês de férias já está nos 12 salários do ano. Por isso "quanto guardar por mês" = 13º/12 + (1/3 de férias)/12, mais os encargos dos dois ÷ 12.
    - Encargos do 13º = encargos sobre o 13º bruto, com teto próprio para CPP e GILRAT (o 13º é tributado em separado). Encargos do 1/3 = encargos do mês de férias (remuneração + 1/3) − encargos de um mês comum; acima do teto, só FGTS e 3,2% crescem. Abaixo do teto, tudo dá os mesmos 20% de antes.
    - A provisão contábil completa (férias + 1/3 = 4/3 ÷ 12) aparece em `provisoes.ferias_mais_terco`, só como informação.
    - Custo anual = 12 × (remuneração + encargos) + 11 × VT do empregador (não há vale no mês de férias) + 13º + encargos + 1/3 de férias + encargos.
    - Em tempo parcial, o 1/3 usa os dias de férias da faixa (LC 150, art. 3º).
    - A base é a remuneração do mês. O motor supõe que extras e noturno são habituais e entram nas médias.
12. **Vale-transporte.** O desconto é o menor entre 6% do salário básico (sem extras nem adicionais) e o custo do vale. O teto de 6% fica proporcional se forem informados `diasComVale` < `diasUteisMes`. Com `recusaVt`, o desconto **e o custo do empregador** são zero: sem vale, não há gasto com vale (passo "Empregado recusou o vale: sem custo"). O VT não entra na base de INSS, FGTS nem IR.
13. **Hora extra, domingo e noturno.**
    - Mensalista: valor da hora = salário ÷ divisor, sem arredondar no meio.
    - Domingo ou feriado não compensado do doméstico: em dobro por padrão (LC 150, art. 2º, §8º).
    - Hora noturna: as horas de relógio viram horas contadas, multiplicadas por 60 ÷ 52,5. O adicional de 20% incide sobre as horas contadas. O horista recebe também as horas a mais da hora reduzida. O mensalista recebe só o adicional, porque o app supõe que o salário já cobre a jornada. Essa simplificação aparece para o usuário no alerta `hora_reduzida_mensalista` (info): se, com a redução, a jornada passar do limite, o excedente é hora extra e deve ser informado em `horasExtras` (LC 150, art. 14, §§ 1º e 2º; art. 2º).
14. **Salário-família.** É pago ao empregado e abatido do DAE, quando a remuneração é de até R$ 1.980,38. A dedução fica limitada ao total das contribuições previdenciárias do mês (INSS do empregado + CPP + GILRAT). O que passar não sai do DAE e é pedido de reembolso à Receita (Manual do eSocial Doméstico de 13/08/2026, item do salário-família, texto conferido no PDF). Exemplo: R$ 1.621,00 com 4 filhos → 270,16 pagos, 264,23 deduzidos, 5,93 de reembolso.
15. **DAE.**
    - Valor = encargos + INSS do empregado + IRRF − salário-família deduzido (limitado, veja o item 14).
    - **CPP (8%) e GILRAT (0,8%) incidem sobre o salário de contribuição, limitado ao teto do INSS (R$ 8.475,55 em 2026)**: Lei 8.212, art. 24, caput ("incidente sobre o salário de contribuição do empregado doméstico"), e art. 28, II e §5º, conferidos no Planalto em 20/11/2026. FGTS (8%) e indenização compensatória (3,2%) incidem sobre a remuneração inteira. Com salário de R$ 9.000,00: CPP R$ 678,04 e GILRAT R$ 67,80 (antes, 720,00 e 72,00). O Manual do eSocial (p. 78) lista só as alíquotas, sem falar do teto; conferir no simulador do eSocial continua recomendado.
    - Vencimento: o dia 20 do mês seguinte, antecipado se não for dia útil. O motor considera fins de semana, os feriados nacionais fixos (inclusive 20/11) e a Sexta-feira Santa.
    - Ficam de fora o Carnaval, Corpus Christi e os feriados locais. É uma aproximação, e o valor oficial é o do eSocial.
16. **Diarista sem vínculo.**
    - Custo mensal real = diária × dias marcados que caem no mês. Feriados não são descontados.
    - Média = diária × dias por semana × 52 ÷ 12, numa só divisão (aceita dias fracionários).
    - INSS de 20% da diarista: base = custo médio mensal, limitado entre o mínimo e o teto.
17. **Datas sem tabela.** Datas anteriores a 2026 usam a tabela de 2026, com o alerta `fora_da_vigencia`. Datas futuras usam a última tabela oficial (INSS e IRRF de 2027 ainda não foram publicados).
18. **Conversor legal.** Converte R$ 7,37/h em R$ 1.621,40/mês (737 × 220). A diferença de R$ 0,40 vem do arredondamento do próprio decreto (1.621 ÷ 220 = 7,368…).

## O que ficou como "não verificado" (selo, opção desligada ou fora)

| Item | Como o motor trata |
|---|---|
| Piso do doméstico no RJ (Lei 8.315/2019; cerca de R$ 1.238,11) | Parâmetro `nao_verificado`, só como informação. O cálculo usa o mínimo nacional. |
| Número da lei do piso do RS (16.514/2026) | O valor é usado (conferido em fonte oficial). A lei aparece com a marca "número conferido em fonte secundária". |
| Doméstico no Grupo II do PR | Usado como padrão, com a nota "deduzido pela CBO; convenção prevalece". O grupo pode ser trocado. |
| Doméstico na faixa I de SC | Usado, com a observação de que a fonte é secundária. |
| Dobro em domingo no CLT (Súmula 146 do TST) | Parâmetro `dobro_domingo_clt` com status `nao_verificado`. Não é usado (o modo CLT é da Fase 2). |
| Pagamento do trabalho no 2º dia de repouso (após 16/12/2026) | Alerta `segundo_repouso_nao_verificado` até sair o ato do MTE (Decreto 13.173, art. 4º). |
| Número de dias de repouso perdidos por falta injustificada após 16/12/2026 | Não implementado na Fase 1. A opção "descontar o repouso" fica para quando houver o ato do MTE. |
| Vencimento do DAE do 13º em 20/01 | Parâmetro `dae_13_vencimento` com status `nao_verificado`. Não é afirmado em nenhum passo. |
| Desconto simplificado no IRRF do 13º | Não aplicado. O passo leva `status: 'nao_verificado'`. |
| Reflexo do DSR sobre horas extras habituais (fórmula de mercado) | Não calculado. Alerta `dsr_extras_nao_calculado`. |
| ISS ou ICMS da diarista MEI | O DAS aparece com ISS, mas o passo leva `status: 'nao_verificado'`. |
| Vencimento do DAS do MEI no dia 20 | Só na observação do parâmetro. Não é usado. |
| Contagem até 17/12/2026 (e a atribuição à CNI) | Mencionada sem atribuição, como "há quem conte". A data pode ser mudada pelo override. |
| Tabelas de INSS e IRRF de 2027 | Não publicadas. O motor usa as de 2026 e avisa quando houver mudança. |
| Salário mínimo de 2027 (R$ 1.741) | `previsto`: mostrado, sem uso no cálculo. |
| Limites do MEI de 2027 e 2028 (LC 238) | `previsto`, condicionados às leis orçamentárias. |

Não citados de propósito, conforme o fechamento dos pendentes: as críticas ao Decreto 13.173 e a regra "horas semanais × 5" do TST. Também não aparecem a nota do RS sobre o RJ, o Decreto 3.048, art. 214, e o manual do eSocial ("Exemplo 7") como base do DSR da diarista.

## Fora da Fase 1 (motor)

Os modos autônomo/RPA, MEI completo, CLT horista, intermitente e tempo parcial do CLT ficam para depois (perguntas 2a e 3b). Os parâmetros `autonomo`, `autonomo_retencao_empresa`, `mei_*`, `fgts` e `dobro_feriado_clt` já estão no arquivo de dados para essas etapas.

## Manutenção

Para atualizar, troque só `dados/parametros.js`. Acrescente uma nova vigência com `vigente_desde`, feche a anterior com `vigente_ate` (para parâmetros oficiais em sequência), atualize `PARAMETROS_VERSAO` e `DATA_CONFERENCIA` e rode os testes. O teste de dados falha se um parâmetro vigente ficar sem `fonte_url` ou sem data, ou se duas vigências oficiais se sobrepuserem.

Revisões marcadas:
- **16/12/2026:** troca para 42 h, e o julgamento do Plenário do STF, quando houver.
- **Janeiro de 2027:** mínimo, INSS, IRRF, piso do PR e MEI.

## Revisão de 20/11/2026 (UTC)

Treze problemas apontados por revisores. Todos foram confirmados refazendo a conta ou abrindo a fonte, corrigidos e cobertos em `testes/revisao.test.mjs`.

| # | Onde | Problema | Correção |
|---|---|---|---|
| 1 | `inss.js` | Passo de cada faixa mostrava centavos como reais ("R$ 12157,5000") | Exibe `parcela_exata / 100` com 4 casas ("R$ 121,5750") |
| 2 | `domestico.js` | CPP e GILRAT sem o teto do salário de contribuição | `encargosDomestico()`: CPP e GILRAT sobre min(remuneração, teto); FGTS e 3,2% sobre tudo; vale no mês, no 13º, nas provisões e no custo anual |
| 3 | `jornada.js`, `alertas.js` | Alerta atribuía ao Decreto 13.173 uma regra de mínimo por hora | Texto "Conta do app: … O decreto do mínimo ainda fixa R$ 7,37"; `abaixo_minimo` derivado fala em "mínimo mensal proporcional"; nível `info` e "referência" sem vínculo |
| 4 | `domestico.js` | Salário-família abatido do DAE sem limite | Dedução limitada a INSS + CPP + GILRAT; resto em `salario_familia_reembolso`, com passo e alerta |
| 5 | `domestico.js` | Hora reduzida do mensalista fora da conta sem aviso | Alerta `hora_reduzida_mensalista` (info) |
| 6 | `dinheiro.js`, `comum.js` | Número enorme virava Infinity e quebrava o BigInt | `parseDinheiro`/`lerCentavos` recusam inteiro não seguro; `lerDinheiroCampo` recusa acima de R$ 1 bilhão; `lerNumero` recusa Infinity; `multiplicar`/`fracao` protegidos |
| 7 | `domestico.js` | `horasSemana` 0,0009 dividia por zero | `horasSemana` entre 1 e 168; `fracao` devolve 0 com denominador 0 |
| 8 | `diarista.js` | Dias fracionários quebravam o BigInt | `fracao(valor, round(dias × 52 × 10⁶), 12 × 10⁶)` e `multiplicar` no ano |
| 9 | `domestico.js` | VT recusado continuava como custo | `vt_empregador = 0` com recusa |
| 10 | todos os `calcular*` | `entrada = null` lançava TypeError | `normalizarEntrada()` no início; `opcoes = null` também |
| 11 | `porHora.js` | Média 52/12 arredondava duas vezes | Uma divisão só em BigInt |
| 12 | `alertas.js` | Média 2,5 dias sem alerta de vínculo | `dias > 2` dispara `vinculo_domestico` |
| 13 | `diarista.js` | Mês 13 ou 00 aceito | Valida com `dataValida`; usa o mês da data e avisa |
