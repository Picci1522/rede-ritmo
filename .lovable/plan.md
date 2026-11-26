# Rede Ritmo — planejamento ULTRA V3

## 1. Resumo e análise dos materiais
A proposta é captar solicitações de aula experimental gratuita, validar e padronizar os dados, classificar os interessados e disponibilizar os pedidos à recepção da unidade escolhida. Não é uma confirmação de vaga ou horário.

Foram analisados o briefing completo, os dois mapas SVG e o kit visual com 15 arquivos de marca e fotografias. Os mapas apresentam o mesmo fluxo: campanha → dados → prioridade → recepção. O kit corresponde às três unidades, às quatro modalidades e ao acolhimento descritos no briefing.

### Situação atual do projeto
- Página única já criada, com fotografias oficiais, marca, formulário e navegação por seções.
- Registro privado, validação no navegador e servidor, classificação automática e bloqueio de WhatsApp repetido já implementados.
- 17 testes automatizados passaram na etapa anterior; houve testes reais com contatos fictícios nas três unidades, depois removidos.
- JSONs fictícios, apresentação curta e roteiro de vídeo já preparados.
- Integração externa não configurada: hoje o pedido fica registrado como pendente, sem falsa confirmação de encaminhamento.
- Painel da recepção ainda não existe. O vídeo ainda não foi gravado e a página não está publicada.

Preservar o que já funciona; novas funcionalidades só começam após aprovação deste planejamento.

## 2. Requisitos obrigatórios
1. Página única em português, identidade oficial grafite, laranja e branco quente, fonte Inter, imagens do kit e funcionamento em computador, tablet e celular.
2. Nome, e-mail, WhatsApp com DDD, unidade, modalidade, prazo e consentimento obrigatórios; erros claros sem apagar o preenchimento.
3. Classificação automática: **nesta semana → quente; neste mês → morno; pesquisando → frio**.
4. Uma solicitação por WhatsApp normalizado nesta campanha, com bloqueio também no registro, incluindo envios concorrentes.
5. Recebimento real pela recepção, associado à unidade e modalidade, com confirmação somente depois do processamento.
6. Dados pessoais protegidos, credenciais fora do código público e nenhuma exposição de pedidos aos visitantes.
7. Demonstração com dados fictícios, JSONs, texto curto, vídeo de até cinco minutos e link publicado ou código.

Não adicionar unidades, modalidades, preços, planos, contatos ou horários inventados.

## 3. Funcionalidades necessárias e opcionais
### Necessárias para concluir
- Completar o destino de recebimento dos pedidos.
- Mostrar a confirmação apenas quando o pedido estiver efetivamente disponível para a equipe.
- Conferir o fluxo completo de cadastro até leitura pela recepção.
- Atualizar materiais de entrega com os resultados reais.

### Painel — melhoria opcional recomendada
O mapa não exige um painel próprio; o novo briefing o propõe. Recomendo incluí-lo como a alternativa funcional de recepção, sem dependência de um serviço externo.

O painel terá:
- Total de solicitações e totais quente, morno e frio.
- Contagens por unidade e modalidade.
- Lista com nome, e-mail, WhatsApp, data, prioridade, unidade e modalidade.
- Filtros por prioridade, unidade, modalidade e intervalo de datas.
- Ordem de atendimento: quente, morno e frio; dentro da mesma prioridade, os pedidos mais antigos primeiro.
- Estados de carregamento, lista vazia e erro; paginação para não omitir pedidos quando a lista crescer.

Sem funções extras de vendas, assinatura ou agendamento de horários.

## 4. Arquitetura recomendada
**Recomendação: Lovable Cloud + fila privada da recepção + painel protegido.**

```text
Visitante
  → formulário
  → validação e normalização no servidor
  → registro e classificação
  → fila da unidade, disponível somente à equipe autorizada
  → confirmação na página

Recepção autenticada
  → verifica autorização para a unidade
  → consulta fila e indicadores
  → filtra pedidos e identifica os quentes
```

Esta é uma integração interna real: a mesma solicitação enviada pelo visitante é lida pela recepção autorizada. Não depende de um webhook fictício nem de credenciais externas. Na demonstração, será necessário mostrar o pedido na conta da recepção, não apenas no armazenamento do projeto.

**Opção externa:** manter o encaminhamento por webhook para Make ou n8n quando existir um destino real. Nesse caso, configurar endereço e eventual token como segredos; o fluxo deverá separar as três unidades e confirmar o registro no destino. Essa opção não será apresentada como concluída sem teste de recebimento.

Não chamar um simples registro pendente de “encaminhamento confirmado”. Pedidos antigos pendentes terão tratamento explícito; não marcar falhas externas como entregues sem comprovação.

