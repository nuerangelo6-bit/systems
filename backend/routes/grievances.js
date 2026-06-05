const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');


router.get('/', authMiddleware, async (req, res) => {
  try {
    const { complainant_id } = req.query;
    
    
    if (complainant_id) {
      const [grievances] = await pool.query(
        'SELECT * FROM vw_grievance_summary WHERE complainant_id = ? ORDER BY submission_date DESC',
        [complainant_id]
      );
      return res.json({ success: true, data: grievances });
    }
    
    
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const [grievances] = await pool.query('SELECT * FROM vw_grievance_summary ORDER BY submission_date DESC');
    res.json({ success: true, data: grievances });
  } catch (error) {
    console.error('Get grievances error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/my', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const [grievances] = await pool.query(
      'SELECT * FROM vw_grievance_summary WHERE complainant_id = ? ORDER BY submission_date DESC',
      [req.user.userId]
    );
    res.json({ success: true, data: grievances });
  } catch (error) {
    console.error('Get my grievances error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [grievances] = await pool.query(
      'SELECT * FROM vw_grievance_summary WHERE grievance_id = ?',
      [req.params.id]
    );
    
    if (grievances.length === 0) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }
    
    
    if (req.user.role === 'student' && grievances[0].complainant_id !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.json({ success: true, data: grievances[0] });
  } catch (error) {
    console.error('Get grievance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/track/:caseNumber', authMiddleware, async (req, res) => {
  try {
    const [grievances] = await pool.query(
      'SELECT * FROM vw_grievance_summary WHERE case_number = ?',
      [req.params.caseNumber]
    );
    
    if (grievances.length === 0) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    
    
    if (req.user.role === 'student' && grievances[0].complainant_id !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.json({ success: true, data: grievances[0] });
  } catch (error) {
    console.error('Track grievance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.post('/', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    console.log('Received grievance submission:', req.body);
    const { student_name, student_email, student_id_num, category_id, subject, description, suspect_id, suspect_name } = req.body;

    console.log('Step 1: Generating case number');
    const year = new Date().getFullYear();
    const [maxCase] = await pool.query(
      'SELECT case_number FROM grievances WHERE YEAR(submission_date) = ? ORDER BY case_number DESC LIMIT 1',
      [year]
    );
    
    let nextNum = 1;
    if (maxCase.length > 0 && maxCase[0].case_number) {
      const currentNum = parseInt(maxCase[0].case_number.split('-')[2]);
      nextNum = currentNum + 1;
    }
    
    const caseNumber = `GRV-${year}-${String(nextNum).padStart(4, '0')}`;
    console.log('Case number generated:', caseNumber);

    console.log('Step 2: Calling stored procedure');
    const [result] = await pool.query(
      'CALL sp_submit_grievance(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [caseNumber, req.user.userId, student_name, student_email, student_id_num, category_id, subject, description, suspect_id, suspect_name]
    );
    console.log('Stored procedure result:', result);

    const grievanceId = result[0][0].grievance_id;
    console.log('Grievance ID:', grievanceId);

    console.log('Step 3: Inserting notifications');
    try {
      const [admins] = await pool.query(
        "SELECT user_id FROM users WHERE role IN ('admin', 'superadmin')"
      );
      for (const admin of admins) {
        await pool.query(
          'INSERT INTO notifications (user_id, title, message, type, grievance_id, case_number) VALUES (?, ?, ?, ?, ?, ?)',
          [admin.user_id, 'New Grievance Filed', `A new grievance ${caseNumber} has been submitted by ${student_name}`, 'info', grievanceId, caseNumber]
        );
      }
    } catch (notifError) {
      console.error('Notification insertion failed (non-critical):', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      grievanceId: result[0][0].grievance_id,
      caseNumber
    });
  } catch (error) {
    console.error('Submit grievance error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});


router.put('/:id/status', authMiddleware, requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { status } = req.body;

    const [grievance] = await pool.query('SELECT complainant_id, case_number FROM grievances WHERE grievance_id = ?', [req.params.id]);

    await pool.query(
      'CALL sp_update_status(?, ?, ?)',
      [req.params.id, status, req.user.userId]
    );

    if (grievance.length > 0 && grievance[0].complainant_id) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type, grievance_id, case_number) VALUES (?, ?, ?, ?, ?, ?)',
        [grievance[0].complainant_id, 'Case Status Updated', `Your grievance ${grievance[0].case_number} status has been updated to: ${status}`, 'success', req.params.id, grievance[0].case_number]
      );
    }

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.put('/:id/assign', authMiddleware, requireRole(['superadmin']), async (req, res) => {
  try {
    const { adminId } = req.body;
    
    await pool.query(
      'UPDATE grievances SET assigned_admin_id = ? WHERE grievance_id = ?',
      [adminId, req.params.id]
    );
    
    res.json({ success: true, message: 'Admin assigned successfully' });
  } catch (error) {
    console.error('Assign admin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/:id/logs', authMiddleware, async (req, res) => {
  try {
    const [logs] = await pool.query(
      'SELECT * FROM grievance_logs WHERE grievance_id = ? ORDER BY changed_at DESC',
      [req.params.id]
    );
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/:id/hearings', authMiddleware, async (req, res) => {
  try {
    const [hearings] = await pool.query(
      'SELECT * FROM hearings WHERE grievance_id = ? ORDER BY hearing_number',
      [req.params.id]
    );
    res.json({ success: true, data: hearings });
  } catch (error) {
    console.error('Get hearings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/:id/summons', authMiddleware, async (req, res) => {
  try {
    const [summons] = await pool.query(
      `SELECT s.*, h.scheduled_date, h.scheduled_time, h.venue, h.hearing_number
       FROM summons s
       JOIN hearings h ON s.hearing_id = h.hearing_id
       WHERE s.grievance_id = ?
       ORDER BY h.hearing_number`,
      [req.params.id]
    );
    res.json({ success: true, data: summons });
  } catch (error) {
    console.error('Get summons error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.put('/:id', authMiddleware, requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { assigned_admin_id, status } = req.body;
    
    if (assigned_admin_id !== undefined) {
      await pool.query(
        'UPDATE grievances SET assigned_admin_id = ? WHERE grievance_id = ?',
        [assigned_admin_id, req.params.id]
      );
      return res.json({ success: true, message: 'Admin assigned successfully' });
    }
    
    if (status) {
      await pool.query(
        'CALL sp_update_status(?, ?, ?)',
        [req.params.id, status, req.user.userId]
      );
      return res.json({ success: true, message: 'Status updated successfully' });
    }
    
    res.status(400).json({ success: false, message: 'Nothing to update' });
  } catch (error) {
    console.error('Update grievance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.post('/:id/hearings', authMiddleware, requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { scheduled_date, scheduled_time, venue } = req.body;
    const [grievance] = await pool.query('SELECT case_number, complainant_id FROM grievances WHERE grievance_id = ?', [req.params.id]);

    if (grievance.length === 0) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    const [result] = await pool.query(
      'CALL sp_schedule_hearing(?, ?, ?, ?, ?, ?)',
      [req.params.id, grievance[0].case_number, scheduled_date, scheduled_time, venue, req.user.userId]
    );

    let hearingId = null;
    if (result && result[0] && result[0][0] && result[0][0].hearing_id) {
      hearingId = result[0][0].hearing_id;
    } else {
      // Fallback: query for the most recently created hearing for this grievance
      const [hearingResult] = await pool.query(
        'SELECT hearing_id FROM hearings WHERE grievance_id = ? ORDER BY hearing_id DESC LIMIT 1',
        [req.params.id]
      );
      if (hearingResult.length > 0) {
        hearingId = hearingResult[0].hearing_id;
      }
    }

    if (!hearingId) {
      console.error('Failed to get hearing_id from stored procedure result and fallback query:', result);
      return res.status(500).json({ success: false, message: 'Failed to schedule hearing - could not retrieve hearing ID' });
    }


    const [g] = await pool.query(
      'SELECT student_name, suspect_name FROM grievances WHERE grievance_id = ?',
      [req.params.id]
    );

    if (g.length > 0) {
      await pool.query(
        'INSERT INTO summons (hearing_id, grievance_id, case_number, party_type, party_name, issued_by) VALUES (?, ?, ?, ?, ?, ?)',
        [hearingId, req.params.id, grievance[0].case_number, 'complainant', g[0].student_name, req.user.userId]
      );
      if (g[0].suspect_name) {
        await pool.query(
          'INSERT INTO summons (hearing_id, grievance_id, case_number, party_type, party_name, issued_by) VALUES (?, ?, ?, ?, ?, ?)',
          [hearingId, req.params.id, grievance[0].case_number, 'respondent', g[0].suspect_name, req.user.userId]
        );
      }
    }

    if (grievance[0].complainant_id) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type, grievance_id, case_number) VALUES (?, ?, ?, ?, ?, ?)',
        [grievance[0].complainant_id, 'Hearing Scheduled', `A hearing has been scheduled for your grievance ${grievance[0].case_number} on ${new Date(scheduled_date).toLocaleDateString()} at ${scheduled_time}`, 'warning', req.params.id, grievance[0].case_number]
      );
    }

    res.status(201).json({ success: true, message: 'Hearing scheduled successfully', hearingId });
  } catch (error) {
    console.error('Schedule hearing error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.put('/:id/hearings/:hearingId', authMiddleware, requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { status, outcome, reschedule_reason, next_hearing_date, next_hearing_time, next_venue } = req.body;
    
    if (status === 'Completed' && outcome) {
      await pool.query(
        'UPDATE hearings SET status = ?, outcome = ? WHERE hearing_id = ?',
        ['Completed', outcome, req.params.hearingId]
      );
      
      await pool.query('UPDATE grievances SET status = ? WHERE grievance_id = ?', ['Resolved', req.params.id]);
      return res.json({ success: true, message: 'Hearing completed' });
    }
    
    if (status === 'Rescheduled' && next_hearing_date && next_hearing_time && next_venue) {
      
      await pool.query(
        'UPDATE hearings SET status = ?, reschedule_reason = ? WHERE hearing_id = ?',
        ['Rescheduled', reschedule_reason, req.params.hearingId]
      );
      
      
      const [grievance] = await pool.query('SELECT case_number FROM grievances WHERE grievance_id = ?', [req.params.id]);
      const [result] = await pool.query(
        'CALL sp_schedule_hearing(?, ?, ?, ?, ?, ?)',
        [req.params.id, grievance[0].case_number, next_hearing_date, next_hearing_time, next_venue, req.user.userId]
      );
      
      return res.json({ success: true, message: 'Hearing rescheduled' });
    }
    
    res.status(400).json({ success: false, message: 'Invalid update' });
  } catch (error) {
    console.error('Update hearing error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.delete('/:id', authMiddleware, requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    await pool.query('DELETE FROM grievances WHERE grievance_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Grievance deleted' });
  } catch (error) {
    console.error('Delete grievance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/meta/stats', authMiddleware, requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const [total] = await pool.query('SELECT COUNT(*) as total FROM grievances');
    const [byStatus] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) as under_review,
        SUM(CASE WHEN status = 'Hearing Scheduled' THEN 1 ELSE 0 END) as hearing_scheduled,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
      FROM grievances
    `);
    const [byCategory] = await pool.query(`
      SELECT c.category_name, COUNT(*) as count 
      FROM grievances g 
      JOIN categories c ON g.category_id = c.category_id 
      GROUP BY c.category_name
    `);
    const [recentHearings] = await pool.query(`
      SELECT h.*, g.subject, g.student_name, g.case_number 
      FROM hearings h 
      JOIN grievances g ON h.grievance_id = g.grievance_id 
      WHERE h.status = 'Scheduled' 
      ORDER BY h.scheduled_date ASC 
      LIMIT 5
    `);
    const [avgDays] = await pool.query(`
      SELECT AVG(DATEDIFF(COALESCE(resolution_date, NOW()), submission_date)) as avg_days_open 
      FROM grievances 
      WHERE status IN ('Resolved', 'Closed')
    `);

    res.json({
      success: true,
      data: {
        total: total[0].total,
        submitted: byStatus[0].submitted || 0,
        under_review: byStatus[0].under_review || 0,
        hearing_scheduled: byStatus[0].hearing_scheduled || 0,
        resolved: byStatus[0].resolved || 0,
        rejected: byStatus[0].rejected || 0,
        byCategory,
        recentHearings,
        avg_days_open: Math.round(avgDays[0].avg_days_open || 0)
      }
    });
  } catch (error) {
    console.error('Get meta stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/meta/audit-logs', authMiddleware, requireRole(['superadmin']), async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT 
        gl.log_id,
        gl.changed_at as timestamp,
        gl.changed_by as user_id,
        u.full_name as user_name,
        u.role as user_role,
        gl.old_status as old_value,
        gl.new_status as new_value,
        gl.note,
        g.case_number,
        CASE 
          WHEN gl.old_status IS NOT NULL AND gl.new_status IS NOT NULL THEN 'status_change'
          WHEN gl.note LIKE '%assigned%' THEN 'assignment'
          WHEN gl.note LIKE '%hearing%' THEN 'hearing'
          ELSE 'other'
        END as action_type,
        CONCAT(
          CASE 
            WHEN gl.old_status IS NOT NULL THEN CONCAT('Status changed from ', gl.old_status, ' to ', gl.new_status)
            ELSE 'Updated case'
          END,
          CASE 
            WHEN gl.note IS NOT NULL THEN CONCAT(' - ', gl.note)
            ELSE ''
          END
        ) as action
      FROM grievance_logs gl
      JOIN grievances g ON gl.grievance_id = g.grievance_id
      LEFT JOIN users u ON gl.changed_by = u.user_id
      ORDER BY gl.changed_at DESC
      LIMIT 100
    `);

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/meta/settings', authMiddleware, requireRole(['superadmin']), async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM system_settings LIMIT 1');
    
    if (settings.length === 0) {
      return res.json({
        success: true,
        data: {
          academic_year: '2025-2026',
          semester: '1st Semester',
          case_id_prefix: 'GRV',
          case_id_start_number: 1
        }
      });
    }

    res.json({ success: true, data: settings[0] });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.put('/meta/settings', authMiddleware, requireRole(['superadmin']), async (req, res) => {
  try {
    const { academic_year, semester, case_id_prefix, case_id_start_number } = req.body;

    const [existing] = await pool.query('SELECT * FROM system_settings LIMIT 1');
    
    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO system_settings (academic_year, semester, case_id_prefix, case_id_start_number) VALUES (?, ?, ?, ?)',
        [academic_year, semester, case_id_prefix, case_id_start_number]
      );
    } else {
      await pool.query(
        'UPDATE system_settings SET academic_year = ?, semester = ?, case_id_prefix = ?, case_id_start_number = ? WHERE settings_id = ?',
        [academic_year, semester, case_id_prefix, case_id_start_number, existing[0].settings_id]
      );
    }

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
