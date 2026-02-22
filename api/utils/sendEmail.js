import { Resend } from 'resend';

// Inicializa Resend utilizando la llave almacenada en las variables de entorno
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  try {
    const { data, error } = await resend.emails.send({
      // ✅ CAMBIO VITAL: Usamos tu dominio verificado
      from: 'FutStore <info@futstorecr.com>',
      to: options.email,
      subject: options.subject,
      html: options.message,
    });

    if (error) {
      console.error("Error detallado de Resend:", error);
      throw new Error(error.message);
    }

    console.log("Correo enviado con éxito. ID de mensaje:", data.id);
    return data;
  } catch (err) {
    console.error("Error crítico en el servicio de envío:", err);
    throw err;
  }
};

export default sendEmail;