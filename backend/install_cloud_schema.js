const fs = require('fs');
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
});

db.connect(async (err) => {
    if (err) {
        console.error('Error connecting:', err);
        process.exit(1);
    }
    console.log('Connected to Cloud Database.');

    try {
        // Read schema.sql, ignoring CREATE DATABASE and USE which fail on managed clouds
        let schemaSql = fs.readFileSync('../db/schema.sql', 'utf8');
        schemaSql = schemaSql.replace(/CREATE DATABASE[^;]+;/gi, '');
        schemaSql = schemaSql.replace(/USE [^;]+;/gi, '');

        console.log('Creating tables...');
        await db.promise().query(schemaSql);
        
        console.log('Inserting initial clubs...');
        const initialClubs = `
            INSERT INTO clubs (name, faculty_incharge, description) VALUES 
            ('Computer Society of India (CSI)', 'Dr. R. Thangarajan', 'Professional body for IT professionals and students to exchange ideas.'),
            ('IEEE Student Branch', 'Dr. S. Albert Alexander', 'Advancing technology for humanity through technical activities and competitions.'),
            ('Self Development Cell (SDC)', 'Dr. P. Vidhyapriya', 'Focuses on the holistic development of students through various workshops and seminars.'),
            ('Robotic Club', 'Dr. K. Gowrisankar', 'Hub for robotics enthusiasts to build and experiment with innovative robotic systems.'),
            ('Innovation Management Cell', 'Dr. M. Sangeetha', 'Encouraging entrepreneurial thinking and innovation among students.'),
            ('Fine Arts Club', 'Mr. S. Logeswaran', 'Platform for students to showcase their creativity in music, dance, and arts.')
        `;
        
        // Ignore duplicate insert errors safely
        await db.promise().query('TRUNCATE TABLE clubs;').catch(()=>null);
        await db.promise().query(initialClubs);

        console.log('Cloud database initialized completely with schema and initial data!');
    } catch (e) {
        console.error('Migration failed:', e);
    }

    db.end();
});
