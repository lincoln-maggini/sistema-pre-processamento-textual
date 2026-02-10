from flask import Blueprint
from controllers.salvarProcessos_controller import salvar_processo_controller

save_bp = Blueprint('save_bp', __name__)

@save_bp.route('/api/salvar-processo', methods=['POST'])
def salvar_processo_route():
    return salvar_processo_controller()

def setup_salvarProcessos_routes(app):
    app.register_blueprint(save_bp)
