const ProcessActivaciones = require('../model/process/processActivaciones')
const ProcessActivacionesV2 = require('../model/process/processActivacionesV2')
const processActivaciones = new ProcessActivaciones()
const processActivacionesV2 = new ProcessActivacionesV2()

class Activaciones {

    activarNumeroStreetSeller(data, driver){
        //return processActivaciones.processActivacionNumeroStreetSeller(data, driver)
        return processActivacionesV2.processActivacionNumeroStreetSeller(data, driver)
    }

    actualizarSaldoActivacionesRAM(driver) {
        //return processActivaciones.processActualizarSaldoActivacionesRAM(driver)
        return processActivacionesV2.processActualizarSaldoActivacionesRAM(driver)
    }

    rebootActivacionesRAM(driver) {
        //return processActivaciones.processRebootActivacionesRAM(driver)
        return processActivacionesV2.processRebootActivacionesRAM(driver)
    }
}

module.exports = Activaciones