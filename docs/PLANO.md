# PLANO: Tabela de Ganhos 2.0

Versão do plano: 20/11/2026 (UTC). Estado: **proposta, aguardando a sua confirmação**. Nada foi construído ainda.

---

## 1. Resumo em 5 linhas

1. Hoje o app compara horas × dias × valor/hora. Ele vai virar um **assistente completo para quem paga alguém por hora, dia ou mês no Brasil**.
2. Você conta como é o trabalho e ele diz o enquadramento provável (diarista, doméstica com carteira, autônomo, MEI, CLT, intermitente). Depois calcula **quanto você paga de verdade** e **quanto a pessoa recebe**, com a conta aberta e o link da lei.
3. Ganha uma **tabela de salários** (mínimo, pisos estaduais, valor por hora, dia e mês), uma área de **leis e consultas**, **cálculos salvos** com título, notas e etiquetas, e um menu de **configurações**.
4. Todo número legal tem **fonte e data de vigência**, e o app já sabe das mudanças marcadas: a jornada cai para 42 h em dezembro de 2026, o mínimo muda em 2027 e o teto do MEI também.
5. Continua **grátis, offline, sem cadastro e sem servidor**. Os dados ficam só no aparelho, e você pode compartilhar por link ou WhatsApp.

---

## 2. Público e casos de uso (personas)

| Persona | Situação | O que precisa do app |
|---|---|---|
| **Ana, 45, contrata diarista** | Faxina 1 ou 2 vezes por semana, paga por dia | Ver o valor justo, saber se está acima do mínimo, ser avisada se passar a 3 dias por semana (vira emprego doméstico), mandar o combinado no WhatsApp |
| **Seu Jorge, 70, filho contrata cuidadora** | Cuidadora 5 dias por semana, às vezes à noite | Custo mensal real com DAE, 13º, férias, adicional noturno e hora noturna menor; letra grande |
| **Carla, dona de pequena empresa** | Paga freelancer por hora ou contrata horista | Comparar RPA, MEI, CLT horista e intermitente; saber a retenção de 11% e os 20% patronais |
| **Bruno, paga ajudante de obra ou aulas** | Pessoa física pagando autônomo eventual | Total do mês, recibo simples, alerta dos requisitos de vínculo (CLT art. 3º) |
| **A pessoa que recebe** (amiga que abriu o link) | Diarista, cuidadora ou freelancer | "Quanto eu recebo líquido?", "Estou ganhando o mínimo?", "Tenho direito a 13º?" |
| **Você, que manda o link a amigos** | Quer algo que funcione sem explicar | Abrir e entender em 10 segundos; link já preenchido |

**Casos de uso principais:**
1. "Quanto custa por mês?" (calculadora rápida).
2. "Que tipo de contratação é essa?" (enquadramento e alerta de vínculo).
3. "Quanto ela recebe líquido e quanto vai na guia do governo?" (doméstico, CLT).
4. "Comparar diarista × registrada" (cenários lado a lado).
5. "Guardar o que combinei" (salvos com notas).
6. "Ler a regra" (leis, glossário, perguntas frequentes).
7. "Mandar para alguém" (link, texto de WhatsApp, recibo).

---

## 3. Escopo em fases

Esforço: **P** = pequeno (horas), **M** = médio (1 a 3 dias), **G** = grande (vários dias).

### Fase 1: essencial (primeira entrega)

| # | Item | O que é | Por que importa | Esforço |
|---|---|---|---|---|
| 1.1 | **Arquivo de parâmetros datado** | Todos os números legais num arquivo só, cada um com valor, data de início, link da fonte e situação (vigente, previsto ou não verificado) | É a base de tudo: quando a lei muda, troca-se só esse arquivo | M |
| 1.2 | **Motor de cálculo separado e testado** | As contas ficam fora da tela, com testes automáticos que comparam com exemplos oficiais | Evita erro de dinheiro; permite mexer na tela sem quebrar a conta | G |
| 1.3 | **Calculadora com modos** | Por hora simples, diarista, doméstico (mensal e horista), autônomo/RPA e MEI (veja a seção 4) | É o pedido central | G |
| 1.4 | **"Mostrar a conta"** | Embaixo de cada resultado, linha por linha: fórmula, números e lei com link | Confiança; quase nenhum concorrente faz | M |
| 1.5 | **Alerta de vínculo** | Selo amarelo ou vermelho ao chegar a 3 dias por semana na mesma casa (LC 150, art. 1º); checklist dos 4 requisitos da CLT art. 3º para outros trabalhos | Protege quem paga de um processo trabalhista | P |
| 1.6 | **Alerta de mínimo** | Avisa se o valor/hora fica abaixo de R$ 7,37 ou do piso do seu estado | Evita pagar abaixo da lei | P |
| 1.7 | **Tabela de salários** | Mínimo, pisos estaduais, conversor hora/dia/semana/mês/ano e a tabela atual de comparação com valores livres | Você pediu; serve de consulta rápida | M |
| 1.8 | **Salvos** | Título, notas, etiquetas, data, busca, duplicar, fixar, exportar e importar | Você pediu; na concorrência é pago | M |
| 1.9 | **Configurações** | Tema, letra grande, estado (piso), valores padrão, dias da semana, arredondamento, backup | Você pediu | M |
| 1.10 | **Leis e consultas** | Resumos em linguagem simples com link oficial, glossário em toque, perguntas frequentes, busca única | Você pediu | M |
| 1.11 | **Compartilhar** | Link com o cálculo já preenchido (sem nome nem CPF), texto pronto para WhatsApp, impressão/PDF | O app vive de ser passado adiante | P |
| 1.12 | **Mudança de jornada da EC 141** | Datas de 42 h e 40 h já programadas, com aviso na tela | Começa em menos de um mês | P |
| 1.13 | **Aviso legal fixo** | "Estimativa educativa; não substitui contador, advogado nem a folha do eSocial" | Reduz risco | P |

