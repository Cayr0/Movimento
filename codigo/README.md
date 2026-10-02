# Controle de Empréstimos (app de celular)

- `src/app.html`: código do app (HTML, CSS e JS num arquivo só).
- `build.mjs`: `node build.mjs` gera `dist/`, a versão instalável (PWA: manifest, service worker para funcionar offline, ícones).
- `dist/`: é a pasta que vai para a hospedagem (ex.: GitHub Pages).

## Dados
Banco local IndexedDB `controle-emprestimos`, guardado como histórico de movimentações que nunca é apagado nem alterado:
- store `movimentacoes` (id UUID, tipo, pessoaId, emprestimoId, dados, registradoEm, ordem, dispositivoId, sincronizado 0/1, versao).
- tipos atuais: `PESSOA_CRIADA`, `EMPRESTIMO_CRIADO`, `RECEBIMENTO` (dados: valorCentavos, perdaoCentavos, data; perdão abate a dívida sem contar como recebido). Quitação é derivada (saldo zero).
- store `meta`: dispositivoId, jurosPadrao, prazoPadrao, multaDiaPadraoCentavos, renovarJuros.
- Dinheiro sempre em centavos (inteiros). Dados do empréstimo: valorCentavos, jurosPct, jurosCentavos, totalPrevistoCentavos, multaDiaCentavos, vencimento.
O estado (empréstimos, pessoas) é recalculado lendo o log (`projetar`). Para sincronizar: enviar movimentações com `sincronizado = 0` e baixar as de outros dispositivos pelo id.

## Cálculo
juros (R$) = arredonda(valor × juros% / 100); se o valor dos juros for digitado, o juros% passa a ser juros ÷ valor. Total previsto = valor + juros. Vencimento = data do empréstimo + prazo (dias).
Atraso: para cada dia depois do vencimento soma o "valor por dia vencido" do empréstimo (padrão R$ 1,00, ajustável em Ajustes e por empréstimo). Total a receber hoje = total previsto + dias vencidos × valor por dia.
Recebimentos parciais (função `extrato`, dia a dia): cada recebimento abate primeiro a diária de atraso, depois os juros, depois o valor emprestado. Se o empréstimo tem `renovarJuros` (padrão sim, escolha do Vinicius), no dia seguinte a cada vencimento sem quitação entram novos juros (mesma %) sobre valor + juros em aberto (sem a diária), e o próximo vencimento anda um prazo. A diária conta desde o vencimento original até quitar.

## Parcelado
Empréstimo com `modalidade: 'parcelado'`: numeroParcelas, valorParcelaCentavos, primeiraParcela (as demais vencem todo mês no mesmo dia, `somarMeses`). Juros simples ao mês (padrão de Ajustes, editável; ou digita a parcela e os juros se ajustam): total = valor × (1 + juros% × parcelas); centavos de arredondamento vão na última parcela (`ajusteUltimaCentavos`). Sem renovação de juros. Cada parcela vencida e não paga soma o valor por dia (diária por parcela, escolha do Vinicius). Recebimentos e perdões quitam a parcela mais antiga em aberto (função `extratoParcelado`).

## Parcelar dívida
Num empréstimo de pagamento único em aberto, "Parcelar dívida" grava `DIVIDA_PARCELADA` no empréstimo antigo (data, saldo, novoEmprestimoId), que passa a aparecer como "Parcelado" com saldo zero, e cria um novo empréstimo parcelado com `origemEmprestimoId` e valor = saldo do dia. Os juros do parcelamento são escolhidos na hora (sem juros, padrão ou qualquer %).

Observações: campo opcional `observacoes` no empréstimo (accordion no cadastro).

## Telas
Início (totais: total emprestado sem contar parcelamentos de dívida, operações dos últimos 30 dias, a receber no mês incluindo atrasados; últimos 5 empréstimos), Empréstimos (por pessoa, com busca), Histórico (filtros por tipo, período e pessoa; "A receber no mês" lista os vencimentos), Ajustes.

## Segurança
PIN de 4 a 6 números (meta `seguranca`: salt + hash PBKDF2-SHA256, tamanho, digitalId). Pede o PIN ao abrir e ao voltar depois de 1 minuto em segundo plano; 5 erros seguidos travam por 30 s. Digital/rosto via WebAuthn (autenticador do próprio aparelho), só como atalho: o PIN continua valendo. O PIN bloqueia a tela; os dados no IndexedDB não são criptografados.

## Editar e excluir
No fim do detalhe do empréstimo há links discretos "Editar empréstimo · Excluir empréstimo"; cada recebimento no histórico tem um "excluir" pequeno. Editar reabre o formulário preenchido e grava `EMPRESTIMO_EDITADO` (os novos dados substituem os anteriores na projeção, recebimentos mantidos). Excluir pede confirmação e depois PIN/digital (sem PIN configurado, só a confirmação) e grava `EMPRESTIMO_EXCLUIDO` ou `RECEBIMENTO_EXCLUIDO`. Nada é apagado do log. Excluir um parcelamento reabre a dívida original; um empréstimo renegociado só pode ser editado/excluído depois de excluir o parcelamento que saiu dele.

## A receber hoje e CSV
Início mostra "A receber hoje" (o que vence hoje + tudo em atraso; parcelas atrasadas somadas por empréstimo) com as listas "Pagam hoje" e "Em atraso" (liga/desliga em Ajustes, chave `hoje` em `telaInicial`). Histórico tem "Exportar CSV" do que está filtrado: ponto e vírgula, vírgula decimal, datas dd/mm/aaaa, BOM UTF-8 (abre direto no Excel). Na prévia do claude.ai o CSV é copiado, porque lá não dá para baixar arquivos.

## Conta Google e backup no Drive
Cada pessoa entra com a própria conta Google (Google Identity Services, token no navegador, sem servidor). Escopo `drive.file openid email`: o app só vê o arquivo que ele criou, "Controle de Empréstimos - backup.json" (achado por `appProperties.app = controle-emprestimos`). Sincronizar = baixar o arquivo, acrescentar no celular as movimentações que faltam (add, nunca sobrescreve), subir a união e marcar `sincronizado=1`. Roda logo depois de cada lançamento (o toque ainda vale se o Google precisar renovar o acesso), em Ajustes › "Fazer backup agora" e pelo aviso discreto no Início quando há lançamentos fora do backup há mais de 1 dia. Celular novo: "Já usa o app? Entrar com Google e recuperar" na tela vazia. "Esqueci o PIN" na tela de bloqueio confirma pela mesma conta Google e remove o PIN.
Config: `config.json` com `{ "googleClientId": "..." }` (público) é injetado por `build.mjs` como `window.__CONFIG__`. Sem ele, os botões do Google não aparecem. Passo a passo em PUBLICAR.md.
