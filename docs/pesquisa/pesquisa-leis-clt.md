# Legislação trabalhista e previdenciária que afeta quem paga alguém por hora ou por dia (situação em 20/11/2026)

Pesquisa feita em 20/11/2026. As fontes são primárias sempre que deu: Planalto, Receita Federal, Senado e Câmara. Onde o fato veio de fonte secundária ou de cálculo meu, isso está escrito. "Não verificado" quer dizer que não achei fonte confiável.

## Novidade principal: a jornada máxima vai cair

**Emenda Constitucional 141, de 16/10/2026** (publicada no DOU em 16/10/2026, Edição Extra-A). Fonte: https://planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc141.htm e https://www12.senado.leg.br/noticias/materias/2026/10/16/congresso-promulga-o-fim-da-escala-6x1-e-aposentadoria-de-agentes-de-saude

O que a emenda muda:
- **Art. 7º, XIII, nova redação:** jornada de até 8 h por dia e 40 h por semana.
- **Art. 7º, XV, nova redação:** 2 dias de repouso semanal remunerado, um deles de preferência no domingo.
- **Transição (art. 6º):**
  - 2 meses depois da publicação, o limite cai para **42 h por semana**. Pela minha conta, isso é por volta de **16/12/2026**; o site valorfinal.com.br dá a mesma data e o Mix Vale fala em 15/12. Confirmar a contagem do prazo.
  - 1 ano depois disso, o limite cai para **40 h por semana**, por volta de 16/12/2027.
- **Salário (art. 2º):** não pode haver redução nominal nem proporcional, e isso vale também para pisos.
- **Art. 7º da emenda:** durante a transição, acordo ou convenção coletiva pode ampliar a jornada diária para distribuir as 42 h.
- **Art. 4º:** quem já tem jornada de 40 h ou menos não sofre redução proporcional.
- **Art. 10:** o novo inciso XV (2 dias de repouso) só vale 2 meses depois da publicação. O resto vale desde a publicação.

**Domésticos.** A emenda só renumera o antigo parágrafo único do art. 7º para § 1º. Esse parágrafo estende aos domésticos os incisos XIII e XV. Por isso, a minha interpretação é que **a redução vale também para domésticos**. A imprensa e a doutrina dizem o mesmo (DOL, O Popular, Grupo GEN). Mesmo assim, isso não está verificado em norma expressa, e a LC 150 (art. 2º) continua escrevendo "44 h". Também não está verificado se o divisor do doméstico cai para 210 e depois para 200. Notícia do DOL fala em 200, mas não há norma que diga isso.

**Para o app:** o divisor e as horas da semana devem ser configuráveis, com padrão por data:
- 44 h, divisor 220, até 15/12/2026;
- 42 h, divisor 210 a partir de cerca de 16/12/2026;
- 40 h, divisor 200 a partir de cerca de 16/12/2027.

As contas 42 × 5 = 210 e 40 × 5 = 200 são derivação minha. Elas seguem a mesma lógica que dá 220 para 44 h. Não são texto de norma.

## 1. Salário mínimo

**2026.** O mínimo é **R$ 1.621,00 por mês**, **R$ 54,04 por dia** e **R$ 7,37 por hora**. Vale desde 01/01/2026. Base: Decreto 12.797/2025, art. 1º e parágrafo único. https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm
- O valor por hora vem de 1.621 ÷ 220 = 7,368.
- Com divisor 210, a hora seria R$ 7,72. Com divisor 200, seria R$ 8,11. As duas contas são derivação minha; não há norma que fixe esses valores.

**2027.** O PLOA 2027 (PLN 24/2026) propõe **R$ 1.741**. É estimativa e não está aprovado; o valor final depende do INPC de novembro e sai em dezembro. Fonte: https://www12.senado.leg.br/noticias/materias/2026/08/31/executivo-envia-orcamento-de-2027-ao-congresso-com-minimo-de-r-1.741
- 1.741 ÷ 220 = R$ 7,91 por hora (conta minha).
- No app, isso deve aparecer como "previsto", nunca como valor vigente.

## 2. Jornada, hora extra e trabalho noturno

