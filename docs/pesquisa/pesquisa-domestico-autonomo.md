# Modalidades para "pagar alguém por hora/dia" no Brasil: regras vigentes em 20/11/2026

Pesquisa feita em 20/11/2026. Sempre que achei, usei fonte primária (planalto.gov.br, gov.br/inss, gov.br/receitafederal, manual do eSocial, al.sp.gov.br, estado.rs.gov.br). O que não confirmei em fonte primária aparece como **não verificado**.

---

## 0. Parâmetros-base de 2026 (o app deve guardar e permitir trocar no menu de configuração)

| Parâmetro | Valor | Vigência | Fonte |
|---|---|---|---|
| Salário mínimo nacional | R$ 1.621,00 por mês (R$ 54,04 por dia; R$ 7,37 por hora) | desde 01/01/2026 | Decreto 12.797/2025 (planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm) |
| Teto do INSS | R$ 8.475,55 | desde a competência 01/2026 | Portaria Interministerial MPS/MF 13/2026, publicada em gov.br/inss (tabela de contribuição mensal) |
| INSS do empregado, doméstico e avulso (alíquotas progressivas) | até 1.621,00: 7,5%; de 1.621,01 a 2.902,84: 9%; de 2.902,85 a 4.354,27: 12%; de 4.354,28 a 8.475,55: 14% | competência 01/2026 | gov.br/inss |
| INSS do contribuinte individual (CI), facultativo e MEI | 20% sobre a base de 1.621,00 a 8.475,55 (de R$ 324,20 a R$ 1.695,11); plano simplificado 11% sobre o salário mínimo (R$ 178,31); MEI 5% (R$ 81,05) | 01/2026 | gov.br/inss |
| IRRF, tabela mensal | até 2.428,80: isento; até 2.826,65: 7,5% (deduz 182,16); até 3.751,05: 15% (deduz 394,16); até 4.664,68: 22,5% (deduz 675,49); acima: 27,5% (deduz 908,73). Dependente: R$ 189,59. Desconto simplificado: R$ 607,20 | 01/2026 | gov.br/receitafederal/.../tabelas/2026 |
| Redutor do IR (Lei 15.270/2025) | renda até R$ 5.000,00: redução de até R$ 312,89 (o imposto zera); de R$ 5.000,01 a R$ 7.350,00: redução = 978,62 − 0,133145 × renda; acima de R$ 7.350,00: sem redução | 01/2026 | mesma página da Receita |

**Fórmula do INSS progressivo de 2026** (as parcelas a deduzir foram calculadas por mim a partir das faixas oficiais e conferem com o desconto máximo de R$ 988,09):
- S ≤ 1.621,00: INSS = S × 7,5%
- S ≤ 2.902,84: INSS = S × 9% − 24,31
- S ≤ 4.354,27: INSS = S × 12% − 111,40
- S ≤ 8.475,55: INSS = S × 14% − 198,49
- S acima disso: INSS = 988,09

**Fórmula do IRRF de 2026:**
1. Base = rendimento − INSS − dependentes × 189,59, ou rendimento − 607,20 (desconto simplificado); usar o que for mais favorável.
2. Imposto pela tabela = base × alíquota − parcela a deduzir.
3. Aplicar o redutor sobre o **rendimento tributável bruto**: até 5.000, redução = min(imposto, 312,89); entre 5.000,01 e 7.350, redução = 978,62 − 0,133145 × rendimento.
4. IR = max(0, imposto − redução).

---

## 1. Critérios de vínculo empregatício (a base de todas as modalidades)

- **CLT, art. 3º** (planalto.gov.br/ccivil_03/decreto-lei/del5452.htm): é empregado quem presta serviço de natureza **não eventual** a empregador, **sob dependência** (subordinação), **mediante salário** (onerosidade), sendo **pessoa física**. A **pessoalidade** decorre do art. 2º, em que o empregador "dirige a prestação pessoal de serviço".
- **CLT, art. 7º, "a"**: a CLT não se aplica aos domésticos, que têm lei própria (LC 150/2015).
- **LC 150/2015, art. 1º** (planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm): o doméstico presta serviço de forma "contínua, subordinada, onerosa e pessoal e de finalidade não lucrativa à pessoa ou à família, no âmbito residencial destas, por mais de 2 (dois) dias por semana". O parágrafo único proíbe contratar menor de 18 anos como doméstico.
- **CLT, art. 442-B (autônomo):** pela reforma de 2017, contratar um autônomo cumprindo todas as formalidades afasta a condição de empregado, mesmo com exclusividade. **Não verifiquei o texto atual no Planalto.** A doutrina (AASP) lê o artigo como presunção relativa: se houver subordinação, o vínculo é reconhecido.
- **Os quatro requisitos, para um checklist no app:**
  1. Pessoalidade: a pessoa não pode mandar outra no lugar.
  2. Não eventualidade ou habitualidade: dias fixos, rotina. No trabalho doméstico, o critério legal objetivo é **3 ou mais dias por semana**.
  3. Subordinação: o contratante define horário, modo de fazer e fiscaliza.
  4. Onerosidade: há pagamento.
  Com todos presentes, há risco de vínculo, seja qual for o contrato ou nome usado (RPA, MEI, "freela").
- **Jurisprudência:** o TRT-2 reconheceu vínculo doméstico com 3 dias por semana, citando o limite de 2 diárias semanais do art. 1º da LC 150 (ww2.trt2.jus.br, notícia "Prestação de serviços domésticos em três dias na mesma semana gera vínculo de emprego"). A afirmação de que o TST tem entendimento consolidado sobre "até 2 dias" aparece só em fontes secundárias: **não verificado no tst.jus.br**.

