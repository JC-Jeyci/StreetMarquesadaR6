const glob = require('glob')
const path = require('path')

module.exports = (app, driver) => {
    glob.sync('./src/services/router/*.js').forEach((file) => {
        if(!file.includes('index.js'))
            require(path.resolve(file))(app, driver)
    })
}