### Fase 2: recursos completos

| # | Item | O que é | Por que importa | Esforço |
|---|---|---|---|---|
| 2.1 | **Modos CLT horista, intermitente e tempo parcial** | DSR, hora extra, noturno, férias + 1/3 e 13º proporcionais por período | Para quem é empresa ou paga por convocação | G |
| 2.2 | **Comparador de cenários A × B × C** | Diarista × doméstica registrada × MEI, com diferença em R$ e % no mês e no ano | Decisão mais comum do público | M |
| 2.3 | **Custo anual real e "cofrinho"** | Quanto guardar por mês para 13º, férias e 1/3 | Evita susto em novembro e dezembro | P |
| 2.4 | **Calendário de dias trabalhados** | Toque no dia: trabalhou, faltou, feriado, meio período; soma o mês; conta dias por semana | Controle real; alimenta o alerta de vínculo | G |
| 2.5 | **Controle de pagamentos** | Mês pago, pendente ou parcial; forma (Pix, dinheiro) | Fecha o ciclo do pagador | M |
| 2.6 | **Recibo imprimível** | Recibo de diária ou mês, valor por extenso, período, campo de assinatura; PDF ou imagem | Nenhum concorrente grátis faz | M |
| 2.7 | **Várias pessoas** | Uma ficha por prestador, com resumo do mês somando todos | Quem tem diarista e cuidadora | M |
| 2.8 | **Lembretes (.ics)** | DAE dia 20, 13º em 30/11 e 20/12, DAE do 13º em 20/01, reajuste do mínimo em janeiro | Prazos esquecidos geram multa | P |
| 2.9 | **Simuladores de 13º, férias e rescisão doméstica** | Estimativas com aviso de que o valor oficial é o do eSocial | Momentos de dúvida | G |
| 2.10 | **Modo trabalhador** | A mesma conta vista por quem recebe | O amigo que recebe o link também usa | M |
| 2.11 | **Checklist de formalização** | Passo a passo do eSocial Doméstico com links gov.br | Para quem decidiu registrar | P |

### Fase 3: ousado

| # | Item | O que é | Por que importa | Esforço |
|---|---|---|---|---|
| 3.1 | **Modo conversa** | Perguntas simples, uma por vez ("É na sua casa?", "Quantos dias?") que levam ao enquadramento, ao custo e ao próximo passo; sem IA, árvore de decisão local | Para quem não sabe nem por onde começar | M |
| 3.2 | **Termômetro de risco trabalhista** | Pontua dias/semana, tempo seguido, horário fixo e exclusividade; mostra baixo, médio ou alto e o que fazer | Diferencial único | M |
| 3.3 | **"E se formalizar?"** | Diferença de custo e o que a pessoa ganha (FGTS, INSS, seguro-desemprego) | Ajuda os dois lados a conversar | M |
| 3.4 | **Combinado com aceite por link** | Texto do acordo (dias, valor, faltas) com código de conferência; registro, não contrato | Transforma cálculo em acordo | M |
| 3.5 | **Atualização de leis com "o que mudou"** | Ao abrir com internet, baixa o arquivo de parâmetros novo e mostra "o mínimo mudou de X para Y, fonte: ..." | Mantém o app certo sem você republicar tudo | M |
| 3.6 | **Pix copia-e-cola** | Gera só o texto e o QR do Pix com chave e valor; não paga nada | Facilita pagar | M |
| 3.7 | **Ditado por voz e leitura em voz alta** | "Ela veio terça e quinta, 4 horas"; leitura do resultado | Acessibilidade para idosos | M |

---

## 4. Telas e navegação

**Barra inferior com 5 abas** (no computador, vira menu lateral): **Calcular · Tabela · Salvos · Leis · Mais (Configurações)**. No topo: título, selo "Valores de 2026, conferidos em 20/11/2026" e botão de tema.

### 4.1 Calcular

**Topo:** seletor de modo em chips + botão "Não sei qual é o meu" (abre o modo conversa na Fase 3; na Fase 1, um questionário de 4 perguntas).

**Modos:**

| Modo | Campos (com chips de um toque e botões − e +) | O que mostra |
|---|---|---|
| **Por hora simples** (o atual, melhorado) | R$/h, horas/dia, dias/mês ou dias da semana marcados | Valor por dia, horas no mês, total; alerta de mínimo |
| **Diarista** | Valor da diária ou horas × R$/h, dias por semana, mesma casa? | Custo mensal; selo de alerta ao chegar a 3 dias; o que a diarista recolhe por conta própria (INSS de autônomo ou MEI) |
| **Doméstico** (mensalista ou horista) | Salário ou R$/h, horas por semana, estado, dependentes, VT, hora extra, horas noturnas | Número principal "Você paga por mês"; depois: líquido da pessoa, DAE (sua parte de 20% + INSS e IR dela), custo anual com 13º e férias + 1/3, quanto guardar por mês |
| **Autônomo / RPA** | Valor bruto, quem paga (pessoa física ou empresa), município (ISS opcional) | Pessoa física: custo = valor, sem retenção; empresa: 20% patronal, retenção de 11% até o teto, IRRF, ISS se informado |
| **MEI** | Valor do serviço, tipo (serviço, comércio ou ambos) | Para quem paga: custo = valor. Para quem recebe: DAS fixo e limite anual. Alerta: ser MEI não afasta vínculo |
| **CLT horista** (Fase 2) | R$/h, horas, dias úteis, domingos e feriados, extras, noturno | Salário + DSR, INSS, IRRF, FGTS, encargos da empresa |
| **Intermitente** (Fase 2) | R$/h, horas do período | Remuneração + DSR + férias proporcionais + 1/3 + 13º proporcional, pagos ao fim de cada período |
| **Tempo parcial** (Fase 2) | Horas por semana | Limites da CLT (30 h ou 26 h + 6 extras) ou do doméstico (25 h) e as férias por faixa |

