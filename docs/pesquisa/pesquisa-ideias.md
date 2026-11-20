# Tabela de Ganhos: brainstorm do que adicionar, integrar e facilitar (pesquisa de 20/11/2026)

## 0. Fatos verificados que sustentam as ideias

Todos foram conferidos na fonte nesta pesquisa. O que não consegui confirmar está marcado como "não verificado".

| Fato | Valor | Vigência | Fonte |
|---|---|---|---|
| Salário mínimo nacional | R$ 1.621,00 | desde 01/01/2026 | Decreto 12.797/2025: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm |
| Mínimo por dia e por hora | R$ 54,04/dia e R$ 7,37/h | 2026 | https://conexaotrabalho.portaldaindustria.com.br/noticias/detalhe/trabalhista/-geral/novo-salario-minimo-ja-esta-em-vigor/ (fonte secundária; R$ 1.621/220 = 7,368) |
| INSS do empregado e do doméstico (progressivo) | 7,5% até 1.621,00; 9% até 2.902,84; 12% até 4.354,27; 14% até 8.475,55 (teto) | 01/01/2026 | Portaria Interministerial MPS/MF 13/2026: https://www.normaslegais.com.br/legislacao/portaria-interministerial-mps-mf-13-2026.htm |
| Salário-família | R$ 67,54 por filho, para quem ganha até R$ 1.980,38 | 01/01/2026 | mesma Portaria |
| Quem é doméstico (com vínculo) | trabalho contínuo, subordinado, oneroso e pessoal, em residência, "por mais de 2 dias por semana" | LC 150/2015, art. 1º | https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm |
| Jornada do doméstico | 8 h/dia e 44 h/semana; tempo parcial até 25 h/semana; noturno das 22h às 5h | LC 150, arts. 2º, 3º e 14 | idem |
| Encargos do Simples Doméstico (DAE) | 8% INSS patronal + 0,8% GILRAT + 8% FGTS + 3,2% indenização compensatória (total 20% pagos pelo empregador) + INSS retido do empregado + IRRF, se houver | LC 150, art. 34; Manual eSocial Doméstico de 13/08/2026 | lcp150 e https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/manual-do-esocial-empregador-domestico-versao-13-08-2026.pdf |
| Vencimento do DAE | **dia 20 do mês seguinte**, antecipado se cair em dia não útil. Atenção: o art. 35 da LC 150 no Planalto ainda diz "dia 7"; o manual oficial diz dia 20, e o histórico dele registra a mudança na versão de 09/12/2025 | manual 13/08/2026 | PDF do manual acima (seção 4.3.1 e Histórico) |
| 13º salário | 1ª parcela até 30/11; 2ª parcela até 20/12; o DAE da competência 13º vence em 20/01 | manual 13/08/2026 | PDF do manual (4.1.7) |
| IR: redução mensal (Lei 15.270/2025) | IRRF zerado para renda tributável de até R$ 5.000/mês; redução parcial de R$ 5.000,01 a R$ 7.350 | 01/01/2026 | https://legis.senado.leg.br/norma/41758136/publicacao/41762089 (as faixas exatas da tabela progressiva vieram de fontes secundárias: **não verificado na Receita**) |
| MEI | teto de R$ 81 mil/ano; o PLP 186/2026 propõe R$ 110 mil em 2027 e R$ 140 mil em 2028, ainda **não em vigor**; DAS de 5% do mínimo = R$ 81,05, mais ICMS/ISS | 2026 | https://www.gov.br/memp/pt-br/teto-do-mei (DAS de R$ 81,05: fonte de imprensa) |
| Contribuinte individual (autônomo) | 20% (Lei 8.212, art. 21); 11% no plano simplificado; 5% para o MEI; a empresa paga 20% sobre o que paga a autônomos (art. 22, III) | vigente | https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm |
| Intermitente (CLT, art. 452-A) | parcelas pagas ao fim de cada período (férias com 1/3, 13º, DSR) | **não verificado** (texto literal não obtido) | https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm |
| Jurisprudência sobre diarista | 3 ou mais dias por semana na mesma casa tende a gerar vínculo (TRT-2, 2023); menos de 3 dias, sem vínculo (TRT-3) | casos | https://ww2.trt2.jus.br/noticias/noticias/noticia/prestacao-de-servicos-domesticos-em-tres-dias-na-mesma-semana-gera-vinculo-de-emprego |

