from flask import request, jsonify
from models.realizarProcessos_model import limpar_texto

# processa o texto de acordo com a ordem de etapa e retorna os resultados
def processar_texto_controller():
    data = request.get_json()
    texto = data.get("texto", "")
    ordem = data.get("ordem", [])
    configs_ranking = data.get("configs_ranking", [])

    resultados_processamento = limpar_texto(
        texto, ordem_etapas=ordem, configs_ranking=configs_ranking
    )

    return jsonify({
        "resultados_processamento": resultados_processamento
    })