**Em todos os modos:**
- Resultado atualiza enquanto você digita (sem botão "Calcular").
- **"Mostrar a conta"**: por exemplo, "INSS 7,5% × 1.621,00 = 121,58 · Portaria MPS/MF 13/2026 ↗".
- Ícone "i" em cada número leva à lei.
- Botões: Salvar · Compartilhar · Copiar para planilha · Imprimir · Comparar com outro cenário.
- "Quanto posso pagar" (já existe) vira o **modo inverso**: do orçamento para horas, dias ou salário máximo registrável já com encargos.

### 4.2 Tabela

1. **Tabela de comparação atual**, agora com até 5 valores/hora à sua escolha + coluna fixa "mínimo legal", dias e horas configuráveis, tela cheia no celular e cópia para planilha.
2. **Salário mínimo nacional**: mês, dia e hora; divisor da jornada atual; valor previsto para 2027 marcado como "previsto".
3. **Pisos estaduais** de SP, RS, PR e SC, com data e fonte; os não verificados aparecem marcados assim; os demais estados usam o mínimo nacional.
4. **Conversor**: digite um valor em qualquer unidade (hora, dia, semana, mês, ano) e veja as outras.
5. **Tabelas oficiais**: INSS do empregado, IRRF com redutor, contribuição de autônomo e MEI, encargos do doméstico.
6. **Referência de mercado de diarista** (opcional, marcada "não oficial"; veja a pergunta 14).

### 4.3 Salvos

- Lista com busca, filtro por etiqueta e por modo, ordenação por data ou título, fixados no topo.
- Cada salvo tem título, notas livres, etiquetas, data de criação e de edição, modo e a **versão da tabela legal usada**. Ao reabrir com uma tabela mais nova, o app avisa: "este cálculo usou os valores de 2026; recalcular com os atuais?".
- Ações: abrir, duplicar, renomear, apagar (com "desfazer"), compartilhar, exportar.
- Exportar e importar: arquivo de backup completo (JSON) e CSV para planilha.

### 4.4 Leis e consultas

- **Busca única** em leis, glossário, perguntas e salvos.
- **Resumos** curtos e em linguagem simples, cada um com "Ler na lei oficial ↗" e data: quem é doméstico (LC 150), jornada e EC 141, hora extra, noturno, DSR, férias, 13º, FGTS, INSS, IR, VT, intermitente, tempo parcial, autônomo, MEI, estágio (com o aviso de que família não pode ter estagiário), temporário (idem).
- **Glossário** em toque: DSR, DAE, FGTS, 1/3, GILRAT, RPA, MEI, CPP, divisor, competência, eSocial.
- **Perguntas frequentes**: "Diarista 2 vezes por semana tem direito a quê?", "Quando vence a guia?", "A jornada vai mudar?", "Preciso pagar 13º para diarista?".
- **Calendário de prazos**: DAE dia 20, 13º, mudanças da lei.
- **"O que mudou"**: histórico de alterações das tabelas.

### 4.5 Mais → Configurações

- **Aparência:** claro, escuro ou automático; letra grande; alto contraste; menos animação.
- **Local:** estado (define o piso); município (só para ISS, opcional).
- **Padrões:** R$/h, horas/dia, dias da semana trabalhados (seg a dom), modo inicial.
- **Arredondamento:** nenhum, R$ 0,50, R$ 1 ou R$ 5.
- **Tabela legal:** "automática pela data" ou fixar um ano; editar um valor à mão (com aviso e opção de voltar ao oficial); jornada semanal e divisor.
- **Recibo:** nome do pagador (opcional, fica só no aparelho).
- **Dados:** fazer backup, restaurar, apagar tudo (com confirmação).
- **Sobre:** versão, data da última conferência das leis, aviso legal, fontes.

---

## 5. Regras legais que o motor vai aplicar

Só entram aqui fatos conferidos (CONFIRMADO ou CORRIGIDO na pesquisa). As "contas minhas" estão marcadas como **derivado**.

### 5.1 Salário mínimo e jornada