---

## 2. Modalidade 1: Empregado doméstico (LC 150/2015)

**Quando se aplica:** serviço à pessoa ou família, na residência, sem fim lucrativo, por **mais de 2 dias por semana** (art. 1º). Inclui faxineira, cozinheira, babá, cuidador de idoso, motorista particular, caseiro.

**Regras principais (LC 150):**
- Jornada de 8 horas por dia e 44 por semana. Hora extra com acréscimo mínimo de 50%. Para o mensalista, o salário-hora é o salário dividido por 220 (art. 2º e §2º).
- Tempo parcial de até 25 horas por semana, com salário proporcional e no máximo 1 hora extra por dia, limitada a 6 horas por dia (art. 3º).
- Escala 12x36 por acordo escrito (art. 10).
- Registro de horário obrigatório (art. 12).
- Trabalho noturno das 22h às 5h: hora de 52min30s e adicional mínimo de 20% (art. 14).
- Férias de 30 dias com mais 1/3 (art. 17).
- É proibido descontar do salário alimentação, vestuário, higiene ou moradia. Adiantamento, plano de saúde e similares podem ser descontados até 20% do salário (art. 18).
- Seguro-desemprego de 1 salário mínimo por até 3 meses (art. 26).
- 13º salário: 1ª parcela até 30/11 e 2ª até 20/12 (Manual do eSocial Doméstico, versão 13/08/2026).

**Encargos no DAE do Simples Doméstico (LC 150, art. 34; confirmados no Manual do eSocial Doméstico de 13/08/2026, p. 78):**

| Quem paga | Item | Alíquota |
|---|---|---|
| Empregador | Contribuição patronal previdenciária (CPP) | 8,0% |
| Empregador | Seguro contra acidentes (GILRAT) | 0,8% |
| Empregador | FGTS | 8,0% |
| Empregador | Indenização compensatória (art. 22, a "multa" antecipada) | 3,2% |
| **Total do empregador** | | **20,0% sobre a remuneração** |
| Empregado (descontado do salário) | INSS progressivo | 7,5% a 14% |
| Empregado (descontado do salário) | IRRF | se houver |

**Vencimento do DAE (atenção):** o texto compilado do art. 35 da LC 150 no Planalto ainda diz "até o dia 7 do mês seguinte". Porém o **Manual oficial do eSocial do Empregador Doméstico, versão 13/08/2026**, diz que o DAE vem "com a data de vencimento da competência (até dia 20 do mês seguinte, antecipado no caso de dia não útil)". A mudança segue a Lei 14.438/2022 e a adoção do FGTS Digital. O 13º gera DAE com vencimento em 20/01. **Recomendação para o app: usar dia 20, antecipado se não for dia útil, citando o manual, e mostrar a nota sobre o dia 7 do texto original.** Fonte: gov.br/esocial/pt-br/documentacao-tecnica/manuais/manual-do-esocial-empregador-domestico-versao-13-08-2026.pdf

**Pisos estaduais do doméstico em 2026:**

| UF | Piso | Situação |
|---|---|---|
| SP | R$ 1.874,36 (domésticos e cuidadores de idoso ou de pessoa com deficiência) | Lei 18.471 de 27/05/2026, em vigor no 1º dia do mês seguinte à publicação (junho de 2026, segundo a imprensa). Fonte: al.sp.gov.br/repositorio/legislacao/lei/2026/lei-18471-27.05.2026.html. Piso anterior: R$ 1.804 (não verificado na fonte primária) |
| RS | Faixa 1 = R$ 1.884,75; domésticos estão na Faixa 1, item "d" | Publicado no DOE em 21/05/2026, reajuste de 5,35%. Fonte: estado.rs.gov.br (notícia "reajuste do piso salarial regional já está em vigor..."). Número da lei não verificado (fontes secundárias citam 16.514) |
| PR | Grupo II = R$ 2.181,63; Grupos I a IV de R$ 2.105,34 a R$ 2.407,90, válidos até 31/12/2026 | Fonte: parana.pr.gov.br (AEN, 19/01/2026). **Enquadramento do doméstico no Grupo II: não verificado em fonte oficial**, só em sites secundários. Decreto de 2026: não verificado |
| SC | 1ª faixa = R$ 1.842,00, retroativo a 01/01/2026 (LC estadual 895/2026) | **Não verificado em fonte primária**. Fonte usada: trabalhista.blog, 27/03/2026 |
| RJ | Piso estadual sem reajuste desde 2019 e abaixo do mínimo nacional, então vale R$ 1.621 | **Não verificado em fonte primária** |
| Demais UFs | R$ 1.621,00 (mínimo nacional) | Decreto 12.797/2025 |

Piso por hora, com divisor 220: SP 8,52; RS 8,57; SC 8,37; PR 9,92; nacional 7,37.

**Fórmulas (empregado doméstico):**
- Salário mensal S = max(valor combinado, piso da UF, proporcional à jornada no tempo parcial).
- Horista: S = valor/hora × horas no mês, com valor/hora ≥ piso ÷ 220. O DSR é devido: o manual do eSocial dá um exemplo de cálculo de DSR para diarista e horista ("Exemplo 7").
- Desconto do empregado: INSS(S) pela tabela progressiva + IRRF.
- **Líquido do trabalhador** = S − INSS(S) − IRRF − descontos permitidos (até 20%).
- **DAE do mês** = S × 20% (empregador) + INSS(S) + IRRF.
- **Custo mensal real do empregador**, com provisões = S × 1,20 + (S/12) × 1,20 (13º) + (S/12 × 4/3) × 1,20 (férias + 1/3) ≈ **S × 1,3667**. Esta é uma aproximação minha: o 1/3 de férias também entra na base de FGTS e INSS. Vale-transporte (até 6% descontado do salário) não entra nessa conta.
- Exemplo com S = 1.621,00: INSS do empregado R$ 121,58; líquido R$ 1.499,42; parte do empregador no DAE R$ 324,20; DAE total R$ 445,78.

