# O que mudou

## Versão 2.0.0 (20/11/2026, UTC)

A v1 era uma tabela só: quanto se paga por hora no mês, de 8 a 15 dias, de 1 a 6 horas por dia, a R$ 10, 12 e 15. A v2 é um app com cinco abas e as contas da lei.

### Novidades

- **Abre direto na calculadora**, com três modos: Por hora, Diarista e Doméstico.
  - Por hora conta os dias marcados no calendário do mês escolhido e responde também "quanto posso pagar" com um orçamento.
  - Diarista mostra o custo no mês e por ano, avisa quando o número de dias na mesma casa pode virar vínculo de emprego, e mostra o que a diarista pode recolher (INSS ou MEI).
  - Doméstico calcula a guia DAE com o vencimento, o líquido de quem recebe, o custo por ano e quanto guardar para 13º e férias. Usa o piso do estado quando é maior que o mínimo.
  - "Não sei qual é o meu": questionário curto que indica o modo.
  - "Mostrar a conta" com cada passo e o link da lei.
  - O resultado muda enquanto você digita, sem botão "Calcular".
- **Jornada automática pela data:** a mudança para 42 horas por semana (e depois 40) entra sozinha na data da lei, com aviso. O que ainda é previsto aparece com o selo "Previsto".
- **Tabela:** a comparação da v1 continua, agora com o mínimo legal, mais valores e faixas que você escolhe. Também traz o salário mínimo, os pisos estaduais, um conversor de salário e as tabelas oficiais (INSS, IR, encargos). Tocar num valor leva os números para a calculadora.
- **Salvos:** guarde cálculos com título, notas e etiquetas. Busca, fixar, duplicar, compartilhar, backup em arquivo, planilha (CSV) e restauração. Um lembrete sugere o backup quando há 5 ou mais salvos.
- **Leis:** resumos em português simples, glossário, perguntas frequentes, calendário de prazos (próximo DAE, 13º, mudanças) e "o que mudou". A busca também acha os seus salvos.
- **Mais (Configurações):** três visuais ("Talão e carimbo", o padrão recomendado; "Carteira azul"; "Bobina da somadora"), tema claro ou escuro, letra grande, alto contraste, menos animação, estado e piso, padrões, arredondamento (desligado por padrão), data das contas, valores da lei editáveis com "voltar ao oficial", backup e "apagar tudo".
- **Compartilhar:** link que abre o cálculo preenchido (leva só números), texto pronto para o WhatsApp, copiar e imprimir.
- **Funciona sem internet** depois da primeira abertura, e pode ser instalado na tela inicial. Quando sai uma versão nova, aparece "Nova versão disponível" com o botão "Atualizar".
- **Acessibilidade:** contraste AA nos três visuais, claros e escuros; alvos de toque de 44 px ou mais; foco visível; o leitor de tela fala o resultado; respeito a "reduzir movimento"; sem rolagem para o lado em 360 px.

### Correções da revisão (20/11/2026, UTC)

- **Foco do teclado não fica mais atrás da barra de abas:** a página rola até o campo com foco ficar acima das abas (e acima do resumo fixo, quando ele aparece).
- **Resultado à vista:** quando o resultado está mais abaixo, fora da tela, aparece acima das abas um resumo com o total ("Você paga por mês: R$ … · Ver conta"). Um toque leva ao resultado.
- **Leitor de tela:** além do total, fala os alertas de risco (ex.: "Atenção: salário abaixo do mínimo").
- **A calculadora volta no modo em que você estava** ao trocar de aba e voltar.
- **Salvar:** o título sugerido já vem escrito no campo; é só tocar em "Salvar" (ou trocar o texto).
- **Doméstico:** a opção do Estado sem escolha agora diz "Não informar" e cabe no campo.
- **Dias da semana em tela bem estreita** (320 px, letra grande): os botões quebram em 2 linhas para ficar com 44 px ou mais.
- **Visual "Carteira azul" claro:** o contorno de foco no cabeçalho azul-marinho ficou mais claro e visível.
- **Textos mais cuidadosos:** o questionário diz que, com 3 dias ou mais na mesma casa, "pode ser" emprego doméstico; o texto compartilhado da Diarista avisa desse risco a partir de 3 dias, em vez de dizer que não há 13º nem férias; "O que mudou" e Mais não dizem mais que todos os valores foram conferidos em fonte oficial; os pontos não verificados aparecem com texto para quem usa o app; o piso do PR aparece com "data de início não confirmada".
- **Configurações não se perdem** quando o armazenamento do aparelho demora para abrir: nada é gravado antes de a configuração guardada ser lida.
- **Sem internet, o app abre o app:** abrir outra página do site (como a v1 ou um documento) não troca mais a cópia guardada do app.
- **Backup alterado não quebra as contas:** só os valores que a tela Mais edita (pisos de SP, RS e SC, divisor e datas da jornada) são aceitos, com faixa de valor. Se uma tela falhar por causa de dado guardado, a mensagem não manda mais conferir a internet.
- **Restaurar "substituindo":** apagar e gravar acontecem juntos; um arquivo sem nenhum cálculo legível é recusado e os cálculos do aparelho ficam como estavam.
- **Links e salvos com data fora de 2000 a 2099** são recusados ("A data do link é inválida."), em vez de dar "Não deu para calcular".
- Um salvo sem valor não aparece mais como "R$ 0,00". Um link com modo inválido (ex.: `?modo=constructor`) não quebra a calculadora.
- Pontos do motor achados na revisão (passo "sem direitos" da Diarista com 3 dias ou mais, datas fixas no alerta da jornada, data de início do piso do PR, datas antes de 1988) estão em `docs/PENDENCIAS-UI.md`.

### O que continua igual

- Grátis, sem cadastro, sem anúncio e sem rastreador. Os dados ficam só no aparelho.
- O que a v1 guardou no aparelho (tema, valor por hora, horas por dia e a visão da tabela) é aproveitado na primeira abertura da v2.

### Limites conhecidos

- O app não conta feriados estaduais e municipais, nem Carnaval e Corpus Christi, no vencimento do DAE e nos dias do mês.
- Pontos que a pesquisa não conseguiu confirmar (domingo em dobro na CLT, vencimento do DAE do 13º, piso do RJ) aparecem marcados como "não verificado" e ficam fora das contas.
- Convenções coletivas não estão no app; quando existe uma para a categoria, ela pode valer mais que o piso usado aqui.
