# Fluxo Conversacional Básico do Chatbot de Pré-Venda

Este documento descreve o fluxo de interação básico entre o utilizador e o chatbot de pré-venda para a empresa de transporte de mercadorias. Toda a interação textual com o utilizador será em português de Portugal.

## 1. Mensagem de Boas-Vindas

Quando o utilizador inicia a interação com o chatbot, a primeira mensagem apresentada será uma saudação cordial e uma breve introdução à sua finalidade. O objetivo é que o utilizador se sinta bem-vindo e compreenda imediatamente como o chatbot o pode assistir.

*Exemplo de Mensagem de Boas-Vindas:*

`Chatbot: Olá! Bem-vindo ao assistente virtual da Portugalenses. Estou aqui para ajudar com informações sobre os nossos serviços de transporte de carga. Como posso ajudar?`

## 2. Receção do Pedido do Utilizador

Após a mensagem de boas-vindas, o chatbot aguardará que o utilizador introduza a sua questão ou pedido. O utilizador poderá escrever livremente a sua pergunta no campo de texto disponibilizado na interface.

*Exemplo de Interação:*

`Utilizador: Queria saber se fazem transportes para Madrid.`

`Utilizador: Quanto custa enviar paletes para o Porto?`

`Utilizador: Quais os tipos de carga que aceitam?`

## 3. Processamento do Pedido e Chamada à Função de Recuperação de Dados

Assim que o utilizador submete a sua questão, o texto introduzido é enviado para a função de recuperação de dados (`getCargoInfoSimulated`). Esta função irá processar a string em português, normalizar o texto (convertendo para minúsculas e removendo acentos) e tentar encontrar palavras-chave que correspondam às informações presentes na camada de dados simulada (o ficheiro `simulated_data.json`).

A função tentará identificar:
- Destinos
- Tipos de carga
- Intenções específicas (preços, tempos de trânsito)
- Restrições especiais (como contentores para cidades portuguesas)

## 4. Formulação da Resposta

A resposta do chatbot será formulada com base no resultado devolvido pela função `getCargoInfoSimulated`. O chatbot agora mantém contexto entre mensagens e fornece respostas mais focadas na pergunta específica.

### a. Cenário de Recuperação de Dados Bem-Sucedida

Se a função encontrar informação relevante para a pergunta do utilizador, o chatbot apresentará essa informação de forma clara e concisa. A resposta será específica ao tipo de pergunta feita.

*Exemplos de Respostas (Bem-Sucedidas):*

*Para a pergunta: "Queria saber se fazem transportes para Madrid."*

`Chatbot: Sim, fazemos transportes para Madrid!`

*Para a pergunta: "Quanto custa enviar paletes para o Porto?"*

`Chatbot: O preço base para Porto é de 0.6€/kg ou 60€/m³.`

*Para a pergunta: "Quanto tempo demora para Turim?"*

`Chatbot: O tempo de trânsito para paletes para Turim é de 3-4 dias úteis.`

*Para a pergunta: "Quero enviar contentores para o Porto?"*

`Chatbot: Os contentores são apenas para envios internacionais. Para envios nacionais, sugerimos o uso de paletes.`

### b. Cenário de Recuperação de Dados Malsucedida (ou Informação Insuficiente)

Se a função não encontrar informação diretamente relevante para a pergunta do utilizador, ou se a pergunta for demasiado vaga, o chatbot informará o utilizador de que não conseguiu encontrar a informação específica e tentará guiar o utilizador para reformular a pergunta.

*Exemplos de Respostas (Malsucedidas/Insuficientes):*

*Para a pergunta: "Quanto custa?" (demasiado vago)*

`Chatbot: Para cotações precisas, por favor indique o destino e o tipo de carga.`

*Para a pergunta: "Quanto tempo demora?" (sem contexto)*

`Chatbot: Os tempos de trânsito variam conforme o destino e tipo de carga. Pode especificar?`

## 5. Gestão de Contexto e Perguntas de Seguimento

O chatbot mantém contexto entre mensagens, armazenando:
- Último destino mencionado
- Último tipo de carga mencionado
- Última pergunta feita

Isso permite respostas mais naturais em perguntas de seguimento sem necessidade de repetir informações.

*Exemplo de Perguntas de Seguimento:*

`Utilizador: Fazem transportes para Madrid?`
`Chatbot: Sim, fazemos transportes para Madrid!`

`Utilizador: E quanto tempo demora?`
`Chatbot: O tempo de trânsito para paletes para Madrid é de 2-3 dias úteis.`

## 6. Gestão de Agradecimentos

O chatbot reconhece e responde a agradecimentos do utilizador.

*Exemplo:*

`Utilizador: Obrigado!`
`Chatbot: De nada! Estou à disposição para responder a quaisquer outras questões que possa ter.`

## 7. Fim da Interação

Para terminar a interação, o utilizador pode simplesmente fechar a janela do chatbot ou usar uma frase de despedida.

Este fluxo atualizado reflete as melhorias implementadas no chatbot, incluindo:
- Respostas mais focadas e específicas
- Manutenção de contexto entre mensagens
- Tratamento especial para casos específicos (como contentores nacionais)
- Reconhecimento de agradecimentos
- Interface com scroll automático para novas mensagens

