from flask import jsonify, request
from models.salvarProcessos_model import salvar_processo
import jwt

SECRET_KEY = "matheuselincoln123"

def salvar_processo_controller():
    try:
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer"):
            return jsonify({"success": False, "error": "Token ausente. Faça login."}), 401

        token = auth.split(" ")[1]
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        usuario_id = decoded["usuario_id"]

        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Corpo da requisição vazio"}), 400

        data["usuario_id"] = usuario_id

        processo_id = salvar_processo(data)
        return jsonify({"success": True, "message": "Processo salvo com sucesso!", "processo_id": processo_id}), 201

    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "error": "Sessão expirada."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "error": "Token inválido."}), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500