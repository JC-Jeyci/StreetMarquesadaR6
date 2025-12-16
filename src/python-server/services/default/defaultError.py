from flask import jsonify

def page_not_found(self):
    return jsonify({"code": 1, "data": "Ruta no definida", "message": "Ruta no definida"}), 404

def error_interno_server(self):
    return jsonify({"code": 1, "data": "Error interno del servidor", "message": "Error interno del servidor"}), 500