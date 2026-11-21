# Robô de valores

Todo dia, um robô no GitHub confere as fontes oficiais. Quando um valor novo está confirmado e todos os testes passam, ele publica sozinho na `main`, e o app passa a usar o valor na data certa. Quando algo não bate, ele não muda nada e abre uma issue com o rótulo `robô`.

**Regra do não sei:** nada entra na conta sem confirmação numa fonte oficial. Uma projeção só aparece com o selo "Previsto" e fica fora da conta.

## O que ele aplica sozinho

| Valor | Fonte | Quando aplica |
|---|---|---|
| **Salário mínimo** (mês, dia e hora) | Texto do decreto no site do Planalto. O robô procura no quadro de decretos do ano (`_ato2023-2026/AAAA/decreto/_decretosAAAA.htm`; de 2027 em diante a pasta é `_ato2027-2030`) a ementa com "salário mínimo". A conferência é feita na [série 1619 do Banco Central](https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados?formato=json). | Aplica quando leu o decreto. Se o Banco Central já tiver o ano novo, os dois valores precisam bater. Só lê a redação em vigor: texto tachado (redação revogada) e parágrafos "(Revogado…)" ficam de fora; se sobrar mais de uma frase "o salário mínimo será de R$", abre issue e não aplica. Decreto com "Redação dada pelo…", "Retificação" ou "(Vide…)" só entra quando o Banco Central já tiver o ano e bater. Só aceita texto de `https://www.planalto.gov.br/ccivil_03/_ato…/`: link ou redirecionamento para outro servidor abre issue e não aplica. Quando só o Banco Central tem o valor, aplica só o mensal: diário e hora ficam sem número (`null`) e o app mostra os dois como "conta do app" (mensal ÷ 30 e mensal ÷ divisor), com aviso. O robô continua procurando o decreto e, quando o lê, troca pelos valores dele (ou abre issue, se o mensal não bater). Se as fontes divergirem, abre issue e não aplica. |
| **DAS do MEI** | 5% do mínimo + R$ 1 (ICMS) e/ou R$ 5 (ISS), LC 123, art. 18-A, §3º, V | Junto com o mínimo que o robô aplicou. |
| **Autônomo / facultativo** (`autonomo`) | Base mínima = mínimo e base máxima = teto do INSS. As alíquotas de 20%, 11% e 5% não mudam. | Só quando o mínimo **e** a tabela do INSS do ano já estão aplicados. Antes da portaria (que sai por volta de 9/1), o app continua com a vigência do ano anterior: o robô não grava teto velho como se fosse do ano novo. |
| **Retenção do autônomo por empresa** | Teto do INSS | Junto com a tabela nova do INSS. |
| **INSS do empregado** (faixas e teto) | [Tabela de contribuição mensal do INSS](https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal) | Só quando os valores da página mudaram e tudo isto vale: as 4 alíquotas continuam 7,5/9/12/14, as faixas são crescentes e sem buraco, a 1ª faixa é igual ao mínimo oficial do mesmo ano (que já precisa estar aplicado) e o teto subiu entre 0% e 15%. Vale desde 1º de janeiro, porque a portaria sai por volta de 9/1 com efeito retroativo. Se alguma checagem falhar, abre issue. A 1ª faixa vem da portaria, nunca do decreto. |
| **Salário-família** | [Página do INSS](https://www.gov.br/inss/pt-br/direitos-e-deveres/salario-familia/valor-limite-para-direito-ao-salario-familia) | Linha nova "A partir de 01/01/AAAA", com cota e limite subindo entre 0% e 15%. |

## O que ele só prevê

Quando o IBGE divulga o INPC de novembro, o robô calcula a projeção do mínimo do ano seguinte pela regra da Lei 14.663/2023 e da Lei 15.077/2024. A fonte é o [SIDRA, tabela 1736, variável 2292](https://apisidra.ibge.gov.br/values/t/1736/n1/all/v/2292/p/last%201), o INPC acumulado em 12 meses. A conta é:

> mínimo atual × (1 + INPC de 12 meses até novembro) × (1 + PIB real de dois anos antes, limitado a 0,6%–2,5%), arredondado para o real de cima.

A mesma conta reproduz os mínimos de 2025 (R$ 1.518) e de 2026 (R$ 1.621). O robô grava o resultado como **previsto**, com a observação "PROJEÇÃO do robô, não é o valor oficial". O valor fica fora da conta. O PIB não é lido de nenhuma página: ele fica escrito à mão em `robo/config.js` (`PIB_REAL_PCT`; o de 2025 é 2,3%). Acrescente o PIB novo quando o IBGE divulgar, em março.

## O que ele só vigia

Estas fontes nunca são aplicadas sozinhas:

- IRRF: as páginas de tabelas da Receita (a do ano, a do ano seguinte, que hoje dá 404, e o índice);
- pisos estaduais de SP, RS, SC, PR e RJ (os links de `dados/parametros.js`).

O robô guarda um resumo de cada página: só o conteúdo principal, sem scripts, sem espaços repetidos e sem "Atualizado em …". O que fica guardado em `robo/estado.json` é o hash desse resumo. Se o hash mudar, ele abre uma issue com o link. A pessoa confere e atualiza `dados/parametros.js` à mão. Só contam como "conteúdo da página" as respostas 2xx e 404/410 (a página não existe). Erro de rede, página vazia e qualquer outro status (401, 403, 408, 429, 451, 5xx: bloqueio ou falha passageira, comum no gov.br para IPs de nuvem) viram erro em `robo/estado.json` e não mexem no hash, para não abrir issue nem fazer commit falso. As páginas do IRRF são guardadas com o ano na chave (`irrf_2026`, `irrf_2027`), para a virada do ano não parecer mudança.

### Mínimo mudando no meio do ano

O robô lê todos os meses da série 1619 do Banco Central, não só janeiro. Se algum mês de um ano que o app já tem diferir do valor que o app usa naquele mês, ele abre a issue "salário mínimo mudou no meio de AAAA", com o mês e os dois valores, e não aplica nada. Isso já aconteceu por medida provisória em fevereiro de 2020 (R$ 1.039 → R$ 1.045) e em maio de 2023 (R$ 1.302 → R$ 1.320). O quadro de medidas provisórias do Planalto não é vigiado: não consegui confirmar o endereço dele desta máquina (o Planalto recusou a conexão), e a série do Banco Central já mostra o valor de uma MP.

### Conferência por parâmetro

Antes de gravar, e de novo toda vez que o app abre (`mesclarAuto` em `dados/parametros.js`), cada vigência do robô passa por `problemasAuto`: fonte em `gov.br`, vigência em 1º de janeiro, mesmas chaves da vigência anterior, mínimo subindo até 15% (diário compatível com mensal ÷ 30, hora com mensal ÷ 220), INSS com 4 faixas crescentes de 7,5/9/12/14% e 1ª faixa igual ao mínimo do ano, teto subindo de 0% a 15%, DAS do MEI = 5% do mínimo do ano, autônomo com base mínima = mínimo e base máxima = teto do mesmo ano. O que não passa é ignorado pelo app; no robô, nada é gravado e abre issue. Se o mínimo de um ano cai, os valores derivados dele caem junto.

## Calendário aproximado

| Quando | O quê |
|---|---|
| ~10 de dezembro | O IBGE divulga o INPC de novembro, e o robô grava a projeção do mínimo |
| ~10 a 31 de dezembro | Sai o decreto do salário mínimo, e o robô aplica o mínimo, o DAS do MEI e a base do autônomo |
| início de janeiro (~9/1) | Sai a portaria do INSS, e o robô aplica as faixas, o teto, o salário-família e a retenção do autônomo |
| janeiro | Pisos de SC e PR (só vigia) |
| ~maio | Piso do RS (só vigia) |
| ~junho | Piso de SP (só vigia) |

## Arquivos

| Arquivo | O que é |
|---|---|
| `dados/parametros-auto.js` | O que o robô confirmou. `dados/parametros.js` mescla isso nas vigências escritas à mão. Uma vigência oficial escrita à mão nunca é trocada nem apagada. A do robô só substitui uma "previsto" ou "não verificado" de mesma data, e a vigência anterior termina na véspera. O selo "conferidos em" do app usa a data mais recente entre a conferência manual e a última atualização do robô. |
| `robo/estado.json` | Memória do robô: última execução, hashes das páginas, últimos valores lidos e erros. Ele só faz commit quando algo relevante muda, nunca só pela hora da execução. Se o último commit tiver mais de 45 dias, faz um commit de "batimento", porque o GitHub desliga o agendamento de repositório público depois de 60 dias sem atividade. |
| `robo/robo.js` | O robô (Node 22, sem dependências, `fetch` nativo). Usa o User-Agent `tabela-ganhos-robo (+https://github.com/LifeB69/tabela-ganhos)`, espera até 30 s e tenta 3 vezes. |
| `robo/config.js` | PIB, limites, endereços. |
| `.github/workflows/robo.yml` | Agenda: todo dia às 11:17 UTC, e também pelo botão "Run workflow". Roda o robô. Se ele achou algo, roda `node --test testes/` e, só se tudo passar, faz o commit como `tabela-ganhos-robo`. Se a `main` andou desde o início da rodada, refaz o commit em cima dela e roda os testes de novo antes do push (nunca publica uma combinação que não foi testada). Se os testes falharem, não publica e abre issue. Se o rebase der conflito, os testes falharem depois dele ou o push for recusado, abre a issue "não consegui publicar". Permissões: só `contents: write` e `issues: write`. |
| `testes/robo.test.mjs`, `testes/fixtures/robo/` | Testes com respostas gravadas: o decreto de 2026, um decreto de 2027 fictício, a série do Banco Central com e sem o ano novo, divergência entre fontes, INPC, a página do INSS de 2026 (real) e uma de 2027 fictícia, páginas quebradas ou vazias, erro de rede e derivados do MEI. |

## GitHub Pages

O workflow não tem `pages: write` e não pede publicação do Pages. Não sei se um push feito com o `GITHUB_TOKEN` dispara a publicação do Pages "a partir de um ramo" neste repositório; isso só dá para ver depois do primeiro commit do robô. Se o site não atualizar, a saída é um job separado, só com `pages: write` e `id-token: write`, usando `actions/deploy-pages` com versão fixa, sem o token que roda o robô.

## Datas

`gerado_em` fica em UTC e `gerado_em_brasilia` guarda a data de Brasília da rodada. O selo "conferidos em" usa a data de Brasília e nunca passa de hoje: uma rodada às 22:00 de 31/12 (Brasília) mostra 31/12, não 01/01.

## Rodar no computador

```sh
node robo/robo.js --seco        # lê as fontes de verdade e mostra o que faria; não grava nada nem abre issue
node robo/robo.js --simular     # o mesmo, com respostas gravadas (sem internet)
node robo/robo.js --fixtures testes/fixtures/robo/decreto-2027 --hoje 2026-12-28 --raiz /tmp/teste   # um cenário
```

Sem `GITHUB_TOKEN`, as issues só aparecem impressas na tela.

## Como desligar

- **Pausar:** no GitHub, vá em *Actions* → *Robô de valores* → *⋯* → *Disable workflow*. Para religar, use *Enable workflow*.
- **Desligar de vez:** apague `.github/workflows/robo.yml`.
- **Desfazer o que o robô aplicou:** volte `dados/parametros-auto.js` para `"vigencias": {}`. O app volta a usar só os valores escritos à mão.
- **Corrigir um valor:** escreva a vigência certa à mão em `dados/parametros.js`, com `status: 'vigente'`. A vigência manual sempre vence a do robô na mesma data.

## Limites conhecidos

- Em 21/11/2026, o site do Planalto fechou a conexão (ECONNRESET) quando o robô tentou acessá-lo desta máquina com o User-Agent dele. Não sei se o Planalto aceita conexões dos servidores do GitHub. Se não aceitar, o mínimo entra só pelo Banco Central (mensal oficial; diário e hora como conta do app), com a observação que diz isso.
- O diário do mínimo não tem regra fixa de arredondamento. Mensal ÷ 30 arredondado para cima reproduz 2025 e 2026, mas não 2017 (Decreto 8.948/2016: R$ 937 → R$ 31,23) nem 2020 (MP 919/2020: R$ 1.045 → R$ 34,83). Arredondado para o mais próximo erra 2026 (R$ 54,03 em vez de R$ 54,04). Por isso o robô só grava o diário que leu no decreto.
- Os quadros e o decreto de 2026 nos testes foram montados com o texto real, e não baixados.
- As páginas de piso do RS e do PR são notícias, e a do RJ é do LegisWeb (não é oficial). Por isso, o aviso de mudança nelas é só uma pista para conferir.

## O que o GitHub alcança (primeira execução, 21/11/2026 05:18 UTC)

| Fonte | Dos servidores do GitHub |
|---|---|
| Banco Central (série 1619 do salário mínimo) | funciona |
| IBGE (INPC) | funciona |
| Páginas dos pisos estaduais | funcionam |
| Planalto (texto do decreto) | recusa a conexão |
| gov.br: INSS, salário-família, Receita (IRRF) | recusa a conexão |

Consequências:
- O salário mínimo do ano novo entra pela série do Banco Central. O diário e o horário ficam com a conta do app (mensal ÷ 30 e mensal ÷ divisor), marcados "conta do app", até alguém ler o decreto.
- A tabela do INSS e o salário-família de janeiro **não** entram sozinhos pelo GitHub. Precisam ser lidos de uma máquina no Brasil (o robô roda igual em qualquer computador: `node robo/robo.js`) ou atualizados à mão.
- A publicação do GitHub Pages dispara sozinha depois do commit do robô (conferido: o commit `robô: estado das fontes` gerou a publicação).
