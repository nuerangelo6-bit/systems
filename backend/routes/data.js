const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');


router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY category_name');
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/suspects', authMiddleware, async (req, res) => {
  try {
    const [suspects] = await pool.query('SELECT * FROM suspects ORDER BY full_name');
    res.json({ success: true, data: suspects });
  } catch (error) {
    console.error('Get suspects error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/admins', authMiddleware, requireRole(['superadmin']), async (req, res) => {
  try {
    const [admins] = await pool.query(
      "SELECT user_id, username, full_name, email FROM users WHERE role = 'admin' ORDER BY full_name"
    );
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.post('/sql', authMiddleware, requireRole(['superadmin']), async (req, res) => {
  try {
    const { sql } = req.body;


    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE'];
    const upperQuery = sql.toUpperCase();
    
    if (dangerousKeywords.some(keyword => upperQuery.includes(keyword))) {
      return res.status(403).json({ error: 'Only SELECT queries are allowed' });
    }
    
    if (!upperQuery.trim().startsWith('SELECT') && !upperQuery.trim().startsWith('SHOW') && !upperQuery.trim().startsWith('DESCRIBE')) {
      return res.status(403).json({ error: 'Only SELECT, SHOW, and DESCRIBE queries are allowed' });
    }
    
    const [results] = await pool.query(sql);
    res.json(results);
  } catch (error) {
    console.error('SQL query error:', error);
    res.status(500).json({ error: error.message });
  }
});


router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [totalCases] = await pool.query('SELECT COUNT(*) as count FROM grievances');
    const [byStatus] = await pool.query('SELECT status, COUNT(*) as count FROM grievances GROUP BY status');
    const [byCategory] = await pool.query('SELECT c.category_name, COUNT(*) as count FROM grievances g JOIN categories c ON g.category_id = c.category_id GROUP BY c.category_name');
    
    res.json({
      total: totalCases[0].count,
      byStatus,
      byCategory
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/stats/student', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const userId = req.user.userId;
    const [totalCases] = await pool.query('SELECT COUNT(*) as count FROM grievances WHERE complainant_id = ?', [userId]);
    const [byStatus] = await pool.query('SELECT status, COUNT(*) as count FROM grievances WHERE complainant_id = ? GROUP BY status', [userId]);
    const [byCategory] = await pool.query('SELECT c.category_name, COUNT(*) as count FROM grievances g JOIN categories c ON g.category_id = c.category_id WHERE g.complainant_id = ? GROUP BY c.category_name', [userId]);
    
    res.json({
      total: totalCases[0].count,
      byStatus,
      byCategory
    });
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/stats/admin', authMiddleware, requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const userId = req.user.userId;
    const [totalCases] = await pool.query('SELECT COUNT(*) as count FROM grievances WHERE assigned_admin_id = ?', [userId]);
    const [byStatus] = await pool.query('SELECT status, COUNT(*) as count FROM grievances WHERE assigned_admin_id = ? GROUP BY status', [userId]);
    const [byCategory] = await pool.query('SELECT c.category_name, COUNT(*) as count FROM grievances g JOIN categories c ON g.category_id = c.category_id WHERE g.assigned_admin_id = ? GROUP BY c.category_name', [userId]);
    
    res.json({
      total: totalCases[0].count,
      byStatus,
      byCategory
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
