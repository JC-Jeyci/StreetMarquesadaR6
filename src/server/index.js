const express = require('express')
const morgan = require('morgan')
const helmet = require('helmet')
const http = require('http')
const fs = require('fs')
const app = express()
const { initializeDriver, initializeDriverSinCaptcha } = require('./webdriver');
const elementos = require('../utils/resources')
process.env.TZ = 'UTC+6'

// Se pone la pagina en modo de espera para que no reciba peticiones hasta que se termine de configurar
elementos.estadoPagina = 0

const options = {
    /*
        cert: fs.readFileSync(''),
        key: fs.readFileSync(''),
        ca: fs.readFileSync('') 
    */
}

app.use(morgan('dev'))
app.use(helmet())

app.use(express.json({limit: '500kb'}))
app.use(express.urlencoded({extended: true}))

/* const startDriver = (async() => {
    const driver = await initializeDriver();

    require('../services/router')(app, driver)
    require('../services/default')(app)
})


startDriver() */

// En caso de falla del webdriver usar esta forma
const startDriver = async () => {
    //const driver = await initializeDriver();
    const driver = await initializeDriverSinCaptcha();
    return driver;
};

// Inicia el driver y luego pasa el driver inicializado a las rutas
try {
    startDriver().then((driver) => {
        require('../services/router')(app, driver);
        require('../services/default/index')(app);
    }).catch((error) => {
        console.log("Error al inicializar el driver:", error);
        require('../services/default/driver')(app);
    });
} catch (error) {
    console.log("error al configurar el webdriver");
    require('../services/default/driver')(app);
}

const serverHttp = http.createServer(options, app).listen(3000, () => {
    console.log(`HTTP servidor esta escuchando en el puerto ${serverHttp.address().port}`);
    
})