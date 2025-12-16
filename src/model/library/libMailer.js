const nodemailer = require('nodemailer')
const Constants = require('../constants/index')
const dataCorreo = new Constants().dataCorreo()

class LibMailer {

    enviarCorreo(subject, text) {
        return new Promise((resolve, reject) => {
            try {
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: dataCorreo.email,
                        pass: dataCorreo.pass,
                    },
                });

                let messageOptions = {
                    from: dataCorreo.email,
                    to: "soporte@morpheusdss.com, 11jeyci@gmail.com",
                    subject: subject,
                    text: text,
                    //attachments: data
                };

                transporter.sendMail(messageOptions, function (error, info) {
                    if (error) {
                        //throw error;
                        console.log("ocurrio un error al enviar el correo");
                        console.log(error);
                    } else {
                        console.log("Email successfully sent!");
                    }
                });

                return resolve("todo bien")
            } catch (error) {
                console.log(error)
                return resolve("todo mal")
            }
        })

    }

    enviarCorreoSaldoAgotado(subject, text) {
        return new Promise((resolve, reject) => {
            try {
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: dataCorreo.email,
                        pass: dataCorreo.pass,
                    },
                });

                let messageOptions = {
                    from: dataCorreo.email,
                    to: "soporte@morpheusdss.com, 11jeyci@gmail.com, dsamanof@hotmail.com, adrianamolina@morpheusdss.com",
                    subject: subject,
                    text: text,
                    //attachments: data
                };

                transporter.sendMail(messageOptions, function (error, info) {
                    if (error) {
                        //throw error;
                        console.log("ocurrio un error al enviar el correo");
                        console.log(error);
                    } else {
                        console.log("Email successfully sent!");
                    }
                });

                return resolve("todo bien")
            } catch (error) {
                console.log(error)
                return resolve("todo mal")
            }
        })

    }
}


module.exports = LibMailer