**Correção importante para o app.** O exemplo da tarefa ("DAE dia 7") está desatualizado. O manual oficial diz dia 20. O app deve mostrar a data do manual, citar a divergência com o texto da LC e deixar a data configurável.

**Limite de escopo legal.** A regra dos "2 dias" vale só para o trabalho doméstico em residência (LC 150). Para pedreiro, professor particular ou freelancer pago por pessoa física, vale a CLT, art. 3º (pessoalidade, não eventualidade, subordinação, onerosidade), sem número fixo de dias. O app deve tratar os dois casos com alertas diferentes. Também **não verifiquei** se uma pessoa física que contrata um autônomo é obrigada a reter os 11% ou a pagar os 20% patronais. Pela redação, o art. 22 fala em "empresa", então isso precisa de checagem antes de entrar no comparador.

## 1. Ideias: 48, em três tipos

Legenda: V = valor (1 a 5), E = esforço (1 a 5), Risco = risco legal (baixo, médio ou alto), Dep. = depende de algo.

### A. Simples: rápido de fazer, alto valor

| # | Nome | O que faz | Para quem | V | E | Risco | Dep. |
|---|---|---|---|---|---|---|---|
| 1 | Alerta de vínculo | Mostra um selo amarelo ou vermelho quando são mais de 2 dias/semana na mesma casa (LC 150) e um texto curto: "isso pode ser emprego doméstico". Para outras profissões, mostra um aviso genérico da CLT, art. 3º | pagador | 5 | 1 | médio (o texto precisa ser cauteloso: "pode", não "é") | lei citada |
| 2 | Piso do mínimo por hora | Avisa quando o valor/hora fica abaixo de R$ 7,37 (mínimo/220) ou quando o total do mês fica abaixo do proporcional ao mínimo | os dois | 5 | 1 | baixo | tabela anual |
| 3 | Tabela de parâmetros com data | Um arquivo `params-2026.json` com mínimo, faixas do INSS, teto, IR, DAS do MEI, cada valor com URL e data de vigência; a tela mostra "valores de jan/2026" | todos | 5 | 2 | baixo | atualização anual |
| 4 | "Explicar a conta" | Abaixo de cada resultado, os passos: horas × dias × R$/h = total, com fórmula e números | leigo | 5 | 1 | baixo | — |
| 5 | Glossário em toque | Toque em DSR, DAE, FGTS, 1/3, GILRAT, RPA ou MEI e abre uma explicação de 2 linhas, com link para a lei | leigo | 4 | 1 | baixo | — |
| 6 | Presets de profissão | Diarista, babá, cuidador de idosos, pedreiro, professor particular, passeador de cães: cada um preenche horas, dias, alertas e o glossário relevante (sem valor/hora "oficial", só exemplo editável) | pagador | 4 | 1 | baixo | — |
| 7 | Arredondamentos | Arredonda para R$ 0,50 ou R$ 5, prático para Pix ou dinheiro | pagador | 3 | 1 | baixo | — |
| 8 | Valores/hora livres na tabela | Troca os fixos R$10/12/15 por até 5 valores à escolha, mais a coluna "mínimo legal" | todos | 5 | 1 | baixo | — |
| 9 | Compartilhar cálculo por link | Codifica os parâmetros no `#hash` da URL e manda pelo WhatsApp; o amigo abre já preenchido. Sem nome nem CPF no link | todos | 5 | 2 | baixo | — |
| 10 | Texto pronto para WhatsApp | Um botão que gera "Combinado: 3h × 2 dias/sem × R$ 15 = R$ 360/mês" | os dois | 4 | 1 | baixo | — |
| 11 | Modo letra grande e alto contraste | Para idosos (pagadores de cuidador, por exemplo) | acessibilidade | 4 | 1 | baixo | — |
| 12 | Selo "última conferência das leis" | Data, com aviso de que a ferramenta não é assessoria jurídica | todos | 4 | 1 | baixo (reduz risco) | — |
| 13 | Calculadora inversa | "Tenho R$ 500/mês: quantas horas cabem a R$ 15/h?" (generaliza o "Quanto posso pagar") | pagador | 4 | 1 | baixo | — |
| 14 | Hora extra, noturno e feriado | Liga extra de +50%, adicional noturno (22h às 5h) e domingo/feriado em dobro, com nota "aplica-se a empregado" | os dois | 4 | 2 | médio | lei |

