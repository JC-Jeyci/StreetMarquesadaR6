from flask import request, jsonify
from model.process.ImagenStreet import ImagenStreet

class Imagenes:
    
    def procesarImagen():
        try:
            dataImagen = request.json
            
            path_img = dataImagen["path_img"]
            name_img = dataImagen["name_img"]
    
            imagenStreet = ImagenStreet()
            result = imagenStreet.procesarImagenFolio(path_img, name_img)
            
            return {"code": 1, "data":{"folio": result["codigo"]}, "message": "Peticion correcta"}
        except Exception as ex:
            print(str(ex))
            return str(ex)