from flask import Flask
from flask_cors import CORS
from routes.realizarProcessos_route import setup_realizarProcessos_routes
from routes.salvarProcessos_route import setup_salvarProcessos_routes
from routes.atualizarProcessos_routes import setup_atualizarProcessos_routes
from routes.listarProcessos_route import setup_listarProcessos_routes
from routes.renomearProcessos_route import setup_renomearProcessos_routes
from routes.excluirProcessos_route import setup_excluirProcessos_routes
from routes.carregarProcessos_route import setup_carregarProcessos_routes
from routes.usuario_route import setup_usuario_routes

app = Flask(__name__)
CORS(app)

setup_realizarProcessos_routes(app)
setup_salvarProcessos_routes(app)
setup_atualizarProcessos_routes(app)
setup_listarProcessos_routes(app)
setup_renomearProcessos_routes(app)
setup_excluirProcessos_routes(app)
setup_carregarProcessos_routes(app)
setup_usuario_routes(app)

if __name__ == "__main__":
    app.run(debug=True)