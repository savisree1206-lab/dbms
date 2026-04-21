const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'club_management'
});

db.connect((err) => {
    if (err) throw err;
    
    console.log('\n--- 📋 ACTIVE CLUB MEMBERS ---');
    db.query('SELECT name, role, position FROM members', (err, members) => {
        if (err) throw err;
        console.table(members);

        console.log('\n--- 💡 PENDING JOIN REQUESTS & IDEAS ---');
        db.query('SELECT name, applied_position, idea FROM join_requests', (err, requests) => {
            if (err) throw err;
            if (requests.length === 0) {
                console.log('No pending requests found.');
            } else {
                console.table(requests);
            }
            db.end();
        });
    });
});
