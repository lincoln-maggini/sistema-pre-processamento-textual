from flask import Blueprint
from controllers.renomearProcessos_controller import renomear_processo_controller

renomear_bp = Blueprint("renomear_bp", __name__)

@renomear_bp.route("/api/renomear-processo", methods=["PUT"])
def renomear_processo_route():
    return renomear_processo_controller()

def setup_renomearProcessos_routes(app):
    app.register_blueprint(renomear_bp)
