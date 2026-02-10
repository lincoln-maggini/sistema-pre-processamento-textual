from flask import Blueprint
from controllers.excluirProcessos_controller import excluir_processo_controller

excluir_bp = Blueprint("excluir_bp", __name__)

@excluir_bp.route("/api/excluir-processo", methods=["DELETE"])
def excluir_processo_route():
    return excluir_processo_controller()

def setup_excluirProcessos_routes(app):
    app.register_blueprint(excluir_bp)