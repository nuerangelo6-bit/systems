const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
  });

  try {
    console.log('Connecting to MySQL...');
    await connection.connect();

    
    console.log('Dropping existing database (if any)...');
    await connection.query('DROP DATABASE IF EXISTS student_grievance_db');

    
    console.log('Creating database...');
    await connection.query('CREATE DATABASE student_grievance_db');
    await connection.query('USE student_grievance_db');

    
    console.log('Reading SQL file...');
    const sqlPath = path.join(__dirname, '../student_grievance_db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    
    console.log('Executing SQL statements...');
    for (const statement of statements) {
      if (statement) {
        try {
          await connection.query(statement);
        } catch (err) {
          
          if (!err.message.includes('DELIMITER') && !err.message.includes('syntax')) {
            console.log('Warning:', err.message);
          }
        }
      }
    }

    console.log('✅ Database setup completed successfully!');
    console.log('Database: student_grievance_db');
    console.log('You can now start the backend server with: npm run dev');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await connection.end();
  }
}

setupDatabase();
