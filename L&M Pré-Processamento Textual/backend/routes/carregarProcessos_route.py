from flask import Blueprint
from controllers.carregarProcessos_controller import carregar_processo_controller

carregar_processo_bp = Blueprint("carregar_processo_bp", __name__)

@carregar_processo_bp.route("/api/carregar-processo", methods=["GET"])
def carregar_processo_route():
    return carregar_processo_controller()

def setup_carregarProcessos_routes(app):
    app.register_blueprint(carregar_processo_bp)