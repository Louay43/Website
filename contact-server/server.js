require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Contact route
app.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"${name}" <${email}>`,
    to: process.env.EMAIL_TO,
    subject: subject,
    text: message
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error sending email.');
    }
    console.log('Email sent:', info.response);
    res.send('Message sent successfully!');
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
