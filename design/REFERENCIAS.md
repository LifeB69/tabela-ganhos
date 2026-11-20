# Referências visuais e direções: Tabela de Ganhos v2

Data: 2026-11-20 (UTC). Base: `docs/PLANO.md` (pergunta 26 = redesenho completo com referências) e `docs/pesquisa/pesquisa-concorrentes-ux.md`.
Estado: **proposta para o dono escolher uma das 3 direções**. Nada foi desenhado nem codificado ainda.

---

## 1. Critério usado

**Público:** gente comum no Brasil (inclusive idosos) que paga diarista, doméstica, cuidadora ou freelancer. Usa no celular. Precisa confiar no número (dinheiro e lei) sem sentir que está num banco frio nem num app "feito por IA".

**O que cada referência precisava ensinar** (uma busca para cada coisa):

| Parte | O que extrair |
|---|---|
| Mostrar a conta | como abrir um cálculo linha a linha sem assustar |
| Tabelas no celular | colunas de dinheiro legíveis a 360 px, sem rolagem lateral escondida |
| Tipografia de números | dígitos tabulares, número grande do resultado, letra que idoso lê |
| Confiança sem frieza | como o governo e os bancos digitais passam seriedade |
| Navegação inferior | 5 abas com rótulo sempre visível |
| Materiais fora da tela | recibo, carteira de trabalho, cédula, fita de somar: coisas que o público já associa a "pagamento certo" |

**Aceite:** padrão claro e aproveitável, coerente com o plano, página viva e acessível por agente.
**Descarte:** mockups genéricos de Dribbble/Behance, telas sem fonte real, visual de IA (lista em `sinais-de-ia.md`).