**CLT.** Fonte: https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm
- **Art. 58:** até 8 h por dia.
- **Art. 59:** até 2 h extras por dia, por acordo.
- **Art. 59, § 1º:** a hora extra vale pelo menos **50% a mais** que a hora normal.
- **Hora extra a 100%** (domingos e feriados não compensados): vem da Lei 605/1949, art. 9º, e de jurisprudência do TST. Não verificado em fonte primária nesta pesquisa.
- **Art. 73:** o trabalho noturno vale pelo menos **20% a mais** que o diurno.
- **Art. 73, § 1º:** a hora noturna dura **52 min 30 s**. Pela minha conta, 7 h de relógio entre 22h e 5h viram 8 h pagas.
- **Art. 73, § 2º:** horário noturno é das **22h às 5h**.

**Doméstico (LC 150/2015).** Fonte: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm
- **Art. 2º:** 8 h por dia, 44 h por semana, hora extra de pelo menos 50%. A hora do mensalista é o salário ÷ 220, a menos que o contrato preveja jornada menor.
- **Art. 14:** trabalho noturno das 22h às 5h, hora de 52 min 30 s, adicional de pelo menos 20%.
- **Art. 10:** permite a escala 12x36 por acordo escrito. Nessa escala, o salário mensal já cobre o repouso semanal e os feriados.

## 3. Descanso semanal remunerado (DSR) para horista e diarista

**Lei 605/1949.** Fonte: https://www.planalto.gov.br/ccivil_03/leis/l0605.htm
- **Art. 1º:** 24 h seguidas de repouso, de preferência no domingo, além dos feriados.
- **Art. 7º, a:** para diarista, semanalista, quinzenalista e mensalista, o repouso vale **1 dia de serviço**.
- **Art. 7º, b:** para o **horista**, o repouso vale **a jornada normal** do dia.
- Nos dois casos, entram na conta as **horas extras habituais** (redação da Lei 7.415/1985).
- **Art. 7º, § 2º:** o mensalista já tem o repouso incluído no salário.
- **Art. 6º:** quem falta sem justificativa na semana perde o DSR daquela semana. No regime reduzido (§ 3º), conta só a frequência nos dias combinados.

**Súmula 172 do TST:** "Computam-se no cálculo do repouso remunerado as horas extras habitualmente prestadas." Texto conferido em fonte secundária: https://tesesesumulas.com.br/sumula/tst/172
- Sobre o reflexo do DSR majorado em férias, 13º e FGTS: a OJ 394 da SDI-1 foi revista no Tema 9 dos recursos repetitivos do TST. A redação atual não foi verificada.

**Fórmula usual de mercado para o DSR do horista:** (valor das horas do mês ÷ dias úteis) × (domingos + feriados). É prática corrente, não texto de lei; não verificado em norma.

**Com a EC 141:** a partir de cerca de 16/12/2026, são 2 dias de repouso por semana. Isso muda a contagem de dias úteis contra dias de repouso.

## 4. Férias + 1/3

- **Constituição, art. 7º, XVII:** férias com 1/3 a mais.
- **Doméstico (LC 150, art. 17):** 30 dias a cada 12 meses, com pelo menos 1/3 a mais.
- **Horista com jornada variável (CLT, art. 142, § 1º):** as férias são pagas pela **média de horas** do período aquisitivo, com o valor da hora na data em que as férias começam.
- **Adicionais (CLT, art. 142, §§ 5º e 6º):** hora extra, noturno e insalubridade entram na base. Se não estiverem sendo pagos na época das férias, usa-se a média duodecimal.
- **Conta para proporcionais:** férias proporcionais + 1/3 = remuneração × 1/12 × 4/3 = **11,11%** por mês trabalhado. É conta minha.

## 5. 13º salário

**Lei 4.090/1962.** Fonte: https://www.planalto.gov.br/ccivil_03/leis/l4090.htm
- **Art. 1º, § 1º:** 1/12 da remuneração de dezembro por mês trabalhado.
- **Art. 1º, § 2º:** 15 dias ou mais de trabalho no mês contam como mês inteiro.
- **Art. 3º:** na dispensa sem justa causa, o 13º é proporcional.

