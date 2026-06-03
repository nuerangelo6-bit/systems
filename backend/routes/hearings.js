const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');


router.get('/grievance/:grievanceId', authMiddleware, async (req, res) => {
  try {
    const [hearings] = await pool.query(
      'SELECT * FROM hearings WHERE grievance_id = ? ORDER BY hearing_number',
      [req.params.grievanceId]
    );
    res.json({ success: true, data: hearings });
  } catch (error) {
    console.error('Get hearings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.post('/', authMiddleware, requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { grievanceId, caseNumber, scheduledDate, scheduledTime, venue } = req.body;
    
    
    const [result] = await pool.query(
      'CALL sp_schedule_hearing(?, ?, ?, ?, ?, ?)',
      [grievanceId, caseNumber, scheduledDate, scheduledTime, venue, req.user.userId]
    );
    
    const hearingId = result[0][0].hearing_id;
    
    
    const [grievance] = await pool.query(
      'SELECT student_name, suspect_name FROM grievances WHERE grievance_id = ?',
      [grievanceId]
    );
    
    if (grievance.length > 0) {
      
      await pool.query(
        'INSERT INTO summons (hearing_id, grievance_id, case_number, party_type, party_name, issued_by) VALUES (?, ?, ?, ?, ?, ?)',
        [hearingId, grievanceId, caseNumber, 'complainant', grievance[0].student_name, req.user.userId]
      );
      
      
      if (grievance[0].suspect_name) {
        await pool.query(
          'INSERT INTO summons (hearing_id, grievance_id, case_number, party_type, party_name, issued_by) VALUES (?, ?, ?, ?, ?, ?)',
          [hearingId, grievanceId, caseNumber, 'respondent', grievance[0].suspect_name, req.user.userId]
        );
      }
    }
    
    res.status(201).json({ success: true, message: 'Hearing scheduled successfully', hearingId });
  } catch (error) {
    console.error('Schedule hearing error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.put('/:id/reschedule', authMiddleware, requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { scheduledDate, scheduledTime, venue, reason } = req.body;
    
    await pool.query(
      'UPDATE hearings SET scheduled_date = ?, scheduled_time = ?, venue = ?, status = ?, reschedule_reason = ? WHERE hearing_id = ?',
      [scheduledDate, scheduledTime, venue, 'Rescheduled', reason, req.params.id]
    );
    
    res.json({ success: true, message: 'Hearing rescheduled successfully' });
  } catch (error) {
    console.error('Reschedule hearing error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.put('/:id/complete', authMiddleware, requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { outcome } = req.body;
    
    await pool.query(
      'UPDATE hearings SET status = ?, outcome = ? WHERE hearing_id = ?',
      ['Completed', outcome, req.params.id]
    );
    
    res.json({ success: true, message: 'Hearing marked as completed' });
  } catch (error) {
    console.error('Complete hearing error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/summons/my', authMiddleware, async (req, res) => {
  try {
    const [summons] = await pool.query(
      `SELECT s.*, h.scheduled_date, h.scheduled_time, h.venue, h.hearing_number, g.case_number 
       FROM summons s
       JOIN hearings h ON s.hearing_id = h.hearing_id
       JOIN grievances g ON s.grievance_id = g.grievance_id
       WHERE g.complainant_id = ? OR s.party_name IN (SELECT full_name FROM suspects WHERE full_name = s.party_name)
       ORDER BY h.scheduled_date DESC`,
      [req.user.userId]
    );
    res.json({ success: true, data: summons });
  } catch (error) {
    console.error('Get summons error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.put('/summons/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE summons SET is_read = 1 WHERE summon_id = ?',
      [req.params.id]
    );
    res.json({ success: true, message: 'Summon marked as read' });
  } catch (error) {
    console.error('Mark summon read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
