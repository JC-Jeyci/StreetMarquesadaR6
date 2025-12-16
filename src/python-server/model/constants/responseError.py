class ResponseError :
    
    def notResult(self, msg):
        return {"code": 23, "message": msg, "data": "S/R", "status": 400}
    
    def invalidInformation(self):
        return {"code": 23, "message": "Favor de verificar la información del numero a recargar", "data": "S/R", "status": 400}

    # Errores captcha e imagen
    def pathNotResult(self, msg):
        return {"code": 31, "message": msg, "data": "S/R", "status": 400}
    
    def fileNotSave(self, msg):
        return {"code": 32, "message": msg, "data": "S/R", "status": 400}
    
    def imgNotFormat(self, msg):
        return {"code": 33, "message": msg, "data": "S/R", "status": 400}
    
    def process(self, msg="Error en el proceso"):
        return {"code":15, "message": msg, "data": "S/R", "status": 500}


    # Errores Telcel
    def fallaTelcel(self):
        return {"code":40, "message": "Fallas en el portal de telcel, espere 3 minutos y vuelva a intentar de nuevo", "data": "S/R", "status": 400}
    
    def timeoutTelcel(self):
        return {"code":41, "message": "Tiempo de espera agotado en el portal de telcel", "data": "S/R", "status": 400}


    # Errores de html pagina
    def itemNotFound(self):
        return {"code":50, "message": "Elemento no encontrado en la busqueda", "data": "S/R", "status": 400}