**Lei 4.749/1965.** Fonte: https://www.planalto.gov.br/ccivil_03/leis/l4749.htm
- **Art. 2º:** o adiantamento (metade do salário) é pago entre fevereiro e novembro.
- **Art. 1º:** o restante é pago até **20 de dezembro**.

**IR no 13º:** a redução da Lei 15.270 também vale para o 13º (veja a seção 9).

## 6. FGTS

**Lei 8.036/1990.** Fonte: https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm
- **Art. 15:** **8%** da remuneração, depositado até o **dia 20** de cada mês (redação da Lei 14.438/2022).
- **Art. 15, § 7º:** aprendiz tem **2%**.
- **Art. 18, § 1º:** na dispensa sem justa causa, multa de **40%** sobre os depósitos.

**Doméstico (LC 150):**
- **Art. 34, IV:** 8% de FGTS.
- **Arts. 22 e 34, V:** mais **3,2%** de indenização compensatória, que substitui a multa de 40%.
- Total de FGTS e indenização: **11,2%**.

## 7. INSS do empregado (inclui doméstico e avulso)

**Tabela de 2026.** Fonte: Portaria Interministerial MPS/MF 13, de 09/01/2026, Anexo II (DOU de 12/01/2026), consultada pela reprodução em https://www.normaslegais.com.br/legislacao/portaria-interministerial-mps-mf-13-2026.htm. Vale para fatos geradores a partir da competência janeiro/2026.

| Faixa | Alíquota | Desconto máximo da faixa (conta minha) |
|---|---|---|
| Até R$ 1.621,00 | 7,5% | R$ 121,58 |
| De R$ 1.621,01 a R$ 2.902,84 | 9% | R$ 115,37 |
| De R$ 2.902,85 a R$ 4.354,27 | 12% | R$ 174,17 |
| De R$ 4.354,28 a R$ 8.475,55 | 14% | R$ 576,98 |

- **Teto do salário de contribuição:** R$ 8.475,55.
- **Desconto máximo por mês:** **R$ 988,09** (conta minha, igual às fontes secundárias).
- **Como calcular:** cada alíquota incide só sobre a parte do salário dentro da sua faixa (cálculo progressivo).
- **Texto antigo da LC 150:** o art. 34, I, ainda fala em "8% a 11%", mas na prática vale a tabela progressiva acima.
- **13º:** o INSS do 13º é calculado separado, com a mesma tabela. Isso é prática de folha; não verificado em fonte primária nesta pesquisa.
- **Salário-família 2026:** R$ 67,54 por filho, para quem ganha até R$ 1.980,38 (mesma portaria).
- **Tabela de 2027:** ainda não publicada. Sai em janeiro de 2027, com o novo mínimo.

## 8. INSS e encargos do patrão

**Empresa (Lei 8.212/1991).** Fonte: https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm
- **Art. 22, I:** **20%** da folha de empregados e avulsos.
- **Art. 22, II:** RAT/SAT de **1%, 2% ou 3%**, conforme o risco da atividade.
- Terceiros (Sistema S e outros): não verificado nesta pesquisa.
- **Art. 22, III:** 20% sobre o que se paga a **contribuinte individual** (autônomo).
- Retenção de 11% sobre o autônomo (Lei 10.666/2003, art. 4º): não verificado.
- Simples Nacional e desoneração mudam esses valores: não verificado.

**Empregador doméstico (Lei 8.212, art. 24, redação da Lei 13.202/2015, e LC 150, art. 34):**
- **8%** de contribuição patronal + **0,8%** de seguro contra acidente = 8,8%.
- Com FGTS de 8% e indenização de 3,2%, o patrão doméstico paga **20% sobre o salário**, além do que já paga ao empregado (conta minha).
- Tudo é recolhido numa guia única do eSocial (Simples Doméstico, art. 34).

**Autônomo (art. 21):**
- 20% sobre o que recebe.
- **Ou 11% sobre o salário mínimo** no plano simplificado (art. 21, § 2º). Em 2026, isso dá R$ 178,31 (conta minha).
- MEI paga 5%.

## 9. Imposto de Renda retido na fonte (IRRF), 2026

**Tabela mensal.** Fonte: Receita Federal, https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026 (base: Lei 15.191/2025, vigência desde janeiro/2026).

