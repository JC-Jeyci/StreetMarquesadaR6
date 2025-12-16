const ControllerActivaciones = require('../../controller/activaciones')
const Response = require('../../model/constants/response')
const elementos = require('../../utils/resources')
const LibLog = require('../../model/library/libLog')
const log = new LibLog()

const response = new Response()
const ctrActivaciones = new ControllerActivaciones()

module.exports = (app, driver) => {

    app.post('/activaciones/numero/regionSeis', (req, res) => {

        let data = req.body

        if (data.clave != '1Mar0Mor8') {
            return response.sendBadRequest(res)
        }

        if (elementos.estadoPagina == 0) {
            return response.send(res, response.pageConfig())
        }

        if (elementos.estadoSaldoRecargas == 0) {
            return response.send(res, response.pageSaldo())
        }

        console.log(`El contador de recargas va en ${elementos.contadorRecargas}`);

        data.tipo = "peticion"
        log.logGenerate(data).then((result) => { }).catch((error) => { })

        ctrActivaciones.activarNumeroStreetSeller(data, driver).then((result) => {
            response.send(res, result)
        }).catch((error) => {
            response.send(res, error)
        })
    })

    app.post('/activaciones/saldo/regionSeis', (req, res) => {
        return response.send(res, response.success(
            { 
                saldo: elementos.saldoTotalRecargas, 
                estadoPagina: elementos.estadoPagina, 
                estadoSaldo: elementos.estadoSaldoRecargas, 
                recargas: elementos.contadorRecargas,
                recargasCorrectas: elementos.recargasCorrectas,
                recargasFallidas: elementos.recargasFallidas,
                estadoUltimaRecarga: elementos.estadoUltimaRecarga,
                error: elementos.contadorErrorRecarga,
                intermitencia: elementos.intermitencia,
                fechaLastRecarga: elementos.fechaRecarga
            }
        ))
    })

    app.post('/activaciones/actualizarSaldo/regionSeis', (req, res) => {

        if (elementos.estadoSaldoRecargas != 0) {
            return response.send(res, response.processValidation("Verifica la informacion de la pagina"))
        }

        ctrActivaciones.actualizarSaldoActivacionesRAM(driver).then((result) => {
            response.send(res, result)
        }).catch((error) => {
            response.send(res, error)
        })
    })

    app.post('/activaciones/reiniciarServicio/regionSeis', (req, res) => {

        let data = req.body

        if (data.clave != '1Mar0Mor8') {
            return response.sendBadRequest(res)
        }

        /* if (elementos.estadoPagina != 0) {
            return response.send(res, response.pageConfig())
        } */

        if (elementos.estadoPagina != 0) {
            if (elementos.estadoSaldoRecargas != 0) {
                return response.send(res, response.pageConfig())
            }
        }

        ctrActivaciones.rebootActivacionesRAM(driver).then((result) => {
            response.send(res, result)
        }).catch((error) => {
            response.send(res, error)
        })
    })
}