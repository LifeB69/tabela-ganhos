# Pendências achadas pela interface no motor

Registro dos problemas que as telas encontram no motor. A interface **não muda o motor**: quem cuida do motor corrige e cobre com teste.
Formato: data (UTC) · onde · o que aparece · sugestão.

## Abertas

### 1. Português no alerta de salário abaixo do piso ou do mínimo
- **Resolvido em 2026-11-20 (UTC)** no motor, com teste em `testes/motor-textos.test.mjs`.
- **Data:** 2026-11-20 (UTC), na construção da estrutura da v2.
- **Onde:** `js/motor/alertas.js`, função `alertasSalarioMensal`, linha 76 (texto do alerta `abaixo_piso` / `abaixo_minimo`).
- **O que aparece na tela:** "R$ 1.621,00 fica abaixo **de o** piso de SP: R$ 1.874,36 por mês." (e "abaixo **de o** salário mínimo").
- **Como reproduzir:** `calcularDomestico({ salario: '1.621,00', uf: 'SP' }, '2026-11-20').alertas` → alerta `abaixo_piso`.
- **Sugestão:** montar o nome já com a contração: `nome = piso.origem === 'piso_uf' ? \`do piso de ${piso.uf}\` : 'do salário mínimo'` e o texto `fica abaixo ${nome}`. Conferir se algum teste compara esse texto.
- **Impacto:** só texto; os valores estão certos.

### 2. Diarista: passo "sem direitos" entra também com 3 dias ou mais na mesma casa
- **Resolvido em 2026-11-20 (UTC)** no motor, com teste em `testes/motor-textos.test.mjs`.
- **Data:** 2026-11-20 (UTC), revisão da Fase 1.
- **Onde:** `js/motor/diarista.js`, linhas 112-116 (passo `sem_direitos_clt`).
- **O que aparece na tela:** com 3 dias por semana na mesma casa, "Mostrar a conta" traz "Sem 13º, férias, DSR, FGTS e vale-transporte — R$ 0,00" logo abaixo do alerta "Pode ser emprego doméstico". A tela se contradiz.
- **Como reproduzir:** `calcularDiarista({ valorDiaria: '200,00', diasDaSemana: [1, 3, 5], mes: '2026-11', mesmaResidencia: true }, '2026-11-20').passos` tem `sem_direitos_clt`.
- **Sugestão:** gerar esse passo só quando `diasSemana < vinculo_domestico.dias_semana_a_partir_de` (ou quando `mesmaResidencia === false`). A partir de 3 dias, trocar por um passo sem valor, por exemplo "Direitos dependem do enquadramento: com 3 dias ou mais na mesma casa pode ser emprego doméstico; veja o modo Doméstico".
- **O que a interface já fez:** a nota do texto compartilhado (WhatsApp, copiar) agora avisa do risco de vínculo a partir de 3 dias, em vez de "sem 13º, férias nem FGTS".

### 3. Alerta de mudança de jornada com números e datas fixos no texto
- **Resolvido em 2026-11-20 (UTC)** no motor, com teste em `testes/motor-textos.test.mjs`.
- **Data:** 2026-11-20 (UTC), revisão da Fase 1.
- **Onde:** `js/motor/alertas.js`, `alertasMudancaJornada`, linhas 95-103.
- **O que aparece:** o divisor vem de `horas === 42 ? 210 : 200`, o texto diz "Há quem conte a data a partir de 17/12/2026" e o alerta da liminar diz sempre "A data de 16/12/2026 segue a liminar...". Se a pessoa muda a data da jornada em Mais (por exemplo, para 17/12/2026), o alerta continua dizendo 16/12/2026. No modo Por hora (sem vínculo, `porHora.js:69`) aparece "O salário mensal não pode ser reduzido", regra que só vale para empregado.
- **Sugestão:** ler o divisor com `getParam('divisor_hora', d, overrides)`; usar `formatarDataBR(datas.jornada_42)` no texto da liminar; só citar "17/12/2026" quando a data em uso for a oficial; no Por hora sem vínculo, não chamar o alerta ou trocar o texto por um aviso só de referência (a jornada muda o mínimo por hora, não o contrato de quem presta serviço).

