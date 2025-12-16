const elementos = {
    arrayCodes: new Array(),
    arrayUrlRecarga: new Array(),
    contadorRecargas: 0,
    estadoPagina: 1,
    estadoSaldoRecargas: 1,
    saldoTotalRecargas: 0,
    recargasCorrectas:0,
    recargasFallidas: 0,
    contadorErrorRecarga:0,
    intermitencia:0,
    estadoUltimaRecarga:'S/R',
    fechaRecarga:'S/R'
}

module.exports = elementos