class response {
    // PETICIÓN COMPLETADA CORRECTAMENTE
    success(data,msg) {
        let object = {response: {code: 0, data: data || 'S/R', message: msg || 'Petición realizada exitosamente'}, status: 200}
        return object
    }

    keyFound(data) {
        let object = {response: {code: 2, data: data, message: 'Petición realizada exitosamente'}, status: 202}
        return object
    }

    /* -- VALIDACIONES --  -- VALIDACIONES --  -- VALIDACIONES --  -- VALIDACIONES --  -- VALIDACIONES --  -- VALIDACIONES -- */
    requestValidation(msg) {
        let object = {response: {code: 20, data: 'S/R', message: msg || 'Parámetros incorrectos'}, status: 400}
        return object;
    }

    processValidation(message) {
        let object = {response: {code: 21, data: 'error', message: message}, status: 400}
        return object
    }

    duplicateParameter(message) {
        let object = {response: {code: 22, data: 'error', message: message}, status: 400}
        return object
    }

    noResult(message) {
        let object = {response: {code: 23, data: 'S/R', message: message}, status: 400}
        return object
    }

    authentication(message) {
        let object = {response: {code: 24, data: 'err', message: message}, status: 401}
        return object
    }

    // Token
    authenticationTK(message) {
        let object = {response: {code: 25, data: 'No Autorizado', message: message}, status: 401}
        return object
    }

    longParameter(message) {
        let object = {response: {code: 26, data: 'error', message: message}, status: 431}
        return object
    }

    methodNotAllowed(message) {
        let object = {response: {code: 27, data: 'error', message: message}, status: 405}
        return object
    }

    noMatchCoincidence(data, msg){
        let object = {response: {code: 29, data: data || 'S/R', message: msg || 'Error de imei'}, status: 400}
        return object
    }

    processValidationData(data) {
        let object = {response: {code: 30, data: data || 'S/R', message: "Informacion no encontrada"}, status: 400}
        return object
    }

    processBuildSelenium(data){
        let object = {response: {code: 31, data: data || 'S/R', message: "Error en Selenium"}, status: 400}
        return object
    }

    /* -- ERRORES --  -- ERRORES --  -- ERRORES --  -- ERRORES --  -- ERRORES --  -- ERRORES --  -- ERRORES --  -- ERRORES -- */
    dataBase(data) {
        let object = {response: {code: 11, data: 'S/R', message: 'Error conexión fallida'}, status: 500}
        return object
    }

    query(data, message) {
        let object = {response: {code: 12, data: 'S/R', message: message || 'Error de petición'}, status: 500}
        return object
    }

    mailer(data) {
        let object = {response: {code: 14, data: data, message: 'Error de envío de correo electrónico'}, status: 500}
        return object
    }

    process(data, msg) {
        let object = {response: {code: 15, data: data || 'S/R', message: msg ||'Error interno del servidor'}, status: 500}
        return object
    }

    update(data, message) {
        let object = {response: {code: 16, data: data, message: message}, status: 500}
        return object
    }

    sesion(data, message) {
        let object = {response: {code: 17, data: data, message: message}, status: 200}
        return object
    }

    connectAWS(data, message){
        let object = {response: {code: 18, data: data || 'S/R', message: message || "Error conexion con AWS"}, status: 500}
        return object
    }

    // Errores Pagina Recargas
    fallaRecarga(data, message){
        let object = {response: {code: 50, data: data || 'S/R', message: message ||'Fallas al realizar la recarga'}, status: 400}
        return object
    }

    fallaPagina(){
        let object = {response: {code: 51, data: 'S/R', message: 'Fallas en la pagina de recargas'}, status: 400}
        return object
    }

    pageConfig(){
        let object = {response: {code: 52, data: 'S/R', message: 'Volviendo a configurar pagina'}, status: 400}
        return object
    }

    pageSaldo(){
        let object = {response: {code: 53, data: 'S/R', message: 'Saldo agotado'}, status: 400}
        return object
    }


   // ENVIAR RESPUESTA DE LAS PETICIONES
    send(response, obj) {
        return response.status(obj.status).json(obj.response)
    }

    sendBadRequest(response) {
        return response.status(400).json({code: 20, data: 'S/R', message: 'Parámetros incorrectos'})
    }
}

module.exports = response