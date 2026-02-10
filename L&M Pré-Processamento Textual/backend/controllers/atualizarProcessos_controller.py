from flask import jsonify, request
from models.atualizarProcessos_model import atualizar_processo
import jwt

SECRET_KEY = "matheuselincoln123"

def atualizar_processo_controller(processo_id):
    try:
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer "):
            return jsonify({"success": False, "error": "Token ausente. Faça login."}), 401

        token = auth.split(" ")[1]
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        usuario_id = decoded["usuario_id"]

        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Corpo da requisição vazio"}), 400

        # atualiza o processo
        processo_id_atualizado = atualizar_processo(data, processo_id, usuario_id)
        return jsonify({"success": True, "message": "Processo atualizado com sucesso!", "processo_id": processo_id_atualizado}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "error": "Sessão expirada."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "error": "Token inválido."}), 401
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 403
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500