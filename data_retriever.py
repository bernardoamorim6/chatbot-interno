# data_retriever.py
import json
import unidecode # For accent normalization

# Load the simulated data from the JSON file
# This assumes 'simulated_data.json' is in the same directory or a correct path is provided.
DATA_FILE_PATH = "/home/ubuntu/simulated_data.json"

def load_data(file_path=DATA_FILE_PATH):
    """Loads the simulated database from a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: The data file {file_path} was not found.")
        return None
    except json.JSONDecodeError:
        print(f"Error: The data file {file_path} is not a valid JSON.")
        return None

SIMULATED_DB = load_data()

def normalize_text(text):
    """Normalizes text by converting to lowercase and removing accents."""
    if not text: 
        return ""
    return unidecode.unidecode(text.lower().strip())

def get_cargo_info(user_inquiry_pt):
    """
    Retrieves information from the simulated cargo database based on user inquiry.

    Args:
        user_inquiry_pt (str): The user's inquiry in Portuguese.

    Returns:
        list: A list of strings containing relevant information or a message if no information is found.
    """
    if SIMULATED_DB is None:
        return ["Lamentamos, mas de momento não conseguimos aceder à nossa base de dados de serviços."]

    normalized_inquiry = normalize_text(user_inquiry_pt)
    results = []

    # Keywords for different categories
    destination_keywords = [normalize_text(d['nome']) for d in SIMULATED_DB.get('destinos', [])]
    cargo_type_keywords = [normalize_text(ct['nome']) for ct in SIMULATED_DB.get('tipos_carga', [])]
    pricing_keywords = ["preco", "custo", "quanto custa", "tarifas", "cotacao"]
    transit_time_keywords = ["tempo", "transito", "quanto tempo", "demora", "prazo"]
    general_service_keywords = ["servicos", "informacao", "ajuda"]

    # --- Check for Destinations ---
    found_destinations = []
    for dest_data in SIMULATED_DB.get('destinos', []):
        norm_dest_name = normalize_text(dest_data['nome'])
        if norm_dest_name in normalized_inquiry:
            found_destinations.append(dest_data['nome'])
            if dest_data['disponivel']:
                results.append(f"Sim, fazemos transportes para {dest_data['nome']}.")
                # Add pricing for this destination
                if dest_data['nome'] in SIMULATED_DB.get('precos_base', {}):
                    preco_info = SIMULATED_DB['precos_base'][dest_data['nome']]
                    results.append(f"O preço base para {dest_data['nome']} é de {preco_info['por_kg']}€/kg ou {preco_info['por_m3']}€/m³.")
            else:
                results.append(f"De momento, não temos serviço disponível para {dest_data['nome']}.")
    
    # --- Check for Cargo Types ---
    found_cargo_types = []
    for cargo_data in SIMULATED_DB.get('tipos_carga', []):
        norm_cargo_name = normalize_text(cargo_data['nome'])
        # Check for the cargo name itself or related terms like 'tipo de paletes'
        if norm_cargo_name in normalized_inquiry or any(term in normalized_inquiry for term in [f"tipo de {norm_cargo_name}", f"transporte de {norm_cargo_name}"]):
            found_cargo_types.append(cargo_data['nome'])
            results.append(f"Relativamente a {cargo_data['nome']}: {cargo_data['descricao']}")
            if cargo_data.get('limitacoes'):
                results.append(f"Limitações para {cargo_data['nome']}: {cargo_data['limitacoes']}")
            # Add surcharge info if applicable
            if cargo_data['nome'] in SIMULATED_DB.get('sobretaxas', {}):
                sobretaxa = SIMULATED_DB['sobretaxas'][cargo_data['nome']]
                results.append(f"Existe uma sobretaxa de {((sobretaxa - 1) * 100):.0f}% para {cargo_data['nome']}.")

    # --- Check for Pricing Queries ---
    if any(keyword in normalized_inquiry for keyword in pricing_keywords) and not results:
        # If specific destination/cargo not mentioned, give general pricing info or ask for more details
        if not found_destinations and not found_cargo_types:
            results.append("Para cotações, por favor indique o destino e o tipo de carga. Os nossos preços base variam consoante o destino (ex: Lisboa 0.5€/kg, Madrid 1.2€/kg) e tipo de carga.")
        elif not found_destinations:
            results.append("Para que destino seria a cotação?")
        elif not found_cargo_types:
            results.append("Que tipo de carga pretende transportar para lhe darmos uma cotação?")

    # --- Check for Transit Time Queries ---
    # This is a more complex part, as transit times depend on origin, destination, and cargo type.
    # For simplicity, we'll look for matches in the predefined transit time entries.
    if any(keyword in normalized_inquiry for keyword in transit_time_keywords):
        specific_transit_found = False
        for tt_entry in SIMULATED_DB.get('tempos_transito', []):
            match_destination = normalize_text(tt_entry['destino']) in normalized_inquiry or not found_destinations
            match_cargo_type = normalize_text(tt_entry['tipo_carga']) in normalized_inquiry or not found_cargo_types
            
            # Prioritize if both destination and cargo type from query match an entry
            if (normalize_text(tt_entry['destino']) in normalized_inquiry and normalize_text(tt_entry['tipo_carga']) in normalized_inquiry):
                results.append(f"O tempo de trânsito estimado para {tt_entry['tipo_carga']} para {tt_entry['destino']} é de {tt_entry['tempo_estimado_dias']}.")
                specific_transit_found = True
                break # Found a very specific match
            # If only one matches or it's a general query for transit times
            elif (found_destinations and normalize_text(tt_entry['destino']) in [normalize_text(d) for d in found_destinations]) or \
                 (found_cargo_types and normalize_text(tt_entry['tipo_carga']) in [normalize_text(ct) for ct in found_cargo_types]):
                if f"O tempo de trânsito estimado para {tt_entry['tipo_carga']} para {tt_entry['destino']} é de {tt_entry['tempo_estimado_dias']}." not in results:
                     results.append(f"O tempo de trânsito estimado para {tt_entry['tipo_carga']} para {tt_entry['destino']} é de {tt_entry['tempo_estimado_dias']}.")
                     specific_transit_found = True # Found at least one relevant transit time
        
        if not specific_transit_found and not any("tempo de trânsito estimado" in r for r in results):
            if found_destinations and found_cargo_types:
                 results.append(f"Para obter o tempo de trânsito exato para {', '.join(found_cargo_types)} para {', '.join(found_destinations)}, por favor contacte-nos ou consulte a nossa tabela detalhada.")
            elif found_destinations:
                results.append(f"Os tempos de trânsito para {', '.join(found_destinations)} variam. Por exemplo, para Lisboa é geralmente 1-2 dias úteis para paletes. Qual o tipo de carga?")
            elif found_cargo_types:
                results.append(f"Os tempos de trânsito para {', '.join(found_cargo_types)} variam consoante o destino. Para que destino seria?")
            else:
                results.append("Os nossos tempos de trânsito variam consoante o destino e o tipo de carga. Por exemplo, Lisboa para paletes demora 1-2 dias úteis. Pode especificar o seu pedido?")

    # --- Check for General Service Queries ---
    if any(keyword in normalized_inquiry for keyword in general_service_keywords) and not results:
        results.append("Oferecemos serviços de transporte de carga para vários destinos, incluindo paletes, contentores, carga refrigerada e mercadorias perigosas. Como podemos ajudar?")

    # If no specific information was found after all checks
    if not results:
        results.append("Lamentamos, mas não encontrámos informação específica para o seu pedido. Poderia reformular a sua questão ou perguntar sobre destinos, tipos de carga, preços ou tempos de trânsito?")

    # Remove duplicate results before returning
    return list(dict.fromkeys(results))

# Example Usage (for testing purposes):
if __name__ == "__main__":
    # Test cases
    queries = [
        "Olá, fazem transporte para Lisboa?",
        "Qual o preço para Madrid?",
        "Transportam paletes?",
        "E mercadorias perigosas para o Porto?",
        "Quanto tempo demora para Paris com carga refrigerada?",
        "Informação sobre contentores",
        "Custo para Braga",
        "Tempo de trânsito para Faro",
        "Serviços",
        "Transportam pianos?", # Should result in 'not found'
        "Quanto custa levar umas caixas para o Porto?", # Generic, should ask for more details or give Porto price
        "qual o preco para paletes para lisboa"
    ]

    if SIMULATED_DB:
        for q in queries:
            print(f"--- User Inquiry: {q} ---")
            response = get_cargo_info(q)
            for line in response:
                print(f"Chatbot: {line}")
            print("\n")
    else:
        print("Simulated database could not be loaded. Cannot run tests.")


