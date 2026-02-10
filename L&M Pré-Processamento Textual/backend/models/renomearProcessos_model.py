from db import get_connection

def renomear_processo(processo_id, novo_nome, usuario_id):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        query = """
            UPDATE processos
            SET nome = %s
            WHERE id = %s AND user_id = %s
        """
        cursor.execute(query, (novo_nome, processo_id, usuario_id))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        raise e
    finally:
        cursor.close()
        conn.close()
