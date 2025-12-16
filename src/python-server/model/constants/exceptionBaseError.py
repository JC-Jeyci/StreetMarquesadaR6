import json

class ExceptionBaseError(Exception):
    def __init__(self, data, message):
        super().__init__(message)
        self.data = data
        self.message = message
        
    def to_json(self):
        result = {
            "code": self.code,
            "data": self.data,
            "message": self.message
        }
        
        return json.dumps(result)
        
    def __str__(self):
        return f"[Error {self.code}] {self.message}: {self.data}"


class ExceptionBaseResponseError(Exception):
    def __init__(self, code, data, message, status):
        super().__init__(message)
        self.code = code
        self.data = data
        self.message = message
        self.status = status
        
    def to_json(self):
        result = {
            "response":{
                "code": self.code,
                "data": self.data,
                "message": self.message
            },
            "status": self.status
        }
        
        return json.dumps(result)
        
    def __str__(self):
        return f"[Response {self.status}] {self.message}: {self.data}"
    

class ExceptionBaseResponseJsonError(Exception):
    def __init__(self, json_data):
        super().__init__(json_data.get('message'))
        self.code = json_data.get('code')
        self.data = json_data.get('data')
        self.message = json_data.get('message')
        self.status = json_data.get('status')
        
    def to_json(self):
        result = {
            "response":{
                "code": self.code,
                "data": self.data,
                "message": self.message
            },
            "status": self.status
        }
        
        return json.dumps(result)
        
    def __str__(self):
        return f"[code {self.code}] {self.message}: {self.data}"


class ErrorHandlerProcess(ExceptionBaseResponseJsonError):
    # Si no hay parametros a personalizar solo dejamos el "pass", caso contrario
    # debes declarar los valores a enviar y quitar el "pass"
    pass
    
