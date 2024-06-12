const nodeMailer = require("nodemailer");

const transporter = nodeMailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendMail = async (to, subject, content) => {
  try {
    var mailOptions = {
      from: process.env.SMTP_MAIL,
      to,
      subject,
      html: content,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.log(error);
      else {
        // console.log("Mail sent successfully : ", info.messageId);
      }
    });
  } catch (errors) {
    console.log(errors);
  }
};

module.exports = {
  sendMail,
};
