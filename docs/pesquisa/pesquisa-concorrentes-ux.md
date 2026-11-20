# Pesquisa: concorrentes, boas práticas de UX e oportunidades para o "Tabela de Ganhos"

Data: 2026-11-20. Os fatos numéricos ou legais têm fonte no fim de cada item e também na lista `claims`. Onde não achei fonte primária, o texto diz "não verificado".

## 1. Calculadoras e apps parecidos

| Ferramenta | O que faz bem | O que falta | Como mostra o resultado | Armadilhas de UX |
|---|---|---|---|---|
| **ValorFinal: salário de empregada doméstica** (valorfinal.com.br/calculadora-salario-empregada-domestica) | É a melhor referência do nicho. Pede poucos campos: salário bruto, passagens de VT e estado (para comparar com o piso regional). Explica a conta numa seção chamada "Como chegamos nesse valor" e mostra as fórmulas. Cita a lei com link: LC 150 arts. 22, 34 e 35, a tabela do INSS de 2026, o Decreto 10.854/2021, a Lei 15.270/2025 e a Lei 14.438/2022. Diz que o cálculo roda no navegador e lista as limitações (hora extra, faltas, mês de admissão). Tem calculadoras irmãs de rescisão, férias e 13º. | Não imprime, não gera recibo e não compartilha o resultado. Salvar cenários só existe no plano VIP pago ("até 500 cenários"). Não trata diarista nem horista. | Um número em destaque (custo mensal para o empregador). Depois vêm o líquido da empregada, o DAE do mês, o custo no ano e quanto "reservar por mês". Abaixo, dois blocos: "O que a empregada recebe" e "O que vai no DAE". | Os dependentes ficam escondidos em "Mais opções". O campo de estado não diz se muda o cálculo. Há muitos convites para VIP, widget e cursos. |
| **iDinheiro: salário líquido** (idinheiro.com.br/calculadoras/calculadora-salario-liquido) | Campos com rótulo claro e um guia "Como usar" em passos. Traz as tabelas de INSS e IRRF de 2026 e mostra autor, revisor e data de atualização, o que passa confiança. | Não tem gráfico, não salva e não compartilha. O passo a passo está no artigo, longe do resultado. | Separa "Proventos" de "Descontos" e oferece "Exibir resultado em tabela". | Tem dois botões "Calcular". Hora extra e dependentes menores de 14 anos ficam atrás de "Ver mais campos". "Benefícios" e "Outros descontos" se confundem. Os anúncios ("continua após a publicidade") ficam colados na ferramenta. As datas de atualização se contradizem (12/11/2026 num lugar, 26/01/2026 no outro). |
| **Freela sem Crise: preço do faxineiro** (freelasemcrise.com.br/calculadoras/preco/faxineiro) | Visto pelo lado de quem presta o serviço. O usuário escolhe o regime (MEI, autônomo ou Simples) e informa a meta líquida, os custos fixos e variáveis e as horas por mês. Cada campo tem uma dica curta. Quando ainda não há dados, mostra "Preencha sua meta…". | Não tem presets nem a conta explicada, e não salva nem compartilha. O texto lista o que muda o preço (m², frequência, tipo de faxina, deslocamento), mas nada disso é campo da calculadora. | Diz "Cálculo em tempo real", mas não deixa claro se o resultado é por hora, por diária ou por mês. | O seletor do Simples diz "Anexo III" e o texto de recomendação diz "Anexo VI", o que se contradiz. |
| **Calculadora do Cidadão (Banco Central)** (www3.bcb.gov.br/CALCIDADAO) | É oficial. Corrige um valor por índice (IPCA, INPC, IGP-M e outros), Selic, CDI, poupança, TR e Taxa Legal, e tem um link para a metodologia. | Não é feita para celular: a data é digitada em MM/AAAA. Não salva nem compartilha, e o resultado é seco. | Mostra o fator acumulado (ex.: 1,0225) e o valor corrigido. | O formulário é burocrático e o vocabulário é técnico. Serve de exemplo de "fonte oficial + metodologia", não de UX. |
| **Calculadoras de rescisão** (iDinheiro, meutudo, 99Pay, Toro, Razonet, Meu Contador Online) | Cobrem as verbas da CLT e lembram que o valor oficial é o do TRCT emitido pelo eSocial. | Quase todas são só CLT, com pouca coisa para doméstico. Não achei simulador oficial de rescisão no gov.br nem no MTE. | Lista de verbas com total. | Pedem muitos campos de uma vez (tipo de demissão, aviso, datas). São monetizadas com anúncios e empréstimo consignado. |
| **Custo de doméstica / DAE** (CalculaCentro, Calculadora Brasil, hacecuentas, meutudo, Jornal Contábil) | Repetem a regra dos 20% de encargos (8 + 0,8 + 8 + 3,2). | Divergem sobre o vencimento do DAE (dia 7 ou dia 20) e sobre as faixas do INSS. Ao menos uma mostra uma tabela errada. | Valor de salário mais encargos. | Informação desatualizada, sem data de vigência nem fonte primária. |
| **Apps de diarista e ponto** (Parafuzo, EdKasa, Cleaner Up, Easy Clean, rastreadores genéricos de horas, ZenMaid) | Agenda, registro de entrada e saída, total por taxa horária, fatura. | Parafuzo e EdKasa são marketplaces para contratar diarista, não para controlar pagamento. Os de controle são do lado de quem presta o serviço, quase todos iOS ou em inglês, e não falam da lei brasileira. Não achei app para quem paga uma pessoa física por hora e quer controlar dias, valores e recibos. | — | — |
| **eSocial Doméstico** (gov.br/esocial) | É a fonte oficial: folha, DAE, rescisão e o Manual do Empregador Doméstico (versão de 13/08/2026). | Não simula nada antes de contratar. É burocrático e exige login gov.br. | Folha e guia DAE. | Linguagem técnica. O FAQ antigo (perguntas-e-respostas-domestico.pdf) ainda diz que o DAE vence no dia 7. |