### B. Funcionais: recursos completos

| # | Nome | O que faz | Para quem | V | E | Risco | Dep. |
|---|---|---|---|---|---|---|---|
| 15 | Comparador de regimes | Lado a lado: diarista autônoma, doméstica CLT (DAE de 20% + 13º + férias + 1/3), intermitente, MEI (o trabalhador paga DAS de R$ 81,05+) e autônomo/RPA. Duas colunas: custo total do pagador e líquido do trabalhador | os dois | 5 | 4 | alto (simplificações; o RPA de PF não foi verificado) | params + revisão jurídica |
| 16 | Custo real por hora | Valor/hora × (1 + 20% DAE) + provisões de 13º (1/12) e férias + 1/3 (1/12 × 4/3) ≈ fator 1,43 sobre o salário (cálculo próprio, conferir) | pagador | 5 | 2 | médio | 15 |
| 17 | Simulador de folha doméstica | Salário → INSS do empregado (faixas de 2026), DAE (8 + 0,8 + 8 + 3,2), IRRF com a redução da Lei 15.270, salário-família, vale-transporte (6%) | pagador de doméstica | 5 | 3 | médio | params; IR **não verificado** |
| 18 | 13º e férias | Proporcionais por meses (fração ≥ 15 dias), parcelas de 30/11 e 20/12, 1/3 de férias | os dois | 5 | 3 | médio | — |
| 19 | Rescisão simplificada | Saldo de salário, aviso, 13º e férias proporcionais; para doméstico, o FGTS de 3,2% já depositado | os dois | 4 | 4 | alto | revisão |
| 20 | Calendário de dias trabalhados | Marca o dia por toque (trabalhou, faltou, feriado, meio dia); soma automática do mês; detecta mais de 2 dias por semana | os dois | 5 | 3 | baixo | — |
| 21 | Controle de pagamentos | Cada mês pago, pendente ou parcial, com data e forma (Pix ou dinheiro); saldo devedor | pagador | 5 | 3 | baixo | 20 |
| 22 | Cálculos salvos | Título, notas, etiqueta, data, fixar, duplicar, buscar; salvos em IndexedDB, offline | todos | 5 | 2 | baixo | — |
| 23 | Multi-pessoas | Uma ficha por prestador (apelido, profissão, valor/hora, dias), com resumo do mês somando todos | pagador | 5 | 3 | baixo | 22 |
| 24 | Recibo imprimível | Recibo em PDF/HTML com valor por extenso, período e assinatura; compartilhar como imagem no WhatsApp | os dois | 5 | 2 | baixo (é recibo de quitação, não substitui folha do eSocial) | — |
| 25 | Lembretes | Arquivo .ics para o calendário: DAE dia 20, 13º em 30/11 e 20/12, DAE do 13º em 20/01, reajuste do mínimo em janeiro, férias a vencer | pagador | 4 | 2 | baixo | data configurável |
| 26 | Reajuste | Simula o novo valor/hora pelo % do mínimo (2025→2026 = +6,79%) ou por % livre; mostra o impacto no mês e no ano | os dois | 4 | 2 | baixo | params |
| 27 | Biblioteca de leis offline | Resumos em linguagem simples de LC 150, CLT (art. 3º, 58-A, 452-A), Lei 8.212 (art. 21/22) e Decreto do mínimo, cada um com link do Planalto e data | todos | 4 | 3 | médio (resumir bem) | — |
| 28 | Busca "Consultar" | Caixa única que procura no glossário, nas leis e nos salvos ("o que é DSR", "férias") | todos | 4 | 2 | baixo | 5, 27 |
| 29 | Menu de configuração | Tema, moeda/arredondamento, data do DAE, ano dos parâmetros, idioma do recibo, nome do pagador (opcional), backup | todos | 4 | 2 | baixo | — |
| 30 | Exportar e importar | JSON (backup completo), CSV para planilha e QR code para passar dados entre celulares sem servidor | todos | 4 | 2 | baixo | — |
| 31 | Tabela de salários de referência | Mínimo nacional (mensal, dia, hora) + mínimos regionais estaduais (SP, RJ, PR, RS, SC: **não verificados**, precisam de pesquisa) + "seu valor vs. mínimo" | os dois | 4 | 3 | médio | pesquisa por estado |
| 32 | Pix copia-e-cola | Gera só o texto do BR Code (padrão EMV do BCB) com chave e valor, mais um QR; não faz pagamento | pagador | 4 | 3 | baixo (não toca dinheiro) | manual do BR Code do BCB |
| 33 | Modo trabalhador | Mesma base, olhando do outro lado: "quanto vou receber líquido", "estou recebendo o mínimo?", "tenho direito a 13º?" | trabalhador | 5 | 2 | médio | 15 a 18 |
| 34 | Histórico de valores/hora | Gráfico de quanto foi pago por mês e por pessoa | pagador | 3 | 2 | baixo | 21 |
| 35 | Checklist de formalização | Passo a passo do eSocial Doméstico: cadastro, admissão, folha, DAE, recibo; com links para gov.br | pagador | 4 | 1 | baixo | — |

