const { Builder, By, until } = require('selenium-webdriver');
const { Select } = require('selenium-webdriver/lib/select');
const path = require('path');
const crypto = require('crypto')
const Response = require('../constants/response')
const Constants = require('../constants/index')
const fs = require('fs').promises;
const axios = require('axios')
const elementos = require('../../utils/resources')
const LibMailer = require('../library/libMailer')
const libMailer = new LibMailer()
const dataMessageCorre = new Constants().dataMessageCorre()
const LibLog = require('../library/libLog')
const log = new LibLog()
const moment = require('moment-timezone');


const ValidacionesMSG = new Constants().dataValidacionesSMG()
const dataPagina = new Constants().dataPagina()
const response = new Response()

class ProcessActivacionesV2 {

    processActivacionNumeroStreetSeller(data, driver) {
        return new Promise(async (resolve, reject) => {

            try {
                let result
                let array_ventana = await driver.getAllWindowHandles()
                if (array_ventana.length == 3) {
                    let ultima_ventana = array_ventana[array_ventana.length - 1];
                    await driver.switchTo().window(ultima_ventana);

                    result = await this.llenarDatosRecarga(dataPagina.nip, data.numero, data.monto, driver)

                } else {
                    console.log("Hay demasiadas ventanas abierta");
                    return reject(response.processValidation("Demasiadas ventanas abiertas"))
                }

                return resolve(response.success(result))

            } catch (error) {
                console.log(error);

                if (error.response) {
                    return reject(error)
                }
                return reject(response.process("Error en el proceso de la funcion processActivacionNumeroStreetSeller"))
            }
        })
    }

    llenarDatosRecarga(nip_street, numero, monto, driver) {
        return new Promise(async (resolve, reject) => {

            let randomSeconds = Math.random() * (1.5 - 1.0) + 1.0;
            let randomMilliseconds = randomSeconds * 1000;

            let folio = ''
            let validacionMSG = {msg:''}

            try {
                console.log('#======= 02.1: Pestaña de recargas TAE RAM -> Recargas Amigo -> Llenando la informacion =======#');
                /* if (elementos.arrayCodes.length == 0) {

                    let dataImg = await this.capturaImgCaptcha(driver)

                    let [resultFolio, resultInfo] = await Promise.all([this.obtenerFolioImagen(dataImg), this.procesarInfoNumero(nip_street, numero, monto, driver)])

                    console.log(resultFolio);
                    folio = resultFolio.data.folio
                } else {
                    console.log("se contro el captcha");
                    folio = elementos.arrayCodes[0]
                    console.log(`El captcha es ${folio}`);
                    elementos.arrayCodes.length = 0

                    await this.procesarInfoNumero(nip_street, numero, monto, driver)
                } */

                await this.procesarInfoNumero(nip_street, numero, monto, driver)

                /* let inputCaptcha = await driver.findElement(By.xpath('//input[@id="captchaResponse"]'))
                await inputCaptcha.sendKeys(`${folio}`) */
                //await inputCaptcha.sendKeys(`p4p5p`)

                let botonVender = await driver.findElement(By.xpath('//input[@id="submitButton"]'))
                await botonVender.click()

                await driver.sleep(randomMilliseconds);

                let dataRecarga = await this.confirmarDatosRecarga(driver, validacionMSG)

                //logs
                let saldoDisponible = parseInt(elementos.saldoTotalRecargas) - parseInt(monto)
                let dataLog = { numero, monto, captcha: 'N/A', result: dataRecarga, saldoActual: saldoDisponible, tipo:'recarga' }
                log.logGenerate(dataLog).then((result) => { }).catch((error) => { })
                return resolve(dataRecarga)
            } catch (error) {
                elementos.estadoUltimaRecarga = 'Fallida'
                elementos.recargasFallidas++
                if(validacionMSG.msg == ValidacionesMSG.intermitencia || validacionMSG.msg == ValidacionesMSG.numero_no_valido){
                    elementos.intermitencia++
                } else {
                    elementos.contadorErrorRecarga++
                }
                const now = moment().tz('America/Mexico_City');
                elementos.fechaRecarga = now.format("YYYY-MM-DD HH:mm:ss")
                //logs
                if (error.response) {
                    let dataLog = { numero, monto, captcha: 'N/A', result: error.response, saldoActual: elementos.saldoTotalRecargas, tipo:'recarga' }
                    log.logGenerate(dataLog).then((result) => { }).catch((error) => { })
                    return reject(error)
                }

                let dataLog = { numero, monto, captcha: 'N/A', result: { message: "Error en el proceso en la funcion llenarDatosRecarga" }, saldoActual: elementos.saldoTotalRecargas, tipo:'recarga' }
                log.logGenerate(dataLog).then((result) => { }).catch((error) => { })
                return reject(response.process("Error en el proceso en la funcion llenarDatosRecarga"))
            } finally {
                elementos.contadorRecargas++
                elementos.estadoPagina = 0
                console.log(`El estado de la pagina es: ${elementos.estadoPagina} y el contador de recarga es:${elementos.contadorRecargas}`);

                if(elementos.contadorErrorRecarga >= 4){
                    //aqui correo de advertencia
                    elementos.contadorErrorRecarga = 0
                    libMailer.enviarCorreo(dataMessageCorre.cambiosPagina.titulo, dataMessageCorre.cambiosPagina.texto).then((result) =>{}).catch((error) =>{})
                }

                if (elementos.contadorRecargas <= 25) {
                    console.log("Caso de cerrar ventana recarga");
                    
                    this.cerrarVentaRecarga(driver)
                } else {
                    console.log("Caso de cerrar sesion y volver a iniciar");
                    
                    this.cerrarSesion(driver)

                }
            }
        })
    }