### 4. Piso do PR: data de início sem fonte oficial
- **Data:** 2026-11-20 (UTC), revisão da Fase 1.
- **Onde:** `dados/parametros.js`, `piso_domestico_PR` (`vigente_desde: '2026-01-01'`, `status: 'vigente'`).
- **O que falta:** a notícia do Governo do PR de 19/01/2026 (a fonte citada) traz os 4 grupos e "válidos até 31 de dezembro", mas não traz a data de início, o número do decreto nem cita domésticos. Uma busca em 20/11/2026 achou só fonte secundária (site de consultoria) falando em "Decreto 13.182" e efeitos desde 01/01/2026. Não conferido no DOE-PR.
- **Sugestão:** conferir o decreto estadual publicado (número, data de vigência e se cita domésticos) e trocar a fonte pela publicação oficial. Se não der, marcar a vigência como não confirmada nos dados.
- **O que a interface já fez:** Tabela, Mais e "O que mudou" mostram o piso do PR com "data de início não confirmada" (não mexe no dado nem na conta); a nota de Mais → Local diz que o grupo e a data do PR não foram confirmados em fonte oficial.

### 5. `horaMinima` e `pisoDomestico` devolvem null antes da primeira vigência
- **Data:** 2026-11-20 (UTC), revisão da Fase 1.
- **Onde:** `js/motor/jornada.js:77` (`horaMinima`) e `pisoDomestico`; usados por `calcularPorHora` e `calcularDomestico`.
- **O que acontece:** com data antes de 05/10/1988, `calcularPorHora` e `calcularDomestico` lançam `TypeError: Cannot read properties of null (reading 'valor')`.
- **Sugestão:** devolver um erro claro ("Sem salário mínimo nesta data") ou um alerta `entrada_invalida`.
- **O que a interface já fez:** link compartilhado, salvos (também os de backup) e data fixa em Mais só aceitam datas de 01/01/2000 a 31/12/2099 (`dataNaFaixa` em `js/dados/config.js`). O link com data fora da faixa abre com "A data do link é inválida.".

## Observações (não são erro do motor)

- `js/motor/index.js` não reexporta `LIMITE_CENTAVOS` nem `formatarDataBR`. A interface importa `LIMITE_CENTAVOS` direto de `js/motor/dinheiro.js` e formata a data por conta própria. Se o motor quiser, pode reexportar os dois.

## Achados da tela Tabela (2026-11-20, UTC)

- **`proximasMudancas(data, limite)` não recebe overrides.** Se a pessoa mudar a data da jornada (`jornada_datas`) em Configurações, a lista "Próximas mudanças" continua com 16/12/2026 e 16/12/2027, enquanto `tabelaMinimo` e os cálculos já usam a data nova. `listarMudancasFuturas(data, limite, overrides)` aceita overrides; sugestão: `proximasMudancas(dataISO, limiteISO = null, opcoes = {})` repassar `opcoes.overrides`. Impacto: só a lista informativa.
- **`listarMudancasFuturas` devolve `valor_atual: null` quando a vigência anterior é `previsto`** (ex.: limite do MEI de 2028, cuja anterior é a prevista de 2027). A tela mostra "Passa a R$ 140.000,00" nesse caso. Não é erro de conta; registro para quem quiser mostrar "de R$ 110.000,00 (previsto)".

## Achados da tela Mais (2026-11-20, UTC)

- **Override do piso do PR não tem efeito.** `getParam('piso_domestico_PR', d, { piso_domestico_PR: X })` troca `valor`, mas `pisoDomestico` usa `p.grupos[grupo]`, que vem da vigência oficial. Um valor editado para o PR seria ignorado sem aviso. A tela Mais não oferece edição do PR por isso. Sugestão: aceitar `overrides.piso_domestico_PR_<grupo>` ou fazer `pisoDomestico` preferir `p.valor` quando `p.editado_por_usuario`.
- **Salário mínimo não pode ser editado pela config.** O `valor` é um objeto (`{ mensal, diario, horario }`) e a config só guarda overrides numéricos; um override numérico em `salario_minimo` quebraria `obterMinimo` (`p.valor.mensal` vira `undefined`). A tela mostra o mínimo só para leitura. Se o dono quiser editar, o motor precisa aceitar algo como `overrides.salario_minimo_mensal`.
- **Opções "não verificado" ligáveis não existem no motor.** `config.opcoesNaoVerificadas` não é lido por nenhuma função do motor, e os itens `nao_verificado` (`dobro_domingo_clt`, `dae_13_vencimento`, `piso_domestico_RJ`) não têm chave para entrar na conta. A tela Mais lista esses pontos com o selo "Não verificado" e "Fora das contas (desligado)", sem interruptor, para não oferecer um botão que não muda nada. O domingo em dobro do CLT depende do modo CLT (fora da Fase 1).