**Riscos:** sem registro, a pessoa ou família responde na Justiça do Trabalho por FGTS + 3,2%, férias + 1/3, 13º, horas extras e INSS em atraso com multa e juros.

---

## 3. Modalidade 2: Diarista sem vínculo (até 2 dias por semana na mesma residência)

- **Base legal:** não é doméstica porque não passa de 2 dias por semana (LC 150, art. 1º, a contrario sensu). É trabalhadora autônoma, ou seja, contribuinte individual (Lei 8.212, art. 12, V, "h": pessoa física que exerce atividade econômica por conta própria; planalto.gov.br/ccivil_03/leis/l8212cons.htm).
- **O que a pessoa física contratante paga ou recolhe:** só o valor da diária combinada. A pessoa física comum não é "empresa" (Lei 8.212, art. 15, I). As equiparações do parágrafo único alcançam o contribuinte individual em relação a quem lhe presta serviço, e a pessoa física em casos como dono de obra. Por isso, **não há 20% patronal nem retenção de 11%** quando quem contrata é pessoa física sem atividade econômica. Esta é uma inferência minha a partir do art. 15 e do art. 4º da Lei 10.666/2003, que obriga apenas a "empresa" a reter. **Não achei texto expresso dizendo que a pessoa física está isenta: tratar como "não verificado", mas é a leitura consolidada.**
- **O que a diarista recolhe por conta própria:**
  - INSS de 20% sobre a renda (mín. R$ 324,20, máx. R$ 1.695,11), ou 11% no plano simplificado (R$ 178,31, sem aposentadoria por tempo de contribuição), ou **MEI**: ocupação "DIARISTA INDEPENDENTE", CNAE 9700-5/00, na lista oficial (gov.br/empresas-e-negocios/.../atividades-permitidas/d).
  - Vencimento da GPS do contribuinte individual: dia 15 do mês seguinte (Lei 8.212, art. 30, II).
  - IR via **carnê-leão** quando recebe de pessoa física, pago até o último dia útil do mês seguinte (gov.br/receitafederal, página do carnê-leão).
- **Fórmulas:**
  - Custo do pagador = diária × dias. Diária = horas × valor/hora, ou valor fechado.
  - Líquido estimado da diarista = bruto − INSS próprio (20%, 11% ou DAS-MEI) − carnê-leão, se a renda mensal passar da faixa de isenção.
- **Riscos:**
  - Passar a **3 ou mais dias por semana** na mesma casa transforma a relação em vínculo doméstico.
  - Dias fixos com subordinação forte aumentam o risco.
  - **Alerta para o app:** contar os dias por semana e avisar "≥3 dias = vínculo doméstico".
  - Vários contratantes em dias diferentes não geram vínculo com nenhum deles por si só.

---

## 4. Modalidade 3: Autônomo com RPA (Recibo de Pagamento a Autônomo)

**Se quem contrata é EMPRESA (PJ):**
- Retém 11% do autônomo e recolhe junto com a parte dela até o dia 20 do mês seguinte (Lei 10.666/2003, art. 4º; planalto.gov.br/ccivil_03/leis/2003/l10.666.htm). A base vai de 1.621,00 a 8.475,55, então a retenção máxima é R$ 932,31 (cálculo meu: 11% × 8.475,55).
- Recolhe **20% patronal** sobre o total pago ao contribuinte individual (Lei 8.212, art. 22, III), sem teto.
- O autônomo que presta serviço a empresa pode deduzir 45% da contribuição da empresa, limitado a 9%. É daí que vêm os 11% (Lei 8.212, art. 30, §4º).
- IRRF retido pela tabela mensal + redutor da Lei 15.270.
- ISS: alíquota municipal entre **2%** (LC 116/2003, art. 8º-A) e **5%** (art. 8º, II). O município pode atribuir a retenção ao tomador por lei (LC 116, art. 6º). A alíquota exata depende de cada município: **não verificado por cidade**.
- Fórmulas:
  - Custo da empresa = bruto × 1,20 (+ ISS, se a empresa for responsável e não descontar).
  - Líquido do autônomo = bruto − min(bruto, 8.475,55) × 11% − IRRF − ISS retido.

**Se quem contrata é PESSOA FÍSICA:**
- Não retém nem recolhe (mesma lógica do item 3).
- O autônomo recolhe 20% (ou 11% no simplificado) por GPS até o dia 15, e o IR por carnê-leão.
- Riscos: os 4 requisitos do art. 3º, sobretudo subordinação e habitualidade. O RPA não protege se houver vínculo de fato.

---

## 5. Modalidade 4: MEI (Microempreendedor Individual)

