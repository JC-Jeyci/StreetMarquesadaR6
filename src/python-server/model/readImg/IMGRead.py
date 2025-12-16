from PIL import Image, ImageOps
import os
from model.constants.exceptionBaseError import ErrorHandlerProcess
from model.constants.responseError import ResponseError
responseError = ResponseError()

class IMGRead:
    
    def procesarDimensionesImg(self, img_path, img_name):
        try:
            borde_px=5
            ruta = './model/img/img_captcha'
            img_directorio= os.path.join(ruta, img_name + ".png")
            print(img_path)
            with Image.open(img_path) as img:
                #Este codigo es por si las imagen salen con una linea negra antes de aumentar el tamaño
                #area_recortada = img.crop((0, 2, 119, 38))
                #resized_img = area_recortada.resize((200, 64))
                
                #Este codigo es para las imagenes que vienen sin linea
                resized_img = img.resize((200, 64))
                #resized_img.save(img_directorio)
                
                #Este codigo es para agregar un borde blanco a la imagen y que pueda leer las letras que vienen muy pegadas a los lados
                borde_imagen = ImageOps.expand(resized_img, border=borde_px, fill="white")
                borde_imagen.save(img_directorio)
                
            if os.path.exists(img_directorio):
                return {"ruta": img_directorio}
            else:
                raise ErrorHandlerProcess(responseError.pathNotResult("No se encontro la imagen modificada para el captcha"))
        except ErrorHandlerProcess as ehp:
            raise
        except Exception as ex:
            
            print(str(ex))
            raise ErrorHandlerProcess(responseError.process("Error al tratar de modificar el tamaño de la imagen"))
    