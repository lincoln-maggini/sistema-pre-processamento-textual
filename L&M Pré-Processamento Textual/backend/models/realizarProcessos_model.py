import unicodedata
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer

# ações de pré-processamento de texto
def remover_acentos(texto):
    norm = unicodedata.normalize('NFD', texto)
    return ''.join(ch for ch in norm if unicodedata.category(ch) != 'Mn')

def remover_numeros(texto):
    return re.sub(r'\d+', '', texto)

def remover_caracteres_especiais(texto):
    return re.sub(r'[^\w\s]', '', texto)

def converter_minusculas(texto):
    return texto.lower()

def remover_stopwords(texto):
    sw = set(stopwords.words('portuguese'))
    return " ".join(p for p in texto.split() if p.lower() not in sw)

def aplicar_stemming(texto):
    stemmer = SnowballStemmer('portuguese')
    return " ".join(stemmer.stem(p) for p in texto.split())

def ranking_palavras(texto):
    palavras = texto.split()
    contagem = {}
    for palavra in palavras:
        if palavra in contagem:
            contagem[palavra] += 1
        else:
            contagem[palavra] = 1
    
    # ordena os itens do dicionário por contagem em ordem decrescente
    ranking_ordenado = sorted(contagem.items(), key=lambda item: item[1], reverse=True)
    return ranking_ordenado

# mapeamento de ids para funções
PROCESSADORES = {
    "numeros": remover_numeros,
    "caracteres": remover_caracteres_especiais,
    "acentos": remover_acentos,
    "minusculas": converter_minusculas,
    "stopwords": remover_stopwords,
    "stemming": aplicar_stemming,
    "ranking": ranking_palavras,
}

# mapeamento de ids para nomes descritivos
NOMES_ETAPAS = {
    "numeros": "Remover Números",
    "caracteres": "Remover Caracteres Especiais",
    "acentos": "Remover Acentos",
    "minusculas": "Converter para Minúsculas",
    "stopwords": "Remover Stopwords",
    "stemming": "Aplicar Stemming",
    "ranking": "Ranking de palavras",
}

# processa o texto em uma sequências de etapas e retorna os resultados de cada uma
def limpar_texto(texto, ordem_etapas, configs_ranking=None):
    resultados_etapa = [{"etapa": "Texto Original", "texto": texto}]
    texto_atual = texto
    ranking_counter = 0

    for etapa_id in ordem_etapas:
        if etapa_id in PROCESSADORES:
            nome_etapa = NOMES_ETAPAS.get(etapa_id, etapa_id)
            
            # condição para aplicar o ranking.
            if etapa_id == "ranking":
                config_ranking = configs_ranking[ranking_counter] if configs_ranking and ranking_counter < len(configs_ranking) else None
                limite_ranking = config_ranking['limite'] if config_ranking else None
                tipo_grafico = config_ranking['grafico'] if config_ranking else None
                
                # ranking sempre deve ser aplicado ao texto mais recente, mas não deve alterá-lo para a próxima etapa.
                resultado_ranking = PROCESSADORES[etapa_id](texto_atual)
                
                if limite_ranking is not None:
                    resultado_ranking = resultado_ranking[:limite_ranking]
    
                dados_grafico = resultado_ranking
                resultado_texto_exibicao = "\n".join(f"{p}: {c}" for p, c in resultado_ranking)
    
                resultados_etapa.append({
                    "etapa": nome_etapa, 
                    "texto": resultado_texto_exibicao,
                    "dados_grafico": dados_grafico,
                    "tipo_grafico": tipo_grafico
                })
                
                ranking_counter += 1
            
            else:
                texto_atual = PROCESSADORES[etapa_id](texto_atual)
                resultados_etapa.append({"etapa": nome_etapa, "texto": texto_atual})

    return resultados_etapa

# configuração do nltk
nltk.download('stopwords', quiet=True)
nltk.download('punkt', quiet=True)