| Base de cálculo | Alíquota | Parcela a deduzir |
|---|---|---|
| Até R$ 2.428,80 | Isento | – |
| De R$ 2.428,81 a R$ 2.826,65 | 7,5% | R$ 182,16 |
| De R$ 2.826,66 a R$ 3.751,05 | 15% | R$ 394,16 |
| De R$ 3.751,06 a R$ 4.664,68 | 22,5% | R$ 675,49 |
| Acima de R$ 4.664,68 | 27,5% | R$ 908,73 |

- **Dedução por dependente:** R$ 189,59 por mês.
- **Desconto simplificado:** R$ 607,20 por mês. Ele substitui as deduções legais quando é mais vantajoso.

**Redução da Lei 15.270/2025** (art. 3º-A incluído na Lei 9.250/1995; vale desde 01/01/2026). Fontes: https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15270.htm e a página da Receita acima.
- **Rendimento tributável até R$ 5.000,00:** redução de até R$ 312,89, que zera o imposto.
- **De R$ 5.000,01 a R$ 7.350,00:** redução = R$ 978,62 − 0,133145 × rendimento tributável do mês.
  - Exemplo: com R$ 6.000, a redução é R$ 179,75.
- **Acima de R$ 7.350:** sem redução.
- A redução nunca passa do imposto calculado pela tabela. Ela também vale para o 13º, que é tributado só na fonte.
- **Ponto de implementação:** a redução usa o **rendimento tributável bruto do mês**, não a base depois das deduções.

**Ajuste anual a partir da declaração de 2027 (ano-calendário 2026):**
- Até R$ 60.000: redução de até R$ 2.694,15.
- De R$ 60.000,01 a R$ 88.200: redução = R$ 8.429,73 − 0,095575 × rendimento anual.

**Correção da tabela para 2027:** não encontrei lei nova. A tabela atual continua valendo até haver mudança (não verificado em nada além de imprensa).

## 10. Vale-transporte

**Lei 7.418/1985 e Decreto 10.854/2021.** Fonte: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/decreto/d10854.htm
- **Art. 114:** o empregado paga **6% do salário básico**, sem adicionais. O patrão paga o que passar disso.
- Se o custo da passagem for menor que 6% do salário, desconta-se só o custo. Isso vem de fonte secundária; não verificado no texto.
- **Art. 115:** o desconto é proporcional aos vales entregues no período, salvo convenção coletiva em contrário.
- **Art. 111:** o vale-transporte não tem natureza salarial e não sofre INSS nem FGTS.
- **Doméstico (LC 150, art. 19, parágrafo único):** o patrão pode pagar em dinheiro, com recibo.

## 11. Contrato intermitente

**CLT, art. 443, § 3º, e art. 452-A** (incluídos pela Lei 13.467/2017). Fonte: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13467.htm

**O que é:** trabalho subordinado que não é contínuo e alterna períodos de trabalho e de inatividade, medidos em horas, dias ou meses.

**Regras:**
- **Caput do 452-A:** contrato escrito, com o valor da hora. A hora não pode ser menor que a hora do mínimo nem que a de colega na mesma função.
- **§ 1º:** convocação com 3 dias corridos de antecedência.
- **§ 2º:** o trabalhador tem 1 dia útil para responder. Se não responder, conta como recusa.
- **§ 4º:** quem aceitar e não cumprir sem motivo paga multa de 50% à outra parte.
- **§ 5º:** o tempo parado não é tempo à disposição do patrão.
- **§ 6º:** **ao fim de cada período de trabalho**, paga-se na hora: remuneração, **férias proporcionais + 1/3**, **13º proporcional**, **DSR** e adicionais legais.
- **§ 7º:** o recibo tem que separar cada parcela.
- **§ 8º:** INSS e FGTS são recolhidos sobre o que foi pago no mês.
- **§ 9º:** a cada 12 meses, 1 mês de férias. Nesse mês o trabalhador não pode ser convocado pelo mesmo patrão.

**Conta para o app (minha):** sobre a remuneração R do período, mais o DSR:
- férias proporcionais + 1/3 = R × 11,11%;
- 13º proporcional = R × 8,33%;
- FGTS = 8% sobre o total pago;
- INSS do empregado pela tabela progressiva sobre o total do mês;
- encargo patronal de empresa: 20% + RAT.

