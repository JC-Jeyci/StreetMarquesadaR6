const Constants = require('../constants')
const RUTALOGS = new Constants().rutaLogs().path
const moment = require('moment-timezone');
const fs = require('fs')

class LibLog {
    logGenerate(data) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('DATA', data);
                let result = ''
                if (data.tipo == 'recarga') {
                    result = JSON.stringify(data.result)
                }

                let now = moment().tz('America/Mexico_City');


                let year = now.year();
                let month = now.month() + 1; // .month() es 0-indexado, por lo que se suma 1
                let day = now.date();
                let hours = now.hours();
                let minutes = now.minutes();
                let seconds = now.seconds();


                let dateFile = `${year}-${month}-${day}`;
                let fullDate = `${dateFile} ${hours}:${minutes}:${seconds}`;
                let logR = []

                switch (data.tipo) {
                    case 'peticion':
                        logR = [
                            `\rNumero: ${data.numero}`,
                            `\tMonto: ${data.monto}`,
                        ]
                        break;

                    case 'recarga':
                        logR = [
                            `Numero: ${data.numero}  Monto: ${data.monto}  Captcha: ${data.captcha}`,
                            `\nRespuesta: ${result}`,
                        ]
                        break;

                    default:
                        console.log('Log no creado, error con tipo de log');
                        break;
                }
                let carpeta = data.tipo == 'peticion' ? 'peticion' : 'recarga'

                let archivo = `${RUTALOGS}/${carpeta}/${data.tipo}-${dateFile}.txt`
                let contenido = `Fecha: ${fullDate} SaldoActual: ${data.saldoActual}\r\n${logR}\r\n##########################################################################################################\r\n`

                fs.appendFile(archivo, contenido, (err) => {
                    if (err) console.log(err)
                })

                resolve(1)
            } catch (error) {
                console.log("Fallo al registrar el log");
                console.log(error)
                return resolve(1);
            }

        })
    }
}

module.exports = LibLog