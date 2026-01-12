const { onRequest } = require("firebase-functions/v2/https");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

admin.initializeApp();

// Configure o transportador do Nodemailer (ex: Gmail)
// IMPORTANTE: Para Gmail, use uma "Senha de App" (App Password) gerada na conta Google.
// Não use sua senha de login normal se tiver 2FA ativado.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "blutecnologiasbr@gmail.com", // << SUBSTITUA PELO SEU EMAIL
    pass: "wvge jprj encr zkhd",    // << SUBSTITUA PELA SENHA DE APP GERADA
  },
});

exports.sendInviteEmail = onRequest({ cors: true, invoker: 'public' }, async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { email, nome } = req.body;

    if (!email || !nome) {
      return res.status(400).send("Faltando email ou nome");
    }

    const mailOptions = {
      from: `"O Assessor" <blutecnologiasbr@gmail.com>`, // << USE O MESMO EMAIL AQUI
      to: email,
      subject: "Convite para entrar na Equipe - App O Assessor",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #6EE794;">Bem-vindo ao O Assessor!</h2>
          <p>Olá <strong>${nome}</strong>,</p>
          <p>Você foi convidado para fazer parte da nossa equipe.</p>
          <p>Para concluir seu cadastro e acessar o aplicativo, clique no botão abaixo:</p>
          <a href="https://oassessor.vercel.app/cadastro-assessor-equipe?email=${email}" style="background-color: #6EE794; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Aceitar Convite</a>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">Se você não esperava este convite, por favor ignore este email.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).send({ success: true });
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      res.status(500).send({ error: error.toString() });
    }
});

exports.generateWebAuthToken = onRequest({ cors: true, invoker: 'public' }, async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).send("Missing idToken");
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const customToken = await admin.auth().createCustomToken(decodedToken.uid);
      res.status(200).json({ token: customToken });
    } catch (error) {
      console.error("Erro ao gerar token:", error);
      res.status(500).send({ error: error.toString() });
    }
});