# Tabela de Ganhos

Quanto custa pagar alguém por hora, por dia ou por mês no Brasil, com a conta aberta e o link da lei. Grátis, sem cadastro, em português, e funciona sem internet depois da primeira abertura.

## O que o app faz

- **Calcular** (abre direto aqui): três modos.
  - **Por hora:** valor por hora × horas por dia × dias do mês (contados no calendário de verdade ou pelo total de dias), e o contrário: "quanto posso pagar" com um orçamento.
  - **Diarista:** custo no mês, média por mês e por ano, aviso quando o número de dias pode virar vínculo de emprego doméstico, e o que a diarista pode recolher (INSS ou MEI).
  - **Doméstico:** salário, encargos do eSocial (guia DAE e vencimento), líquido de quem recebe, custo por ano e quanto guardar por mês para 13º e férias. Usa o piso do estado quando ele é maior que o mínimo.
  - "Não sei qual é o meu": um questionário curto que indica o modo.
  - Cada resultado mostra "Mostrar a conta", passo a passo, com o link da lei. Dá para salvar, compartilhar (link só com números), copiar e imprimir.
- **Tabela:** comparação do mês (dias × horas × valores por hora, com o mínimo legal), salário mínimo, pisos estaduais do doméstico, conversor (hora, dia, semana, mês, ano) e as tabelas oficiais (INSS, IR, encargos). Tocar num valor leva os números para a calculadora.
- **Salvos:** os cálculos guardados neste aparelho, com busca, etiquetas, fixar, duplicar, compartilhar, backup em arquivo (JSON), planilha (CSV) e restauração.
- **Leis:** resumos simples (jornada, DSR, doméstico ou diarista, DAE, 13º, férias e outros), glossário, perguntas frequentes, calendário de prazos e o que mudou. A busca também acha os seus salvos.
- **Mais:** aparência (três visuais, tema claro ou escuro, letra grande, alto contraste, menos animação), estado e piso, padrões da calculadora, arredondamento, data das contas e valores da lei editáveis, backup, "apagar tudo", instalar como app e sobre.

**Visual padrão:** "Talão e carimbo" (A), o recomendado. Em Mais → Aparência dá para trocar para "Carteira azul" (B) ou "Bobina da somadora" (C); a troca vale para o app inteiro.

## Privacidade

- Não há servidor, cadastro, anúncio nem rastreador. O app é uma página estática.
- Tudo o que você digita e salva fica **só no seu aparelho** (IndexedDB do navegador). Nada é enviado pela rede.
- O app não carrega nada de fora: fontes, ícones e código vêm do próprio site, e a política de segurança (CSP) do `index.html` bloqueia qualquer outro endereço.
- O link de compartilhar leva só números (modo, valores, dias e data), nunca título, notas ou nomes.
- Se você limpar os dados do navegador ou trocar de aparelho sem backup, os salvos se perdem. Use **Salvos → Fazer backup** de vez em quando.

## Como usar

Abra o endereço do GitHub Pages no celular. Para instalar: no Android (Chrome), toque em "Instalar o app" ou no menu ⋮ → "Instalar app"; no iPhone (Safari), toque em Compartilhar → "Adicionar à Tela de Início". Depois da primeira abertura, o app funciona sem internet. Quando sair uma versão nova, aparece o aviso "Nova versão disponível" com o botão "Atualizar".

## Para quem mexe no código

HTML, CSS e JavaScript puros, com módulos ES nativos. Não há build nem dependências.

```sh
node --test testes/                                  # motor, dados, PWA (Node 22 ou mais novo)
python3 -m http.server 8800 --bind 127.0.0.1         # abra http://127.0.0.1:8800/
```

- `js/motor/` e `dados/parametros.js`: as contas e os valores da lei, com data de vigência e fonte (veja `docs/MOTOR.md`).
- `js/telas/`: uma tela por arquivo; `js/ui/`: componentes; `js/dados/`: configuração e armazenamento; `css/`: tokens dos três visuais, base, componentes e um CSS por tela (veja `docs/ARQUITETURA-UI.md`).
- `sw.js`: guarda todos os arquivos do app para uso sem internet. Ao criar um arquivo novo, ponha-o na lista `FILES` (o teste `testes/pwa.test.mjs` avisa se faltar). Ao publicar, suba `VERSAO` no `sw.js` e `VERSAO_APP` em `js/dados/config.js` (os dois precisam ser iguais).
- Checagem automática de contraste, alvos de toque e rolagem lateral: abra o app com `?verificar=1` e veja o console. Para 360 ou 390 px no Chrome sem janela, use `testes/moldura.html` (instruções em `docs/ARQUITETURA-UI.md`, seção 12).
- Novidades da v2: `docs/MUDANCAS.md`. A versão antiga fica em `legado/index-v1.html`, só para consulta.

## Aviso legal

Estimativa educativa. Não substitui contador, advogado nem o eSocial. Este app não é do governo. Os valores da lei foram conferidos na data mostrada no topo do app; leis, pisos e convenções coletivas mudam, e a convenção coletiva da categoria pode valer mais que o piso usado aqui. Confira sempre na fonte oficial (cada conta traz o link) antes de decidir.
