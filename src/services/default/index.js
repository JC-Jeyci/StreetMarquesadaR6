module.exports = (app) => {
    app.get('*', (req, res) => {
        res.status(404).json({message: "Ruta no definida"})
    })
}