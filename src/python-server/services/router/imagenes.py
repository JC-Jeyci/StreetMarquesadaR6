from context import app
from controller.Imagenes import Imagenes

@app.route('/imagenes/leerImagen', methods=['POST'])
def post_activar_numero_street():
    try:
        result = Imagenes.procesarImagen()
        
        print(result)
        
        if result["code"] == 1:
            return ({"code": 0, "data":result["data"], "message": "peticion realizada correctamente"}), 200
        else :
            return ({"code": 15, "data":result["data"], "message": "Fallas al leer la imagen"}), 400
        
    except Exception as ex:
        return ({"code": 15, "data":str(ex), "message": "Fallas al leer la imagen"}), 500