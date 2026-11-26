# Rede Ritmo — material para avaliação

## Apresentação curta
A Rede Ritmo é uma rede fictícia de academias criada para o projeto avaliativo de No-Code e Low-Code do SENAI SC. A campanha permite solicitar uma aula experimental gratuita, escolher unidade e modalidade e informar quando se pretende começar. Os dados são validados e padronizados, os pedidos recebem prioridade automaticamente e ficam protegidos no Lovable Cloud. O encaminhamento externo depende de configurar e testar o destino da recepção; não há agendamento automático nem confirmação falsa.

## Funcionamento e arquitetura
Página única em português com identidade e fotografias oficiais. Formulário validado no navegador e no servidor. Registro em `trial_requests`, acessível ao responsável em Mais → Banco de dados → trial_requests. Visitantes não têm permissão de leitura, alteração ou exclusão dos dados armazenados.

Classificação calculada no registro:
- `esta-semana` → `quente` (laranja).
- `este-mes` → `morno` (âmbar).
- `pesquisando` → `frio` (azul).

## Regra de duplicidade
Cada WhatsApp normalizado pode ter uma única solicitação nesta campanha, independentemente da unidade ou modalidade. Normalização: apenas dígitos, prefixo 55, DDD e telefone. A restrição única no registro bloqueia inclusive cliques simultâneos e envios de navegadores diferentes. Um pedido pendente não deve ser reenviado pelo visitante; a equipe precisa concluir o encaminhamento da solicitação já registrada.

## Conectar a recepção com webhook
1. Criar um fluxo real no Make, n8n, Zapier ou ferramenta escolhida pela equipe, começando por um webhook POST HTTPS.
2. Guardar o endereço como segredo `RECEPTION_WEBHOOK_URL` nas configurações do projeto. Se o fluxo exigir um token Bearer, guardar `RECEPTION_WEBHOOK_TOKEN`. Nunca colocar segredos no código ou no formulário.
3. Criar três destinos no fluxo conforme `unidade`: `centro`, `estreito`, `sao-jose`. Cada destino deve entregar o pedido ao local usado pela recepção, por exemplo uma tabela ou CRM privado.
4. Destacar `classificacao = quente` na ferramenta da recepção e ordenar a fila por prioridade e data.
5. O webhook recebe `id`, `nome`, `email`, `whatsapp`, `unidade`, `modalidade`, `prazo`, `classificacao`, `data_solicitacao` e `consentimento`. O cabeçalho `Idempotency-Key` contém o id do pedido; o fluxo também deve impedir duplicatas por esse id.
6. Responder 2xx somente depois de registrar o pedido no destino. Uma resposta 2xx de mera aceitação sem processamento não comprova recebimento pela equipe. Não redirecionar. O servidor aguarda até 10 segundos.
7. Enviar um pedido fictício na página, conferir a execução do fluxo, ler o pedido na ferramenta da unidade e verificar `integration_status = delivered` no registro. Só então a tela mostra “Solicitação recebida!”.
8. Sem configuração ou em caso de falha, o pedido permanece registrado como `pending` ou `failed` e a página informa que o encaminhamento não foi confirmado. Não existe reenvio automático implementado; os pendentes exigem acompanhamento do responsável.
9. Publicar a versão atual após configurar a integração e repetir um teste no endereço publicado. A publicação ainda não foi realizada.

## Resultado dos testes realizados
17 testes automatizados passaram: classificação quente/morno/frio; e-mail inválido; unidade ausente; normalização; associação das três unidades; consentimento; nome mínimo e máximo; WhatsApp com DDD; modalidade e prazo obrigatórios; classificação manual ignorada; navegação inicial.

Testes na página real: escolha de Centro e São José pelos cartões; menu no celular; validação de campos vazios e e-mail inválido; envio fictício nas três unidades; registro com prioridades corretas; bloqueio de WhatsApp repetido; preservação dos campos. Os três registros fictícios foram removidos após conferência. Sem rolagem horizontal no celular e sem erros de execução detectados.

Pendente: recebimento externo pela recepção, porque nenhum destino foi fornecido. Não apresentar esse teste como aprovado. Não há e-mail de notificação configurado.

## Roteiro de vídeo — até 5 minutos
**0:00–0:40** Apresentar a campanha, explicar que é uma academia fictícia e mostrar identidade oficial.

**0:40–1:15** Percorrer modalidades, unidades e etapas. Escolher Centro e mostrar o campo preenchido.

**1:15–2:10** Mostrar tentativa com e-mail inválido e bloqueio. Corrigir usando dados fictícios, informar “nesta semana”, aceitar contato e enviar.

**2:10–2:50** Abrir o registro protegido e mostrar unidade Centro e prioridade quente. Enviar outro contato fictício para Estreito com “neste mês” ou São José com “pesquisando”, e mostrar morno ou frio.

**2:50–3:20** Repetir o WhatsApp e demonstrar a mensagem de duplicidade.

**3:20–4:20** Com a integração configurada, mostrar a execução real e o pedido recebido pela unidade. Conferir os campos e status delivered; voltar à página e mostrar a confirmação. Se ainda não configurada, declarar a pendência e não simular a entrega.

**4:20–5:00** Mostrar celular, JSONs fictícios, explicar proteção dos dados e encerrar com o link publicado ou código disponível no projeto.