- **Limite de receita:** R$ 81.000,00 por ano (LC 123/2006, art. 18-A, §1º).
- No ano de abertura: R$ 6.750,00 × meses de atividade (§2º).
- Excesso de até 20% (até R$ 97.200, cálculo meu): o desenquadramento vale a partir de 1º de janeiro do ano seguinte. Acima de 20%: retroage a 1º de janeiro do ano do excesso (§7º, III).
- **DAS mensal em 2026:** INSS = 5% do salário mínimo = **R$ 81,05** (Lei 8.212, art. 21, §2º, II, "a"; valor em gov.br/inss), + R$ 1,00 de ICMS (comércio e indústria) e/ou + R$ 5,00 de ISS (serviços) (LC 123, art. 18-A, §3º, V, "b" e "c"). Isso dá R$ 82,05 (comércio ou indústria), R$ 86,05 (serviços) ou R$ 87,05 (comércio e serviços). Os totais por atividade vêm da Agência Brasil e da imprensa; a soma confere com a lei.
- Vencimento do DAS: dia 20 (**não verificado em fonte primária**, só InfoMoney).
- **Diarista pode ser MEI?** Sim: "DIARISTA INDEPENDENTE", CNAE 9700-5/00, está na lista oficial de ocupações permitidas (gov.br/empresas-e-negocios/pt-br/empreendedor/quero-ser-mei/atividades-permitidas/d). Recolhimento de ISS ou ICMS dessa ocupação: **não verificado**. Cuidador ou faxineiro como ocupações separadas: **não verificado**.
- **Atenção:** ser MEI **não afasta o vínculo**. Uma "MEI" trabalhando 3 ou mais dias por semana na mesma residência, com subordinação, continua sendo doméstica (LC 150, art. 1º + CLT, art. 9º, que anula atos destinados a fraudar a lei; art. 9º não conferido no Planalto).
- **Pessoa física contratando MEI:** não retém nada. Paga o valor combinado e pede nota fiscal (opcional quando o tomador é pessoa física, segundo regra do CGSN: **não verificado**).
- **Empresa contratando MEI:** sem retenção de INSS na regra geral (**não verificado na Resolução CGSN 140**). ISS conforme o município.
- **MEI com 1 empregado:** só um empregado, ganhando o salário mínimo ou o piso da categoria (LC 123, art. 18-C, caput). O MEI recolhe **3%** de CPP sobre o salário desse empregado (art. 18-C, §1º, III) + FGTS de 8% + o INSS do empregado descontado (7,5% a 14%). A alíquota de FGTS do MEI não foi conferida em fonte primária.
- **Fórmulas:**
  - Para o pagador pessoa física: custo = valor do serviço.
  - Para o trabalhador MEI: líquido = receita − DAS fixo (81,05 + 5 ou + 1) − custos. Não há IR mensal; há a declaração anual DASN-SIMEI.
  - MEI empregador: custo do empregado = S × (1 + 3% + 8%) + provisões.

---

## 6. Modalidade 5: Estágio (Lei 11.788/2008) e Jovem Aprendiz

**Estágio** (planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11788.htm):
- **Quem pode conceder estágio (art. 9º):** pessoas jurídicas de direito privado, órgãos públicos e **profissionais liberais de nível superior registrados em conselho**. **Uma pessoa física comum (família) não pode ter estagiário.** O app deve bloquear essa combinação.
- **Requisitos (art. 3º):** matrícula e frequência, termo de compromisso tripartite, atividades compatíveis com o curso. O descumprimento gera vínculo de emprego (art. 15).
- **Jornada (art. 10):** 4h/dia e 20h/semana (educação especial e anos finais do fundamental na modalidade profissional de EJA); **6h/dia e 30h/semana** (superior, profissional de nível médio, médio regular); até 40h/semana em períodos sem aula, se previsto no projeto pedagógico.
- **Duração:** no máximo 2 anos na mesma concedente, salvo pessoa com deficiência (art. 11).
- **Bolsa e transporte:** obrigatórios no estágio não obrigatório. Benefícios como alimentação e saúde não geram vínculo (art. 12).
- **Seguro:** seguro contra acidentes pessoais obrigatório (art. 9º, IV).
- **Recesso:** 30 dias por ano de estágio, remunerado se houver bolsa; proporcional se o estágio for menor que 1 ano (art. 13).
- **Cota de estagiários (art. 17):** 1 a 5 empregados: 1; 6 a 10: até 2; 11 a 25: até 5; mais de 25: até 20%. Não se aplica ao nível superior nem ao médio profissional.
- **Encargos:** não há FGTS nem INSS patronal obrigatório sobre a bolsa (**não verificado em fonte primária**). IRRF sobre a bolsa pela tabela (**não verificado**).
- **Fórmulas:**
  - Bolsa mensal = valor/hora × horas (≤ 30h/semana).
  - Recesso proporcional = 30 × meses/12 dias.
  - Custo = bolsa + auxílio-transporte + seguro.

**Jovem Aprendiz** (CLT, arts. 428 a 433). Não consegui ler esses artigos no Planalto (página truncada). Dados de fontes gov.br secundárias (Manual da Aprendizagem do MTE e cartilha do MDS):
- Idade: de 14 a menos de 24 anos (sem limite para pessoa com deficiência).
- Contrato escrito, por prazo determinado, de no máximo 2 anos.
- Salário mínimo-hora (ou piso estadual).
- Jornada de 6h/dia, ou até 8h para quem concluiu o fundamental, contando as horas teóricas. Hora extra e compensação proibidas.
- **FGTS de 2%**. Tem 13º, férias e vale-transporte.
- Situação: **não verificado no texto atual da CLT**.
- **Não se aplica a família ou pessoa física:** a aprendizagem exige inscrição em programa e se destina a estabelecimentos (cota de 5% a 15%, art. 429, não verificado). A LC 150 proíbe doméstico menor de 18.
- Fórmula: S = 7,37 × horas no mês (+ DSR). Custo = S + FGTS 2% + INSS patronal (depende do regime tributário da empresa).

---

## 7. Modalidade 6: Trabalho temporário (Lei 6.019/1974)

