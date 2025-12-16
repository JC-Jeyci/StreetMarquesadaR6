from model.readImg.IMGRead import IMGRead
from model.readImg.IMGPreditor import IMGPreditor
from model.constants.exceptionBaseError import ErrorHandlerProcess
from model.constants.responseError import ResponseError
responseError = ResponseError()

class ImagenStreet:
    
    def procesarImagenFolio(self, path_img, name_img):
        try:  
            imgRead = IMGRead()
            imgData = imgRead.procesarDimensionesImg(path_img, name_img)
            
            imgPreditor = IMGPreditor()
            dataCodigo = imgPreditor.procesarImagenTexto(imgData["ruta"])
            
            print(dataCodigo)
            return dataCodigo
        
        except ErrorHandlerProcess as ehp:
            raise
        except Exception as ex:
            raise ErrorHandlerProcess(responseError.process(str(ex)))