**Intermitente para doméstico:** não verificado. A LC 150 exige trabalho contínuo, então o contrato intermitente doméstico é controverso. O app deve avisar isso.

## 12. Tempo parcial

**CLT, art. 58-A** (redação da Lei 13.467/2017).
- **Caput:** até **30 h por semana sem hora extra**, ou até **26 h por semana com até 6 h extras**.
- **§ 1º:** salário proporcional ao de quem trabalha em tempo integral.
- **§ 3º:** hora extra com 50% a mais.
- **§ 4º:** em contratos com menos de 26 h, as horas a mais contam como extras, até 6 por semana.
- **§ 5º:** a compensação vai até a semana seguinte; se não houver, paga-se no mês seguinte.
- **§ 6º:** pode vender 1/3 das férias.
- **§ 7º:** as férias seguem o art. 130 (as mesmas do tempo integral).

**Doméstico em tempo parcial (LC 150, art. 3º):**
- Até 25 h por semana.
- Até 1 h extra por dia, com acordo escrito e limite de 6 h por dia.
- Férias por faixa de horas semanais:

| Horas por semana | Dias de férias |
|---|---|
| Até 5 h | 8 |
| Mais de 5 até 10 h | 10 |
| Mais de 10 até 15 h | 12 |
| Mais de 15 até 20 h | 14 |
| Mais de 20 até 22 h | 16 |
| Mais de 22 até 25 h | 18 |

Esse art. 3º, § 3º, ainda está no texto do Planalto.

## 13. Diarista e outros pontos para o público do app

**Quem é doméstico (LC 150, art. 1º):** quem trabalha **mais de 2 dias por semana** para a mesma família. A conclusão de que quem trabalha até 2 dias por semana não tem vínculo vem dessa leitura; é interpretação usual, não verificada em norma expressa. O diarista sem vínculo pode contribuir como autônomo ou MEI.

**Menores:** a LC 150 proíbe contratar menor de 18 anos para trabalho doméstico.

**Licença-paternidade (Lei 15.371/2026, vale a partir de 01/01/2027):**
- 10 dias em 2027, 15 dias em 2028 e 20 dias em 2029. Os 20 dias dependem de meta fiscal.
- O pagamento passa a ser feito pelo INSS (salário-paternidade).
- Fonte: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15371.htm

**LC 150 em 2026:** a Lei 15.455/2026 incluiu o Capítulo I-A, sobre medidas para vítima de trabalho análogo à escravidão. Não muda nenhum cálculo.

## Recomendações de arquitetura do app a partir da pesquisa

1. Guardar todos os parâmetros num **arquivo de tabelas datado**, por exemplo `tabelas.json`, com campos `vigente_desde`, `fonte_url` e `status` (vigente, previsto ou não verificado). O cálculo escolhe a tabela pela data da competência.
2. Datas de troca que precisam estar previstas:
   - 01/01/2026: mínimo, INSS e IR atuais;
   - cerca de 16/12/2026: 42 h e 2 dias de repouso;
   - 01/01/2027: novo mínimo (R$ 1.741 previsto), nova tabela do INSS (não publicada) e licença-paternidade;
   - cerca de 16/12/2027: 40 h.
3. Cada número na tela deve levar a um "i" que mostre a lei e o link. Isso já alimenta a área "Ler leis".
4. Perfis de cálculo:
   - autônomo ou diarista até 2 dias;
   - doméstico mensal ou horista (eSocial);
   - CLT de empresa;
   - intermitente;
   - tempo parcial.
5. Aviso fixo: "estimativa; convenção coletiva e piso regional podem mudar os valores". O piso regional estadual (SP, RJ, PR, RS, SC) não foi pesquisado: não verificado.


## Verificação