| Parâmetro | Valor | Vigência | Fonte |
|---|---|---|---|
| Salário mínimo | R$ 1.621,00/mês; R$ 54,04/dia; R$ 7,37/hora | desde 01/01/2026 | Decreto 12.797/2025, art. 1º e parágrafo único: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm |
| Mínimo 2027 | R$ 1.741 **previsto** (PLN 24/2026); a LDO previa R$ 1.717; valor final sai por decreto | previsto para 01/01/2027 | https://www12.senado.leg.br/noticias/materias/2026/08/31/executivo-envia-orcamento-de-2027-ao-congresso-com-minimo-de-r-1.741 |
| Jornada CLT | até 8 h/dia; até 2 h extras/dia; hora extra ≥ 50% | Lei 13.467/2017 (desde 11/11/2017); 50% já na CF/88 | CLT arts. 58 e 59: https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm |
| Jornada doméstica | 8 h/dia, 44 h/semana; extra ≥ 50%; hora = salário ÷ 220, salvo jornada menor no contrato; salário-dia = mensal ÷ 30 | desde 02/06/2015 | LC 150, art. 2º: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm |
| **EC 141/2026** | 8 h/dia; **42 h/semana** 2 meses após a publicação; **40 h** um ano depois do fim desse prazo; **2 dias de repouso** semanal remunerado (um de preferência no domingo); sem redução de salário nem de pisos; acordo ou convenção pode ampliar a jornada diária na transição | publicada em 16/10/2026; 42 h e 2 repousos por volta de **16/12/2026**; 40 h por volta de **16/12/2027** | https://planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc141.htm |
| EC 141 e doméstico | vale também para o doméstico, porque a CF estende os incisos XIII e XV ao doméstico | idem | idem, CF art. 7º, parágrafo único (agora § 1º) |
| Trabalho noturno | 22h às 5h; hora de 52 min 30 s; adicional ≥ 20% | vigente | CLT art. 73; LC 150 art. 14 |
| Tempo parcial CLT | até 30 h/semana sem extras, ou até 26 h + até 6 h extras a 50% | desde 11/11/2017 | CLT art. 58-A |
| Tempo parcial doméstico | até 25 h/semana; férias de 8 a 18 dias por faixa de horas (até 5 h: 8; até 10 h: 10; até 15 h: 12; até 20 h: 14; até 22 h: 16; até 25 h: 18) | desde 02/06/2015 | LC 150, art. 3º |

### 5.2 Enquadramento

| Regra | Valor | Fonte |
|---|---|---|
| Empregado | pessoa física, serviço não eventual, sob dependência, com salário | CLT art. 3º |
| Doméstico | contínuo, subordinado, oneroso, pessoal, sem fim lucrativo, na residência, **por mais de 2 dias por semana**; proibido menor de 18 | LC 150, art. 1º |
| Jurisprudência | 3 dias por semana gerou vínculo doméstico (TRT-2, 2ª Turma, notícia de 07/06/2023); decisão de turma, não súmula | https://ww2.trt2.jus.br/noticias/noticias/noticia/prestacao-de-servicos-domesticos-em-tres-dias-na-mesma-semana-gera-vinculo-de-emprego |
| Estágio | só pessoa jurídica, órgão público ou profissional liberal registrado; 6 h/dia e 30 h/semana (ou 4 h e 20 h); máximo de 2 anos; bolsa, transporte, seguro e recesso de 30 dias | Lei 11.788/2008: https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11788.htm |
| Temporário | só via empresa de trabalho temporário para tomadora pessoa jurídica; até 180 + 90 dias | Lei 6.019/1974: https://www.planalto.gov.br/ccivil_03/leis/l6019.htm |
| Aprendiz | 14 a 24 anos incompletos; até 2 anos; mínimo-hora; 6 h (8 h se concluiu o fundamental); FGTS 2%; exige pessoa jurídica | Manual de Aprendizagem do MTE (https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/escola/e-biblioteca/manual-de-aprendizagem-profissional.pdf); Lei 8.036 art. 15 § 7º |

### 5.3 DSR, 13º, férias

