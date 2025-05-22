// document_retriever.js

/**
 * Document retrieval logic for internal employee chatbot
 * This module handles parsing Portuguese queries, extracting client numbers,
 * identifying document types, and searching for matching PDF files.
 */

class DocumentRetriever {
    constructor() {
        // Document types and their variations in Portuguese
        this.documentTypes = {
            "fatura": ["fatura", "faturas", "factura", "facturas", "invoice", "invoices"],
            "guia_transporte": ["guia", "guias", "crm", "guia de transporte", "guias de transporte", "transport guide", "transport guides"]
        };
        
        // Base path for document storage
        this.documentsBasePath = "documents/";
    }

    /**
     * Normalize text by converting to lowercase and removing accents
     * @param {string} text - Text to normalize
     * @returns {string} - Normalized text
     */
    normalizeText(text) {
        if (!text) return "";
        return text.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    /**
     * Extract client number from user query
     * @param {string} query - User query in Portuguese
     * @returns {string|null} - Extracted client number or null if not found
     */
    extractClientNumber(query) {
        const normalizedQuery = this.normalizeText(query);
        
        // Regular expression to match client number pattern (C followed by digits)
        const clientNumberRegex = /c(\d{3,})/g;
        const matches = normalizedQuery.match(clientNumberRegex);
        
        if (matches && matches.length > 0) {
            // Return the first match, converting 'c' to uppercase
            return matches[0].replace('c', 'C');
        }
        
        return null;
    }

    /**
     * Identify document type from user query
     * @param {string} query - User query in Portuguese
     * @returns {string|null} - Identified document type or null if not found
     */
    identifyDocumentType(query) {
        const normalizedQuery = this.normalizeText(query);
        
        // Check for each document type and its variations
        for (const [docType, variations] of Object.entries(this.documentTypes)) {
            for (const variation of variations) {
                if (normalizedQuery.includes(this.normalizeText(variation))) {
                    return docType;
                }
            }
        }
        
        return null;
    }

    /**
     * Search for documents matching client number and document type
     * @param {string} clientNumber - Client number (e.g., C001)
     * @param {string|null} documentType - Document type or null for all types
     * @returns {Promise<Object>} - Search results with status and document list
     */
    async searchDocuments(clientNumber, documentType) {
        try {
            // Validate client number format
            if (!clientNumber || !clientNumber.match(/^C\d{3,}$/)) {
                return {
                    success: false,
                    error: "formato_cliente_invalido",
                    message: "Formato do número de cliente incorreto. Por favor, use o formato CXXX (ex: C001)."
                };
            }
            
            // Get list of documents for the client
            const documents = await this.getDocumentsForClient(clientNumber, documentType);
            
            if (documents.length === 0) {
                let errorMessage = `Não foram encontrados documentos para o cliente ${clientNumber}`;
                if (documentType) {
                    const readableDocType = documentType === "fatura" ? "faturas" : "guias de transporte";
                    errorMessage += ` do tipo ${readableDocType}`;
                }
                errorMessage += ".";
                
                return {
                    success: false,
                    error: "documentos_nao_encontrados",
                    message: errorMessage
                };
            }
            
            return {
                success: true,
                documents: documents,
                count: documents.length
            };
        } catch (error) {
            console.error("Error searching documents:", error);
            return {
                success: false,
                error: "erro_interno",
                message: "Ocorreu um erro ao procurar os documentos. Por favor, tente novamente."
            };
        }
    }

    /**
     * Get list of documents for a specific client
     * @param {string} clientNumber - Client number (e.g., C001)
     * @param {string|null} documentType - Document type or null for all types
     * @returns {Promise<Array>} - List of document objects with path and name
     */
    async getDocumentsForClient(clientNumber, documentType) {
        try {
            // In a real implementation, this would use the file system API
            // For this mockup, we'll simulate file system access with fetch
            const response = await fetch(`${this.documentsBasePath}${clientNumber}/index.json`).catch(() => null);
            
            // If we can't fetch the index (which doesn't exist in our mockup),
            // we'll simulate the file listing based on our folder structure
            const simulatedDocuments = this.getSimulatedDocuments(clientNumber);
            
            // Filter by document type if specified
            if (documentType) {
                return simulatedDocuments.filter(doc => doc.type === documentType);
            }
            
            return simulatedDocuments;
        } catch (error) {
            console.error("Error getting documents for client:", error);
            return [];
        }
    }

    /**
     * Simulate document listing for a client (for mockup purposes)
     * @param {string} clientNumber - Client number (e.g., C001)
     * @returns {Array} - List of document objects with path, name, and type
     */
    getSimulatedDocuments(clientNumber) {
        // This is a mockup function that simulates file system access
        // In a real implementation, this would be replaced with actual file system operations
        
        const simulatedDocuments = {
            "C001": [
                { 
                    path: `${this.documentsBasePath}C001/fatura_C001_2023-01.pdf`,
                    name: "Fatura Janeiro 2023",
                    type: "fatura",
                    date: "2023-01-15"
                },
                { 
                    path: `${this.documentsBasePath}C001/fatura_C001_2023-02.pdf`,
                    name: "Fatura Fevereiro 2023",
                    type: "fatura",
                    date: "2023-02-15"
                },
                { 
                    path: `${this.documentsBasePath}C001/guia_transporte_C001_123.pdf`,
                    name: "Guia de Transporte #123",
                    type: "guia_transporte",
                    date: "2023-02-20"
                }
            ],
            "C002": [
                { 
                    path: `${this.documentsBasePath}C002/fatura_C002_2023-01.pdf`,
                    name: "Fatura Janeiro 2023",
                    type: "fatura",
                    date: "2023-01-20"
                },
                { 
                    path: `${this.documentsBasePath}C002/guia_transporte_C002_456.pdf`,
                    name: "Guia de Transporte #456",
                    type: "guia_transporte",
                    date: "2023-01-25"
                }
            ],
            "C003": [
                { 
                    path: `${this.documentsBasePath}C003/fatura_C003_2023-01.pdf`,
                    name: "Fatura Janeiro 2023",
                    type: "fatura",
                    date: "2023-01-10"
                },
                { 
                    path: `${this.documentsBasePath}C003/fatura_C003_2023-02.pdf`,
                    name: "Fatura Fevereiro 2023",
                    type: "fatura",
                    date: "2023-02-10"
                },
                { 
                    path: `${this.documentsBasePath}C003/fatura_C003_2023-03.pdf`,
                    name: "Fatura Março 2023",
                    type: "fatura",
                    date: "2023-03-10"
                },
                { 
                    path: `${this.documentsBasePath}C003/guia_transporte_C003_789.pdf`,
                    name: "Guia de Transporte #789",
                    type: "guia_transporte",
                    date: "2023-03-15"
                }
            ],
            "C004": [
                { 
                    path: `${this.documentsBasePath}C004/fatura_C004_2023-01.pdf`,
                    name: "Fatura Janeiro 2023",
                    type: "fatura",
                    date: "2023-01-05"
                },
                { 
                    path: `${this.documentsBasePath}C004/guia_transporte_C004_101.pdf`,
                    name: "Guia de Transporte #101",
                    type: "guia_transporte",
                    date: "2023-01-12"
                },
                { 
                    path: `${this.documentsBasePath}C004/guia_transporte_C004_102.pdf`,
                    name: "Guia de Transporte #102",
                    type: "guia_transporte",
                    date: "2023-02-18"
                }
            ]
        };
        
        return simulatedDocuments[clientNumber] || [];
    }

    /**
     * Process user query and return appropriate response
     * @param {string} query - User query in Portuguese
     * @returns {Promise<Object>} - Response object with message and documents if found
     */
    async processQuery(query) {
        // Extract client number from query
        const clientNumber = this.extractClientNumber(query);
        
        // Identify document type from query
        const documentType = this.identifyDocumentType(query);
        
        // If no client number is specified, get documents from all clients
        if (!clientNumber) {
            const allDocuments = [];
            // Get documents from all simulated clients
            for (const clientId of ["C001", "C002", "C003"]) {
                const clientDocs = await this.getDocumentsForClient(clientId, documentType);
                allDocuments.push(...clientDocs);
            }
            
            if (allDocuments.length === 0) {
                return {
                    success: false,
                    error: "documentos_nao_encontrados",
                    message: "Não foram encontrados documentos com os critérios especificados."
                };
            }
            
            return {
                success: true,
                documents: allDocuments,
                count: allDocuments.length
            };
        }
        
        // If client number is specified, search for documents for that client
        const searchResults = await this.searchDocuments(clientNumber, documentType);
        return searchResults;
    }

    /**
     * Format document list for display in chatbot
     * @param {Array} documents - List of document objects
     * @returns {string} - HTML formatted document list
     */
    formatDocumentList(documents) {
        if (!documents || documents.length === 0) {
            return "";
        }
        
        let html = "<div class='document-list'>";
        
        documents.forEach(doc => {
            html += `
                <div class='document-item'>
                    <a href='${doc.path}' target='_blank' class='document-link'>
                        <span class='document-name'>${doc.name}</span>
                        <span class='document-date'>${doc.date}</span>
                    </a>
                </div>
            `;
        });
        
        html += "</div>";
        
        return html;
    }
}

// Export the DocumentRetriever class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentRetriever;
} else {
    // For browser environment
    window.DocumentRetriever = DocumentRetriever;
}