### C. Ousados: diferenciais

| # | Nome | O que faz | Para quem | V | E | Risco | Dep. |
|---|---|---|---|---|---|---|---|
| 36 | Modo conversa | Perguntas guiadas ("Quantos dias por semana?", "É na sua casa?", "Ela trabalha para outras casas?") que levam ao regime provável, ao custo e ao próximo passo; árvore de decisão local, sem IA | leigo | 5 | 3 | médio | 1, 15 |
| 37 | Termômetro de risco trabalhista | Pontua dias/semana, meses seguidos, horário fixo e exclusividade; mostra "baixo, médio ou alto" com explicação e o que fazer | pagador | 5 | 3 | alto (precisa de cautela e aviso) | 20 |
| 38 | Acordo combinado | Gera um "combinado" em texto simples (dias, valor, quem leva material, faltas, aviso), com aceite dos dois por link/hash; serve como registro, não como contrato | os dois | 5 | 3 | médio | 9 |
| 39 | Painel duplo pagador e trabalhador | Link de leitura para o trabalhador ver os próprios dias e pagamentos (só via link/QR exportado, sem servidor) | os dois | 5 | 4 | baixo | 20, 21, 30 |
| 40 | Linha do tempo de direitos | Dado o tempo de casa, mostra quando nascem férias, 13º e aviso; "em 3 meses ela completa 1 ano" | os dois | 4 | 3 | médio | 18 |
| 41 | Simulador "e se formalizar?" | Diferença mensal e anual entre continuar diarista e registrar com 3 dias, incluindo o que o trabalhador ganha (FGTS, INSS, seguro-desemprego) | os dois | 5 | 3 | médio | 15 |
| 42 | Painel do ano | Total pago no ano por pessoa, gerando o "informe" de conferência para a declaração | pagador | 4 | 3 | médio | 21 |
| 43 | Atualização das leis com diff | Ao abrir, busca `params.json` versionado no próprio GitHub Pages; se mudou, mostra "o mínimo mudou de X para Y, fonte: ..." | todos | 5 | 3 | baixo | 3 |
| 44 | Comparar com a região | Mostra a faixa típica de valor/hora por profissão e cidade (dado público, como pesquisas do IBGE: **não verificado** se existe granularidade) | os dois | 3 | 5 | baixo | fonte de dados |
| 45 | Ditado por voz | "Ela veio terça e quinta, 4 horas" vira marcação no calendário (Web Speech API, quando disponível) | leigo | 3 | 3 | baixo | navegador |
| 46 | Recibo verificável | Recibo com hash/QR que confere se o PDF não foi alterado (verificação no próprio app) | os dois | 3 | 3 | baixo | 24 |
| 47 | Cofrinho de provisão | Sugere separar por mês o 13º, as férias e o 1/3 ("guarde R$ X este mês") | pagador | 4 | 2 | baixo | 16 |
| 48 | Modo grupo de amigos | Vários pagadores dividem um mesmo cuidador ou diarista e o app divide custo e dias (com alerta de que a soma de dias numa mesma casa é o que conta) | pagadores | 3 | 3 | médio | 23 |

