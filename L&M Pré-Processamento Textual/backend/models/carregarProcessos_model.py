import json
from db import get_connection

def carregar_processo_por_id(processo_id, usuario_id):
    if not processo_id or not usuario_id:
        raise ValueError("Processo ID e Usuario ID são obrigatórios.")
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # obter o processo principal
        query_processo = """
            SELECT id, nome, texto_original, texto_final, criado_em
            FROM processos
            WHERE id = %s AND user_id = %s
        """
        cursor.execute(query_processo, (processo_id, usuario_id))
        processo = cursor.fetchone()
        if not processo:
            raise ValueError("Processo não encontrado ou não pertence ao usuário.")

        # obter as etapas ordenadas por ordem_index
        query_etapas = """
            SELECT ordem_index, etapa_nome, resultado_texto, dados_grafico, tipo_grafico
            FROM processo_etapas
            WHERE processo_id = %s
            ORDER BY ordem_index ASC
        """
        cursor.execute(query_etapas, (processo_id,))
        etapas = cursor.fetchall()

        # converter dados_grafico de JSON string para dict/list se existir
        for etapa in etapas:
            if etapa['dados_grafico']:
                etapa['dados_grafico'] = json.loads(etapa['dados_grafico'])

        return {
            "id": processo['id'],
            "nome": processo['nome'],
            "texto_original": processo['texto_original'],
            "texto_final": processo['texto_final'],
            "criado_em": processo['criado_em'],
            "etapas": etapas
        }
    except Exception as e:
        raise e
    finally:
        cursor.close()
        conn.close()