- [CONFIRMADO] 1. Salário mínimo: R$ 1.621,00/mês, R$ 54,04/dia, R$ 7,37/hora (Decreto 12.797/2025), vigência 2026-01-01 (https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm) — Os três valores estão no art. 1º e no parágrafo único. O art. 2º marca a vigência para 1º/01/2026. Em 2026-11-20 ainda vale.
- [CONFIRMADO] 2. Salário mínimo 2027 previsto no PLOA (PLN 24/2026): R$ 1.741, não definitivo (https://www12.senado.leg.br/noticias/materias/2026/08/31/executivo-envia-orcamento-de-2027-ao-congresso-com-minimo-de-r-1.741) — A Agência Senado (oficial) confirma R$ 1.741 no PLN 24/2026. A LDO previa R$ 1.717 (https://www12.senado.leg.br/noticias/materias/2026/04/15/lei-de-diretrizes-orcamentarias-preve-salario-minimo-de-r-1-717-em-2027). Não achei decreto nem LOA 2027 aprovada até 2026-11-20. O valor final depende do INPC de novembro e do decreto. No app, deve aparecer como 'previsto'.
- [CONFIRMADO] 3. EC 141/2026: 42 h/semana 2 meses após a publicação; 40 h 1 ano depois; 2 dias de repouso semanal remunerado; sem redução salarial (https://planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc141.htm) — Publicada no DOU extra de 16/10/2026. Art. 6º, I: 42 h dois meses após a publicação (~2026-12-16). Art. 6º, II: 40 h um ano após o fim do prazo do inciso I (~2027-12-16), não um ano após a publicação. O art. 7º, XV passa a dar 2 dias de repouso, um de preferência no domingo, com vigência em 2 meses (art. 10, I; ~2026-12-16). Por acordo ou convenção coletiva, a compensação pode ser feita com média de 2 dias por mês (§2º). O art. 2º proíbe redução salarial, pisos incluídos. A nova redação do art. 7º, XIII também fixa 8 h por dia. A EC não cita a LC 150, mas o art. 7º, parágrafo único da CF estende os incisos XIII e XV ao doméstico, então o limite de 44 h da LC 150 também cai. O art. 5º remete a lei complementar para MEI, ME e EPP (não verifiquei o teor).
- [CONFIRMADO] 4. Jornada CLT de 8 h/dia; hora extra de pelo menos 50% (art. 59 §1º); até 2 h extras por dia (https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm) — O art. 58 traz 8 h diárias e não tem nota de alteração. O art. 59, caput e §1º, na redação da Lei 13.467/2017 (vigente desde 2017-11-11), prevê 'não excedente de duas' horas e 50%. O mínimo de 50% já está na CF, art. 7º, XVI, desde 1988. O limite semanal muda com a EC 141 (fato 3).
- [CONFIRMADO] 5. Adicional noturno de pelo menos 20%; hora noturna de 52 min 30 s; das 22h às 5h (CLT art. 73; LC 150 art. 14) (https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm) — O art. 73 (caput, §1º e §2º) e o art. 14 da LC 150 (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) confirmam a regra. Ela vale para o trabalhador urbano e o doméstico. O rural segue outra regra (Lei 5.889/1973), que não verifiquei aqui.
- [CONFIRMADO] 6. Doméstico: 8h/dia e 44h/semana; hora extra de 50%; salário-hora = salário mensal ÷ 220 salvo jornada menor no contrato (LC 150 art. 2º) (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) — O texto da LC 150 (DOU de 2015-06-02) diz isso. Em ~2026-12-16 o teto semanal passa a 42 h e em ~2027-12-16 a 40 h pela EC 141, via CF art. 7º, XIII e parágrafo único, o que deve mudar o divisor 220 (não verifiquei norma sobre o novo divisor). O app deve avisar isso.
- [CONFIRMADO] 7. DSR: diarista recebe 1 dia de serviço, horista a jornada normal, computadas as horas extras habituais (Lei 605/1949 art. 7º a e b) (https://www.planalto.gov.br/ccivil_03/leis/l0605.htm) — A redação das alíneas a e b vem da Lei 7.415, de 9/12/1985.
- [CONFIRMADO] 8. Súmula 172 TST: horas extras habituais entram no cálculo do repouso remunerado (https://jurisprudencia-backend2.tst.jus.br/rest/documentos/6c4b286ab2338b1f6a8848a7705b8c18) — Acórdãos do próprio TST (jurisprudencia-backend2.tst.jus.br) citam o texto: 'Computam-se no cálculo do repouso remunerado as horas extras habitualmente prestadas'. A súmula foi mantida pela Res. 121/2003 (DJ de 19, 20 e 21/11/2003) e vem do Ex-prejulgado 52. A página oficial de súmulas e o documento deram 503 ou redirecionaram, então não li a súmula direto na fonte. Troque a fonte de blog (tesesesumulas) pela do TST.
- [CONFIRMADO] 9. 13º: 1/12 por mês trabalhado; fração de 15 dias ou mais conta como mês inteiro (Lei 4.090/1962 art. 1º) (https://www.planalto.gov.br/ccivil_03/leis/l4090.htm) — Art. 1º, §§1º e 2º: '1/12 avos da remuneração devida em dezembro, por mês de serviço'.
- [CONFIRMADO] 10. 13º: adiantamento entre fevereiro e novembro; restante até 20 de dezembro (Lei 4.749/1965) (https://www.planalto.gov.br/ccivil_03/leis/l4749.htm) — O art. 1º marca o pagamento até 20 de dezembro. O art. 2º diz que o adiantamento, entre fevereiro e novembro, é a metade do salário do mês anterior, em parcela única.
- [CONFIRMADO] 11. FGTS de 8% depositado até o dia 20; aprendiz 2%; multa de 40% na dispensa sem justa causa (https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm) — O art. 15 (redação da Lei 14.438/2022) traz 8% da remuneração do mês anterior até o vigésimo dia. O §7º (Lei 10.097/2000) fixa o aprendiz em 2%. O art. 18, §1º (Lei 9.491/1997) fixa os 40%. A Lei 14.438 diz que os efeitos seguem o seu art. 19 (data não verificada). Para o doméstico, os 40% são trocados pelos 3,2% mensais do art. 22 da LC 150.
- [CONFIRMADO] 12. Doméstico: FGTS 8% + indenização 3,2% + INSS patronal 8% + seguro acidente 0,8% (LC 150 art. 34) (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) — Art. 34, incisos II a V, e art. 22. O inciso I ainda diz '8% a 11%' para o INSS do empregado, mas hoje vale a tabela progressiva de 7,5% a 14% (fato 13).
- [CONFIRMADO] 13. INSS do empregado 2026: 7,5% até R$ 1.621,00; 9% até R$ 2.902,84; 12% até R$ 4.354,27; 14% até R$ 8.475,55, progressivo (https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal) — A página oficial do INSS mostra a mesma tabela para empregado, doméstico e avulso, a partir da competência jan/2026, pela Portaria Interministerial MPS/MF nº 13, de 09/01/2026. Troque a fonte normaslegais (secundária) por esta.
- [CONFIRMADO] 14. Salário-família 2026: R$ 67,54 por filho, remuneração até R$ 1.980,38 (https://www.gov.br/inss/pt-br/direitos-e-deveres/salario-familia/valor-limite-para-direito-ao-salario-familia) — Vale desde 1º/01/2026 pela Portaria Interministerial MPS/MF 13/2026. É por filho ou equiparado de até 14 anos, ou inválido de qualquer idade. Para 2026 há uma só faixa.
- [CONFIRMADO] 15. INSS patronal de empresa: 20% sobre a folha + RAT de 1%, 2% ou 3%; 20% sobre o pago a contribuinte individual (Lei 8.212 art. 22) (https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm) — Art. 22, I e III (Lei 9.876/1999) e II, a/b/c (Lei 9.732/1998). Não inclui o FAP, terceiros (Sistema S) nem o Simples Nacional, que mudam o custo real.
- [CONFIRMADO] 16. Empregador doméstico: 8% + 0,8% (Lei 8.212 art. 24, redação da Lei 13.202/2015) (https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm) — Art. 24, I (8%) e II (0,8%), na redação da Lei 13.202/2015.
- [CONFIRMADO] 17. IRRF tabela mensal 2026: isento até R$ 2.428,80; 7,5% (−182,16) até 2.826,65; 15% (−394,16) até 3.751,05; 22,5% (−675,49) até 4.664,68; 27,5% (−908,73) acima (https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026) — Bate faixa por faixa com a tabela da Receita, vigente a partir de jan/2026.
- [CONFIRMADO] 18. IRRF 2026: dependente R$ 189,59/mês; desconto simplificado R$ 607,20/mês (https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026) — Na mesma página, a parcela isenta para maiores de 65 anos é R$ 1.903,98/mês.
- [CONFIRMADO] 19. Lei 15.270/2025: redução de até R$ 312,89 (imposto zero) até R$ 5.000; de R$ 5.000,01 a R$ 7.350 redução = 978,62 − 0,133145 × rendimento; vale para o 13º (https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15270.htm) — A lei é de 26/11/2025 e incluiu o art. 3º-A na Lei 9.250/1995. Os efeitos começam em jan/2026. A redução não pode passar do imposto apurado e é zero acima de R$ 7.350. O §3º aplica a redução ao IR exclusivo na fonte sobre o 13º. A Receita confirma os mesmos valores (https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026).
- [CORRIGIDO] 20. Vale-transporte: empregado paga 6% do salário básico e o patrão o excedente (Decreto 10.854/2021 art. 114), vigência 2021-11-10 => A regra está certa (art. 114, I e II; o salário básico exclui adicionais e vantagens). A vigência está errada: o decreto é de 10/11/2021, saiu no DOU de 11/11/2021 e vigora 30 dias após a publicação (art. 188, II), ou seja, por volta de 2021-12-11. (https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/decreto/d10854.htm) — 10/11/2021 é a data de assinatura, não a de vigência.
- [CONFIRMADO] 21. Intermitente: hora ≥ hora do mínimo; convocação com 3 dias corridos; ao fim de cada período paga remuneração, férias proporcionais + 1/3, 13º proporcional, DSR e adicionais; INSS e FGTS sobre os valores do mês (CLT art. 452-A) (https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13467.htm) — Art. 452-A, caput e §§1º, 6º e 8º. A hora também não pode ser menor que a paga aos demais empregados da mesma função. A Lei 13.467 saiu no DOU em 14/7/2017 e vigora 120 dias depois (art. 6º), em 2017-11-11 pelo meu cálculo.
- [CONFIRMADO] 22. Tempo parcial CLT: até 30 h/semana sem extras ou até 26 h/semana com até 6 h extras a 50% (art. 58-A) (https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm) — Art. 58-A, caput e §§3º e 4º, na redação da Lei 13.467/2017.
- [CONFIRMADO] 23. Doméstico em tempo parcial: até 25 h/semana, férias de 8 a 18 dias conforme as horas semanais (LC 150 art. 3º) (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) — Faixas das férias: até 5 h, 8 dias; mais de 5 até 10 h, 10 dias; mais de 10 até 15 h, 12 dias; mais de 15 até 20 h, 14 dias; mais de 20 até 22 h, 16 dias; mais de 22 até 25 h, 18 dias. O salário é proporcional.
- [CONFIRMADO] 24. Doméstico é quem trabalha mais de 2 dias por semana para a mesma pessoa ou família (LC 150 art. 1º) (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) — O texto completo diz: serviço contínuo, subordinado, oneroso, pessoal e sem fim lucrativo, no âmbito residencial, por mais de 2 dias por semana. É proibido contratar menor de 18 anos.
- [CORRIGIDO] 25. Licença-paternidade de 10 dias em 2027, 15 em 2028 e 20 em 2029, paga pelo INSS (Lei 15.371/2026), vigência 2027-01-01 => A lei é de 31/3/2026 (DOU de 1/4/2026) e vigora em 2027-01-01. São 10 dias em 2027 e 15 em 2028. Os 20 dias de 2029 dependem de cumprir a meta fiscal da LDO; se ela não for cumprida, só valem a partir do segundo exercício depois do cumprimento. Há acréscimo de 1/3 se o filho tiver deficiência (art. 12). Quem paga o salário-paternidade ao empregado CLT é o empregador, que o INSS reembolsa. O INSS paga direto ao doméstico, ao contribuinte individual e a outros segurados. O custo sai da Previdência (art. 13). (https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15371.htm) — 'Paga pelo INSS' é impreciso para o empregado de empresa, e os 20 dias de 2029 são condicionais.