## 2. Top 15 por valor/esforço

| Pos. | Ideia | V/E |
|---|---|---|
| 1 | #1 Alerta de vínculo | 5/1 |
| 2 | #2 Piso do mínimo por hora | 5/1 |
| 3 | #4 Explicar a conta | 5/1 |
| 4 | #8 Valores/hora livres + coluna do mínimo | 5/1 |
| 5 | #5 Glossário em toque | 4/1 |
| 6 | #6 Presets de profissão | 4/1 |
| 7 | #13 Calculadora inversa | 4/1 |
| 8 | #35 Checklist de formalização | 4/1 |
| 9 | #3 Tabela de parâmetros com fonte e data (base de tudo) | 5/2 |
| 10 | #22 Cálculos salvos com título e notas | 5/2 |
| 11 | #24 Recibo imprimível e compartilhável | 5/2 |
| 12 | #9 Link compartilhável com parâmetros | 5/2 |
| 13 | #33 Modo trabalhador | 5/2 |
| 14 | #16 Custo real por hora | 5/2 |
| 15 | #20 Calendário por toque + #21 controle de pagamentos (em par) | 5/3 |

**Ordem técnica sugerida:** primeiro #3 (parâmetros), depois #22 e #29 (persistência e configuração), depois os itens de esforço 1, depois recibo, calendário e pagamentos, e por fim o comparador (#15), que tem o maior risco e precisa de revisão.

## 3. Cinco ideias ousadas que tornariam o app único

