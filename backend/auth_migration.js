const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud') ? { rejectUnauthorized: false } : undefined
});

db.connect((err) => {
    if (err) {
        console.error('Connection error:', err);
        process.exit(1);
    }
    
    console.log('Connected to DB. Running migration...');
    
    db.query("ALTER TABLE users ADD COLUMN club_id INT NULL DEFAULT NULL", (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') console.error('Error adding club_id:', err.message);
        
        db.query("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) DEFAULT 'student'", (err) => {
             if (err) console.error('Error modifying role:', err.message);
             console.log("Migration complete! Users table updated for club members.");
             db.end();
        });
    });
});