    confirmarDatosRecarga(driver, validacionMSG) {
        return new Promise(async (resolve, reject) => {

            let randomSeconds = Math.random() * (1.5 - 1.0) + 1.0;
            let randomMilliseconds = randomSeconds * 1000;

            try {
                let selector = ".modal.fade.show[id='recargar']"; // Reemplaza con tu selector CSS
                let ventanaModal = await driver.wait(until.elementLocated(By.css(selector)), 15000);
                await driver.wait(until.elementIsVisible(ventanaModal), 15000);

                let numeroConfirmar = await driver.findElement(By.xpath('//strong[@id="ConfirmModal_number"]'))
                let numero = await numeroConfirmar.getText()

                let montoConfirmar = await driver.findElement(By.xpath('//strong[@id="ConfirmModal_ammount"]'))
                let monto = await montoConfirmar.getText()

                let vigenciaConfirmar = await driver.findElement(By.xpath('//p[@id="ConfirmModal_validity"]'))
                let vigencia = await vigenciaConfirmar.getText()

                let adicionalConfirmar = await driver.findElement(By.xpath('//p[@id="ConfirmModal_add"]'))

                console.log(`El monto de la recarga es: ${monto}`);

                if (numero.length == 0 || monto == 0 || vigencia == 0) {
                    let botonCancelar = await driver.findElement(By.xpath('//div[@id="recargar"]/div/div/div[3]/button[1]'))
                    await driver.sleep(randomMilliseconds);
                    await botonCancelar.click()
                    return reject(response.processValidation("No se logro confirmar la informacion de la recarga"))
                }

                console.log("#======= 02.3: Pestaña de recargas TAE RAM -> Recargas Amigo -> confirmar recarga =======#")
                let botonConfirmacion = await driver.findElement(By.xpath('//button[@id="normalSell"]'))
                await driver.sleep(randomMilliseconds);
                await botonConfirmacion.click()

                try {
                    selector = ".modal.fade.show:not([id='myLoader']):not([id='loaderNew']):not([id='loader'])"
                    let ventanaModal = await driver.wait(until.elementLocated(By.css(selector)), 30000);
                    await driver.wait(until.elementIsVisible(ventanaModal), 30000);

                    let idVentana = await ventanaModal.getAttribute('id');

                    if (idVentana == 'rechargeSuccess') {
                        let folioText = await driver.findElement(By.xpath('//strong[@id="recharge-messageId"]'))
                        let folio = await folioText.getText()
                        console.log("Modal recarga realizada");
                        console.log(`Folio recarga ${folio}`);

                        let botonOk = await driver.findElement(By.xpath('//div[@id="rechargeSuccess"]/div/div/div[3]/button'))
                        await driver.sleep(randomMilliseconds);
                        await botonOk.click()
                        elementos.recargasCorrectas++
                        elementos.estadoUltimaRecarga = 'Exitosa'
                        const now = moment().tz('America/Mexico_City');
                        elementos.fechaRecarga = now.format("YYYY-MM-DD HH:mm:ss")

                        if(elementos.contadorErrorRecarga > 0){
                            elementos.contadorErrorRecarga--
                        }

                        return resolve({ numero, folio })

                    } else {
                        console.log("En caso de modal error");
                        console.log(idVentana);
                        let messageError = "Intente realizar la recarga mas tarde"
                        if(idVentana == 'custom_error'){
                            try {
                                let dataError = await driver.findElement(By.xpath('//p[@id="custom_error_description"]'))
                                messageError = await dataError.getText()
                                validacionMSG.msg = messageError
                                console.log(`==ERROR== ${messageError}`);
                            } catch (error) {
                                console.log("Error al obtener el mensaje de error");
                                
                            }
                        }
                        return reject(response.fallaRecarga({ numero, modal: idVentana, err: messageError}, "Fallo al realizar la recarga"))
                    }
                } catch (error) {

                    console.log(error);
                    return reject(response.fallaRecarga({ numero, modal: "Tiempo agotado en la espera de la respuesta del modal de recarga" }, "Posibles cambios o fallas en la pagina de recargas"))
                }

            } catch (error) {

                console.log(error);
                return reject(response.fallaPagina())
            }
        })
    }