**O que se repete no mercado:**
1. Quase ninguém mostra a conta junto do número. A ValorFinal é a exceção.
2. Salvar cenários é raro ou pago.
3. Ninguém gera recibo ou resumo para compartilhar (WhatsApp, PDF).
4. Ninguém trata, num lugar só, as três situações em que o leitor de fato está:
   - diarista até 2 dias por semana, sem vínculo;
   - doméstico com carteira;
   - horista ou freelancer.
5. A vigência dos números raramente aparece, e várias páginas trazem tabelas velhas ou erradas.
6. Muitas páginas são poluídas por anúncios.

## 2. Base legal que o app deve usar (2026)

- **Salário mínimo:** R$ 1.621,00 desde 01/01/2026, pelo Decreto 12.797/2025. A Agência Gov dá R$ 54,04 por dia e R$ 7,37 por hora. ([planalto](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm), [agenciagov](https://agenciagov.ebc.com.br/noticias/202512/publicado-decreto-que-reajusta-salario-minimo-para-r-1-621-a-partir-de-1o-de-janeiro))
- **Quando há vínculo doméstico:** trabalho "por mais de 2 (dois) dias por semana" (LC 150/2015, art. 1º). Para a diarista, isso é o critério principal. ([planalto LC 150](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm))
- **Jornada e hora extra do doméstico:** até 8 h por dia e 44 h por semana. A hora extra vale no mínimo 50% a mais. Para o mensalista, a hora é o salário dividido por 220 (art. 2º, caput, §1º e §2º). Tempo parcial é de até 25 h por semana (art. 3º).
- **Trabalho noturno:** das 22h às 5h. A hora noturna dura 52min30s e tem adicional mínimo de 20% (art. 14).
- **Encargos do empregador doméstico (art. 34):** INSS patronal de 8%, seguro contra acidente de 0,8%, FGTS de 8% e 3,2% para a indenização compensatória (art. 22). Somam 20%. A extração feita da página do Planalto pegou só os incisos I, III, IV e V. O inciso II (8% patronal) é confirmado por fontes secundárias, mas não pelo texto do Planalto nesta pesquisa.
- **INSS da empregada (tabela progressiva de 2026), pela Portaria Interministerial MPS/MF nº 13, de 09/01/2026, vigente desde 01/01/2026:**
  - até R$ 1.621,00: 7,5%
  - de R$ 1.621,01 a R$ 2.902,84: 9%
  - de R$ 2.902,85 a R$ 4.354,27: 12%
  - de R$ 4.354,28 a R$ 8.475,55: 14%
  - teto de R$ 8.475,55
  - salário-família de R$ 67,54 por cota, para quem ganha até R$ 1.980,38

  Fonte: [Senior](https://documentacao.senior.com.br/exigenciaslegais/noticias/trabalhista-previdenciaria/2026/2026-01-12-trabalhista-portaria-interministerial-mps-mf-n-13-nova-tabela-de-contribuicao-do-inss-para-2026/). É fonte secundária: o texto da portaria no DOU ou no gov.br não foi lido. Algumas fontes diferem por centavos.
- **IRRF em 2026 (Lei 15.270/2025, que criou o art. 3º-A da Lei 9.250):**
  - renda tributável de até R$ 5.000,00 por mês: redução de até R$ 312,89, o que zera o imposto;
  - de R$ 5.000,01 a R$ 7.350,00: redução de R$ 978,62 − 0,133145 × renda;
  - vale desde janeiro de 2026.

  A tabela progressiva completa de 2026 não foi verificada nesta pesquisa. ([planalto](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15270.htm))
- **Vencimento do DAE: as fontes divergem.**
  - O texto da LC 150, art. 35, no Planalto, diz "até o dia 7 do mês seguinte".
  - A Lei 8.036, art. 15, com redação da Lei 14.438/2022, passou o depósito do FGTS para "até o vigésimo dia".
  - Fontes secundárias (ValorFinal, trabalhista.blog) dizem que o DAE vence no dia 20 desde a competência de 03/2024.
  - O FAQ antigo do eSocial ainda diz dia 7.

  Uma fonte oficial atual para o DAE não foi verificada. Por isso o app deve dizer "confira no eSocial" e não fixar a data.
- **Outras regras conhecidas, sem verificação nesta rodada:**
  - férias com mais 1/3 (CF, art. 7º, XVII);
  - 13º salário (Lei 4.090/1962);
  - desconto de vale-transporte de até 6% (Lei 7.418/1985);
  - DSR (Lei 605/1949).

  Têm de ser conferidas no Planalto antes de entrar no app.
- **Faixas de preço de diarista (não oficiais):**
  - Catraca Livre: R$ 150 a R$ 200 por dia nas capitais e R$ 100 a R$ 130 no interior;
  - Cronoshare: R$ 85 a R$ 150 em São Paulo.

  São só referências de mercado, sem valor legal.

## 3. Boas práticas de UX para calculadora financeira no celular

**Entrada de valores**
- Usar `<input type="text" inputmode="decimal">`, não `type="number"`. O GOV.UK achou iPhones cujo teclado `numeric` não tinha separador decimal. ([GOV.UK](https://technology.blog.gov.uk/2020/02/24/why-the-gov-uk-design-system-team-changed-the-input-type-for-numbers/), [MDN](https://developer.mozilla.org/docs/Web/HTML/Reference/Global_attributes/inputmode))
- Mostrar o prefixo "R$" fixo fora do campo e aceitar "1.621,00", "1621", "1621,5" e "R$ 1621".
- Formatar com `Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'})` ao sair do campo (blur), não enquanto a pessoa digita. Formatar durante a digitação atrapalha o leitor de tela e o cursor.
- Fonte do campo com 16 px ou mais, para o iOS não dar zoom.

**Presets e passos**
- Chips de um toque: "salário mínimo", "R$ 10, 12 ou 15/h", "4h, 6h, 8h", "2 dias por semana", "seg a sex".
- Para horas e dias, usar stepper (− e +) em vez de digitar.
- Perfis prontos: "diarista", "doméstica mensalista", "cuidador noturno", "freelancer".
- Mostrar uma pergunta por vez (assistente) para quem é leigo, com um modo avançado que abre todos os campos.

**Resultado**
- Um número-herói por vez (por exemplo, "Você paga por mês"), com o detalhamento abaixo.
- "Mostrar a conta": cada linha com a fórmula, os números já trocados e o artigo da lei com link. Exemplo: "INSS 7,5% × 1.621,00 = 121,58 (Portaria MPS/MF 13/2026)".
- Atualizar em tempo real. Sem botão "Calcular" duplicado.
- Avisar dentro do contexto. Exemplo: com 3 ou mais dias por semana, mostrar "a partir de 3 dias/semana é vínculo doméstico (LC 150, art. 1º)".

**Comparar cenários**
- Cenários lado a lado (A e B), com a diferença em R$ e em %. Exemplo: diarista 2 dias por semana contra mensalista registrada.
- Uma faixa de "custo anual real" que inclui 13º, férias + 1/3 e encargos.

**Salvar e compartilhar**
- Salvar com título, nota, data e etiquetas no `localStorage`/IndexedDB, com exportar e importar em JSON. O app é offline e não tem backend.
- Compartilhar por link com o estado na URL (sem dados pessoais), pela Web Share API (WhatsApp) e por um resumo em texto ou PDF via `window.print()` com CSS de impressão.
- Gerar recibo simples.

**Confiança**
- Mostrar a data de vigência de cada tabela ("Valores de 2026, conferidos em DD/MM").
- Aviso de que é estimativa e de que o valor oficial é o do eSocial ou do TRCT.
- Página "Fontes e leis" com os links.

**Acessibilidade**
- `<label>` real em cada campo e `aria-live="polite"` no resultado.
- Contraste AA nos dois temas e alvos de toque com 44 px ou mais.
- Não depender só de cor.
- Respeitar `prefers-reduced-motion`.
- Tabelas com `<th scope>`.

**Linguagem**
- Linguagem de leigo: "o que você paga", "o que ela recebe", "guia do governo (DAE)".
- Glossário ao tocar no termo: DSR, FGTS, 1/3 de férias.

## 4. Oportunidades e gaps para o nosso app, por prioridade

1. **Detector de enquadramento "Que tipo de trabalho é?"**: diarista (até 2 dias por semana, sem vínculo), doméstica com carteira, horista CLT ou autônomo/freelancer. Dá o alerta jurídico com o artigo da lei. Nenhum concorrente faz isso.
2. **"Mostrar a conta" em todo resultado**, com a fórmula, os números e o link da lei. Só a ValorFinal faz algo parecido.
3. **Cálculos salvos grátis e offline**, com título, notas, etiquetas, data, duplicar, exportar e importar. Na ValorFinal isso é pago.
4. **Comparador de cenários**: diarista × mensalista registrada × horista. Mostra custo mensal e anual real (13º, férias + 1/3, 20% de encargos) e o líquido de quem recebe.
5. **Tabela de salários e referências**:
   - salário mínimo, valor diário e valor-hora de 2026;
   - pisos regionais (SP, PR, SC, RS), ainda não verificados;
   - faixas de mercado de diarista, marcadas como não oficiais;
   - um seletor "por hora, dia, semana, mês ou ano" para converter entre unidades.
6. **Menu de configuração**:
   - valores padrão (R$/h, dias, horas);
   - tabela legal ativa (ano), com um campo para o usuário editar quando a lei mudar;
   - tema, tamanho de fonte e formato de exportação.
7. **Área "Leis e consultas" offline**: resumos curtos da LC 150, das regras de hora extra e noturno, férias, 13º e VT, com link para o Planalto. Inclui um "verificador": aviso quando o valor-hora digitado fica abaixo de R$ 7,37, o mínimo-hora de 2026.
8. **Hora extra, noturno e feriado**: +50%, adicional noturno de 20% e hora noturna de 52min30s para cuidadores. Os concorrentes de diarista ignoram isso.
9. **Recibo e compartilhamento**: recibo de pagamento de diária ou mês em texto, PDF ou WhatsApp, e link com o estado do cálculo. Nenhum concorrente gratuito oferece.
10. **Controle do mês (diário de dias trabalhados)**: marcar dias num calendário, somar horas e valores e fechar o mês com recibo. É o espaço que os apps de diarista não cobrem do lado de quem paga.
11. **Lembretes e calendário fiscal**: DAE (com a data marcada "confira no eSocial", porque dia 7 e dia 20 divergem), 13º em duas parcelas e férias vencendo. O PWA pode gerar arquivo .ics.
12. **"Quanto posso pagar" reverso, já existente, ampliado**: a partir do orçamento, calcular as horas e dias possíveis e o salário máximo registrável incluindo encargos.
13. **Simuladores de férias, 13º e rescisão doméstica**: estimativas com o aviso de que o valor oficial é o do eSocial.
14. **Confiança e transparência**:
    - cada número com data de vigência e fonte;
    - selo "tabela de 2026";
    - aviso "estimativa, não substitui contador/eSocial";
    - sem anúncios, como diferencial.
15. **Acessibilidade e modo simples**: fonte grande e linguagem simples para pagadores idosos (comum para quem contrata cuidador), mais leitura de resultado por voz (Web Speech).

### Pontos que precisam de fonte antes de entrar no app
- O vencimento atual do DAE (dia 7 ou dia 20).
- O texto oficial da Portaria MPS/MF 13/2026.
- A tabela progressiva do IRRF de 2026.
- Os pisos regionais estaduais de 2026.
- Se diarista pode ser MEI e em qual ocupação.
- A regra de recolhimento de INSS quando uma pessoa física contrata um autônomo.

## Verificação

- [CONFIRMADO] Salário mínimo nacional R$ 1.621,00 (Decreto 12.797, de 23/12/2025), vigência 2026-01-01 (https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm) — O texto do decreto no Planalto traz: 'DECRETO Nº 12.797, DE 23 DE DEZEMBRO DE 2025', R$ 1.621,00 a partir de 1º de janeiro de 2026. O INSS também usa R$ 1.621,00 como piso e primeira faixa de 2026.
- [CONFIRMADO] Valor diário do mínimo R$ 54,04 e valor horário R$ 7,37, vigência 2026-01-01 (https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm) — Os dois valores estão no próprio texto do Decreto 12.797/2025 (fonte primária), não só na notícia da Agência Gov citada. Vigência a partir de 01/01/2026.
- [CONFIRMADO] Empregado doméstico é quem trabalha mais de 2 dias por semana em residência (LC 150/2015, art. 1º) (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) — O art. 1º diz 'por mais de 2 (dois) dias por semana'. A lei é datada de 01/06/2015 e foi publicada no DOU de 02/06/2015. A página não mostra alteração desse artigo.
- [CONFIRMADO] Doméstico: jornada de 8h/dia e 44h/semana; hora extra de no mínimo 50%; divisor 220 (LC 150, art. 2º) (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) — Caput: 8h diárias e 44h semanais. §1º: hora extra no mínimo 50% acima da hora normal. §2º: salário mensal dividido por 220, salvo se o contrato fixar menos horas por mês, caso em que o divisor muda. Sem alteração indicada no Planalto.
- [CONFIRMADO] Tempo parcial doméstico: até 25 horas semanais (LC 150, art. 3º) (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) — O caput do art. 3º diz que é tempo parcial o trabalho que 'não exceda 25 (vinte e cinco) horas semanais'.
- [CONFIRMADO] Trabalho noturno doméstico: 22h às 5h, hora de 52min30s, adicional mínimo de 20% (LC 150, art. 14) (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) — Caput: das 22h às 5h do dia seguinte. §1º: hora noturna de 52 minutos e 30 segundos. §2º: acréscimo mínimo de 20% sobre a hora diurna.
- [CONFIRMADO] Encargos do empregador doméstico: 8% INSS patronal + 0,8% seguro acidente + 8% FGTS + 3,2% indenização compensatória = 20% (LC 150, art. 34) (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm) — O inciso II (8% de contribuição patronal) agora também foi lido no Planalto, que é fonte primária; não depende mais de fonte secundária. Os incisos III (0,8%), IV (8%) e V (3,2%) foram conferidos. Soma: 20%. O inciso I (8% a 11%, do empregado) está desatualizado: hoje vale a tabela progressiva do fato 8. O inciso VI (IRRF, 'se incidente') é retido do empregado e não é encargo do patrão.
- [CONFIRMADO] INSS empregado/doméstico 2026: até 1.621,00 = 7,5%; 1.621,01–2.902,84 = 9%; 2.902,85–4.354,27 = 12%; 4.354,28–8.475,55 = 14%; teto R$ 8.475,55 (Portaria Interministerial MPS/MF nº 13/2026) (https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal) — Página oficial do INSS: as faixas e alíquotas são idênticas, vêm da Portaria Interministerial MPS/MF nº 13, de 09/01/2026, e valem a partir da competência janeiro/2026. O Ministério da Previdência informa publicação no DOU em 12/01/2026 (https://www.gov.br/previdencia/pt-br/assuntos/rpps/destaques/publicada-a-portaria-interministerial-mps-mf-no-13-de-9-01-2026-que-dispoe-sobre-o-reajuste-dos-beneficios-pagos-pelo-inss-e-demais-valores). O texto da portaria no DOU não foi lido: o PDF do gov.br é imagem sem texto e a Biblioteca Digital devolveu erro 403. As alíquotas são progressivas, ou seja, cada uma incide só sobre a sua faixa.
- [CONFIRMADO] Salário-família 2026: R$ 67,54 por cota para remuneração até R$ 1.980,38 (https://www.gov.br/inss/pt-br/direitos-e-deveres/salario-familia/valor-limite-para-direito-ao-salario-familia) — A página oficial do INSS mostra 'Até 1.980,38 cota 67,54', com base na Portaria Interministerial MPS/MF nº 13/2026 e vigência a partir de 01/01/2026.
- [CONFIRMADO] IRRF: redução de até R$ 312,89 que zera o imposto até R$ 5.000,00; de R$ 5.000,01 a R$ 7.350,00 a redução é R$ 978,62 − 0,133145 × renda (Lei 15.270/2025, art. 3º-A da Lei 9.250) (https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15270.htm) — O art. 3º-A foi inserido pelo art. 2º da Lei 15.270/2025 e vale 'a partir do mês de janeiro do ano-calendário de 2026'. A redução cai em linha reta até zerar a partir de R$ 7.350,00. Pelo art. 8º, os efeitos começam em 01/01/2026; a lei saiu no DOU de 27/11/2025. A tabela progressiva mensal do IRRF em si não foi conferida nesta verificação.
- [CONFIRMADO] Depósito do FGTS até o dia 20 de cada mês (Lei 8.036, art. 15, redação da Lei 14.438/2022) (https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm) — O caput do art. 15 diz 'até o vigésimo dia de cada mês', 8% da remuneração do mês anterior, com 'Redação dada pela Lei nº 14.438, de 2022'. Para empregadores comuns, o dia 20 passou a valer na prática com o FGTS Digital, a partir de março/2024; o doméstico recolhe pelo DAE (fato 12).
- [CORRIGIDO] Vencimento do DAE doméstico: não verificado (LC 150, art. 35, diz dia 7; fontes secundárias dizem dia 20 desde a competência 03/2024) => Dia 20 do mês seguinte ao da competência, a partir da competência março/2024. Quando o dia 20 não é útil, o pagamento é antecipado para o dia útil anterior. (https://www.gov.br/esocial/pt-br/noticias/mudanca-na-data-de-vencimento-do-dae) — Em notícia oficial de 19/03/2024, o eSocial diz que, a partir da competência março/2024, o DAE 'passa a ter vencimento até o dia 20 do mês subsequente'. A competência 03/2024 venceu em 19/04/2024 porque o dia 20 caiu num sábado. O FGTS (https://www.fgts.gov.br/Paginas/subpaginas/recolhimento-empregado-domestico.aspx) atribui a mudança à Portaria MTE nº 240, de 29/02/2024, e confirma a antecipação para o dia útil anterior. O texto da Portaria 240 não foi lido. No Planalto, o art. 35 da LC 150 ainda diz 'dia 7' sem nota de alteração. Na prática, vale o dia 20, que é o que o eSocial aplica e o que aparece na guia gerada. Não encontrei mudança posterior até 2026-11-20.