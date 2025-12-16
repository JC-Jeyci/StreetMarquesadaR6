module.exports = (app) => {
    app.use('*', (req, res) => {
        res.status(400).json({ code: 60, data: 'Error al iniciar el driver', message: 'Fallas al iniciar el driver' });
    });
}