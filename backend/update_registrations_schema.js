const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'club_management',
});

const queries = [
    `ALTER TABLE registrations ADD COLUMN registration_type ENUM('Individual', 'Team') DEFAULT 'Individual'`,
    `ALTER TABLE registrations ADD COLUMN team_name VARCHAR(100) DEFAULT NULL`
];

db.connect(async (err) => {
    if (err) {
        console.error('Error connecting:', err);
        process.exit(1);
    }
    console.log('Connected to DB.');

    for (const q of queries) {
        try {
            await db.promise().query(q);
            console.log('Executed:', q);
        } catch (e) {
            console.error('Error:', e.message);
        }
    }
    db.end();
});