| Parâmetro | Valor | Fonte |
|---|---|---|
| DSR | diarista: 1 dia de serviço; horista: a jornada normal; entram as horas extras habituais | Lei 605/1949, art. 7º, a e b (redação da Lei 7.415/1985): https://www.planalto.gov.br/ccivil_03/leis/l0605.htm |
| Súmula 172 TST | horas extras habituais entram no repouso remunerado | acórdãos do TST: https://jurisprudencia-backend2.tst.jus.br/rest/documentos/6c4b286ab2338b1f6a8848a7705b8c18 |
| 13º | 1/12 por mês; 15 dias ou mais contam como mês inteiro | Lei 4.090/1962, art. 1º: https://www.planalto.gov.br/ccivil_03/leis/l4090.htm |
| Prazos do 13º | adiantamento entre fevereiro e novembro; restante até 20/12; doméstico: 1ª parcela até 30/11 | Lei 4.749/1965 (https://www.planalto.gov.br/ccivil_03/leis/l4749.htm); Manual eSocial Doméstico 13/08/2026 |
| Férias doméstico | 30 dias + pelo menos 1/3 | LC 150, art. 17 |
| Intermitente | contrato escrito; hora ≥ hora do mínimo; convocação com 3 dias; ao fim de cada período paga remuneração, férias proporcionais + 1/3, 13º proporcional, DSR e adicionais; INSS e FGTS sobre o mês | CLT art. 452-A: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13467.htm |
| Proporcionais (derivado) | férias + 1/3 = 1/12 × 4/3 ≈ 11,11% por mês; 13º = 8,33% por mês | conta sobre as regras acima |

### 5.4 Encargos e recolhimentos

| Parâmetro | Valor | Vigência | Fonte |
|---|---|---|---|
| FGTS | 8%; aprendiz 2%; depósito até o dia 20; multa de 40% na dispensa sem justa causa | Lei 14.438/2022 (dia 20) | Lei 8.036, arts. 15 e 18: https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm |
| Empregador doméstico | 8% CPP + 0,8% GILRAT + 8% FGTS + 3,2% indenização = **20%** | Simples Doméstico desde 10/2015 | LC 150, arts. 22 e 34; Lei 8.212 art. 24 (redação da Lei 13.202/2015); Manual eSocial Doméstico 13/08/2026, p. 78 |
| Vencimento do DAE | **dia 20 do mês seguinte**, antecipado se não for dia útil; o texto da LC 150 art. 35 ainda diz "dia 7" (desatualizado) | desde a competência 03/2024 | https://www.gov.br/esocial/pt-br/noticias/mudanca-na-data-de-vencimento-do-dae |
| DAE do 13º | vence em 20/01; IRRF e FGTS da 2ª parcela vão no DAE de dezembro | manual de 13/08/2026 | https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/manual-do-esocial-empregador-domestico-versao-13-08-2026.pdf |
| Empresa | 20% sobre a folha + RAT de 1%, 2% ou 3%; 20% sobre o pago a autônomo | vigente | Lei 8.212, art. 22: https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm |
| Retenção de autônomo por empresa | 11% (até o teto: máx. R$ 932,31, derivado), recolhida até o dia 20 | desde a Lei 11.933/2009 | Lei 10.666/2003, art. 4º: https://www.planalto.gov.br/ccivil_03/leis/2003/l10.666.htm |
| Autônomo por conta própria | 20% (R$ 324,20 a R$ 1.695,11) ou 11% no plano simplificado (R$ 178,31); recolhe até o dia 15 | competência 01/2026 | Lei 8.212, arts. 21 e 30 II; https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal |
| ISS | 2% a 5%, conforme o município; retenção só se lei municipal mandar | vigente | LC 116/2003, arts. 6º, 8º e 8º-A: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm |
| Vale-transporte | empregado paga 6% do salário básico; o patrão paga o resto; não é salário | Decreto 10.854/2021, em vigor desde cerca de 11/12/2021 | Decreto 10.854/2021, arts. 111, 114 e 115: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/decreto/d10854.htm |

### 5.5 INSS e IR de quem recebe (2026)

| Parâmetro | Valor | Fonte |
|---|---|---|
| INSS empregado, doméstico e avulso (progressivo) | até R$ 1.621,00: 7,5%; até 2.902,84: 9%; até 4.354,27: 12%; até 8.475,55: 14%; teto R$ 8.475,55; desconto máximo R$ 988,09 (derivado) | Portaria Interministerial MPS/MF 13/2026, competência 01/2026: https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal |
| Salário-família | R$ 67,54 por filho até 14 anos (ou inválido), para quem ganha até R$ 1.980,38 | https://www.gov.br/inss/pt-br/direitos-e-deveres/salario-familia/valor-limite-para-direito-ao-salario-familia |
| IRRF mensal | isento até 2.428,80; 7,5% (−182,16) até 2.826,65; 15% (−394,16) até 3.751,05; 22,5% (−675,49) até 4.664,68; 27,5% (−908,73) acima; dependente R$ 189,59; desconto simplificado R$ 607,20; parcela isenta 65+ R$ 1.903,98 | desde 01/2026: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026 |
| Redutor do IR | até R$ 5.000: redução até R$ 312,89 (zera); de R$ 5.000,01 a R$ 7.350: 978,62 − 0,133145 × rendimento **bruto tributável**; acima: nada; vale para o 13º | Lei 15.270/2025, desde 01/01/2026: https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15270.htm |
| Carnê-leão | quem recebe de pessoa física paga até o último dia útil do mês seguinte | https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/carne-leao |

### 5.6 MEI

| Parâmetro | Valor | Fonte |
|---|---|---|
| Limite anual | R$ 81.000 em 2026; **R$ 110.000 em 2027**; **R$ 140.000 a partir de 2028** (LC 238/2026; ampliação condicionada às leis orçamentárias) | LC 123 art. 18-A; LC 238 de 21/10/2026: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp238.htm |
| DAS 2026 | INSS R$ 81,05 + R$ 1 (ICMS) e/ou R$ 5 (ISS) = R$ 82,05, 86,05 ou 87,05 | https://www8.receita.fazenda.gov.br/simplesnacional/Noticias/NoticiaCompleta.aspx?id=c3b2044c-ff97-432a-b33c-ecf2a3df6dc3 |
| Empregado do MEI | 1 empregado em 2026 (até 2 a partir de 2027); CPP de 3% | LC 123 art. 18-C; LC 238 |
| Diarista pode ser MEI | sim: "Diarista Independente", CNAE 9700-5/00 | https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/quero-ser-mei/atividades-permitidas/d |

### 5.7 Pisos estaduais do doméstico

| UF | Piso | Vigência | Fonte | Observação |
|---|---|---|---|---|
| SP | R$ 1.874,36 | desde 01/06/2026 | Lei 18.471/2026: https://www.al.sp.gov.br/repositorio/legislacao/lei/2026/lei-18471-27.05.2026.html | inclui cuidadores de idoso e de pessoa com deficiência |
| RS | R$ 1.884,75 (Faixa 1, inclui domésticos) | desde 21/05/2026 | https://www.estado.rs.gov.br/reajuste-do-piso-salarial-regional-ja-esta-em-vigor-apos-publicacao-no-diario-oficial-do-estado-nesta-quinta-21 | número da lei não verificado |
| SC | R$ 1.842,00 (faixa I) | efeitos desde 01/01/2026 | LC estadual 895/2026: https://portalelegis.alesc.sc.gov.br/documentos/djwp6 | doméstico na faixa I vem de fonte secundária |
| PR | Grupos I a IV: R$ 2.105,34 a R$ 2.407,90 | até 31/12/2026 | https://www.parana.pr.gov.br/Audio/Parana-renova-piso-salarial-para-ate-R-24-mil-e-deve-manter-maior-valor-do-Brasil-em-2026 | **grupo do doméstico não verificado**: o app pede ao usuário escolher |
| Demais | R$ 1.621,00 | 01/01/2026 | Decreto 12.797/2025 | o piso estadual não vale onde há piso de convenção coletiva |

### 5.8 Outros

- **Licença-paternidade** (só informativo): 10 dias em 2027, 15 em 2028; 20 dias em 2029 só se a meta fiscal for cumprida; a empresa paga ao CLT e o INSS reembolsa; o INSS paga direto ao doméstico. Lei 15.371/2026, vigência 01/01/2027: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15371.htm

### 5.9 Pendente de verificação (o app mostra "não verificado" ou não usa)

1. **Divisor da hora com a EC 141** (210 com 42 h; 200 com 40 h). É conta lógica, não norma. Proposta: configurável, com padrão por data e aviso.
2. **Dia exato da troca para 42 h** (15/12 ou 16/12/2026).
3. Novo divisor do **doméstico** (a LC 150 ainda diz 44 h e 220).
4. **Hora extra a 100%** em domingo e feriado (Lei 605 art. 9º e TST).
5. **Fórmula de mercado do DSR** do horista (horas ÷ dias úteis × domingos e feriados).
6. Reflexo do DSR em férias, 13º e FGTS (OJ 394 e Tema 9 do TST).
7. Férias do horista pela **média de horas** (CLT art. 142) no texto atual.
8. INSS do 13º calculado separado (prática de folha).
9. Terceiros (Sistema S), FAP, Simples Nacional e desoneração no custo da empresa.
10. Que **pessoa física** que contrata autônomo não recolhe nada (leitura consolidada, sem texto expresso).
11. CLT art. 442-B (autônomo) e art. 9º no texto atual.
12. Vencimento do DAS-MEI no dia 20; se a diarista MEI recolhe ISS ou ICMS.
13. Encargos sobre a bolsa de estágio; texto atual dos arts. 428 a 433 da CLT.
14. Piso do RJ; grupo do doméstico no PR; número da lei do RS.
15. Tabelas de INSS e IRRF de 2027 (ainda não publicadas).
16. Intermitente para doméstico (controverso).
17. Regra do VT quando a passagem custa menos que 6% do salário.
18. Alíquota de FGTS do empregado do MEI.
19. Trabalhador rural (outra lei de noturno).
20. Efeito da LC 238 sobre o valor fixo do DAS (passa ao Comitê Gestor).

---

## 6. Arquitetura técnica

### 6.1 Princípios
- Continua **HTML, CSS e JavaScript puros**, sem servidor e sem conta, publicado no GitHub Pages.
- Sai de "um arquivo só" para **alguns arquivos organizados**, para dar para testar e manter. Não há etapa de compilação: o navegador lê os módulos direto.
- Trabalho feito num **worktree/ramo separado**; a versão atual fica no ar até a nova estar aprovada.

### 6.2 Pastas
```
/index.html              casca do app e abas
/manifest.webmanifest    instalação como app
/sw.js                   funcionamento offline e atualização
/css/                    base.css, temas.css, impressao.css
/js/
  app.js                 navegação e estado
  telas/                 calcular.js, tabela.js, salvos.js, leis.js, config.js
  ui/                    campos de dinheiro, chips, avisos, "mostrar a conta"
  motor/                 SÓ contas, sem tela:
    parametros.js        escolhe a tabela pela data
    inss.js  irrf.js  domestico.js  diarista.js  autonomo.js
    mei.js  clt.js  intermitente.js  dsr.js  provisoes.js  vinculo.js
  dados/armazem.js       IndexedDB com reserva em localStorage
  compartilhar.js        link, WhatsApp, impressão
/dados/
  parametros.json        todos os números, com vigência, fonte e status
  leis.json              resumos, glossário, perguntas frequentes
/testes/                 testes do motor (node --test) e da tela
/docs/PLANO.md  FONTES.md  MUDANCAS.md
```

### 6.3 Motor de cálculo
- Funções puras: recebem os dados e a data de referência e devolvem o resultado **mais a lista de passos** ("mostrar a conta"), com a fonte de cada passo.
- Dinheiro calculado em **centavos inteiros**, para evitar erro de arredondamento; arredonda só na exibição e no fim de cada verba, como na folha.
- Cada cálculo registra a **versão do parametros.json** usada.

### 6.4 Dados versionados
- Cada parâmetro tem: `valor`, `vigente_desde`, `vigente_ate`, `fonte_url`, `status` (vigente, previsto, não verificado), `observacao`.
- O motor escolhe pela **data da competência**: um cálculo de janeiro de 2027 já usa a jornada de 42 h e o mínimo novo quando estiver publicado; enquanto for previsto, mostra o selo "previsto".
- O usuário pode **sobrescrever** um valor em Configurações (fica marcado "editado por você").

### 6.5 Armazenamento
- Salvos, configurações, pessoas e calendário em **IndexedDB**; reserva em localStorage; tudo dentro de try/catch para funcionar em janela anônima.
- Backup e restauração em arquivo JSON; CSV para planilha.
- Migração automática quando o formato dos dados mudar.

### 6.6 PWA e atualização
- Service worker com cache versionado: abre offline; quando há versão nova, mostra "Nova versão disponível · Atualizar".
- Na Fase 3, `parametros.json` é buscado separado, para atualizar as leis sem republicar o app, mostrando "o que mudou".

### 6.7 Segurança e privacidade
- Nenhum dado sai do aparelho, exceto quando você compartilha.
- O link compartilhado leva **só números** (modo, valores, dias), nunca nome, CPF, notas ou chave Pix.
- Sem rastreadores, anúncios ou fontes externas; política de segurança de conteúdo restritiva.
- Texto do usuário sempre tratado como texto (nunca como código), para evitar injeção ao importar backups.

### 6.8 Acessibilidade
- Campos de dinheiro como texto com teclado numérico (`inputmode="decimal"`), aceitando "1.621,00", "1621" e "R$ 1621"; formatação ao sair do campo; fonte de 16 px ou mais para o iPhone não dar zoom.
- Rótulo real em cada campo; resultado anunciado ao leitor de tela; contraste AA nos dois temas; alvos de toque de 44 px; não depender só de cor; respeitar "menos animação"; modo letra grande.

### 6.9 Testes
- **Motor:** casos conferidos contra exemplos oficiais (por exemplo, salário de R$ 1.621,00 → INSS R$ 121,58, líquido R$ 1.499,42, parte do patrão no DAE R$ 324,20, DAE R$ 445,78), limites de faixa, teto, redutor do IR, troca de jornada em 16/12/2026.
- **Tela:** navegador automatizado em 360 px, 768 px e desktop; rolagem horizontal zero; checagem de acessibilidade; modo offline.
- **Dados:** teste que falha se algum parâmetro vigente estiver sem fonte ou sem data.

---

## 7. Ideias extras

### 7.1 Top 15 (valor ÷ esforço)

| # | Ideia | Fase |
|---|---|---|
| 1 | Alerta de vínculo (3 dias por semana) | 1 |
| 2 | Alerta de mínimo e de piso estadual | 1 |
| 3 | Mostrar a conta com lei | 1 |
| 4 | Valores/hora livres + coluna do mínimo na tabela | 1 |
| 5 | Glossário em toque | 1 |
| 6 | Presets de profissão (diarista, babá, cuidador, pedreiro, professor particular) com valores só de exemplo | 1 |
| 7 | Modo inverso: "tenho R$ X, quanto cabe?" | 1 |
| 8 | Parâmetros com fonte e data | 1 |
| 9 | Salvos com título, notas e etiquetas | 1 |
| 10 | Link compartilhável + texto de WhatsApp | 1 |
| 11 | Recibo imprimível | 2 |
| 12 | Modo trabalhador | 2 |
| 13 | Custo real por hora e "cofrinho" de 13º e férias | 2 |
| 14 | Calendário de dias + controle de pagamentos | 2 |
| 15 | Checklist de formalização no eSocial | 2 |

### 7.2 Cinco ousadas

1. **Modo conversa + termômetro de risco**: responde "o que eu sou e o que devo fazer". Não achamos concorrente que faça.
2. **"E se formalizar?"**: mostra o custo para quem paga e o ganho para quem recebe, lado a lado.
3. **Combinado com aceite por link**: o cálculo vira um acordo registrado, sem servidor.
4. **Painel duplo**: quem recebe vê os próprios dias e pagamentos por link ou QR exportado.
5. **Leis que se atualizam com "o que mudou"**: cada número com fonte e aviso automático quando a lei muda.

---

## 8. Riscos e limites

- **Não substitui contador, advogado nem a folha do eSocial.** Aviso fixo na tela, no recibo e no texto compartilhado. O valor oficial é o do eSocial ou do TRCT.
- **Leis mudam.** A EC 141 muda a jornada em dezembro de 2026 e em dezembro de 2027; mínimo, INSS e IR mudam todo janeiro; o MEI muda em 2027 e 2028. Mitigação: parâmetros datados, selo de data de conferência, atualização separada e alguém (você ou eu) revendo em janeiro.
- **Convenção coletiva e pisos de categoria** podem mudar os valores; o app não os conhece.
- **Enquadramento é estimativa.** O alerta diz "pode ser", nunca "é". A decisão de um juiz depende dos fatos.
- **Pontos não verificados** (seção 5.9) aparecem marcados ou ficam fora até serem conferidos.
- **Dados só no aparelho:** se o celular for perdido sem backup, os salvos se perdem. O app lembra de fazer backup.
- **Tamanho:** mais recursos tornam o app mais difícil de usar. Mitigação: tela inicial simples, avançado sob "mais opções", modo conversa.
- **Responsabilidade ao compartilhar:** o link pode ser aberto anos depois; o app recalcula com a data do link e avisa se a tabela mudou.

---

## 9. Perguntas para você

Marque uma opção por pergunta. **(R)** = a que eu recomendo.

### A. Público e foco
1. **Quem é o usuário principal?** a) Só quem paga · b) Quem paga, com um modo para quem recebe **(R)** · c) Os dois com o mesmo peso
2. **Quais modos entram na primeira entrega?** a) Hora simples + diarista + doméstico **(R)** · b) a) + autônomo/RPA + MEI · c) Todos, incluindo CLT e intermitente
3. **O app deve atender empresas (CLT, RPA de empresa)?** a) Não, só pessoa física · b) Sim, mas na Fase 2 **(R)** · c) Sim, desde a Fase 1
4. **Mostrar estágio, aprendiz e temporário?** a) Só como leitura, com o aviso "família não pode" **(R)** · b) Com calculadora · c) Não mostrar

