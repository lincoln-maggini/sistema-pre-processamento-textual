from flask import jsonify, request
from models.listarProcessos_model import listar_processos_por_usuario
import jwt

SECRET_KEY = "matheuselincoln123"

def listar_processos_controller():
    try:
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer "):
            return jsonify({"success": False, "error": "Token ausente. Faça login."}), 401

        token = auth.split(" ")[1]

        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"], options={"verify_tempo": False})
        except Exception as e:
            raise e

        usuario_id = decoded["usuario_id"]
        search = request.args.get("search", "")  # parâmetro de busca

        processos = listar_processos_por_usuario(usuario_id=usuario_id, search=search)
        return jsonify({"success": True, "processos": processos}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "error": "Sessão expirada."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "error": "Token inválido."}), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500