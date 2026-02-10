from flask import jsonify, request
from models.carregarProcessos_model import carregar_processo_por_id
import jwt

SECRET_KEY = "matheuselincoln123"

def carregar_processo_controller():
    try:
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer "):
            return jsonify({"success": False, "error": "Token ausente. Faça login."}), 401

        token = auth.split(" ")[1]
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"], options={"verify_tempo": False})
        usuario_id = decoded["usuario_id"]

        processo_id = request.args.get("id")
        if not processo_id:
            return jsonify({"success": False, "error": "ID do processo é obrigatório."}), 400

        processo = carregar_processo_por_id(processo_id=processo_id, usuario_id=usuario_id)
        return jsonify({"success": True, "processo": processo}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "error": "Sessão expirada."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "error": "Token inválido."}), 401
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500