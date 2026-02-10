import json
from db import get_connection

# atualiza um processo existente e suas etapas no banco de dados.
# verifica se o processo pertence ao usuário.
# processo_data: dicionário similar ao de salvar.
# retorna o id do processo atualizado.
def atualizar_processo(processo_data, processo_id, usuario_id):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # verifica se o processo pertence ao usuário
        cursor.execute("SELECT user_id FROM processos WHERE id = %s", (processo_id,))
        result = cursor.fetchone()
        if not result or result[0] != usuario_id:
            raise ValueError("Processo não encontrado ou não pertence ao usuário.")

        # atualiza a tabela processos
        query_processo = """
            UPDATE processos
            SET nome = %s, texto_original = %s, texto_final = %s
            WHERE id = %s
        """
        cursor.execute(query_processo, (
            processo_data.get("nome_processo"),
            processo_data["texto_original"],
            processo_data.get("texto_final"),
            processo_id
        ))

        # deleta etapas existentes
        cursor.execute("DELETE FROM processo_etapas WHERE processo_id = %s", (processo_id,))

        # insere novas etapas
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