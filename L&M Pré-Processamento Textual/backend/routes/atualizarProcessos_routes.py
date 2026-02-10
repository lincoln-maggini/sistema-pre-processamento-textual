from flask import Blueprint
from controllers.atualizarProcessos_controller import atualizar_processo_controller

update_bp = Blueprint('update_bp', __name__)

@update_bp.route('/api/atualizar-processo/<int:processo_id>', methods=['PUT'])
def atualizar_processo_route(processo_id):
    return atualizar_processo_controller(processo_id)

def setup_atualizarProcessos_routes(app):
    app.register_blueprint(update_bp)