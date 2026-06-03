const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailjs = require('@emailjs/nodejs');
const pool = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
require('dotenv').config();

emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY
});

const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    console.log('Login attempt - Username:', username, 'User ID:', user.user_id, 'Full Name:', user.full_name, 'Role:', user.role);
    
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.user_id, role: user.role, fullName: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        userId: user.user_id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        studentId: user.student_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.post('/register', async (req, res) => {
  try {
    const { username, password, full_name, email, student_id } = req.body;
    
    
    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE username = ?',
      [username]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO users (username, password, full_name, email, role, student_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, password, full_name, email, 'student', student_id]
    );
    
    res.status(201).json({ success: true, message: 'Registration successful', userId: result.insertId });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/users', authMiddleware, requireRole(['superadmin']), async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT user_id, username, full_name, email, role, student_id FROM users ORDER BY full_name'
    );
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { full_name, email, student_id } = req.body;
    const userId = req.user.userId;
    
    const [result] = await pool.query(
      'UPDATE users SET full_name = ?, email = ?, student_id = ? WHERE user_id = ?',
      [full_name, email, student_id, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.userId;
    
    const [users] = await pool.query(
      'SELECT password FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = users[0];
    
    if (user.password !== current_password) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE user_id = ?',
      [new_password, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const otp = generateOTP();
    otpStore.set(email, { otp, expires: Date.now() + 30 * 60 * 1000 });

    console.log(`OTP for ${email}: ${otp}`);

    const templateParams = {
      email: email,
      otp_code: otp,
      expiry_time: new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString()
    };

    console.log('EmailJS template params:', templateParams);

    try {
      await emailjs.send(
        process.env.EMAILJS_SERVICE_ID,
        process.env.EMAILJS_TEMPLATE_ID,
        templateParams,
        {
          publicKey: process.env.EMAILJS_PUBLIC_KEY,
          privateKey: process.env.EMAILJS_PRIVATE_KEY
        }
      );
      console.log(`Email sent to ${email}`);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      console.log(`OTP for ${email}: ${otp} (email not sent, check EmailJS configuration)`);
    }

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log(`Verify OTP attempt - Email: ${email}, OTP: ${otp}`);
    console.log('Current OTP store:', Array.from(otpStore.entries()));

    const stored = otpStore.get(email);

    if (!stored) {
      console.log(`OTP not found for email: ${email}`);
      return res.status(400).json({ success: false, message: 'OTP expired or not found' });
    }

    console.log(`Stored OTP for ${email}:`, stored);

    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    if (stored.otp !== otp) {
      console.log(`OTP mismatch - Expected: ${stored.otp}, Received: ${otp}`);
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Don't delete OTP immediately to handle duplicate verification calls
    // OTP will expire naturally after 30 minutes

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, full_name, email, student_id, password } = req.body;

    console.log('Registration attempt:', { username, email, student_id });

    if (!email.endsWith('@adssu.edu.ph')) {
      return res.status(400).json({ success: false, message: 'Please use your institutional email (@adssu.edu.ph)' });
    }

    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO users (username, password, full_name, email, role, student_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, password, full_name, email, 'student', student_id]
    );

    console.log('Registration successful for:', username);
    res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
