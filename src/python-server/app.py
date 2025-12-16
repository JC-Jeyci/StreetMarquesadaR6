from context import app
from model.constants.config import config
from services.default.defaultError import page_not_found
from services.router import *

if __name__ == '__main__':
    #Configuracion del servidor
    app.config.from_object(config['development'])
    #selenium_thread = Thread(target=start_selenium_service)
    #selenium_thread.start()
    #selenium_thread.join()
    #Error handlers
    #Error handlers
    app.register_error_handler(404, page_not_found)
    app.run(port="2000", host="0.0.0.0")