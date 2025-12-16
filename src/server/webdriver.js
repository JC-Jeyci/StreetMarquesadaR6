// webdriver-service.js
const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
//require('chromedriver'); // O el driver que necesites
const Constants = require('../model/constants/index')
const axios = require('axios')
const ProcessActivaciones = require('../model/process/processActivaciones')
const elementos = require('../utils/resources')
const LibMailer = require('../model/library/libMailer')
const libMailer = new LibMailer()
const dataMessageCorre = new Constants().dataMessageCorre()


const dataPagina = new Constants().dataPagina()
console.log(dataPagina);

let driver;

async function initializeDriver() {
    try {
        if (!driver) {
            let options = new chrome.Options();

            let randomSeconds = Math.random() * (1.5 - 1.0) + 1.0;
            let randomMilliseconds = randomSeconds * 1000;

            // Configura opciones específicas para Chrome
            options.addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
            options.addArguments('--disable-blink-features=AutomationControlled');

            driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

            await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            await driver.navigate().to('https://www.google.com/')

            await driver.manage().window().maximize();

            await driver.executeScript("window.open('');")

            let array_ventana = await driver.getAllWindowHandles()

            if (array_ventana.length > 1) {
                let ultima_ventana = array_ventana[array_ventana.length - 1];
                await driver.switchTo().window(ultima_ventana);

                await driver.navigate().to(dataPagina.url)

                await driver.sleep(randomMilliseconds);

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
                        let dataToken = await maxSearchToken()
                        token = dataToken.data.folio
                    } catch (error) {
                        console.log("No se encontro informacion del token");
                        return driver;
                    }

                    /* try {
                        let dataToken = await obtenerToken()
                        token = dataToken.data.folio
                    } catch (error) {
                        console.log("Posible retraso en el mensaje del token, volviendo a consultar el token");

                        await driver.sleep(300000)
                        let dataToken = await obtenerToken()
                        token = dataToken.data.folio
                    } */

                    await inputToken.sendKeys(token)

                    let botonToken = await driver.findElement(By.xpath('//form[@id="tokenForm"]/button'))
                    await botonToken.click()
                    await driver.sleep(randomMilliseconds);
                } catch (error) {
                    console.log("No aparecio el tokem");
                    //libMailer.enviarCorreo(dataMessageCorre.nipCaducado.titulo, dataMessageCorre.nipCaducado.texto).then((result) => { }).catch((error) => { })
                    return driver;
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
                    try {
                        let botonAlert = await driver.findElement(By.xpath('//div[@id="locationNotice"]/div/div/div[3]/button'))
                        await botonAlert.click()
                    } catch (error) {
                        console.log("#======= No aparecio el alert de ubicacion =======#");
                        await driver.sleep(randomMilliseconds);
                        await driver.sleep(2000)
                        let botonAlert = await driver.findElement(By.xpath('//div[@id="locationNotice"]/div/div/div[3]/button'))
                        await botonAlert.click()
                    }

                    let url = await driver.getCurrentUrl();
                    console.log(url);

                    await driver.executeScript("window.open('');")

                    array_ventana = await driver.getAllWindowHandles()

                    if (array_ventana.length < 3) {
                        return reject(response.processValidation("La sesion en la pagina caduco"))
                    }

                    ultima_ventana = array_ventana[array_ventana.length - 1];
                    await driver.switchTo().window(ultima_ventana);

                    await driver.navigate().to(url)

                    await driver.sleep(randomMilliseconds);

                    let recargasAmigo = await driver.findElement(By.xpath('//section[@id="carriersList"]/div[1]/figure/img'))
                    recargasAmigo.click()

                    await driver.sleep(randomMilliseconds);

                    const processActivaciones = new ProcessActivaciones()

                    try {
                        let folio = await processActivaciones.procesoFullCaptcha(driver)
                        elementos.arrayCodes.push(folio)
                    } catch (error) {
                        console.log("Fallo al conseguir el captcha, se intentara en la recarga");
                    }

                    let verificarSaldo = await driver.findElement(By.xpath('//span[@id="balanceLabel"]'))
                    let saldoString = await verificarSaldo.getText()

                    if (!saldoString.trim()) {
                        console.log("No hay saldo disponible para realizar recargas");
                        elementos.estadoSaldoRecargas = 0
                        //libMailer.enviarCorreoSaldoAgotado(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) =>{}).catch((error) =>{})
                    } else {
                        let cantidadSinSimbolos = saldoString.replace(/[$,]/g, '');
                        let cantidadNumero = parseFloat(cantidadSinSimbolos);
                        let cantidadEntero = Math.round(cantidadNumero);
                        elementos.saldoTotalRecargas = cantidadEntero
                        console.log(`Cantidad actual es ${cantidadEntero}`);
                        
                        if (cantidadEntero <= 0) {
                            console.log("No hay saldo disponible para realizar recargas");
                            elementos.estadoSaldoRecargas = 0
                            //libMailer.enviarCorreoSaldoAgotado(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) =>{}).catch((error) =>{})
                        }
                    }

                    elementos.estadoPagina = 1
                } else {
                    console.log("#======= No se encontro la opcion de recarga =======#");
                }
            }
        }
        return driver;
    } catch (error) {
        console.log(error);
        console.log("No se logro inicilizar el webdriver");
        //libMailer.enviarCorreo(dataMessageCorre.errorPagina.titulo, dataMessageCorre.errorPagina.texto).then((result) =>{}).catch((error) =>{})
        return driver;
    }
}