### B. Facilidade de uso
5. **Como o app abre?** a) Direto na calculadora de hora (como hoje) **(R)** · b) No modo conversa · c) Numa tela "o que você quer fazer?"
6. **Questionário "Não sei qual é o meu"?** a) Versão curta (4 perguntas) já na Fase 1 **(R)** · b) Só o modo conversa completo na Fase 3 · c) Não ter
7. **Navegação no celular?** a) Barra inferior com 5 abas **(R)** · b) Menu hambúrguer · c) Uma página longa com seções
8. **Modo letra grande para idosos?** a) Opção nas configurações **(R)** · b) Ligado por padrão · c) Não precisa

### C. Lei e números
9. **Jornada depois da EC 141:** a) Trocar sozinho pela data, com aviso e opção de mudar **(R)** · b) Deixar você escolher sempre · c) Manter 44 h até haver norma do divisor
10. **Valor previsto (ex.: mínimo de R$ 1.741 em 2027):** a) Mostrar com selo "previsto", sem usar no cálculo **(R)** · b) Usar no cálculo de 2027 com aviso · c) Não mostrar
11. **Pontos não verificados (ex.: hora extra a 100% no feriado):** a) Deixar como opção ligável com o selo "não verificado" **(R)** · b) Esconder até verificar · c) Usar normalmente
12. **Piso estadual:** a) Pedir o estado nas configurações e usar o maior entre piso e mínimo **(R)** · b) Só mostrar, sem usar · c) Só o nacional
13. **Arredondamento padrão:** a) Nenhum (centavos), com opção **(R)** · b) R$ 0,50 · c) R$ 1
14. **Mostrar faixas de preço de mercado de diarista (não oficiais)?** a) Não, só valores legais **(R)** · b) Sim, marcadas "não oficial" · c) Deixar você digitar a sua referência
15. **Alerta de vínculo:** a) Selo e texto cauteloso ("pode ser emprego doméstico") **(R)** · b) Bloquear o cálculo de diarista com 3 dias ou mais · c) Só uma nota discreta

