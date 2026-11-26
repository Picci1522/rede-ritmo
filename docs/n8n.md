# Rede Ritmo — integração n8n

## Configuração
Guardar **N8N_WEBHOOK_URL** em Configurações do projeto → Secrets. Usar a Production URL HTTPS do nó Webhook (método POST) do fluxo n8n. Para uma URL de teste, deixar o nó em “Listen for test event” enquanto envia o formulário. Nunca usar prefixo VITE_ para esse segredo; a chamada sai do servidor e o endereço não vai para o navegador. Não há URL fictícia padrão nem token público.

O segredo ainda não foi configurado nesta entrega. Sem ele, a página mostra erro, preserva os campos e permite tentar novamente; não envia ou confirma nada.

## JSON enviado
```json
{
  "nome": "Pessoa Teste",
  "email": "teste@example.com",
  "whatsapp": "5548999990001",
  "unidade": "centro",
  "modalidade": "funcional",
  "inicio": "esta-semana",
  "prazo": "esta-semana",
  "consentimento": true,
  "id": "identificador-estavel-do-pedido",
  "data_solicitacao": "2026-11-26T02:00:00Z"
}
```
O nome é aparado e espaços repetidos são reduzidos; e-mail aparado e em minúsculas; WhatsApp apenas dígitos no formato 55 + DDD + telefone. `inicio` aceita `esta-semana`, `este-mes` ou `pesquisando`. `prazo` preserva compatibilidade com o campo anterior. Unidade: `centro`, `estreito`, `sao-jose`; modalidade: `musculacao`, `funcional`, `pilates`, `danca`.

Não enviar classificação local. O honeypot `website` e o token de nova tentativa são validados internamente e não enviados ao n8n. Cabeçalhos: `Content-Type: application/json` e `Idempotency-Key: <id>`.

## Fluxo no n8n e resposta esperada
1. Webhook POST recebe o JSON.
2. Validar os campos novamente e classificar `inicio`: `esta-semana` → quente; `este-mes` → morno; `pesquisando` → frio.
3. Identificar a unidade, criar um cartão no Trello da recepção correspondente e registrar o pedido no destino privado escolhido.
4. Guardar o `id` como chave única no fluxo. Uma repetição com o mesmo id deve retornar o resultado já processado, sem criar outro cartão.
5. Responder usando “Respond to Webhook” **somente depois** de concluir Trello e registro. Pode retornar HTTP 200 com `{"ok":true}`; qualquer HTTP 2xx é aceito pelo formulário. O corpo não é obrigatório e não é exibido ao visitante.

Não usar resposta imediata do Webhook antes de concluir o fluxo: ela confirmaria apenas a aceitação, não o trabalho no Trello. Não responder 2xx em ramo de falha. HTTP 3xx, 4xx e 5xx ou falha de rede não mostram sucesso. O prazo máximo de espera é 15 segundos; caso o fluxo possa terminar após esse limite, a idempotência por id é essencial na nova tentativa.

## Duplicidade e novas tentativas
O Lovable Cloud mantém `n8n_submissions`, um controle privado de entrega, não um substituto do registro final do n8n. E-mail normalizado ou WhatsApp normalizado já recebido/em processamento bloqueia outro cadastro. Reservas e restrições únicas protegem envios concorrentes. Dados antigos em `trial_requests` são preservados e também considerados na verificação.

Se o n8n falhar, o mesmo formulário pode repetir a solicitação com o mesmo id, e-mail, WhatsApp e token interno de tentativa. O botão volta a ficar disponível e os campos não são apagados. Não recarregar a página durante a repetição: o token é mantido em memória nesta sessão do formulário. Se um processamento interrompido deixar a reserva ocupada, a mesma tentativa pode recuperá-la após 60 segundos. Contatos alterados em uma reserva falha são tratados como outro pedido, não como alteração do registro antigo.

O visitante não pode ler ou alterar contatos armazenados. Apenas o servidor validado acessa esse controle. O n8n e o Trello precisam manter seus próprios acessos e credenciais protegidos.

## Testes com dados fictícios
1. Configure a URL real e ative o fluxo no n8n.
2. Envie `Pessoa Teste`, `teste1@example.com`, um telefone fictício com DDD, Centro, Funcional e “nesta semana”. Confira a execução no n8n, o cartão quente no Trello e o registro final.
3. Use outros contatos fictícios para “neste mês” e “pesquisando”; confira morno e frio.
4. Envie e-mail inválido, unidade ausente ou honeypot preenchido: nada deve chegar ao n8n.
5. Repita o e-mail com outro telefone e depois o telefone com outro e-mail: ambos devem bloquear.
6. Provoque HTTP 500 no fluxo: a página deve mostrar erro sem apagar dados. Corrija o fluxo e clique novamente; confirme apenas um cartão com o mesmo id.
7. Teste HTTP 302, timeout e ausência da variável: nenhum deve mostrar confirmação.
8. Só considere a integração demonstrada depois de ver o recebimento no n8n, no Trello e no destino de registro. Os testes HTTP isolados do projeto usam respostas controladas e **não comprovam entrega externa**.

O código do site está pronto para chamar o fluxo; criar/configurar os nós de classificação, Trello e registro no n8n ainda depende de acesso à instância e aos destinos reais. Não foi criado um fluxo externo nem testado recebimento real nesta etapa.

## Verificação desta etapa
38 testes passaram, incluindo HTTP 2xx/não-2xx, JSON normalizado, honeypot, início obrigatório, concorrência, duplicidade por e-mail ou WhatsApp e repetição de reserva falha com id estável. Os testes de armazenamento rodaram no Lovable Cloud com um contato fictício; a reserva foi removida pelo id depois da conferência. No navegador, foram verificados e-mail inválido, ausência de configuração sem sucesso, preservação dos campos e botão disponível para nova tentativa. A imagem Funcional carregou corretamente e os arquivos de fotos, layout e estilos não foram alterados. Recebimento externo permanece não verificado até configurar o segredo e o fluxo real.