async function initializeDriverSinCaptcha() {
    try {
        if (!driver) {
            let options = new chrome.Options();

            let randomSeconds = Math.random() * (1.5 - 1.0) + 1.0;
            let randomMilliseconds = randomSeconds * 1000;

            // Configura opciones específicas para Chrome
            options.addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
            options.addArguments('--disable-blink-features=AutomationControlled');

            driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

            await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            await driver.navigate().to('https://www.google.com/')

            await driver.manage().window().maximize();

            await driver.executeScript("window.open('');")

            let array_ventana = await driver.getAllWindowHandles()

            if (array_ventana.length > 1) {
                let ultima_ventana = array_ventana[array_ventana.length - 1];
                await driver.switchTo().window(ultima_ventana);

                await driver.navigate().to(dataPagina.url)

                await driver.sleep(randomMilliseconds);

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
                        let dataToken = await maxSearchToken()
                        token = dataToken.data.folio
                    } catch (error) {
                        console.log("No se encontro informacion del token");
                        return driver;
                    }

                    /* try {
                        let dataToken = await obtenerToken()
                        token = dataToken.data.folio
                    } catch (error) {
                        console.log("Posible retraso en el mensaje del token, volviendo a consultar el token");

                        await driver.sleep(300000)
                        let dataToken = await obtenerToken()
                        token = dataToken.data.folio
                    } */

                    await inputToken.sendKeys(token)

                    let botonToken = await driver.findElement(By.xpath('//form[@id="tokenForm"]/button'))
                    await botonToken.click()
                    await driver.sleep(randomMilliseconds);
                } catch (error) {
                    console.log("No aparecio el tokem");
                    //libMailer.enviarCorreo(dataMessageCorre.nipCaducado.titulo, dataMessageCorre.nipCaducado.texto).then((result) => { }).catch((error) => { })
                    return driver;
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
                    /* try {
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

                    array_ventana = await driver.getAllWindowHandles()

                    if (array_ventana.length < 3) {
                        return reject(response.processValidation("La sesion en la pagina caduco"))
                    }

                    ultima_ventana = array_ventana[array_ventana.length - 1];
                    await driver.switchTo().window(ultima_ventana);

                    await driver.navigate().to(url)

                    await driver.sleep(randomMilliseconds);

                    let recargasAmigo = await driver.findElement(By.xpath('//section[@id="carriersList"]/div[1]/figure/img'))
                    recargasAmigo.click()

                    await driver.sleep(randomMilliseconds);

                    /* const processActivaciones = new ProcessActivaciones()

                    try {
                        let folio = await processActivaciones.procesoFullCaptcha(driver)
                        elementos.arrayCodes.push(folio)
                    } catch (error) {
                        console.log("Fallo al conseguir el captcha, se intentara en la recarga");
                    } */

                    let verificarSaldo = await driver.findElement(By.xpath('//span[@id="balanceLabel"]'))
                    let saldoString = await verificarSaldo.getText()

                    if (!saldoString.trim()) {
                        console.log("No hay saldo disponible para realizar recargas");
                        elementos.estadoSaldoRecargas = 0
                        //libMailer.enviarCorreoSaldoAgotado(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) =>{}).catch((error) =>{})
                    } else {
                        let cantidadSinSimbolos = saldoString.replace(/[$,]/g, '');
                        let cantidadNumero = parseFloat(cantidadSinSimbolos);
                        let cantidadEntero = Math.round(cantidadNumero);
                        elementos.saldoTotalRecargas = cantidadEntero
                        console.log(`Cantidad actual es ${cantidadEntero}`);
                        
                        if (cantidadEntero <= 0) {
                            console.log("No hay saldo disponible para realizar recargas");
                            elementos.estadoSaldoRecargas = 0
                            //libMailer.enviarCorreoSaldoAgotado(dataMessageCorre.saldo.titulo, dataMessageCorre.saldo.texto).then((result) =>{}).catch((error) =>{})
                        }
                    }

                    elementos.estadoPagina = 1
                } else {
                    console.log("#======= No se encontro la opcion de recarga =======#");
                }
            }
        }
        return driver;
    } catch (error) {
        console.log(error);
        console.log("No se logro inicilizar el webdriver");
        //libMailer.enviarCorreo(dataMessageCorre.errorPagina.titulo, dataMessageCorre.errorPagina.texto).then((result) =>{}).catch((error) =>{})
        return driver;
    }
}


async function closeDriver() {
    if (driver) {
        await driver.quit();
        driver = null;
    }
}

async function obtenerToken() {
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

async function maxSearchToken(maxRetries = 10) {
    return new Promise(async (resolve, reject) => {
        let retries = 0;
        let token = 0;

        try {
            while (retries < maxRetries) {
                console.log(`Busqueda token... Intento ${retries + 1}`);
                try {
                    let dataToken = await obtenerToken()
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

module.exports = {
    initializeDriver,
    closeDriver, 
    obtenerToken,
    initializeDriverSinCaptcha
};