### D. Salvos e dados
16. **Onde ficam os salvos?** a) Só no aparelho, com backup em arquivo **(R)** · b) Aparelho + sincronizar com Google Drive · c) Só no aparelho, sem backup
17. **Campos do salvo:** a) Título, notas, etiquetas, data, fixar **(R)** · b) a) + foto ou anexo · c) Só título e notas
18. **Fichas por pessoa (diarista, cuidadora...)?** a) Fase 2 **(R)** · b) Fase 1 · c) Não ter
19. **Calendário de dias trabalhados e pagamentos?** a) Fase 2 **(R)** · b) Fase 1 · c) Não ter
20. **Nome de pessoas no recibo e nos salvos?** a) Opcional, só no aparelho, nunca no link **(R)** · b) Não guardar nomes · c) Obrigatório no recibo

### E. Compartilhar
21. **O link compartilhado leva:** a) Só os números do cálculo **(R)** · b) Números + título · c) Tudo, incluindo notas
22. **Recibo:** a) Imprimir/PDF e imagem para WhatsApp na Fase 2 **(R)** · b) Já na Fase 1 · c) Não ter
23. **Pix copia-e-cola?** a) Fase 3, opcional **(R)** · b) Fase 2 · c) Não ter
24. **Lembretes no calendário do celular (.ics)?** a) Sim, Fase 2 **(R)** · b) Não

