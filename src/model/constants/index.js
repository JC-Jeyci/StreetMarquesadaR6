require('dotenv').config();

class Constants {

    dataPagina() {
        return {
            url: process.env.LINK,
            usuario: process.env.USER_STREET,
            nip: process.env.NIP_STREET,
            ram: process.env.RAM_STREET,
            region: process.env.REGION_STREET,
            url_captcha: process.env.URL_CAPTCHA,
            url_token: process.env.URL_TOKEN_STREET,
            cliente: process.env.CLIENTE
        }
    }

    dataCorreo() {
        return {
            email: process.env.EMAIL,
            pass: process.env.PASS_EMAIL
        }
    }

    dataMessageCorre() {
        return {
            saldo: {
                titulo: `Saldo Agotado de ${process.env.CLIENTE} ${process.env.REGION_STREET}`,
                texto: `Favor de comprar mas tiempo aire para el chip de la region ${process.env.REGION_STREET} con el numero de agente ${process.env.USER_STREET}`
            },
            errorPagina: {
                titulo: `Fallas en la pagina RAM de ${process.env.CLIENTE} ${process.env.REGION_STREET} `,
                texto: `Favor de verificar si el proceso de recargas RAM ${process.env.CLIENTE} esta inicializado correctamente`
            },
            nipCaducado: {
                titulo: `Login fallido en la pagina RAM de ${process.env.CLIENTE} ${process.env.REGION_STREET}`,
                texto: `Verificar si las credenciales de acceso son las correctas \n Verificar si el nip del usuario caduco para volver a renovarlo`
            },
            cambiosPagina: {
                titulo: `Error en la pagina RAM de ${process.env.CLIENTE} ${process.env.REGION_STREET}`,
                texto: `Favor de verificar si el proceso de recargas RAM ${process.env.CLIENTE} esta realizando las recargas correctamente,\n
                Posibles detalles: \n
                Intermitencia en la pagina de recargas RAM \n
                Posibles cambios en la pagina de recargas RAM \n
                Fallas validar el captcha en la pagina de recargas RAM`
            }
        }
    }

    rutaLogs() {
        return {
            path: process.env.RUTA_LOG
        }
    }

    dataValidacionesSMG(){
        return {
            intermitencia: `Por el momento no se puede realizar tu transaccion. Intenta mas tarde.`,
            numero_no_valido: `La recarga ha fallado, este numero no es valido.`,
        }
    }
}

module.exports = Constants