    procesoFullCaptcha(driver) {
        return new Promise(async (resolve, reject) => {
            try {
                let dataImg = await this.capturaImgCaptcha(driver)

                let resultImg = await this.obtenerFolioImagen(dataImg)

                return resolve(resultImg.data.folio)

            } catch (error) {
                console.log(error);

                return reject(error)
            }
        })
    }

    capturaImgCaptcha(driver) {
        return new Promise(async (resolve, reject) => {
            try {
                let ruta = './src/python-server/model/img/img_captura'
                let img_filename = await this.generarRandom()

                let imagenCaptcha = await driver.findElement(By.xpath('//img[@id="captcha"]'))
                //let imagenCaptcha = await driver.findElement(By.xpath('//form[@id="rechargeForm"]/div[2]/div[1]/figure"]'))

                const img_path = path.join(ruta, img_filename + '.png');

                let screenshot = await imagenCaptcha.takeScreenshot()

                // Guardar la captura de pantalla en un archivo de manera asíncrona
                await fs.writeFile(img_path, Buffer.from(screenshot, 'base64'));

                return resolve({ path_img: img_path, name_img: img_filename })
            } catch (error) {
                console.log(error);

                return reject(error)
            }
        })
    }

    obtenerFolioImagen(dataImg) {
        return new Promise(async (resolve, reject) => {
            try {
                const url = dataPagina.url_captcha

                const data = {
                    path_img: `./model/img/img_captura/${dataImg.name_img}.png`,
                    name_img: dataImg.name_img
                }

                const config = {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
                try {
                    axios.post(url, data, config).then((response) => {
                        if (response.status == 200) {
                            console.log("respuesta correcta");

                            console.log(response.data);
                            return resolve(response.data)
                        } else {
                            console.log("respuesta no es 200");
                            console.log(response);
                            return reject(response)
                        }

                    }).catch((error) => {
                        console.log("respuesta incorrecta");
                        try {
                            if (error.response.data) {
                                console.log(error.response.data);
                                return reject(error.response.data)
                            }
                            
                            return reject("Fallo al realizar la peticion")
                            
                        } catch (error) {
                            return reject("Fallo al realizar la peticion")
                        }
                        
                    })
                } catch (error) {
                    console.log(error);
                    return reject(error)
                }
            } catch (error) {
                console.log(error);
                return reject(error)
            }
        })
    }

    procesarInfoNumero(nip_street, numero, monto, driver) {
        return new Promise(async (resolve, reject) => {
            try {
                let lista = await driver.findElement(By.xpath('//select[@id="ammountsList"]'))
                let select_recarga = new Select(lista)

                await select_recarga.selectByValue(`${monto}`)

                let inputNumero = await driver.findElement(By.xpath('//input[@id="msisdn"]'))
                console.log(numero);
                await inputNumero.sendKeys(`${numero}`)

                let inputNip = driver.findElement(By.xpath('//input[@id="nip"]'))
                await inputNip.sendKeys(nip_street)

                return resolve({ code: 1 })
            } catch (error) {
                return reject({ code: 2 })
            }
        })
    }

    generarRandom(length = 10) {
        return new Promise(async (resolve, reject) => {
            try {
                // Definir los caracteres a usar (letras y dígitos)
                const caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

                // Crear un buffer de bytes aleatorios
                const buffer = crypto.randomBytes(length);

                // Convertir los bytes en caracteres válidos
                let resultado = '';
                for (let i = 0; i < length; i++) {
                    resultado += caracteres[buffer[i] % caracteres.length];
                }

                return resolve(resultado);
            } catch (error) {
                return reject(error)
            }
        })
    }

    cerrarVentaRecarga(driver) {
        return new Promise(async (resolve, reject) => {
            console.time("tiempoProceso");
            try {
                let array_ventana = await driver.getAllWindowHandles()

                if (array_ventana.length > 2) {
                    let ultima_ventana = array_ventana[array_ventana.length - 1];
                    await driver.switchTo().window(ultima_ventana);
                    await driver.close()
                }

                await this.restaurarVentaRecarga(driver)
                console.timeEnd("tiempoProceso");
                elementos.estadoPagina=1
                
                return resolve("Todo bien")
            } catch (error) {
                console.timeEnd("tiempoProceso");
                console.log("fallo al cerrar la ventana de recargas");
                libMailer.enviarCorreo(dataMessageCorre.errorPagina.titulo, dataMessageCorre.errorPagina.texto).then((result) =>{}).catch((error) =>{})
                return resolve()
            } finally {
                console.log(`El estado de la pagina es: ${elementos.estadoPagina} y el contador de recarga es:${elementos.contadorRecargas}`);
            }
        })
    }

    restaurarVentaRecarga(driver) {
        return new Promise(async (resolve, reject) => {

            let randomSeconds = Math.random() * (1.5 - 1.0) + 1.0;
            let randomMilliseconds = randomSeconds * 1000;

            try {
                let array_ventana = await driver.getAllWindowHandles()

                if (array_ventana.length == 2) {
                    console.log("Entro al caso de cerrar la ventana");

                    await driver.switchTo().window(array_ventana[array_ventana.length - 1]);

                    await driver.executeScript("window.open('');")

                    array_ventana = await driver.getAllWindowHandles()

                    if (array_ventana.length == 3) {
                        await driver.switchTo().window(array_ventana[array_ventana.length - 1]);
                        await driver.navigate().to("https://recargamigoweb.telcel.com/distributor/sales/recharges")

                        await driver.sleep(randomMilliseconds);

                        let url = await driver.getCurrentUrl();
                        console.log(url);

                        if (url == 'https://recargamigoweb.telcel.com/distributor/sales/recharges') {
                            /* await driver.sleep(2000)

                            try {
                                let botonAlert = await driver.findElement(By.xpath('//div[@id="locationNotice"]/div/div/div[3]/button'))
                                await botonAlert.click()
                            } catch (error) {
                                console.log("#======= No aparecio el alert de ubicacion =======#");
                            } */

                            let recargasAmigo = await driver.findElement(By.xpath('//section[@id="carriersList"]/div[1]/figure/img'))
                            recargasAmigo.click()

                            await driver.sleep(randomMilliseconds);

                            /* try {
                                let folio = await this.procesoFullCaptcha(driver)
                                elementos.arrayCodes.push(folio)
                            } catch (error) {
                                console.log("Fallo al conseguir el captcha, se intentara en la recarga");
                            } */

                            /* let folio = await this.procesoFullCaptcha(driver)

                            elementos.arrayCodes.push(folio) */

                            let verificarSaldo = await driver.findElement(By.xpath('//span[@id="balanceLabel"]'))
                            let saldoString = await verificarSaldo.getText()

                            if (!saldoString.trim()) {
                                console.log("No hay saldo disponible para realizar recargas");
                                elementos.estadoSaldoRecargas = 0
                                // libMailer.enviarCorreo(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) =>{}).catch((error) =>{})
                                libMailer.enviarCorreoSaldoAgotado(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) =>{}).catch((error) =>{})
                            } else {
                                let cantidadSinSimbolos = saldoString.replace(/[$,]/g, '');
                                let cantidadNumero = parseFloat(cantidadSinSimbolos);
                                let cantidadEntero = Math.round(cantidadNumero);
                                elementos.saldoTotalRecargas = cantidadEntero
                                console.log(`Cantidad actual es ${cantidadEntero}`);
                                if (cantidadEntero <= 0) {
                                    console.log("No hay saldo disponible para realizar recargas");
                                    elementos.estadoSaldoRecargas = 0
                                    // libMailer.enviarCorreo(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) =>{}).catch((error) =>{})
                                    libMailer.enviarCorreoSaldoAgotado(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) =>{}).catch((error) =>{})
                                }
                            }
                        } else {
                            if (url == 'https://recargamigoweb.telcel.com/distributor/login') {
                                array_ventana = await driver.getAllWindowHandles()

                                let ultima_ventana = array_ventana[array_ventana.length - 1];
                                await driver.switchTo().window(ultima_ventana);
                                await driver.close();

                                array_ventana = await driver.getAllWindowHandles()

                                await driver.switchTo().window(array_ventana[array_ventana.length - 1]);

                                await driver.navigate().refresh();
                                await driver.sleep(randomMilliseconds);

                                url = await driver.getCurrentUrl();
                                console.log(url);

                                if (url == 'https://recargamigoweb.telcel.com/distributor/login' || url == "https://recargamigoweb.telcel.com/distributor/login?out=true") {
                                    await this.iniciarSesion(driver)
                                    elementos.contadorRecargas = 0
                                    elementos.recargasCorrectas = 0
                                    elementos.recargasFallidas = 0
                                } else {
                                    return reject(response.fallaPagina())
                                }
                            } else {
                                return reject(response.fallaPagina())
                            }
                        }
                    } else {
                        console.log("==============Configuracion fallida==============");
                        return reject(response.fallaPagina())
                    }
                } else {
                    console.log("==============Configuracion fallida==============");
                    return reject(response.fallaPagina())
                }

                console.log("==============Configuracion correcta==============");
                return resolve()
            } catch (error) {
                console.log(error);
                console.log("==============Configuracion fallida==============");
                return reject(error)
            }
        })
    }

    cerrarSesion(driver) {
        return new Promise(async (resolve, reject) => {
            let randomSeconds = Math.random() * (1.5 - 1.0) + 1.0;
            let randomMilliseconds = randomSeconds * 1000;

            try {
                let array_ventana = await driver.getAllWindowHandles()

                if (array_ventana.length > 2) {
                    let ultima_ventana = array_ventana[array_ventana.length - 1];
                    await driver.switchTo().window(ultima_ventana);
                    await driver.close()

                    array_ventana = await driver.getAllWindowHandles()

                    await driver.switchTo().window(array_ventana[array_ventana.length - 1]);

                    await driver.navigate().refresh();
                    await driver.sleep(randomMilliseconds);

                    let url = await driver.getCurrentUrl();

                    if (url == 'https://recargamigoweb.telcel.com/distributor/sales/recharges') {
                        let menuUsuario = await driver.findElement(By.xpath('//a[@id="dropdownUser"]'))
                        await menuUsuario.click()
                        await driver.sleep(randomMilliseconds);

                        let opcionSalir = await driver.findElement(By.xpath('//div[@id="page-content-wrapper"]/div/div/nav/nav/div[1]/ul/li[4]/a'))
                        await opcionSalir.click()

                        await driver.sleep(randomMilliseconds);

                        await this.iniciarSesion(driver)
                    } else {
                        if (url == 'https://recargamigoweb.telcel.com/distributor/login' || url == "https://recargamigoweb.telcel.com/distributor/login?out=true") {
                            await this.iniciarSesion(driver)
                        } else {
                            console.log("Fallo al cerrar la sesion");
                            return resolve()
                        }
                    }

                    elementos.estadoPagina = 1
                    return resolve()
                } else {
                    console.log("Fallo al cerrar la sesion");
                    return resolve()
                }
            } catch (error) {
                console.log("Fallo al cerrar la sesion");
                libMailer.enviarCorreo(dataMessageCorre.errorPagina.titulo, dataMessageCorre.errorPagina.texto).then((result) =>{}).catch((error) =>{})
                return resolve()
            } finally{
                elementos.contadorRecargas = 0
                elementos.recargasCorrectas = 0
                elementos.recargasFallidas = 0
                elementos.intermitencia = 0
                console.log(`El estado de la pagina es: ${elementos.estadoPagina} y el contador de recarga es:${elementos.contadorRecargas}`);
            }
        })
    }

    iniciarSesion(driver) {
        return new Promise(async (resolve, reject) => {
            let randomSeconds = Math.random() * (1.5 - 1.0) + 1.0;
            let randomMilliseconds = randomSeconds * 1000;

            try {
                console.log("#======= Login pagina de telcel =======#");
                let inputUser = await driver.findElement(By.xpath('//input[@name="msisdn"]'))
                let inputNip = await driver.findElement(By.xpath('//input[@name="password"]'))
                let inputRam = await driver.findElement(By.xpath('//input[@name="username"]'))
                let botonIngresar = await driver.findElement(By.xpath('//form[@id="loginForm"]/button'))

                await inputUser.sendKeys(dataPagina.usuario)
                await inputNip.sendKeys(dataPagina.nip)
                await inputRam.sendKeys(dataPagina.ram)

                await driver.sleep(randomMilliseconds);
                await botonIngresar.click()
                await driver.sleep(9000)

                console.log("#======= Buscando el token para pagina de telcel =======#")
                try {
                    let token = ''
                    let inputToken = await driver.findElement(By.xpath('//input[@name="token"]'))

                    try {
                        let dataToken = await this.maxSearchToken()
                        token = dataToken.data.folio
                    } catch (error) {
                        console.log("No se encontro el mensaje del token o se fue la señal del chip");
                        return reject(response.fallaPagina())
                    }

                    /* try {
                        let dataToken = await this.obtenerToken()
                        token = dataToken.data.folio
                    } catch (error) {
                        console.log("Posible retraso en el mensaje del token, volviendo a consultar el token");

                        await driver.sleep(300000)

                        try {
                            let dataToken = await this.obtenerToken()
                            token = dataToken.data.folio
                        } catch (error) {
                            console.log("No se encontro el mensaje del token o se fue la señal del chip");
                            return reject(response.fallaPagina())
                        }
                    } */

                    await inputToken.sendKeys(token)

                    let botonToken = await driver.findElement(By.xpath('//form[@id="tokenForm"]/button'))
                    await botonToken.click()
                    await driver.sleep(randomMilliseconds);
                } catch (error) {
                    console.log("No aparecio el input del token");
                    libMailer.enviarCorreo(dataMessageCorre.nipCaducado.titulo, dataMessageCorre.nipCaducado.texto).then((result) => { }).catch((error) => { })
                    return reject(response.fallaPagina())
                }

                let botonMenu = await driver.findElement(By.xpath('//img[@id="sidebarCollapse"]'))

                let actions = driver.actions();

                await actions.move({ origin: botonMenu }).perform()
                await driver.sleep(randomMilliseconds);

                let menuTae = await driver.findElement(By.xpath('//nav[@id="sidebar"]/div[3]/div/ul/li[2]/a/span'))
                await menuTae.click()
                await driver.sleep(randomMilliseconds);

                console.log("#======= Opciones De Recargas TAE =======#")
                let opcion = await driver.findElement(By.xpath('//a[@id="rechargesOption"]/span'))
                let textoOpcion = await opcion.getText()

                if (textoOpcion == 'Recargas') {
                    opcion.click()
                    await driver.sleep(randomMilliseconds);
                    await driver.sleep(2000)
                   /*  try {
                        let botonAlert = await driver.findElement(By.xpath('//div[@id="locationNotice"]/div/div/div[3]/button'))
                        await botonAlert.click()
                    } catch (error) {
                        console.log("#======= No aparecio el alert de ubicacion =======#");
                        await driver.sleep(randomMilliseconds);
                        await driver.sleep(2000)
                        let botonAlert = await driver.findElement(By.xpath('//div[@id="locationNotice"]/div/div/div[3]/button'))
                        await botonAlert.click()
                    } */

                    let url = await driver.getCurrentUrl();
                    console.log(url);

                    await driver.executeScript("window.open('');")

                    let array_ventana = await driver.getAllWindowHandles()

                    if (array_ventana.length < 3) {
                        return reject(response.processValidation("La sesion en la pagina caduco"))
                    }

                    let ultima_ventana = array_ventana[array_ventana.length - 1];
                    await driver.switchTo().window(ultima_ventana);

                    await driver.navigate().to(url)

                    await driver.sleep(randomMilliseconds);

                    let recargasAmigo = await driver.findElement(By.xpath('//section[@id="carriersList"]/div[1]/figure/img'))
                    recargasAmigo.click()

                    await driver.sleep(randomMilliseconds);

                    //const processActivaciones = new ProcessActivaciones()

                    /* try {
                        let folio = await this.procesoFullCaptcha(driver)
                        elementos.arrayCodes.push(folio)
                    } catch (error) {
                        console.log("Fallo al conseguir el captcha, se intentara en la recarga");
                    } */

                    /* let folio = await processActivaciones.procesoFullCaptcha(driver)

                    elementos.arrayCodes.push(folio) */

                    let verificarSaldo = await driver.findElement(By.xpath('//span[@id="balanceLabel"]'))
                    let saldoString = await verificarSaldo.getText()

                    if (!saldoString.trim()) {
                        console.log("No hay saldo disponible para realizar recargas");
                        elementos.estadoSaldoRecargas = 0
                        // libMailer.enviarCorreo(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) =>{}).catch((error) =>{})
                        libMailer.enviarCorreoSaldoAgotado(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) =>{}).catch((error) =>{})
                    } else {
                        let cantidadSinSimbolos = saldoString.replace(/[$,]/g, '');
                        let cantidadNumero = parseFloat(cantidadSinSimbolos);
                        let cantidadEntero = Math.round(cantidadNumero);
                        elementos.saldoTotalRecargas = cantidadEntero
                        console.log(`Cantidad actual es ${cantidadEntero}`);
                        if (cantidadEntero <= 0) {
                            console.log("No hay saldo disponible para realizar recargas");
                            elementos.estadoSaldoRecargas = 0
                            // libMailer.enviarCorreo(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) =>{}).catch((error) =>{})
                            libMailer.enviarCorreoSaldoAgotado(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) =>{}).catch((error) =>{})
                        }
                    }
                }

                return resolve()
            } catch (error) {
                console.log(error);
                
                console.log("Fallo al iniciar sesion");
                return reject(error)

            }
        })
    }

    obtenerToken() {
        return new Promise((resolve, reject) => {
            try {
                const url = dataPagina.url_token
                //const url = 'http://comunicaciondev.ddns.net:5000/gsm/ObtenerCodigo'
                //const url = 'http://189.169.73.14:5000/gsm/ObtenerCodigo'
    
                const data = {
                    region: dataPagina.region
                }
    
                const config = {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
    
                try {
                    console.log(data);
    
                    axios.post(url, data, config).then((response) => {
                        if (response.status == 200) {
                            console.log("respuesta correcta");
    
                            console.log(response.data);
                            return resolve(response.data)
                        } else {
                            console.log("respuesta no es 200");
                            //console.log(response);
                            return resolve(response)
                        }
    
                    }).catch((error) => {
                        console.log("respuesta incorrecta");
    
                        if (error.response.data) {
                            console.log(error.response.data);
                            return reject(error.response.data)
                        } else {
                            return reject("Fallo al realizar la peticion")
                        }
                    })
                } catch (error) {
                    //console.log(error);
                    return reject(error)
                }
            } catch (error) {
                console.log(error);
                return reject(error)
            }
        })
    }

    maxSearchToken(maxRetries = 10) {
        return new Promise(async (resolve, reject) => {
            let retries = 0;
            let token = 0;
    
            try {
                while (retries < maxRetries) {
                    console.log(`Busqueda token... Intento ${retries + 1}`);
                    try {
                        let dataToken = await this.obtenerToken()
                        console.log("Token encontrado");
                        token = dataToken.data.folio
                        return resolve({ code: 1, data: { folio: token }, message: "Token obtenido" })
    
                    } catch (error) {
                        console.log(`No hay informacion del token, esperando 1 minuto...`);
                        await new Promise(resolve => setTimeout(resolve, 60000));
                    }
                    retries++;
                }
    
                console.log("No se logro obtener el token en los ultimos 10 intentos verificar si hay señal en el chip");
                return reject("No se logro obtener el token")
    
            } catch (error) {
                console.log("Error al realizar la busqueda del token");
                return reject(error)
            }
        })
    }

    processActualizarSaldoActivacionesRAM(driver) {
        return new Promise(async (resolve, reject) => {
            try {
                elementos.estadoPagina = 0

                let array_ventana = await driver.getAllWindowHandles()

                for (let i = 2; i < array_ventana.length; i++) {
                    await driver.switchTo().window(array_ventana[i]); // Cambiar a la ventana correspondiente
                    await driver.close(); // Cerrar la ventana actual
                }

                array_ventana = await driver.getAllWindowHandles()

                if (array_ventana.length == 2) {
                    await this.restaurarVentaRecarga(driver)
                    elementos.estadoPagina = 1

                    return resolve(response.success("Configuracion realizada correctamente"))
                } else {
                    return reject(response.processValidation("Error en el driver"))
                }
            } catch (error) {
                return reject(response.process("Error al actualizar el saldo"))
            }
        })
    }

    configurandoVentanaRecarga(driver) {
        return new Promise(async (resolve, reject) => {

            let randomSeconds = Math.random() * (1.5 - 1.0) + 1.0;
            let randomMilliseconds = randomSeconds * 1000;

            try {
                let array_ventana = await driver.getAllWindowHandles()

                if (array_ventana.length == 2) {
                    console.log("Entro al caso de cerrar la ventana");

                    await driver.switchTo().window(array_ventana[array_ventana.length - 1]);

                    await driver.executeScript("window.open('');")

                    array_ventana = await driver.getAllWindowHandles()

                    if (array_ventana.length == 3) {
                        await driver.switchTo().window(array_ventana[array_ventana.length - 1]);
                        await driver.navigate().to("https://recargamigoweb.telcel.com/distributor/sales/recharges")

                        await driver.sleep(randomMilliseconds);

                        let url = await driver.getCurrentUrl();
                        console.log(url);

                        if (url == 'https://recargamigoweb.telcel.com/distributor/sales/recharges') {
                            await driver.sleep(randomMilliseconds);
                            await driver.sleep(5000)

                            try {
                                let botonAlert = await driver.findElement(By.xpath('//div[@id="locationNotice"]/div/div/div[3]/button'))
                                await botonAlert.click()
                            } catch (error) {
                                console.log("#======= No aparecio el alert de ubicacion =======#");
                            }

                            let recargasAmigo = await driver.findElement(By.xpath('//section[@id="carriersList"]/div[1]/figure/img'))
                            recargasAmigo.click()

                            await driver.sleep(randomMilliseconds);

                            /* try {
                                let folio = await this.procesoFullCaptcha(driver)
                                elementos.arrayCodes.push(folio)
                            } catch (error) {
                                console.log("Fallo al conseguir el captcha, se intentara en la recarga");
                            } */

                            /* let folio = await this.procesoFullCaptcha(driver)

                            elementos.arrayCodes.push(folio) */

                            let verificarSaldo = await driver.findElement(By.xpath('//span[@id="balanceLabel"]'))
                            let saldoString = await verificarSaldo.getText()

                            if (!saldoString.trim()) {
                                console.log("No hay saldo disponible para realizar recargas");
                                elementos.estadoSaldoRecargas = 0
                                // libMailer.enviarCorreo(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) =>{}).catch((error) =>{})
                                libMailer.enviarCorreoSaldoAgotado(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) => { }).catch((error) => { })
                            } else {
                                let cantidadSinSimbolos = saldoString.replace(/[$,]/g, '');
                                let cantidadNumero = parseFloat(cantidadSinSimbolos);
                                let cantidadEntero = Math.round(cantidadNumero);
                                elementos.saldoTotalRecargas = cantidadEntero
                                console.log(`Cantidad actual es ${cantidadEntero}`);
                                if (cantidadEntero <= 0) {
                                    console.log("No hay saldo disponible para realizar recargas");
                                    elementos.estadoSaldoRecargas = 0
                                    // libMailer.enviarCorreo(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) =>{}).catch((error) =>{})
                                    libMailer.enviarCorreoSaldoAgotado(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) => { }).catch((error) => { })
                                }
                            }
                        } else {
                            console.log("==============Configuracion fallida==============");
                            return reject(response.fallaPagina())
                        }
                    } else {
                        console.log("==============Configuracion fallida==============");
                        return reject(response.fallaPagina())
                    }
                } else {
                    console.log("==============Configuracion fallida==============");
                    return reject(response.fallaPagina())
                }

                console.log("==============Configuracion correcta==============");
                return resolve()
            } catch (error) {
                console.log(error);
                console.log("==============Configuracion fallida==============");
                return reject(error)
            }
        })
    }

    processRebootActivacionesRAM(driver) {
        return new Promise(async (resolve, reject) => {
            let randomSeconds = Math.random() * (1.5 - 1.0) + 1.0;
            let randomMilliseconds = randomSeconds * 1000;
            elementos.estadoPagina = 0

            try {

                let array_ventana = await driver.getAllWindowHandles()

                for (let i = 2; i < array_ventana.length; i++) {
                    await driver.switchTo().window(array_ventana[i]); // Cambiar a la ventana correspondiente
                    await driver.close(); // Cerrar la ventana actual
                }

                array_ventana = await driver.getAllWindowHandles()

                if (array_ventana.length == 2) {
                    await driver.switchTo().window(array_ventana[array_ventana.length - 1]);

                    await driver.navigate().refresh();
                    await driver.sleep(randomMilliseconds);

                    let url = await driver.getCurrentUrl();

                    await driver.sleep(2000)

                    try {
                        if (url == "https://recargamigoweb.telcel.com/distributor/login" || url == "https://recargamigoweb.telcel.com/distributor/login?out=true") {
                            await this.restaurarVentaRecarga(driver)
                            elementos.estadoPagina = 1
                            if (elementos.saldoTotalRecargas != 0) {
                                elementos.estadoSaldoRecargas = 1
                            }

                            return resolve(response.success("Configuracion realizada correctamente"))
                        }
                    } catch (error) {
                        console.log("======================================= Aqui el error caso 1 =================================");
                        console.log(error);
                        return reject(response.process({ error: "Error al iniciar la pagina de RAM, si el error persiste detenga el servicio y vuelva iniciar el proceso", detalle: "Posible retardo en la pagina" }))
                    }

                    try {
                        let auxUrl = url.slice(0, -2)
                        if (
                            url == "https://recargamigoweb.telcel.com/distributor/login/token" || 
                            auxUrl == "https://recargamigoweb.telcel.com/distributor/login?error" || 
                            url.includes("https://recargamigoweb.telcel.com/distributor/login") || 
                            url == "about:blank"
                        ) {
                            await driver.close(); // Cerrar la ventana actual
                            await driver.switchTo().window(array_ventana[0]); // Cambiar a la ventana correspondiente
                            await driver.executeScript("window.open('');")

                            array_ventana = await driver.getAllWindowHandles()

                            if (array_ventana.length != 2) {
                                return reject(response.process({ error: "Error al iniciar la pagina de RAM, si el error persiste detenga el servicio y vuelva iniciar el proceso", detalle: "Posible falla en el driver, detener el servicio y volver a iniciar el servicio" }))
                            }

                            await driver.switchTo().window(array_ventana[array_ventana.length - 1]);
                            await driver.navigate().to(dataPagina.url)

                            await driver.sleep(randomMilliseconds);

                            await this.restaurarVentaRecarga(driver)
                            elementos.estadoPagina = 1
                            if (elementos.saldoTotalRecargas != 0) {
                                elementos.estadoSaldoRecargas = 1
                            }

                            return resolve(response.success("Configuracion realizada correctamente"))

                        }
                    } catch (error) {
                        console.log("======================================= Aqui el error  caso 2 =================================");
                        console.log(error);
                        return reject(response.process({ error: "Error al iniciar la pagina de RAM, si el error persiste detenga el servicio y vuelva iniciar el proceso", detalle: "Posible retardo en la pagina" }))
                    }

                    try {
                        if (url == 'https://recargamigoweb.telcel.com/distributor/sales/recharges') {
                            await driver.navigate().refresh();
                            await driver.sleep(randomMilliseconds);
                            await driver.sleep(5000)
                            try {
                                let botonAlert = await driver.findElement(By.xpath('//div[@id="locationNotice"]/div/div/div[3]/button'))
                                await botonAlert.click()
                            } catch (error) {
                                console.log("#======= No aparecio el alert de ubicacion =======#");
                            }

                            await this.configurandoVentanaRecarga(driver)
                            elementos.estadoPagina = 1
                            if (elementos.saldoTotalRecargas != 0) {
                                elementos.estadoSaldoRecargas = 1
                            }
                            return resolve(response.success("Configuracion realizada correctamente"))
                        }
                    } catch (error) {
                        console.log("======================================= Aqui el error caso 3 =================================");
                        console.log(error);
                        return reject(response.process({ error: "Error al iniciar la pagina de RAM, si el error persiste detenga el servicio y vuelva iniciar el proceso", detalle: "Posible retardo en la pagina" }))
                    }

                } else if (array_ventana.length == 1) {
                    return reject(response.process("Caso no verificado"))
                } else {
                    return reject(response.process("Error en el driver"))
                }



            } catch (error) {
                return reject(response.process("Error al reinicar el driver de recargas"))
            }
        })
    }
}

module.exports = ProcessActivacionesV2