(planalto.gov.br/ccivil_03/leis/l6019.htm)
- **Definição (art. 2º):** pessoa física contratada por **empresa de trabalho temporário** (pessoa jurídica registrada no Ministério do Trabalho, art. 4º) e colocada à disposição da **tomadora**, que é **pessoa jurídica ou entidade a ela equiparada** (art. 5º). Serve para substituir transitoriamente pessoal permanente ou para demanda complementar.
- **Prazo:** até **180 dias**, consecutivos ou não, + prorrogação de até **90 dias** (art. 10, §§1º e 2º).
- **Direitos (art. 12):** remuneração equivalente à dos empregados da mesma categoria da tomadora; jornada de 8h; horas extras; férias proporcionais; DSR; adicional noturno; indenização de 1/12 do que foi pago; seguro contra acidente.
  - Observação: o texto exibido fala em hora extra de 20%, o que é anterior à CF/88. A Constituição exige pelo menos 50% (CF, art. 7º, XVI: **não conferido nesta pesquisa**).
- **Pessoa física não pode ser tomadora** de trabalho temporário, porque a lei exige pessoa jurídica ou entidade equiparada. **Para o público do app (pessoa física), essa modalidade não se aplica.** Mostrar só como informação.
- **Fórmula (empresa tomadora):** custo = valor da fatura da agência, que inclui salário, encargos e a margem dela. A pessoa contratada recebe pela folha da agência como empregado, com descontos de INSS progressivo e IRRF.

---

## 8. Resumo para o motor de cálculo do app

| Modalidade | Quem pode contratar | O que o pagador recolhe | Desconto no trabalhador | Alerta de risco |
|---|---|---|---|---|
| Doméstico (>2 dias/sem) | Pessoa ou família | 20% (8 + 0,8 + 8 + 3,2) + provisões de 13º e férias + 1/3; DAE até o dia 20 | INSS 7,5–14% + IRRF | Exigir o piso da UF; controle de jornada obrigatório |
| Diarista (≤2 dias/sem) | Pessoa física | Nada | Ela mesma: 20%, 11% ou MEI + carnê-leão | Avisar ao chegar a 3 dias ou mais por semana |
| Autônomo/RPA, contratante PF | Pessoa física | Nada | Ele mesmo: 20% ou 11%, GPS até o dia 15 + carnê-leão | Checklist do art. 3º |
| Autônomo/RPA, contratante PJ | Empresa | 20% patronal + recolher os 11% retidos até o dia 20 + ISS (2–5%, depende do município) | 11% (até o teto) + IRRF | Mesmo checklist |
| MEI | PF ou PJ | Nada (PF) | DAS de 81,05 + 5 (ISS) ou + 1 (ICMS); limite de R$ 81 mil por ano | Ser MEI não afasta o vínculo |
| Estágio | Só PJ, órgão público ou profissional liberal registrado | Bolsa + transporte + seguro | IRRF, se houver | Família não pode; máx. 6h/dia e 30h/semana |
| Aprendiz | Estabelecimentos | FGTS 2% + encargos | INSS | Não se aplica a família |
| Temporário | Só PJ tomadora, via agência | Fatura da agência | INSS + IRRF na folha da agência | Família não pode |

**Itens marcados como não verificados:**
- Pisos de PR, SC e RJ em fonte primária.
- Texto atual dos arts. 428–433 e 442-B da CLT.
- Vencimento do DAS-MEI no dia 20.
- ISS/ICMS da ocupação diarista-MEI.
- Ausência expressa de obrigação para pessoa física que contrata contribuinte individual (é inferência).
- Encargos sobre a bolsa de estágio.
- Posição atual do TST sobre diarista.
- Situação no STF da discussão sobre pejotização: não pesquisada.


## Verificação