1. **Modo conversa (#36) + termômetro de risco (#37).** Nenhuma calculadora que encontrei (ValorFinal, Calculadora Brasil, app oficial eSocial Doméstico) responde "o que eu sou e o que devo fazer" para quem não sabe o regime.
2. **Simulador "e se formalizar?" (#41).** Mostra o custo e também o ganho do trabalhador, o que ajuda os dois a conversar.
3. **Acordo combinado com aceite por link (#38).** Transforma o cálculo em um combinado registrado, sem servidor.
4. **Painel duplo pagador/trabalhador (#39).** O mesmo dado visto pelos dois lados, o que dá transparência.
5. **Leis com data e diff automático (#43).** Cada número no app mostra a fonte e avisa quando a lei muda. O app oficial e as calculadoras de terceiros não fazem isso; elas avisam apenas que são "estimativa".

## 4. Riscos e cuidados transversais

- Aviso fixo: "estimativa educativa; a folha oficial é a do eSocial; não é assessoria jurídica".
- Dados pessoais só no aparelho (IndexedDB), sem CPF em link, com backup exportável. Isso reduz a exposição à LGPD.
- Pendentes de verificação antes de codar: tabela do IRRF de 2026 na Receita; obrigações de pessoa física ao contratar autônomo (RPA); texto literal do art. 452-A da CLT; mínimos estaduais; motivo da divergência entre o art. 35 da LC 150 ("dia 7") e o manual ("dia 20").

Referências de inspiração: app oficial eSocial Doméstico (https://www.gov.br/pt-br/apps/esocial-domestico), gerador de recibo ValorFinal (https://valorfinal.com.br/recibo-pagamento-empregada-domestica), Calculadora Brasil DAE (https://calculadorabrasil.com.br/?p=9924).


## Verificação

- [CONFIRMADO] 1. Salário mínimo nacional R$ 1.621,00, vigência 2026-01-01 => R$ 1.621,00 a partir de 01/01/2026 (Decreto 12.797/2025, art. 1º; art. 2º: vigência em 01/01/2026) (https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm) — Texto do decreto conferido no Planalto em 20/11/2026.
- [CONFIRMADO] 2. Salário mínimo diário R$ 54,04 e horário R$ 7,37 => Diário R$ 54,04; horário R$ 7,37; vigência 01/01/2026 (https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm) — A fonte secundária citada não é necessária. O próprio Decreto 12.797/2025, art. 1º, parágrafo único, fixa os dois valores. Use o decreto como fonte primária.
- [CONFIRMADO] 3. INSS empregado/doméstico/avulso progressivo 7,5% até 1.621,00; 9% 1.621,01-2.902,84; 12% 2.902,85-4.354,27; 14% 4.354,28-8.475,55; teto 8.475,55 => Faixas e alíquotas iguais às informadas, válidas a partir da competência janeiro/2026 (Portaria Interministerial MPS/MF nº 13, de 09/01/2026, publicada no DOU em 12/01/2026) (https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal) — Troque o normaslegais.com.br (fonte não oficial) pela página do INSS. A notícia oficial do teto está em https://www.gov.br/inss/pt-br/assuntos/com-reajuste-de-3-9-teto-do-inss-chega-a-r-8-475-55-em-2026. As alíquotas são progressivas por faixa: cada alíquota incide só sobre a parte do salário dentro da faixa.
- [CONFIRMADO] 4. Salário-família R$ 67,54 por filho para remuneração até R$ 1.980,38 => R$ 67,54 por filho ou equiparado até 14 anos, ou inválido de qualquer idade, para remuneração mensal até R$ 1.980,38; vigência 01/01/2026 (Portaria MPS/MF 13/2026, art. 4º) (https://www.gov.br/inss/pt-br/direitos-e-deveres/salario-familia/valor-limite-para-direito-ao-salario-familia) — O benefício vale para empregado, inclusive doméstico, e avulso. Não vale para contribuinte individual nem MEI. Em mês de admissão ou demissão é pago proporcionalmente.
- [CONFIRMADO] 5. Empregado doméstico: serviço contínuo, subordinado, oneroso, pessoal, por mais de 2 dias por semana (LC 150 art. 1º) => Art. 1º: serviço contínuo, subordinado, oneroso e pessoal, de finalidade não lucrativa, à pessoa ou família, no âmbito residencial, por mais de 2 dias por semana. LC 150 de 01/06/2015, publicada no DOU de 02/06/2015, com vigência na publicação (art. 47) (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) — Faltavam dois requisitos no resumo: finalidade não lucrativa e âmbito residencial.
- [CONFIRMADO] 6. Jornada doméstica 8h/dia e 44h/semana; tempo parcial até 25h/semana; noturno 22h-5h (LC 150 arts. 2º, 3º, 14) => Art. 2º: 8h diárias e 44h semanais. Art. 3º: tempo parcial de até 25h semanais. Art. 14: noturno das 22h às 5h. Vigência 02/06/2015 (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) — Texto conferido no Planalto.
- [CONFIRMADO] 7. DAE doméstico: 8% INSS patronal + 0,8% GILRAT + 8% FGTS + 3,2% indenização compensatória + INSS retido do empregado + IRRF se houver => LC 150 art. 34, incisos II a VI: 8% patronal, 0,8% GILRAT, 8% FGTS, 3,2% (art. 22) e IRRF se incidente. Vigência desde 2015; o Simples Doméstico começou na competência 10/2015. O Manual eSocial Doméstico versão 13/08/2026 traz a mesma lista (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) — A fonte primária é a LC 150, art. 34. O manual é complementar. O inciso I ainda diz 8% a 11% para o empregado, mas desde a competência 03/2020 vale a tabela progressiva de 7,5% a 14% (EC 103/2019), como o próprio manual registra. A vigência 2026-08-13 é a data da versão do manual, não da regra.
- [CORRIGIDO] 8. Vencimento do DAE até dia 20 do mês seguinte (antecipado se não útil); texto do art. 35 da LC 150 ainda diz dia 7; vigência 2025-12-09 => Até o dia 20 do mês seguinte, antecipado se não for dia útil, a partir da competência março/2024 (notícia oficial do eSocial de 19/03/2024; o exemplo dado é a competência 03/2024, que venceu em 19/04/2024) (https://www.gov.br/esocial/pt-br/noticias/mudanca-na-data-de-vencimento-do-dae) — O dia 20 e a divergência estão certos: o Manual eSocial Doméstico (13/08/2026) diz 'até dia 20 do mês seguinte, antecipado no caso de dia não útil', e o art. 35 da LC 150 no Planalto ainda diz 'até o dia 7'. A vigência 2025-12-09 está errada; o certo é a competência 03/2024. A notícia do eSocial não cita base legal, e a norma que fixou o dia 20 não foi verificada. Trechos do manual sobre parcelamento de FGTS ainda falam em dia 7, o que é resquício desatualizado.
- [CONFIRMADO] 9. 13º: 1ª parcela até 30/11, 2ª parcela até 20/12; DAE da competência 13º vence em 20/01 => 1ª parcela até 30/11; 2ª até 20/12. O DAE da competência 13º (INSS patronal e do empregado, GILRAT) vence em 20/01 do ano seguinte. O IRRF e o FGTS da 2ª parcela vão na folha de dezembro, que também vence em 20/01 (https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/manual-do-esocial-empregador-domestico-versao-13-08-2026.pdf) — Conferido no manual, versão 13/08/2026, págs. 71-73. A base legal do 13º é a Lei 4.749/1965 (arts. 1º e 2º), que não foi aberta nesta verificação. Para 2026, a 1ª parcela vence em 30/11/2026 (segunda-feira).
- [CONFIRMADO] 10. IRRF zerado para rendimento tributável mensal até R$ 5.000 (redução até R$ 7.350); tabela progressiva não verificada => Lei 15.270, de 26/11/2025 (DOU de 27/11/2025), art. 3º-A da Lei 9.250, com efeitos desde 01/01/2026. Até R$ 5.000,00: redução de até R$ 312,89, o que zera o imposto. De R$ 5.000,01 a R$ 7.350,00: redução = R$ 978,62 − 0,133145 × rendimento tributável mensal, limitada ao imposto calculado pela tabela. Acima de R$ 7.350,00 não há redução. A redução também vale para o 13º (https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15270.htm) — A lei não cria nova tabela progressiva mensal. A redução é aplicada depois do cálculo pela tabela vigente, e as faixas dessa tabela não foram verificadas aqui. Prefira o Planalto ao Senado como fonte.
- [CORRIGIDO] 11. Teto MEI R$ 81 mil/ano; PLP 186/2026 propõe R$ 110 mil (2027) e R$ 140 mil (2028), não em vigor => Em 2026 o teto ainda é R$ 81.000,00 (LC 123, art. 18-A, §1º). O projeto, porém, já virou lei: a Lei Complementar nº 238, de 21/10/2026 (DOU de 21/10/2026, edição extra), fixa R$ 110.000,00 para o ano-calendário 2027 (art. 2º; R$ 9.166,67 por mês no início de atividade) e R$ 140.000,00 a partir de 01/01/2028 (art. 18-A, §1º; R$ 11.666,67 por mês). O MEI também passa a poder ter até 2 empregados (art. 18-C). Efeitos: §§1º e 2º do art. 18-A em 01/01/2028; demais dispositivos em 01/01/2027 (https://planalto.gov.br/ccivil_03/leis/lcp/lcp238.htm) — A página gov.br/memp (modificada em 16/09/2026) está desatualizada. 'Não em vigor' está errado: a lei está sancionada e vigente, mas só produz efeitos em 2027 e 2028. O app deve mostrar R$ 81 mil para 2026, R$ 110 mil para 2027 e R$ 140 mil para 2028.
- [CONFIRMADO] 12. DAS MEI base R$ 81,05 (5% do mínimo) + ICMS/ISS conforme atividade => INSS do MEI: 5% de R$ 1.621,00 = R$ 81,05 (competência jan/2026 em diante). Somam-se R$ 1,00 de ICMS, se contribuinte do ICMS, e R$ 5,00 de ISS, se contribuinte do ISS (LC 123, art. 18-A, §3º, V, redação da LC 155/2016) (https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal) — Use a página do INSS e o Planalto (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm) em vez da gov.br/memp, que não traz o valor. Totais: R$ 82,05 (comércio/indústria), R$ 86,05 (serviços) e R$ 87,05 (ambos), por conta própria. A LC 238/2026 passa o valor fixo para regulamentação do Comitê Gestor; efeito futuro não verificado.
- [CONFIRMADO] 13. Contribuinte individual 20%; plano simplificado 11%; MEI 5%; empresa paga 20% sobre remuneração a contribuintes individuais (Lei 8.212 arts. 21 e 22 III) => Art. 21, caput: 20% (redação da Lei 9.876/1999). Art. 21, §2º, I: 11% (plano simplificado). Art. 21, §2º, II, a: 5% para o MEI (redação da Lei 12.470/2011). Art. 22, III: 20% a cargo da empresa sobre remunerações pagas a contribuintes individuais (incluído pela Lei 9.876/1999). Valores 2026: 11% = R$ 178,31; 20% entre R$ 324,20 e R$ 1.695,11 (página do INSS) (https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm) — A vigência 1999-11-29 vale só para o caput e o art. 22, III; os §2º I e II têm redação de 2011. Para o app: a pessoa física que paga um autônomo não é empresa, então não recolhe os 20% patronais. O autônomo recolhe por conta própria. A retenção de 11% pela empresa (Lei 10.666/2003) não foi verificada aqui.
- [CONFIRMADO] 14. Jurisprudência: três dias por semana na mesma residência gera vínculo doméstico (TRT-2, 2023) => Notícia do TRT-2 publicada em 07/06/2023 (atualizada em 02/09/2024). A 2ª Turma reconheceu vínculo doméstico; relator Pérsio Luis Teixeira de Carvalho. Os pagamentos mensais equivaliam a cerca de 15 diárias por mês, acima do limite de 2 dias semanais do art. 1º da LC 150 (https://ww2.trt2.jus.br/noticias/noticias/noticia/prestacao-de-servicos-domesticos-em-tres-dias-na-mesma-semana-gera-vinculo-de-emprego) — O WebFetch recebeu 403; o texto foi lido por curl. Decisão de uma Turma regional: não é súmula nem precedente vinculante. O número do processo não aparece no texto lido (não verificado). A vigência 2023-01-01 não faz sentido para jurisprudência; use a data da notícia, 07/06/2023.