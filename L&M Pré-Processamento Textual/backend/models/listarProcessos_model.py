from db import get_connection

def listar_processos_por_usuario(usuario_id, search=''):
    if not usuario_id:
        raise ValueError("Usuario ID é obrigatório.")
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT id, nome, texto_original, texto_final, criado_em
            FROM processos
            WHERE user_id = %s
        """
        params = [usuario_id]

        if search:
            query += " AND nome LIKE %s"
            params.append(f"%{search}%")

        query += " ORDER BY criado_em DESC"

        cursor.execute(query, params)
        resultados = cursor.fetchall()
        return resultados
    except Exception as e:
        raise e
    finally:
        cursor.close()
        conn.close()