## 5. Tecnologias e detalhes técnicos
- **React + TanStack Start:** manter o ambiente existente, evitando reescrita.
- **Tailwind CSS e componentes existentes:** preservar os estilos oficiais e criar um painel coerente com a marca.
- **Zod:** compartilhar as regras de validação e repetir a verificação no servidor.
- **Lovable Cloud:** persistência, acessos autenticados e execução do processamento.
- **TanStack Query:** consultas, atualização após ações e paginação do painel.
- **Vitest + Playwright:** regras automatizadas e fluxo real no navegador.

### Segurança e organização dos dados
Manter `trial_requests` privado. Adicionar uma tabela própria de permissões da recepção vinculando usuário e unidade; não usar informações editáveis do perfil para conceder acesso. Uma conta sem permissão não poderá consultar pedidos, mesmo conhecendo o endereço do painel. Os filtros e indicadores usarão o mesmo limite de acesso da lista.

Definir contas de equipe com o responsável antes da demonstração. Não autorizar automaticamente qualquer pessoa que criar uma conta. Usar contas de teste apenas para verificar os cenários.

### Estrutura de arquivos
Preservar:
- `src/routes/index.tsx`: campanha.
- `src/components/trial-form.tsx`: formulário.
- `src/lib/trial-request.ts`: validação e normalização.
- `src/lib/trial-request.functions.ts`: processamento.
- `src/styles.css` e `src/assets/`: identidade e materiais oficiais.
- `src/test/` e `entrega/`: testes e documentação.

Adicionar após aprovação:
- Páginas de acesso e recepção protegida em `src/routes/`.
- Componentes específicos do painel em `src/components/reception/`.
- Consultas protegidas e regras de acesso em módulos próprios de `src/lib/`.
- Mudanças de estrutura do armazenamento feitas pelas ferramentas do Lovable Cloud.

Documentar as funções de envio e consulta; não criar APIs públicas de leitura de dados pessoais. Caso seja usado webhook externo, documentar contrato, configuração, confirmação e tratamento de falhas.

## 6. Plano de desenvolvimento após aprovação
1. **Acesso:** configurar autenticação e permissões por unidade, com testes de bloqueio de usuários não autorizados.
2. **Recepção real:** concluir a fila interna e o processamento de confirmação sem simular entrega externa.
3. **Painel:** indicadores, lista, filtros, prioridade e paginação, sem alterar a campanha já aprovada.
4. **Testes completos:** enviar pedidos fictícios e conferir leitura pela recepção correta.
5. **Finalização:** atualizar documentação, JSONs, instruções de execução e roteiro; preparar uma gravação de até cinco minutos com a integração real quando o fluxo estiver validado.
6. **Publicação:** disponibilizar código ou publicar mediante autorização e repetir o teste no endereço final, se publicado.

## 7. Testes e critérios de aceite
- Cadastro quente, morno e frio: conferir classificação armazenada e exibida na recepção.
- E-mail inválido, unidade ausente e consentimento ausente: bloquear registro.
- WhatsApp duplicado, inclusive tentativas concorrentes: manter um único pedido e apresentar mensagem clara.
- Seleção de Centro, Estreito e São José: associação correta e leitura restrita à equipe permitida.
- Fluxo válido: enviar pela campanha, receber confirmação e ler o mesmo pedido na recepção autenticada.
- Acesso indevido: visitante e conta sem permissão não podem consultar contatos, contagens privadas ou pedidos de outra unidade.
- Filtros e totais: testar valores concretos com dados fictícios, incluindo datas e ordenação das prioridades.
- Computador, tablet e celular: menu, formulário e painel sem conteúdo sobreposto ou rolagem horizontal indevida.
- Remover somente os registros fictícios identificados após os testes.

Concluir apenas quando o fluxo de recebimento estiver comprovado e os materiais refletirem o que realmente foi entregue.

## 8. Riscos e decisões pendentes
- **Exigência de ferramenta externa pelo professor:** os materiais pedem integração demonstrável, mas não impõem Make ou n8n; se houver exigência adicional, o fluxo interno pode precisar de adaptação.
- **Acesso da equipe:** faltam as contas reais que poderão consultar cada unidade; não inventar nem liberar acesso geral.
- **Dependência externa:** webhook exige destino válido e confirmação real; a fila interna reduz esse risco.
- **Vídeo:** existe roteiro, não uma gravação concluída; gravar só depois de demonstrar o recebimento real.
- **Publicação:** não está feita; separar salvamento do código e publicação do site.
- **LGPD:** proteção técnica e consentimento não substituem decisões do responsável sobre retenção e uso dos dados; não inventar uma política jurídica.

## Aprovação solicitada
Aprovar a continuação com **fila interna no Lovable Cloud e painel protegido da recepção** como solução funcional, mantendo o webhook externo como opção configurável, sem reescrever a página já construída.