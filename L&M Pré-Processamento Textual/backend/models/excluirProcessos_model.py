from db import get_connection

def excluir_processo(processo_id, usuario_id):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        query = """
            DELETE FROM processos
            WHERE id = %s AND user_id = %s
        """
        cursor.execute(query, (processo_id, usuario_id))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        raise e
    finally:
        cursor.close()
        conn.close()