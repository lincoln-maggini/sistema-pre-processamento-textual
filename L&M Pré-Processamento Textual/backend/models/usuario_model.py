from db import get_connection

class usuarioModel:
    @staticmethod
    def criar_usuario(nome, email,telefone, senha_hash):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO usuarios (nome, email, telefone, senha) VALUES (%s, %s, %s, %s)",
            (nome, email, telefone, senha_hash)
        )
        conn.commit()
        cursor.close()
        conn.close()

    @staticmethod
    def get_usuario_email(email):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM usuarios WHERE email=%s", (email,))
        usuario = cursor.fetchone()
        cursor.close()
        conn.close()
        return usuario

    @staticmethod
    def get_usuario_id(usuario_id):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM usuarios WHERE id=%s", (usuario_id,))
        usuario = cursor.fetchone()
        cursor.close()
        conn.close()
        return usuario

    @staticmethod
    def atualizar_usuario(usuario_id, nome, email, telefone, senha_hash=None):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            if senha_hash:
                cursor.execute(
                    "UPDATE usuarios SET nome=%s, email=%s, telefone=%s, senha=%s WHERE id=%s",
                    (nome, email, telefone, senha_hash, usuario_id)
                )
            else:
                cursor.execute(
                    "UPDATE usuarios SET nome=%s, email=%s, telefone=%s WHERE id=%s",
                    (nome, email, telefone, usuario_id)
                )
            conn.commit()
            return True
        except:
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()