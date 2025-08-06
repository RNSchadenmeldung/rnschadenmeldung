const nodemailer = require("nodemailer");
const multiparty = require("multiparty");
const fs = require("fs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const form = new multiparty.Form();
    const data = await new Promise((resolve, reject) => {
      form.parse(event, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    let transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: "info@rn-sanierung.com",
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const attachments = [];
    if (data.files.images) {
      for (let file of data.files.images) {
        attachments.push({
          filename: file.originalFilename,
          content: fs.createReadStream(file.path),
        });
      }
    }

    const mailOptions = {
      from: '"RN Sanierung Schadenmeldung" <info@rn-sanierung.com>',
      to: "info@rn-sanierung.com",
      subject: `Neue Schadenmeldung - ${data.fields.damageType}`,
      text: `
Schadenart: ${data.fields.damageType}
Name: ${data.fields.name}
Telefon: ${data.fields.phone}
E-Mail: ${data.fields.email}
Adresse: ${data.fields.address}
Beschreibung: ${data.fields.message}
      `,
      attachments: attachments,
    };

    await transporter.sendMail(mailOptions);

    return { statusCode: 200, body: "Meldung erfolgreich gesendet" };
  } catch (error) {
    return { statusCode: 500, body: `Fehler: ${error.message}` };
  }
};