### F. Visual e marca
25. **Nome do app:** a) Manter "Tabela de Ganhos" **(R)** · b) Mudar (diga o nome) · c) Me sugira 5 nomes
26. **Visual:** a) Manter o estilo atual e organizar · b) Redesenho completo com referências visuais antes **(R)** · c) Tanto faz
27. **Idioma:** a) Só português **(R)** · b) Português + espanhol

### G. Publicação e manutenção
28. **Endereço:** a) Mesmo endereço do GitHub Pages, trocando quando aprovado **(R)** · b) Endereço novo, mantendo o antigo
29. **Atualização das leis:** a) Arquivo de parâmetros separado, revisado por mim todo janeiro e quando sair lei nova **(R)** · b) Só quando você pedir · c) Você edita nas configurações
30. **Entrega:** a) Fase 1 inteira, depois você testa **(R)** · b) Em pedaços pequenos, com teste a cada tela · c) Tudo de uma vez

---

## 10. Próximos passos após a sua confirmação

1. **Você responde às perguntas** (pode ser só as letras, por exemplo "1b, 2a, 3b..."). Sem resposta, uso as recomendadas.
2. **Fechar os pendentes que afetam a Fase 1**: divisor da EC 141, dia exato da troca, piso do PR e RJ, hora extra a 100%.
3. **Criar o ramo e o worktree** separados; a versão atual continua no ar.
4. **Montar `parametros.json` e o motor com testes**, antes de qualquer tela.
5. **Se você escolher o redesenho (pergunta 26):** referências visuais e uma proposta de tela para você aprovar.
6. **Construir as telas da Fase 1** (Calcular, Tabela, Salvos, Leis, Configurações) e o compartilhamento.
7. **Conferência:** testes do motor, celular e computador, offline, acessibilidade, revisão dos textos legais.
8. **Prévia para você testar** num endereço de teste; ajustes.
9. **Publicar** no endereço definido (pergunta 28), com a nota "o que há de novo".
10. **Planejar a Fase 2** e marcar a revisão de janeiro de 2027 (mínimo novo, INSS, IR, MEI) e a de 16/12/2026 (42 h).
