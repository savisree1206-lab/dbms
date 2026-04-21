const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'club_management'
});

const queries = [
    `CREATE TABLE IF NOT EXISTS members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        club_id INT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        role ENUM('New Member', 'Old Member', 'Office Bearer') DEFAULT 'New Member',
        position VARCHAR(100),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS join_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        club_id INT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        applied_position ENUM('New Member', 'Old Member', 'Office Bearer') DEFAULT 'New Member',
        idea TEXT,
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
    )`,
    // Dummy Data for Members
    `INSERT INTO members (club_id, name, email, role, position) VALUES 
    (1, 'John Doe', 'john@example.com', 'Office Bearer', 'President'),
    (1, 'Jane Smith', 'jane@example.com', 'Old Member', 'Secretary'),
    (1, 'Bob Wilson', 'bob@example.com', 'New Member', 'Volunteer')`
];

db.connect(async (err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL. Setting up members and join_requests tables...');

    for (const query of queries) {
        try {
            await db.promise().query(query);
            console.log(`Executed query successfully`);
        } catch (error) {
            console.error('Error executing query:', error.message);
        }
    }

    console.log('Membership system tables setup successfully!');
    db.end();
});