**Anti-referências (vão ao gerador como "evite isto"):**
- roxo de banco digital e gradiente roxo/índigo (é a cara do Nubank e do "app de IA");
- verde-limão com preto (Wise) e preto com um acento neon;
- creme + serifa + terracota (o "bom gosto" padrão de 2026);
- painel de investimentos com gráficos de pizza e cartões com sombra em tudo;
- formulário de tabela fixa e letra de 11 px (a Calculadora do Cidadão, abaixo);
- o visual atual da v1 (verde #17734a + Bricolage Grotesque + Inter), que a pergunta 26 pede para trocar.

**Como as referências foram vistas** (regra do "não sei"):
- **[captura]** = abri a página num navegador sem janela a 375 px de largura, olhei a captura e medi fontes e cores em uso com `conferir.py` (só estudo; as capturas ficaram fora do projeto, no rascunho da sessão).
- **[texto]** = li a página ou a busca, mas não olhei imagem. Vale como pista, não como prova visual.
- **[memória]** = conhecimento geral, sem conferir agora. Está marcado para não ser tratado como fato.

`robots.txt` conferido em 20/11/2026 para gov.br, design-system.service.gov.uk, designsystem.digital.gov, blog.nubank.com.br, wise.design, monzo.com, soulver.app e bcb.gov.br: nenhuma das páginas usadas está bloqueada. Pinterest, Dribbble, Mobbin e Google Imagens não foram usados. Nada foi copiado nem baixado para o projeto; só há links.

---

## 2. As referências (18)

### A. Sistemas públicos de design (confiança, tabela, formulário)

**1. gov.br Design System: Tabela e Tipografia** [captura]
https://www.gov.br/ds/components/table · https://www.gov.br/ds/fundamentos-visuais/tipografia
- Medido na página: fonte **Rawline** em todo o texto, texto #333333, azul primário **#1351B4**, azul-escuro **#071D41**, fundo de código #F0F0F0.
- **Vale aprender:** é o visual que o público já associa a "isto é oficial" (eSocial, Meu INSS, CTPS Digital). Cabeçalho claro, azul único para ação, uma linha fina entre seções, títulos sem enfeite.
- **Não tirar:** o azul #1351B4 e a marca gov.br. Copiar a cara do governo seria fingir ser oficial (risco legal e de confiança). A Rawline não está no Google Fonts (a API respondeu erro 400 em 20/11/2026).

**2. GOV.UK Design System: Summary list** [captura + texto]
https://design-system.service.gov.uk/components/summary-list/
- Medido: fonte GDS Transport; texto #0B0C0C; link #1A65A6; botão verde #0F7A52; vermelho de erro #D13118.
- **Vale aprender:** a lista "rótulo → valor → Alterar" é o melhor formato para o **resumo do cálculo** e para o "mostrar a conta" no celular. Cada linha pode ter a sua ação ("ver lei ↗"). A variante "summary card" agrupa listas sob um título (útil para "Você paga" e "Ela recebe").
- **Não tirar:** a tipografia (fechada) e o tom britânico sem cor.

**3. GOV.UK: por que trocaram o tipo de campo numérico** [texto]
https://technology.blog.gov.uk/2020/02/24/why-the-gov-uk-design-system-team-changed-the-input-type-for-numbers/
- **Vale aprender:** `type="number"` causa erro (rolar o dedo muda o valor; letras somem em silêncio). Usar texto com `inputmode`. Isso já está no plano (6.8); aqui é a base visual do **campo de dinheiro**: grande, com "R$" fixo à esquerda e o valor em dígitos tabulares.

**4. U.S. Web Design System: Table** [captura + texto]
https://designsystem.digital.gov/components/table/
- Medido: Source Sans Pro + Public Sans + Roboto Mono; azul #005EA2; selo verde "Passed WCAG 2.1 AA".
- **Vale aprender:** tabela **empilhada** (stacked) em tela estreita, com o nome da coluna repetido em cada célula; números com a classe `text-tabular` e **alinhados à direita**; linhas zebradas como opção. Serve para a aba **Tabela** (mínimo, pisos, conversor).
- **Não tirar:** a mono para todos os números (fica técnico demais para o nosso público).

**5. Nielsen Norman Group: Mobile tables** [texto]
https://www.nngroup.com/articles/mobile-tables/
- **Vale aprender:** congelar o cabeçalho e a primeira coluna; mostrar só as colunas prioritárias e deixar a pessoa escolher as outras; se houver rolagem lateral, deixar uma coluna cortada à vista como pista (pontinhos passam despercebidos). Regra direta para a tabela hora/dia/semana/mês.

### B. Bancos e finanças (números, tipografia, navegação)

**6. Nubank: Nu Sans** [captura + texto]
https://blog.nubank.com.br/nu-sans/
- Medido no blog: fonte Gellix, roxo de fundo cheio.
- **Vale aprender:** a fonte própria tem versão **tabular** "para alinhar colunas de valores" e um negrito que **ocupa a mesma largura** do peso normal, "evitando que a interface pule" (texto do post). É a regra para o nosso resultado que atualiza enquanto a pessoa digita: o número não pode tremer.
- **Não tirar:** o roxo (anti-referência) e o tom de marca de banco.

**7. Nubank: renovação da identidade** [texto]
https://blog.nubank.com.br/brand-refresh-como-renovamos-a-identidade-visual-do-nubank/
- **Vale aprender:** como um banco brasileiro fala de "relação transparente e descomplicada" em forma visual.
- **Não tirar:** a paleta e as formas. Serve como medida do "banco que queremos não parecer".

**8. Wise: design e tipografia** [captura + texto]
https://wise.design/direction · https://medium.com/transferwise-design/creating-a-wise-typographic-set-1052503f9f01
- Medido: Wise Sans Heavy nos títulos, Inter no texto, verde-limão de fundo. Os endereços `/foundations/typography` e `/foundations/colour` deram página 404 em 20/11/2026.
- **Vale aprender:** o **valor de dinheiro como herói da tela**: fonte de título muito pesada só para o número principal, texto calmo em volta. No artigo, o time conta que chegou a ter "12 tipos diferentes de tabela de comparação" e precisou unificar. É um alerta para o nosso comparador A × B × C.
- **Não tirar:** o verde-limão e o "404 ilustrado". A Wise Sans é fechada.

**9. Monzo: a nova tela inicial** [captura + texto]
https://monzo.com/blog/the-new-and-improved-home-screen
- Medido: MonzoSansText/Display; azul-petróleo #016B83; azul-noite #091723; fundo verde-claro #F2F8F3.
- **Vale aprender:** o resumo "num relance" com blocos que a pessoa reordena e esconde. Ideia para a aba **Salvos** (fixar, ordem). O fundo levemente tingido, em vez de branco puro, deixa a tela menos "banco frio".
- **Não tirar:** a personalização completa (é demais para a Fase 1).

**10. Organizze e Mobills (lojas de apps)** [texto]
https://apps.apple.com/BR/app/id677699286 · https://apps.apple.com/MX/app/id921838244
- **Vale aprender:** são os apps de controle financeiro que o público brasileiro mais conhece. O padrão esperado é uma lista de lançamentos com valor alinhado à direita, uma categoria por cor e uma barra inferior. Mantemos o que o público já sabe usar.
- **Não tirar:** gráficos de pizza e o excesso de cor por categoria. As telas não foram vistas agora; olhar no celular antes de decidir.

### C. Calculadoras

**11. Soulver: caderno-calculadora** [captura + texto]
https://soulver.app/
- Medido no site: Hanken Grotesk + Fraunces. A captura do site mostra só o ícone, não a tela do app.
- **Vale aprender:** a ideia central (texto do site): cada linha mistura palavras e números, o **resultado aparece numa coluna à direita** enquanto se digita, há subtotais por grupo e um total fixo embaixo. É o melhor modelo para o nosso **"Mostrar a conta"**: "INSS 7,5% de 1.621,00 ……… 121,58".
- **Não tirar:** o par serifa + grotesca do site (cai no creme + serifa).

**12. Calculadora do Cidadão (Banco Central)**: anti-referência útil [captura]
https://www3.bcb.gov.br/CALCIDADAO/publico/exibirFormCorrecaoValores.do?method=exibirFormCorrecaoValores
- Medido a 375 px: só Verdana, layout de tabela de computador encolhido, letra minúscula, data em "MM/AAAA".
- **Vale aprender:** o que **não** fazer no celular. Mas o link "Metodologia" junto do resultado é o gesto certo: a fonte oficial ao lado do número.

**13. Material Design 3: barra de navegação** [texto]
https://m3.material.io/components/navigation-bar/guidelines
- **Vale aprender:** de 3 a 5 destinos (nós temos 5: Calcular, Tabela, Salvos, Leis, Mais). No Android, o público conhece o indicador em pílula atrás do ícone ativo. Com 5 abas, manter **rótulo sempre visível** (o idoso não adivinha ícone). Não consegui ler a altura recomendada na página; conferir antes de codar.

### D. Fora da tela (materiais que o público já associa a "pagamento certo")

**14. Talão de recibo de papelaria (Tilibra e similares)** [texto, referência fraca]
https://www.casasbahia.com.br/talao-de-pedido-tilibra-1-18-medio-1-via-com-50-folhas-formato-139mm-x-206mm/p/1582449713 · modelo de texto: https://www.infinitepay.io/blog/modelo-de-recibo
- **Vale aprender:** a estrutura que todo brasileiro reconhece: "Recebi de ___ a quantia de R$ ___ (valor por extenso) referente a ___", **canhoto** destacável, linha de assinatura, campos rotulados em letra pequena acima da linha. É a forma do **recibo** (Fase 2) e pode ser a forma do resultado.
- **Fraca:** não olhei fotos do talão agora. Pedir ao dono uma foto de um talão real ou abrir a loja no navegador antes de gerar a imagem.

**15. Carteira de Trabalho (física e digital)** [texto + memória]
https://www.gov.br/pt-br/apps/ctps-digital
- **Vale aprender:** a carteira azul-marinho é o símbolo de "emprego registrado" no Brasil. As páginas internas têm campos rotulados e anotações do empregador. O app digital mostra "Contratos de Trabalho", cada vínculo abre as anotações. É o gancho visual natural para o **alerta de vínculo** ("isto pode virar carteira assinada").
- **Memória:** a cor e o fundo de segurança da carteira física vêm da minha memória, não de imagem conferida agora. Conferir com foto antes de usar.

**16. Cédulas da Segunda Família do Real (Banco Central)** [texto]
https://www.bcb.gov.br/content/cedulasemoedas/cedulas_moedas_docs/material_apoio/cartilha_segunda_familia_real.pdf
- **Vale aprender:** cada cédula se distingue por **tamanho, cor e tema** (cartilha do BC). O numeral grande no canto é feito para quem enxerga pouco, e o fundo de linhas finas (guilhoché) é sinal de "documento de valor". Daí saem a ideia de **tingir os modos** com uma cor de apoio cada (diarista, doméstico, autônomo) e uma textura de linhas finas, discreta, só no recibo.
- **Não tirar:** imagens das cédulas (reproduzir cédula tem regra própria do BC; usar só a ideia).

**17. Manual de uso da marca Pix (Banco Central)** [texto]
https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/I_manual_uso_marca_pix.pdf
- **Vale aprender:** regra para a Fase 3 (Pix copia-e-cola): o manual diz que a marca "não deve ser redesenhada" e que só se usam os arquivos originais. A versão em vigor é a 1.6 (IN BCB 632/2025); o PDF do link é a 1.5. Conferir antes de usar.

**18. Máquina de somar com fita (bobina)** [texto + memória]
https://en.wikipedia.org/wiki/Adding_machine
- **Vale aprender:** a fita impressa linha a linha com o resultado embaixo é o "mostrar a conta" mais antigo que existe, e muita gente mais velha a conhece do comércio. A página confirma a impressão em fita de papel.
- **Memória, não verificado:** a fita bicolor com negativos em vermelho. A página não fala disso.

### Resumo por tema

| Tema | Melhores referências |
|---|---|
| Mostrar a conta | 11 Soulver, 2 Summary list, 18 fita de somar |
| Tabela no celular | 4 USWDS, 5 NN/g, 1 gov.br |
| Número do resultado | 6 Nu Sans (tabular, sem pular), 8 Wise (número herói) |
| Confiança sem frieza | 1 gov.br, 15 Carteira de Trabalho, 14 talão de recibo |
| Navegação inferior | 13 Material 3, 10 Organizze/Mobills |
| O que evitar | 12 Calculadora do Cidadão, 7 Nubank (roxo), 8 Wise (limão) |

---

## 3. Como as direções foram escolhidas

Listei 7 estruturas possíveis para a tela de resultado: 1 talão de recibo, 2 caderneta pautada, 3 formulário de serviço público, 4 fita de somadora, 5 visor de número grande, 6 extrato bancário, 7 cartão de ponto semanal. Um sorteio (`random.sample`) deu **6, 4 e 3**. O próprio assunto (pagar alguém e guardar comprovante) sugere a **1, talão de recibo**, que entrou como quarta candidata.

- **6, extrato bancário:** saiu. Era exatamente o "banco frio" que o público não quer, e falhou no teste da troca (serve para qualquer app de dinheiro).
- **4, fita de somadora**, **3, formulário de serviço público** e **1, talão de recibo**: ficaram. Cada uma tem nome, material e momento marcante tirados do assunto.

**Teste da troca** (trocando o assunto, a direção ainda serviria?): o talão só faz sentido para pagamento entre pessoas; a carteira azul só faz sentido para trabalho e lei trabalhista. A fita de somadora serviria a qualquer calculadora, então é a mais fraca das três nesse teste. Ficou porque é a única que transforma o "mostrar a conta" no visual inteiro.

**Fontes:** todos os pares estão no Google Fonts (conferido em 20/11/2026 pela API css2, arquivos woff2 baixados no rascunho só para medir). Depois serão hospedadas localmente, sem chamar o Google, como pede o plano (6.7). O suporte a dígitos tabulares (`tnum`) foi medido com fontTools nos arquivos servidos.

**Contraste:** medido com a fórmula WCAG 2.x (script em Python no rascunho da sessão). Texto ≥ 4,5:1 sobre o fundo **e** sobre a superfície; bordas e filetes que precisam ser vistos ≥ 3:1.

---

## 4. As 3 direções

### Direção 1: "Talão e carimbo"

**Ideia:** o app é um bloco de recibos bem impresso. O resultado aparece como um recibo preenchido. O que **você digitou** fica em azul de caneta; o que **o app calculou** fica em preto de impressão. A data de conferência das leis é um **carimbo** ("CONFERIDO 20/11/2026"), e o alerta de vínculo é um carimbo vermelho.

- **Material e luz:** papel branco levemente esverdeado, filetes verdes de talão, picote (linha tracejada) separando "Você paga" de "Ela recebe" como um canhoto. Sem sombra: o papel é plano e o que separa é o filete.
- **Momento marcante:** ao salvar ou compartilhar, o resumo "destaca no picote" (uma animação curta de 200 ms, desligada com "menos animação") e vira o canhoto na lista de Salvos.
- **O que não entra:** letra cursiva falsa, papel amarelado envelhecido, textura de papel em foto, ícones de carimbo em todo canto. O carimbo é só para a data de conferência e para os alertas.
- **Sustentado por:** 14 talão, 2 Summary list, 11 Soulver, 16 cédulas (filete fino), 6 Nu Sans (números que não pulam).

**Fontes:** **Barlow Condensed** 600/700 (títulos, rótulos curtos de campo, número grande do resultado: é a grotesca estreita das gráficas rápidas) + **Barlow** 400/500/600 (texto, campos, tabela). As duas têm `tnum`, mas os dígitos **não** são tabulares por padrão: ligar `font-variant-numeric: tabular-nums` em todo valor.

**Tokens (contraste medido):**

| Token | Claro | Escuro | Uso | Contraste claro (fundo/superfície) | Contraste escuro |
|---|---|---|---|---|---|
| `--fundo` | #F6F7F2 | #121613 | página | | |
| `--papel` | #FFFFFF | #1A201C | recibo, cartões | | |
| `--tinta` | #1C2320 | #E8EDE9 | texto, valores calculados | 14,88 / 16,02 | 15,41 / 13,98 |
| `--tinta-2` | #55605A | #A3AFA7 | rótulos, notas | 6,08 / 6,55 | 8,04 / 7,30 |
| `--talao` (primária) | #2E6B4E | #6FC79A | filetes de destaque, botões, links | 5,86 / 6,31 | 8,97 / 8,14 |
| texto sobre `--talao` | #FFFFFF | #0B1A12 | rótulo do botão | 6,31 | 8,81 |
| `--caneta` | #1F3F99 | #9DB5FF | valores digitados pela pessoa | 8,75 / 9,42 | 9,12 / 8,28 |
| `--carimbo` | #B42318 | #FF8A7A | alerta de vínculo e de mínimo | 6,11 / 6,57 | 7,97 / 7,23 |
| `--carimbo-fundo` | #FDF0EE | #2A1714 | fundo do alerta | carimbo sobre ele 5,91 | 7,45 |
| `--selo` | #5A3E9B | #C5B0FF | carimbo "conferido em" / "previsto" | 7,51 / 8,09 | 9,59 / 8,70 |
| `--ok` | #1E7B45 | #6CD49A | "acima do mínimo" | 4,91 sobre o fundo | 9,55 |
| `--aviso` texto/fundo | #5C4400 / #FFF3C4 | #F5D36B / #2B2410 | "não verificado", mudança de lei | 8,27 | 10,58 |
| `--filete` | #7E8A82 | #5E6D64 | bordas de campo, picote (não-texto) | 3,34 | 3,35 |

Uma primeira versão do filete claro (#8A968E) deu 2,85 e foi escurecida.

**Forma dos componentes:**
- Campo de dinheiro: rótulo pequeno em caixa-alta acima ("VALOR DA DIÁRIA"), "R$" fixo, valor em azul caneta, sublinhado de 2 px (como a linha do talão) em vez de caixa. Altura ≥ 48 px.
- Resultado: cartão-recibo com raio 4 px, borda de 1 px no tom do filete, número grande em Barlow Condensed 700 (40–48 px), valor por extenso embaixo, em letra pequena.
- Mostrar a conta: lista de duas colunas no estilo Soulver, com linha pontilhada guiando até o valor à direita e "Lei ↗" em cada linha.
- Chips de modo: retângulos de raio 4 px com borda; o ativo fica cheio em `--talao`.
- Barra inferior: 5 abas com rótulo sempre visível; a ativa ganha um filete de 3 px no topo, como a margem do talão.
- Ícones: uma família de traço (Lucide ou Tabler) com espessura 1,75.

**Risco:** pode virar **fantasia de papelaria** (picote e carimbo demais = enfeite) e parecer brincadeira num assunto de lei. Remédio: no máximo dois carimbos por tela e o picote só no resultado. A Barlow Condensed em caixa-alta, se usada em texto longo, cansa: usar só em rótulo de até 3 palavras.

---

### Direção 2: "Carteira azul"

**Ideia:** o app parece um documento trabalhista bem passado a limpo: a capa azul-marinho da Carteira de Trabalho no topo, páginas internas claras com campos rotulados e "anotações". É a direção mais séria e a mais próxima do que o público associa a lei e registro, **sem** usar a marca nem o azul do gov.br.

- **Material e luz:** página branca com fundo azulado muito claro, como o fundo de segurança; barra superior azul-marinho cheia; cantos quase retos.
- **Momento marcante:** o alerta de vínculo aparece como uma **"anotação"** na página ("Atenção: 3 dias por semana na mesma casa pode ser emprego doméstico, LC 150 art. 1º"), com borda à esquerda e o número do artigo bem visível.
- **O que não entra:** brasão, marca gov.br, azul #1351B4, verde-amarelo de bandeira, qualquer coisa que faça parecer serviço oficial.
- **Sustentado por:** 15 Carteira de Trabalho, 1 gov.br (estrutura, não marca), 2 Summary list, 4 USWDS e 5 NN/g (tabelas), 12 BCB (o oposto do que fazer).

**Fontes:** **Libre Franklin** 700/800 (títulos: grotesca de jornal e documento, com peso para segurar a barra marinho) + **Noto Sans** 400/600 (texto e todos os valores). Medido: a Noto Sans já traz dígitos tabulares por padrão; a Libre Franklin **não tem `tnum`** no arquivo do Google Fonts, então nunca usá-la para valores em coluna.

**Tokens (contraste medido):**

| Token | Claro | Escuro | Uso | Contraste claro (fundo/superfície) | Contraste escuro |
|---|---|---|---|---|---|
| `--fundo` | #FFFFFF | #0D1522 | página | | |
| `--pagina` | #F2F6F9 | #152033 | blocos, linhas alternadas | | |
| `--tinta` | #0F1B2D | #E6ECF4 | texto | 17,28 / 15,91 | 15,40 / 13,74 |
| `--tinta-2` | #4A5A6E | #9EADC2 | rótulos | 7,05 / 6,49 | 8,03 / 7,16 |
| `--capa` | #1D2F55 | (#152033 + borda) | barra superior, títulos | 13,21 / 12,15; branco sobre ela 13,21 | |
| `--acao` | #1F5FAD | #8FB4FF | botões, links | 6,37 / 5,86; sobre #E8F0FA 5,54 | 8,84 / 7,88; texto #0D1522 sobre ela 8,84 |
| `--ok` | #1E7B45 | #6CD49A | dentro da lei | 5,28 / 4,86 | 10,04 / 8,96 |
| `--alerta` | #A4330F | #FF9C7A | vínculo, abaixo do mínimo | 6,87 / 6,32 | 8,97 / 8,00 |
| `--aviso` texto/fundo | #5C4400 / #FFF4CC | #F5D36B / #2B2410 | "previsto", "não verificado" | 8,35 | 10,58 |
| `--borda` | #7D8DA1 | #5B6E8A | borda de campo (não-texto) | 3,39 | 3,52 |

**Forma dos componentes:**
- Campos em caixa com borda de 1 px e raio 2 px, rótulo acima em negrito, dica embaixo. É o formato de formulário que o público conhece do gov.br.
- Resultado e mostrar a conta: **lista de resumo** (rótulo à esquerda, valor à direita, "Lei ↗" como ação da linha), agrupada em blocos com título: "Você paga por mês", "Ela recebe", "Guia DAE".
- Tabelas: primeira coluna e cabeçalho congelados, valores à direita, linhas alternadas em `--pagina`; em 360 px, empilhar com o rótulo repetido.
- Barra inferior branca com borda superior; a aba ativa fica em `--capa` com um indicador em pílula (o padrão Material que o público Android conhece).
- Sem sombras; a separação vem da borda e do fundo `--pagina`.

**Risco:** é a direção que mais pode parecer **repartição**, fria e burocrática, que é o contrário de "sem banco frio". Há também o risco de ser confundida com serviço oficial. Remédio: linguagem simples e calorosa nos textos, ilustrações nenhuma, e um aviso fixo de que o app não é do governo. Visualmente é a mais "segura" e, por isso, a menos memorável.

---

### Direção 3: "Bobina da somadora"

**Ideia:** a tela é uma fita de máquina de somar. Cada entrada e cada conta vira uma linha impressa, e o total aparece embaixo, separado por traço duplo. Os descontos (INSS, IR, a parte da pessoa) saem em vermelho, como numa fita bicolor. O botão principal é uma "tecla" amarela.

- **Material e luz:** fundo cinza-papel frio, fita branca estreita no centro (largura máxima de cerca de 480 px mesmo no computador), picote nas pontas da fita. Contraste alto, quase preto e branco.
- **Momento marcante:** ao mudar um valor, as linhas afetadas da fita **"reimprimem"** (troca do número com um deslize curto de 120 ms, desligado com "menos animação") e o total se ajusta embaixo.
- **O que não entra:** imitação de máquina antiga (teclas 3D, metal, sépia), fonte de impressora matricial pixelada, som de impressão.
- **Sustentado por:** 18 fita de somar, 11 Soulver, 6 Nu Sans (números estáveis), 8 Wise (número herói), 4 USWDS (alinhamento à direita).

**Fontes:** **Red Hat Mono** 500/700 (só os números da fita e o total: os dígitos têm largura igual por natureza) + **Red Hat Text** 400/500/700 (texto, rótulos, navegação; tem `tnum`). São da mesma família, então combinam sem esforço.

**Tokens (contraste medido):**

| Token | Claro | Escuro | Uso | Contraste claro (fundo/fita) | Contraste escuro |
|---|---|---|---|---|---|
| `--fundo` | #F1F1EE | #0F0F0F | atrás da fita | | |
| `--fita` | #FFFFFF | #1A1A1A | a fita | | |
| `--tinta` | #161616 | #EDEDED | números e texto | 15,99 / 18,10 | 16,37 / 14,87 |
| `--tinta-2` | #595959 | #A8A8A8 | rótulos das linhas | 6,19 / 7,00 | 8,06 / 7,32 |
| `--vermelho` | #B3122A | #FF7A7A | descontos, alerta | 6,11 / 6,92 | 7,59 / 6,89 |
| `--total` | #1D3FBF | #9DB1FF | total, links | 7,38 / 8,35 | 9,28 / 8,43 |
| `--tecla` + texto | #F2B705 + #161616 | igual | botão principal | 9,95 | 9,95 |
| `--ok` | #1E7B45 | #6CD49A | dentro da lei | 4,67 sobre o fundo | 9,55 sobre a fita |
| `--aviso` texto/fundo | #5C4400 / #FFF3C4 | #F5D36B / #2B2410 | previsto, não verificado | 8,27 | 10,58 |
| `--picote` | #767676 | #6B6B6B | picote e filetes (não-texto) | 4,54 | 3,27 |

**Forma dos componentes:**
- Campos como linhas da fita: rótulo à esquerda, valor à direita em mono, toque abre a edição na própria linha. Altura ≥ 48 px.
- Resultado: traço duplo e total em Red Hat Mono 700 (44 px); embaixo, "Você paga" e "Ela recebe" como dois subtotais.
- Mostrar a conta: já é a própria fita; o "Lei ↗" vira uma nota pequena embaixo de cada linha.
- Chips de modo: retângulos sem raio, borda de 1,5 px; o ativo fica invertido (preto, ou branco no tema escuro).
- Barra inferior: fundo `--fita`, rótulos em Red Hat Text 500; a aba ativa fica sublinhada em `--total`.

**Risco:** é a mais ousada e a que pode parecer **fria e técnica** (mono e preto e branco), justamente para idosos. Vermelho nos descontos pode soar como "erro" ou "dívida" e assustar quem paga corretamente. A fita estreita também desperdiça a tela no computador. Ela passa no teste da troca só pela metade.

---

## 5. Comparação e recomendação

| Critério | 1 Talão e carimbo | 2 Carteira azul | 3 Bobina da somadora |
|---|---|---|---|
| Passa confiança (dinheiro e lei) | alta | muito alta | média |
| Calor humano, sem "banco frio" | alta | baixa | baixa |
| Sem cara de IA (teste da troca) | passa | passa | passa pela metade |
| Leitura para idosos | boa (Barlow, números grandes) | muito boa | média (mono) |
| Casa com o recibo da Fase 2 | perfeita | boa | fraca |
| Risco principal | virar enfeite de papelaria | parecer repartição ou oficial | parecer técnica e assustar com o vermelho |

**Recomendação: Direção 1, "Talão e carimbo".** É a única que junta confiança e calor. Ela já desenha o recibo da Fase 2 e dá uma diferença clara entre "o que eu digitei" (caneta) e "o que o app calculou" (impresso), que é o centro do "mostrar a conta". Da Direção 2, convém levar a lista de resumo para as tabelas e as leis.

---

## 6. Próximo passo

1. O dono escolhe a direção (ou pede outra).
2. Com a escolha: completar a prancha com imagens reais de licença aberta (fotos de talão, carteira de trabalho e fita de somar, que hoje são referências **fracas**: só texto ou memória), gravar `DESIGN.md` com os tokens acima e gerar a **tela-chave** (Calcular, modo Doméstico, com o resultado e o "mostrar a conta" abertos) para aprovação antes de qualquer código.
3. Pedido ao dono, se possível: 3 a 5 fotos ou prints de apps e papéis de que ele gosta (um talão de recibo, o app do banco dele), para firmar as referências fracas.
