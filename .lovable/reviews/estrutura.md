# Rede Ritmo — estrutura e funcionamento

## Página
Cabeçalho fixo → campanha em duas colunas → quatro modalidades → três unidades → quatro etapas → formulário → rodapé institucional. Navegação por seções, pois a proposta exige uma única página.

## Formulário
Nome, e-mail, WhatsApp com DDD, unidade, modalidade, prazo e consentimento são validados no navegador e novamente no servidor. Escolher uma unidade no cartão preenche o formulário. O envio bloqueia cliques repetidos e preserva os campos se houver erro.

## Classificação e registro
Nesta semana = quente; neste mês = morno; pesquisando = frio. A classificação é calculada também no registro. Um WhatsApp normalizado (55 + DDD + número) pode ter uma única solicitação nesta campanha; a restrição única no armazenamento bloqueia envios concorrentes. Dados pessoais não ficam acessíveis aos visitantes.

## Integração
Lovable Cloud mantém os pedidos em trial_requests. O servidor poderá enviar um POST para um webhook fornecido pela equipe, com unidade e classificação no corpo. O endereço será guardado em segredo, sem URL fictícia. A tela só informa encaminhamento confirmado após resposta de sucesso. Sem destino configurado, o pedido permanece pendente e a tela explica que não foi encaminhado.

## Testes
Testes automatizados cobrem as três prioridades, campos inválidos, consentimento e normalização. Testes reais no formulário verificam navegação, seleção de unidades, registro, duplicidade e celular, usando somente contatos fictícios. O teste de recebimento externo depende do destino da recepção.