const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

db.connect(async (err) => {
    if (err) return console.error('Error:', err);
    
    try {
        const [events] = await db.promise().query('SELECT * FROM events');
        console.log('--- EVENTS ---');
        console.table(events);

        const [registrations] = await db.promise().query(`
            SELECT u.name as Participant, e.title as Event 
            FROM registrations r
            JOIN users u ON r.user_id = u.id
            JOIN events e ON r.event_id = e.id
        `);
        console.log('\n--- REGISTRATIONS ---');
        console.table(registrations);
    } catch(e) {
        console.error(e);
    }
    db.end();
});
