from flask import jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash
from models.usuario_model import usuarioModel
import jwt
import datetime 
from datetime import timezone   

SECRET_KEY = "matheuselincoln123"

class usuarioController:

    @staticmethod
    def registrar_usuario():
        data = request.get_json()
        nome = data.get("nome")
        email = data.get("email")
        telefone = data.get("telefone")
        senha = data.get("senha")

        if not all([nome, email, telefone, senha]):
            return jsonify({"erro": "Preencha todos os campos."}), 400

        if usuarioModel.get_usuario_email(email):
            return jsonify({"erro": "E-mail já cadastrado."}), 400

        senha_hash = generate_password_hash(senha)
        usuarioModel.criar_usuario(nome, email,telefone, senha_hash)
        return jsonify({"mensagem": "Usuário cadastrado com sucesso!"}), 201

    @staticmethod
    def login():
        data = request.get_json()
        email = data.get("email", "").strip()
        senha = data.get("senha", "").strip()

        if not email or not senha:
            return jsonify({"erro": "Preencha todos os campos."}), 400

        usuario = usuarioModel.get_usuario_email(email)
        if not usuario:
            return jsonify({"erro": "Usuário não encontrado."}), 404

        if not check_password_hash(usuario["senha"], senha):
            return jsonify({"erro": "Senha incorreta."}), 401
        
        expiration_time = datetime.datetime.now(timezone.utc) + datetime.timedelta(hours=2)

        token = jwt.encode({
            "usuario_id": usuario["id"],
            "usuario_nome": usuario["nome"],
            "tempo": int(expiration_time.timestamp())
        }, SECRET_KEY, algorithm="HS256")

        if isinstance(token, bytes):
            token = token.decode("utf-8")

        return jsonify({
            "mensagem": "Login realizado com sucesso!",
            "token": token,
            "usuario": {
                "id": usuario["id"],
                "nome": usuario["nome"],
                "email": usuario["email"]
            }
        }), 200

    @staticmethod
    def obter_dados_usuario():
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer"):
            return jsonify({"erro": "Token ausente."}), 401

        token = auth.split(" ")[1]

        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"erro": "Sessão expirada."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"erro": "Token inválido."}), 401

        usuario = usuarioModel.get_usuario_id(decoded["usuario_id"])
        if not usuario:
            return jsonify({"erro": "Usuário não encontrado."}), 404

        return jsonify({
            "id": usuario["id"],
            "nome": usuario["nome"],
            "email": usuario["email"],
            "telefone": usuario.get("telefone"),
            "dataCriacao": usuario["dataCriacao"].strftime("%d/%m/%Y") if usuario.get("dataCriacao") else ""
        }), 200
    
    @staticmethod
    def atualizar_usuario():
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer"):
            return jsonify({"erro": "Token ausente."}), 401

        token = auth.split(" ")[1]
        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"erro": "Sessão expirada."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"erro": "Token inválido."}), 401

        usuario_id = decoded["usuario_id"]
        data = request.get_json()
        nome = data.get("nome")
        email = data.get("email")
        telefone = data.get("telefone")
        senha = data.get("senha")

        if not all([nome, email]):
            return jsonify({"erro": "Nome e email são obrigatórios."}), 400

        senha_hash = generate_password_hash(senha) if senha else None

        updated = usuarioModel.atualizar_usuario(usuario_id, nome, email, telefone, senha_hash)
        if not updated:
            return jsonify({"erro": "Erro ao atualizar usuário."}), 500

    # gera um novo token atualizado
        expiration_time = datetime.datetime.now(timezone.utc) + datetime.timedelta(hours=2)

        new_token = jwt.encode({
            "usuario_id": usuario_id,
            "usuario_nome": nome,
            "tempo": int(expiration_time.timestamp())
            }, SECRET_KEY, algorithm="HS256")

        if isinstance(new_token, bytes):
            new_token = new_token.decode("utf-8")

        return jsonify({
            "mensagem": "Perfil atualizado com sucesso!",
            "token": new_token
        }), 200