- [CONFIRMADO] 1. Salário mínimo nacional R$ 1.621,00/mês (R$ 54,04/dia; R$ 7,37/hora), vigência 2026-01-01 => R$ 1.621,00/mês; R$ 54,04/dia; R$ 7,37/hora; a partir de 01/01/2026 (Decreto 12.797, de 23/12/2025, arts. 1º e 2º) (https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm) — Texto do decreto conferido. Para o mensalista doméstico, o salário-hora contratual usa o divisor 220 (LC 150, art. 2º §2º): 1.621/220 = 7,368, o que bate com R$ 7,37.
- [CONFIRMADO] 2. INSS do empregado e do doméstico em 2026: até 1.621,00 7,5%; 1.621,01–2.902,84 9%; 2.902,85–4.354,27 12%; 4.354,28–8.475,55 14%; teto R$ 8.475,55; desconto máximo R$ 988,09 => Faixas e alíquotas iguais às afirmadas. Base: Portaria Interministerial MPS/MF nº 13, de 09/01/2026, a partir da competência jan/2026. Desconto máximo recalculado: 121,575 + 115,3656 + 174,1716 + 576,9792 = 988,09 (https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal) — O desconto máximo não está escrito na página; é a soma progressiva por faixa, que conferi aqui.
- [CONFIRMADO] 3. Contribuinte individual 20% (R$ 324,20 a R$ 1.695,11); plano simplificado 11% = R$ 178,31; MEI 5% = R$ 81,05 => 20%: de 324,20 a 1.695,11; 11%: 178,31; 5% (facultativo de baixa renda e MEI): 81,05; competência jan/2026 (Portaria Interministerial MPS/MF 13/2026) (https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal) — A alíquota de 5% vale só para o MEI e para o facultativo de baixa renda.
- [CONFIRMADO] 4. IRRF mensal 2026: isento até 2.428,80; 7,5% (dedução 182,16) até 2.826,65; 15% (394,16) até 3.751,05; 22,5% (675,49) até 4.664,68; 27,5% (908,73); dependente 189,59; desconto simplificado 607,20 => Valores idênticos aos afirmados; tabela da Lei 15.191/2025, aplicada a partir de jan/2026 segundo a página da Receita (https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026) — A página diz que as tabelas anuais valem a partir do exercício 2027 (ano-calendário 2026).
- [CONFIRMADO] 5. Redutor da Lei 15.270/2025: até R$ 5.000, redução de até R$ 312,89 (zera o imposto); de 5.000,01 a 7.350, redução = 978,62 − 0,133145 × rendimento; acima de 7.350, sem redução => Igual ao afirmado; vigência jan/2026 (https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026) — A redução incide sobre os rendimentos tributáveis sujeitos à incidência mensal, e não sobre a base de cálculo já deduzida. A calculadora deve aplicar a fórmula sobre o rendimento bruto tributável.
- [CONFIRMADO] 6. Empregado doméstico: serviço contínuo, subordinado, oneroso, pessoal, sem fim lucrativo, no âmbito residencial, por mais de 2 dias por semana; vedado a menor de 18 anos => LC 150, de 01/06/2015, publicada no DOU de 02/06/2015, art. 1º caput e parágrafo único (Convenção 182 da OIT e Decreto 6.481/2008) (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) — Texto literal conferido no Planalto.
- [CONFIRMADO] 7. Doméstico: jornada de 8h/44h, hora extra +50%, divisor 220; tempo parcial até 25h por semana; adicional noturno de 20% (22h às 5h, hora de 52min30s); férias de 30 dias + 1/3; descontos permitidos até 20% => Art. 2º caput e §§1º e 2º (divisor 220, salvo jornada mensal menor no contrato; §3º: salário-dia = mensal/30); art. 3º (tempo parcial ≤25h/semana); art. 14 caput e §1º (22h às 5h; hora de 52min30s; o §2º fixa o adicional em pelo menos 20%); art. 17 (30 dias + 1/3); art. 18 §1º (limite de 20%) (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) — Ressalva: o limite de 20% do art. 18 §1º trata do adiantamento salarial e, com acordo escrito, de planos médico-odontológicos, seguro e previdência privada. O art. 18 caput proíbe descontar alimentação, vestuário, higiene e moradia. O valor de 20% do adicional noturno está no §2º do art. 14, que não transcrevi literalmente.
- [CONFIRMADO] 8. DAE do Simples Doméstico: empregador 8% CPP + 0,8% GILRAT + 8% FGTS + 3,2% de indenização compensatória = 20%; empregado 7,5% a 14% de INSS + IRRF => Manual do eSocial do Empregador Doméstico, versão de 13/08/2026, p. 78-79: 8,0% + 0,8% + 8,0% + 3,2% a cargo do empregador; retido do empregado: INSS de 7,5% a 14% (desde a competência 03/2020) e IRRF, se houver (https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/manual-do-esocial-empregador-domestico-versao-13-08-2026.pdf) — A base legal é a LC 150, art. 34, I a VI. O texto compilado do inciso I ainda diz 8% a 11%, mas foi superado pela tabela progressiva vigente desde 03/2020.
- [CONFIRMADO] 9. Vencimento do DAE doméstico: até o dia 20 do mês seguinte, antecipado se não for dia útil; o texto compilado do art. 35 da LC 150 ainda diz dia 7 => Dia 20 do mês seguinte, antecipado para o dia útil anterior. Fontes: manual do eSocial de 13/08/2026, p. 80 ('até dia 20 do mês seguinte, antecipado no caso de dia não útil'); Lei 8.212, art. 30 V, com redação da Lei 14.438/2022 ('até o vigésimo dia do mês seguinte'); Lei 8.036, art. 15, com redação da Lei 14.438/2022 (FGTS até o dia 20). O texto compilado da LC 150, art. 35, ainda diz dia 7. (https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm) — O próprio manual ainda cita 'até o dia 7' na seção de parcelamento do FGTS (p. ~90), o que é texto desatualizado. A calculadora deve usar o dia 20.
- [CONFIRMADO] 10. 13º do doméstico: 1ª parcela até 30/11, 2ª até 20/12; DAE do 13º vence em 20/01 => 1ª parcela até 30/11; 2ª até 20/12; o DAE da competência 13º vence em 20/01 (manual do eSocial de 13/08/2026, seção 4.1.7.2) (https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/manual-do-esocial-empregador-domestico-versao-13-08-2026.pdf) — Detalhe para a calculadora: o DAE do 13º traz só o INSS patronal, o do empregado e o GILRAT. O IRRF e o FGTS da 2ª parcela vão no DAE de dezembro, que também vence em 20/01. O FGTS da 1ª parcela é recolhido no DAE da competência em que ela foi paga.
- [CONFIRMADO] 11. Piso de SP para domésticos e cuidadores: R$ 1.874,36 (Lei 18.471/2026, vigente no 1º dia do mês seguinte à publicação) => R$ 1.874,36 (art. 1º, inciso I: trabalhadores domésticos e cuidadores de idosos ou de pessoas com deficiência); Lei 18.471, de 27/05/2026; art. 2º: vigência no 1º dia do mês seguinte à publicação; publicada no DOE-SP em 28/05/2026, logo vigente desde 01/06/2026 (https://www.al.sp.gov.br/repositorio/legislacao/lei/2026/lei-18471-27.05.2026.html) — A data de publicação (28/05/2026) vem de fontes secundárias que coincidem entre si. O inciso II tem o mesmo valor. O piso estadual não se aplica a quem tem piso em lei federal, convenção ou acordo coletivo.
- [CONFIRMADO] 12. Piso do RS, Faixa 1 (inclui domésticos) R$ 1.884,75; faixas até R$ 2.388,50 => Faixa 1: R$ 1.884,75 (inclui empregados domésticos); Faixa 2: 1.928,15; Faixa 3: 1.971,89; Faixa 4: 2.049,76; Faixa 5: 2.388,50; publicada no DOE-RS em 21/05/2026 e vigente desde a publicação (data-base 1º de maio) (https://www.estado.rs.gov.br/reajuste-do-piso-salarial-regional-ja-esta-em-vigor-apos-publicacao-no-diario-oficial-do-estado-nesta-quinta-21) — A notícia oficial não traz o número da lei estadual (não verificado). Também não conferi a letra do item (alínea 'd').
- [CONFIRMADO] 13. Piso do PR 2026: Grupo I 2.105,34; II 2.181,63; III 2.250,04; IV 2.407,90 (enquadramento do doméstico no Grupo II não verificado em fonte oficial) => Grupo I 2.105,34 (agropecuária, florestal e pesca); II 2.181,63 (serviços administrativos, comércio, reparação e manutenção); III 2.250,04; IV 2.407,90; valores aprovados pelo Conselho Estadual (notícia oficial de 19/01/2026), 'válidos até 31/12/2026' (https://www.parana.pr.gov.br/Audio/Parana-renova-piso-salarial-para-ate-R-24-mil-e-deve-manter-maior-valor-do-Brasil-em-2026) — Só os valores estão confirmados. Não verificados: o texto do decreto (fontes secundárias citam o Decreto 13.182, de 01/04/2026, e a Resolução CETER 632/2026), a vigência retroativa a 01/01/2026 e o grupo dos domésticos (em 2025 estavam na Faixa II, segundo fonte secundária). A notícia oficial não menciona domésticos.
- [CONFIRMADO] 14. Piso de SC, 1ª faixa (domésticos) R$ 1.842,00, LC estadual 895/2026, retroativo (não verificado em fonte primária) => LC 895, de 26/03/2026, que altera o art. 1º da LC 459/2009: I R$ 1.842,00; II R$ 1.908,00; III R$ 2.022,00; IV R$ 2.106,00; art. 2º: vigência na publicação, com efeitos desde 01/01/2026 (https://portalelegis.alesc.sc.gov.br/documentos/djwp6) — Agora verificado em fonte primária (autógrafo e despacho de sanção, Alesc). A inclusão dos domésticos na faixa I (alínea d da LC 459) vem de fonte secundária (COAD); a LC 895 só altera os valores. Atenção: a faixa II é R$ 1.908,00, e não 1.980 como dizem alguns sites.
- [CONFIRMADO] 15. Empresa contratante deve reter a contribuição do contribuinte individual e recolher até o dia 20 do mês seguinte => Lei 10.666/2003, art. 4º: a empresa arrecada, descontando da remuneração, e recolhe até o dia 20 do mês seguinte, ou no dia útil anterior se não houver expediente bancário. Redação da Lei 11.933/2009 (antes, MP 447/2008) (https://www.planalto.gov.br/ccivil_03/leis/2003/l10.666.htm) — A vigência '2009-01-01' é aproximada: o dia 20 veio da MP 447/2008 (nov/2008), convertida na Lei 11.933, de 28/04/2009. O mesmo prazo está na Lei 8.212, art. 30 I b. Isso vale só para contratante pessoa jurídica: pessoa física que contrata autônomo não retém.
- [CORRIGIDO] 16. Empresa paga 20% sobre a remuneração do contribuinte individual (art. 22 III); o CI pode deduzir 45% da contribuição da empresa, limitado a 9% (art. 30 §4º), resultando em 11%; o CI recolhe por conta própria até o dia 15 (art. 30 II); empregador doméstico 8% + 0,8% (art. 24); vigência 1999-11-29 => Os valores estão certos: art. 22 III (20%), art. 30 §4º (45%, limitado a 9%) e art. 30 II (dia 15) vêm da Lei 9.876/1999 (DOU de 29/11/1999). A vigência está errada para o art. 24 (8% + 0,8% do empregador doméstico), cuja redação é da Lei 13.202/2015, alinhada à LC 150 (efeitos de out/2015 com o Simples Doméstico). (https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm) — A vigência única de 1999 não vale para o art. 24. Outro ponto: o art. 30 V (Lei 14.438/2022) fixa o recolhimento do empregador doméstico até o dia 20.
- [CONFIRMADO] 17. ISS: alíquota mínima 2% (art. 8º-A) e máxima 5% (art. 8º II); o município pode atribuir responsabilidade ou retenção ao tomador (art. 6º) => Art. 8º II: 5%; art. 8º-A: 2% (incluído pela LC 157, de 29/12/2016, DOU de 30/12/2016); art. 6º: o município, por lei, pode atribuir a responsabilidade a terceiro vinculado ao fato gerador (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm) — A retenção depende de lei de cada município; a calculadora não deve presumir que ela ocorre.
- [CONFIRMADO] 18. Carnê-leão: rendimento recebido de pessoa física; pagar até o último dia útil do mês seguinte => Vale para rendimento de pessoa física residente recebido de outra pessoa física ou do exterior; pagamento até o último dia útil do mês seguinte ao do recebimento (https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/carne-leao) — Usa a mesma tabela mensal e o redutor da Lei 15.270 (fatos 4 e 5).
- [CONFIRMADO] 19. MEI: limite de R$ 81.000/ano (art. 18-A §1º); R$ 6.750 × meses no ano de início (§2º); +R$1 de ICMS e +R$5 de ISS (§3º V); excesso de até 20% desenquadra no ano seguinte (§7º III); 1 empregado com salário mínimo ou piso, CPP de 3% (art. 18-C) => Vale para 2026: R$ 81.000; R$ 6.750/mês no ano de início; ICMS R$ 1 e ISS R$ 5; 1 empregado; CPP 3%. Mudanças já publicadas na LC 238, de 21/10/2026 (DOU extra de 21/10/2026): limite de R$ 110.000 em 2027 (art. 2º; R$ 9.166,67/mês no ano de início) e de R$ 140.000 desde 01/01/2028 (R$ 11.666,67/mês); art. 18-C passa a permitir até 2 empregados (efeitos desde 01/01/2027); ampliação condicionada às leis orçamentárias de 2027 a 2029 (art. 3º) (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm) — Fonte da LC 238: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp238.htm. O app precisa trocar esses valores em 2027. O excesso de até 20% está nas alíneas do §7º III (a: desenquadra a partir do ano seguinte; b: retroativo se passar de 20%).
- [CONFIRMADO] 20. DAS-MEI 2026: R$ 81,05 (INSS) + R$1 para comércio/indústria = 82,05; + R$5 para serviços = 86,05; ambos = 87,05 => INSS R$ 81,05 (5% de 1.621,00) + ICMS R$ 1,00 e/ou ISS R$ 5,00 = 82,05 / 86,05 / 87,05; vale a partir da competência jan/2026 (DAS que vence em fev/2026) (https://www8.receita.fazenda.gov.br/simplesnacional/Noticias/NoticiaCompleta.aspx?id=c3b2044c-ff97-432a-b33c-ecf2a3df6dc3) — Troquei a fonte da Agência Brasil pela fonte primária, o Portal do Simples Nacional. Exceção: o MEI caminhoneiro paga INSS de R$ 194,52 (12%).
- [CONFIRMADO] 21. Diarista Independente (CNAE 9700-5/00) é ocupação permitida ao MEI => 'Diarista Independente', CNAE 9700-5/00, consta na lista (referência: Anexo XI da Resolução CGSN 140/2018) (https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/quero-ser-mei/atividades-permitidas/d) — A página não diz se a ocupação recolhe ISS ou ICMS (não verificado).
- [CONFIRMADO] 22. Estágio: concedentes só PJ privada, órgãos públicos ou profissional liberal de nível superior registrado (art. 9º); jornada 4h/20h ou 6h/30h (art. 10); máximo de 2 anos (art. 11); bolsa e auxílio-transporte obrigatórios no estágio não obrigatório (art. 12); recesso de 30 dias (art. 13); seguro contra acidentes (art. 9º IV) => Igual ao afirmado; Lei 11.788, de 25/09/2008, DOU de 26/09/2008, vigência na publicação (art. 21) (https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11788.htm) — O recesso de 30 dias vale para estágio de 1 ano ou mais (proporcional se menor). O limite de 2 anos não se aplica a estagiário com deficiência. Pessoa física sem registro profissional não pode ser concedente, o que é relevante para o público do app.
- [CONFIRMADO] 23. Trabalho temporário: só por empresa de trabalho temporário (PJ) para tomadora PJ ou equiparada; até 180 dias + 90 de prorrogação; indenização de 1/12 => Arts. 2º, 4º, 5º e 10 §§1º e 2º com redação da Lei 13.429, de 31/03/2017; art. 12 'f' (1/12 por dispensa sem justa causa ou término normal) segue no texto, sem marca de revogação (https://www.planalto.gov.br/ccivil_03/leis/l6019.htm) — Uma pessoa física (família) não pode ser tomadora de temporário, por isso não serve para doméstica. A data da Lei 13.429 (31/03/2017) não aparece na página, mas é o que sei. Há debate doutrinário sobre a alínea 'f' após o FGTS; não verifiquei jurisprudência.
- [CONFIRMADO] 24. Empregado (CLT art. 3º): pessoa física, serviço não eventual, sob dependência, mediante salário; a CLT não se aplica a domésticos (art. 7º a) => Art. 3º e art. 7º 'a' conferidos; DL 5.452, de 01/05/1943, DOU de 09/08/1943, vigência em 10/11/1943 (https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm) — Ressalva: a LC 150, art. 19, manda aplicar a CLT de forma subsidiária ao doméstico, observadas as peculiaridades. Portanto 'não se aplica' não é absoluto.
- [CONFIRMADO] 25. Aprendiz: 14 a 24 anos, contrato de até 2 anos, salário mínimo-hora, jornada de 6h (8h se concluiu o fundamental), FGTS de 2% (não verificado no texto atual da CLT) => Idade de 14 a 24 anos incompletos (sem limite máximo para pessoa com deficiência); contrato de até 2 anos (exceção para pessoa com deficiência); salário mínimo-hora; 6h por dia, ou 8h se concluiu o ensino fundamental, computando a parte teórica (art. 432 §1º, segundo o manual do MTE de 2024); FGTS 2% pela Lei 8.036, art. 15 §7º (incluído pela Lei 10.097/2000), conferido em https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm (https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/escola/e-biblioteca/manual-de-aprendizagem-profissional.pdf) — Não consegui ler os arts. 428 e 432 direto no Planalto (página truncada); os números vêm do manual oficial do MTE de 2024 e da Lei 8.036. Vigência: Lei 10.097/2000 (aprendizagem e FGTS 2%) e Lei 11.180/2005 (24 anos). Aprendiz exige pessoa jurídica com programa de aprendizagem; não se aplica à família contratante.