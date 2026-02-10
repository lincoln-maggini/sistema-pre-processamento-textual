from flask import Blueprint
from controllers.realizarProcessos_controller import processar_texto_controller

realizar_processos_bp = Blueprint("realizar_processos_bp", __name__)

@realizar_processos_bp.route("/api/processar-texto", methods=["POST"])
def processar_texto_route():
    return processar_texto_controller()

def setup_realizarProcessos_routes(app):
    app.register_blueprint(realizar_processos_bp)
