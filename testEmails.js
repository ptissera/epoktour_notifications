const { emailHandler } = require('./src/email-handler');
const testEmail = async() => {
     try {  
      console.log("Enviando mensaje de prueba!");
      await emailHandler.generateTestEmail();
      console.log("Mensaje de prueba enviado!");
      } catch(err) {
        console.log('Error en el envio de mensajes', err);
      }
};

testEmail();
