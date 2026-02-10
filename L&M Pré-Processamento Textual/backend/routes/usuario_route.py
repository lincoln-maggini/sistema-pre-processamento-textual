from flask import Blueprint
from controllers.usuario_controller import usuarioController

usuario_bp = Blueprint("usuario_bp", __name__)

@usuario_bp.route("/api/registrar", methods=["POST"])
def registrar_usuario_route():
    return usuarioController.registrar_usuario()

@usuario_bp.route("/api/login", methods=["POST"])
def login_usuario_route():
    return usuarioController.login()

@usuario_bp.route("/api/usuario", methods=["GET"])
def obter_usuario_route():
    return usuarioController.obter_dados_usuario()

@usuario_bp.route("/api/usuario", methods=["PUT"])
def atualizar_usuario_route():
    return usuarioController.atualizar_usuario()

def setup_usuario_routes(app):
    app.register_blueprint(usuario_bp)
