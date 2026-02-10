import json
from db import get_connection

# insere um novo processo e suas etapas no banco de dados
# retorna o ID do processo inserido
def salvar_processo(processo_data):

    usuario_id = processo_data.get("usuario_id")
    if not usuario_id:
        raise ValueError("Usuario ID é obrigatório para salvar processos.")
    conn = get_connection()
    cursor = conn.cursor()

    try:        
        # inserção na tabela processos
        query_processo = """
            INSERT INTO processos (user_id, nome, texto_original, texto_final)
            VALUES (%s, %s, %s, %s)
        """

        cursor.execute(query_processo, (
            processo_data.get("usuario_id"),
            processo_data.get("nome_processo"),
            processo_data["texto_original"],
            processo_data.get("texto_final")
        ))

        processo_id = cursor.lastrowid

        # inserção das etapas
        etapas = processo_data.get("resultados_etapas", [])
        query_etapa = """
            INSERT INTO processo_etapas (processo_id, ordem_index, etapa_nome, resultado_texto, dados_grafico, tipo_grafico)
            VALUES (%s, %s, %s, %s, %s, %s)
        """

        for etapa in etapas:
            dados_grafico_json = json.dumps(etapa.get("dados_grafico")) if etapa.get("dados_grafico") else None

            cursor.execute(query_etapa, (
                processo_id,
                etapa.get("ordem_index", 0),
                etapa.get("etapa"),
                etapa.get("texto"),
                dados_grafico_json,
                etapa.get("tipo_grafico")
            ))

        conn.commit()
        return processo_id

    except Exception as e:
        conn.rollback()
        raise e

    finally:
        cursor.close()
        conn.close()