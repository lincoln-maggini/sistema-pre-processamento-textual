from flask import jsonify, request
from models.excluirProcessos_model import excluir_processo
import jwt

SECRET_KEY = "matheuselincoln123"

def excluir_processo_controller():
    try:
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer"):
            return jsonify({"success": False, "error": "Token ausente. Faça login."}), 401

        token = auth.split(" ")[1]
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"], options={"verify_tempo": False})
        usuario_id = decoded["usuario_id"]

        data = request.get_json()
        processo_id = data.get("processo_id")

        if not processo_id:
            return jsonify({"success": False, "error": "Dados incompletos."}), 400

        sucesso = excluir_processo(processo_id, usuario_id)

        if sucesso:
            return jsonify({"success": True, "message": "Processo excluído com sucesso."}), 200
        else:
            return jsonify({"success": False, "error": "Processo não encontrado ou não pertence ao usuário."}), 404

    except jwt.InvalidTokenError:
        return jsonify({"success": False, "error": "Token inválido."}), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500