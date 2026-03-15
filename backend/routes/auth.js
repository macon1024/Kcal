const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://kcal-web.onrender.com';

console.log('------------------------------------------------');
console.log('AUTH SERVICE INITIALIZED');
console.log('FRONTEND_URL:', FRONTEND_URL);
console.log('process.env.FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('------------------------------------------------');

// Configure Nodemailer (Using a mock ethereal email for testing, or replace with real SMTP)
// To test this easily, we will print the verification link in the console as well.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // e.g. your-email@gmail.com
    pass: process.env.EMAIL_PASS  // your generated app password
  }
});

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Save user
    const newUser = await User.insert({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      goals: {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 70
      }
    });

    // Send verification email
    const verificationLink = `${FRONTEND_URL}/verify/${verificationToken}`;
    console.log(`\n\n======================================`);
    console.log(`VERIFICATION LINK FOR ${email}:`);
    console.log(verificationLink);
    console.log(`Current FRONTEND_URL is: ${FRONTEND_URL}`);
    console.log(`TYPE OF FRONTEND_URL is: ${typeof FRONTEND_URL}`);
    console.log(`======================================\n\n`);

    const mailHtml = `<p>Hello ${username},</p><p>Please verify your account by clicking the link below:</p><a href="${verificationLink}">Verify Account</a><br/><br/><p>If the button doesn't work, copy and paste this link:</p><p>${verificationLink}</p>`;
    console.log('GENERATED HTML BODY:', mailHtml);

    try {
      await transporter.sendMail({
        from: `"Kcal App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify your Kcal Account",
        html: mailHtml
      });
    } catch (emailErr) {
      console.error('Failed to send email, but user was created. Please use the link printed in the console to verify.', emailErr);
    }

    res.status(201).json({ message: 'User registered. Please check your email to verify your account.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// VERIFY EMAIL
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    await User.update(
      { _id: user._id },
      { $set: { isVerified: true, verificationToken: null } }
    );

    res.json({ message: 'Account verified successfully! You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// RESEND VERIFICATION EMAIL
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Account already verified' });

    // Create new verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    await User.update(
      { _id: user._id },
      { $set: { verificationToken } }
    );

    const verificationLink = `${FRONTEND_URL}/verify/${verificationToken}`;
    console.log(`\n\n=== RESEND VERIFICATION ===`);
    console.log(`LINK FOR ${email}: ${verificationLink}`);
    console.log(`Current FRONTEND_URL is: ${FRONTEND_URL}`);
    console.log(`TYPE OF FRONTEND_URL is: ${typeof FRONTEND_URL}`);
    console.log(`===========================\n\n`);

    const mailHtml = `<p>Hello ${user.username},</p><p>Please verify your account by clicking the link below:</p><a href="${verificationLink}">Verify Account</a><br/><br/><p>If the button doesn't work, copy and paste this link:</p><p>${verificationLink}</p>`;
    console.log('GENERATED HTML BODY (RESEND):', mailHtml);

    try {
      await transporter.sendMail({
        from: `"Kcal App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Resend: Verify your Kcal Account",
        html: mailHtml
      });
      res.json({ message: 'Verification email resent.' });
    } catch (emailErr) {
      console.error('Failed to resend email:', emailErr);
      res.status(500).json({ message: 'Failed to send email. Please verify using the console link.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        goals: user.goals
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
