const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'club_management',
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud') ? { rejectUnauthorized: false } : undefined
});

const queries = [
    // Add faculty_incharge column
    `ALTER TABLE clubs ADD COLUMN faculty_incharge VARCHAR(100) AFTER name`,
    
    // Clear existing for fresh start
    `DELETE FROM clubs`,
    
    // Insert KEC Clubs
    `INSERT INTO clubs (name, faculty_incharge, description) VALUES 
    ('Computer Society of India (CSI)', 'Dr. R. Thangarajan', 'Professional body for IT professionals and students to exchange ideas.'),
    ('IEEE Student Branch', 'Dr. S. Albert Alexander', 'Advancing technology for humanity through technical activities and competitions.'),
    ('Self Development Cell (SDC)', 'Dr. P. Vidhyapriya', 'Focuses on the holistic development of students through various workshops and seminars.'),
    ('Robotic Club', 'Dr. K. Gowrisankar', 'Hub for robotics enthusiasts to build and experiment with innovative robotic systems.'),
    ('Innovation Management Cell', 'Dr. M. Sangeetha', 'Encouraging entrepreneurial thinking and innovation among students.'),
    ('Fine Arts Club', 'Mr. S. Logeswaran', 'Platform for students to showcase their creativity in music, dance, and arts.')`
];

db.connect(async (err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL. Updating schema...');

    for (const query of queries) {
        try {
            await db.promise().query(query);
            console.log(`Executed: ${query.substring(0, 50)}...`);
        } catch (error) {
            console.error('Error executing query:', error.message);
        }
    }

    console.log('Database updated successfully!');
    db.end();
});
