// script.js

document.addEventListener("DOMContentLoaded", () => {
    const messageList = document.getElementById("message-list");
    const userInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");
    const suggestionsContainer = document.getElementById("suggestions-container");
    const toggleButton = document.getElementById("toggle-suggestions");
    
    // Initialize document retriever
    const documentRetriever = new DocumentRetriever();
    
    // Show welcome message when page loads
    showWelcomeMessage();

    if (toggleButton && suggestionsContainer) {
        toggleButton.addEventListener("click", () => {
            suggestionsContainer.classList.toggle("hidden");
            toggleButton.textContent = suggestionsContainer.classList.contains("hidden") ? "Sugestões" : "Ocultar Sugestões";
        });
    }

    document.querySelectorAll(".suggestion-btn").forEach(button => {
        button.addEventListener("click", () => {
            const suggestionText = button.textContent;
            userInput.value = suggestionText;
            sendMessage();
            if (suggestionsContainer) {
                suggestionsContainer.classList.add("hidden");
                if (toggleButton) toggleButton.textContent = "Sugestões";
            }
        });
    });

    // Add event listeners for sending messages
    sendButton.addEventListener("click", sendMessage);
    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    function normalizeText(text) {
        if (!text) return "";
        return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    function getMonthFromText(text) {
        const months = {
            'janeiro': 1, 'fevereiro': 2, 'março': 3, 'marco': 3,
            'abril': 4, 'maio': 5, 'junho': 6, 'julho': 7,
            'agosto': 8, 'setembro': 9, 'outubro': 10,
            'novembro': 11, 'dezembro': 12
        };
        
        const normalizedText = normalizeText(text);
        for (const [month, number] of Object.entries(months)) {
            if (normalizedText.includes(month)) {
                return number;
            }
        }
        return null;
    }

    function getMonthName(monthNumber) {
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return months[monthNumber - 1];
    }

    function getRandomResponse(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function showWelcomeMessage() {
        const welcomeMessages = [
            "Olá! Bem-vindo ao assistente de documentos. Como posso ajudar?",
            "Olá! Estou aqui para ajudar com a recuperação de documentos. O que precisa?",
            "Bem-vindo! Posso ajudar a encontrar faturas ou guias de transporte. Como posso ajudar?"
        ];
        
        const welcomeMessage = getRandomResponse(welcomeMessages);
        addMessageToChat(welcomeMessage, "bot");
    }

    function addMessageToChat(message, sender, html = false) {
        const li = document.createElement("li");
        li.className = `message ${sender}-message`;
        
        // Add message content first
        if (html) {
            li.innerHTML = message;
        } else {
            li.textContent = message;
        }
        
        // Then add bot avatar if it's a bot message
        if (sender === "bot") {
            const img = document.createElement("img");
            img.src = "icon.png";
            img.alt = "Bot Avatar";
            img.className = "bot-avatar";
            li.appendChild(img);
        }
        
        messageList.appendChild(li);
        
        // Scroll to the bottom of the chat
        const chatWindow = document.getElementById("chat-window");
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === "") return;
        
        // Add user message to chat
        addMessageToChat(message, "user");
        
        // Clear input field
        userInput.value = "";
        
        // Process user message and get response
        await processUserMessage(message);
    }

    async function processUserMessage(message) {
        // Check for greetings or thanks
        const normalizedMessage = normalizeText(message);
        
        if (isGreeting(normalizedMessage)) {
            handleGreeting();
            return;
        }
        
        if (isThanks(normalizedMessage)) {
            handleThanks();
            return;
        }
        
        // Process document retrieval query
        try {
            // Show typing indicator
            showTypingIndicator();
            
            // Check for month in the message
            const monthNumber = getMonthFromText(message);
            
            // Check for client number in the message
            const clientNumber = documentRetriever.extractClientNumber(message);
            
            // Process the query with document retriever
            const result = await documentRetriever.processQuery(message);
            
            // Remove typing indicator
            removeTypingIndicator();
            
            if (result.success) {
                // Filter documents by month if specified
                let filteredDocuments = result.documents;
                if (monthNumber) {
                    filteredDocuments = result.documents.filter(doc => {
                        const docDate = new Date(doc.date);
                        return docDate.getMonth() + 1 === monthNumber;
                    });
                }

                if (filteredDocuments.length === 0) {
                    const monthName = monthNumber ? getMonthName(monthNumber) : '';
                    const clientText = clientNumber ? ` para o cliente ${clientNumber}` : '';
                    addMessageToChat(`Não encontrei documentos${monthName ? ` de ${monthName}` : ''}${clientText}.`, "bot");
                    return;
                }

                // Group documents by type and client
                const documentsByTypeAndClient = filteredDocuments.reduce((acc, doc) => {
                    const clientId = doc.path.split('/')[1];
                    if (!acc[clientId]) {
                        acc[clientId] = {
                            fatura: [],
                            guia_transporte: []
                        };
                    }
                    if (!acc[clientId][doc.type]) {
                        acc[clientId][doc.type] = [];
                    }
                    acc[clientId][doc.type].push(doc);
                    return acc;
                }, {});

                // If no specific client was requested, show all clients' documents
                if (!clientNumber) {
                    // Create summary message for all clients
                    const monthName = monthNumber ? ` de ${getMonthName(monthNumber)}` : '';
                    addMessageToChat(`Encontrei os seguintes documentos${monthName}:`, "bot");
                    
                    // Show documents grouped by client
                    for (const [clientId, docs] of Object.entries(documentsByTypeAndClient)) {
                        const messageParts = [];
                        if (docs.fatura && docs.fatura.length > 0) {
                            messageParts.push(`${docs.fatura.length} ${docs.fatura.length === 1 ? 'fatura' : 'faturas'}`);
                        }
                        if (docs.guia_transporte && docs.guia_transporte.length > 0) {
                            messageParts.push(`${docs.guia_transporte.length} ${docs.guia_transporte.length === 1 ? 'CMR' : 'CMRs'}`);
                        }
                        
                        if (messageParts.length > 0) {
                            addMessageToChat(`Cliente ${clientId}: ${messageParts.join(' e ')}`, "bot");
                            
                            // Send each document as a separate message
                            [...(docs.fatura || []), ...(docs.guia_transporte || [])].forEach(doc => {
                                const docHtml = `
                                    <div class='document-item'>
                                        <a href='${doc.path}' target='_blank' class='document-link'>
                                            <span class='document-name'>${doc.name}</span>
                                            <span class='document-date'>${doc.date}</span>
                                        </a>
                                    </div>
                                `;
                                addMessageToChat(docHtml, "bot", true);
                            });
                        }
                    }
                } else {
                    // Create success message for specific client
                    const monthName = monthNumber ? ` de ${getMonthName(monthNumber)}` : '';
                    let successMessage = `Encontrei `;
                    
                    const messageParts = [];
                    if (documentsByTypeAndClient[clientNumber].fatura) {
                        const count = documentsByTypeAndClient[clientNumber].fatura.length;
                        messageParts.push(`${count} ${count === 1 ? 'fatura' : 'faturas'}`);
                    }
                    if (documentsByTypeAndClient[clientNumber].guia_transporte) {
                        const count = documentsByTypeAndClient[clientNumber].guia_transporte.length;
                        messageParts.push(`${count} ${count === 1 ? 'CMR' : 'CMRs'}`);
                    }
                    
                    successMessage += messageParts.join(' e ') + `${monthName} para o cliente ${clientNumber}.`;
                    addMessageToChat(successMessage, "bot");
                    
                    // Send each document as a separate message
                    [...(documentsByTypeAndClient[clientNumber].fatura || []), 
                     ...(documentsByTypeAndClient[clientNumber].guia_transporte || [])].forEach(doc => {
                        const docHtml = `
                            <div class='document-item'>
                                <a href='${doc.path}' target='_blank' class='document-link'>
                                    <span class='document-name'>${doc.name}</span>
                                    <span class='document-date'>${doc.date}</span>
                                </a>
                            </div>
                        `;
                        addMessageToChat(docHtml, "bot", true);
                    });
                }
            } else {
                // Error occurred
                addMessageToChat(result.message, "bot");
            }
        } catch (error) {
            console.error("Error processing message:", error);
            removeTypingIndicator();
            addMessageToChat("Desculpe, ocorreu um erro ao processar a sua mensagem. Por favor, tente novamente.", "bot");
        }
    }

    function getDocumentTypeLabel(type) {
        if (type === "fatura") {
            return "fatura(s)";
        } else if (type === "guia_transporte") {
            return "guia(s) de transporte";
        } else {
            return "documento(s)";
        }
    }

    function showTypingIndicator() {
        const li = document.createElement("li");
        li.className = "message bot-message typing-indicator";
        li.id = "typing-indicator";
        
        const img = document.createElement("img");
        img.src = "icon.png";
        img.alt = "Bot Avatar";
        img.className = "bot-avatar";
        li.appendChild(img);
        
        const span = document.createElement("span");
        span.textContent = "Digitando...";
        li.appendChild(span);
        
        messageList.appendChild(li);
        
        // Scroll to the bottom of the chat
        const chatWindow = document.getElementById("chat-window");
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingIndicator = document.getElementById("typing-indicator");
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    function isGreeting(normalizedMessage) {
        const greetings = ["ola", "oi", "bom dia", "boa tarde", "boa noite", "hello", "hi"];
        return greetings.some(greeting => normalizedMessage.includes(greeting));
    }

    function handleGreeting() {
        const greetingResponses = [
            "Olá! Como posso ajudar com os documentos hoje?",
            "Olá! Precisa de alguma fatura ou guia de transporte?",
            "Olá! Estou aqui para ajudar a encontrar documentos. O que precisa?"
        ];
        
        addMessageToChat(getRandomResponse(greetingResponses), "bot");
    }

    function isThanks(normalizedMessage) {
        const thanks = ["obrigado", "obrigada", "agradecido", "agradecida", "valeu", "thanks"];
        return thanks.some(thank => normalizedMessage.includes(thank));
    }

    function handleThanks() {
        const thanksResponses = [
            "De nada! Estou aqui para ajudar.",
            "Disponha! Precisa de mais alguma coisa?",
            "Por nada! Se precisar de mais documentos, é só pedir."
        ];
        
        addMessageToChat(getRandomResponse(thanksResponses), "bot");
    }
});
