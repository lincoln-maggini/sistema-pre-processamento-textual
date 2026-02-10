from flask import Blueprint
from controllers.listarProcessos_controller import listar_processos_controller

processos_bp = Blueprint("processos_bp", __name__)

@processos_bp.route("/api/listar-processos", methods=["GET"])
def listar_processos_route():
    return listar_processos_controller()

def setup_listarProcessos_routes(app):
    app.register_blueprint(processos_bp)
