const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'club_management',
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud') ? { rejectUnauthorized: false } : undefined
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Basic Routes
app.get('/api/events', (req, res) => {
    const query = 'SELECT events.*, clubs.name AS club_name FROM events JOIN clubs ON events.club_id = clubs.id ORDER BY event_date ASC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get all clubs
app.get('/api/clubs', (req, res) => {
    const query = 'SELECT * FROM clubs';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Create a new club
app.post('/api/clubs', (req, res) => {
    const { name, faculty_incharge, description, logo_url } = req.body;
    const query = 'INSERT INTO clubs (name, faculty_incharge, description, logo_url) VALUES (?, ?, ?, ?)';
    db.query(query, [name, faculty_incharge, description, logo_url], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Club created successfully', id: results.insertId });
    });
});

// Create a new event
app.post('/api/events', (req, res) => {
    const { club_id, title, description, event_date, location, capacity } = req.body;
    const query = 'INSERT INTO events (club_id, title, description, event_date, location, capacity) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.query(query, [club_id, title, description, event_date, location, capacity], (err, results) => {
        if (err) {
            console.error('Error inserting event:', err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Event created successfully', id: results.insertId });
    });
});

app.post('/api/register', (req, res) => {
    const { event_id, name, email } = req.body;
    db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            insertRegistration(results[0].id, event_id, res);
        } else {
            db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, 'defaultpass'], (err, insertRes) => {
               if (err) return res.status(500).json({ error: err.message });
               insertRegistration(insertRes.insertId, event_id, res);
            });
        }
    });
});

function insertRegistration(user_id, event_id, res) {
    const query = 'INSERT INTO registrations (user_id, event_id) VALUES (?, ?)';
    db.query(query, [user_id, event_id], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Already registered for this event' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Registered successfully', id: results.insertId });
    });
}

// GET club members
app.get('/api/clubs/:id/members', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM members WHERE club_id = ? ORDER BY FIELD(role, "Office Bearer", "Old Member", "New Member")';
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// GET club events
app.get('/api/clubs/:id/events', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM events WHERE club_id = ? ORDER BY event_date ASC';
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// GET club registrations
app.get('/api/clubs/:id/registrations', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT users.name, events.title AS event_title 
        FROM registrations 
        JOIN users ON registrations.user_id = users.id 
        JOIN events ON registrations.event_id = events.id 
        WHERE events.club_id = ?
        ORDER BY registrations.registered_at DESC
    `;
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Submit join request and add to member
app.post('/api/clubs/:id/join', (req, res) => {
    const { id } = req.params;
    const { name, email, applied_position, idea } = req.body;
    const role = applied_position || 'New Member';
    
    // Insert directly to members for immediate display
    db.query('INSERT INTO members (club_id, name, email, role) VALUES (?, ?, ?, ?)', [id, name, email, role], (err, memberRes) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Also record the request
        const query = 'INSERT INTO join_requests (club_id, name, email, applied_position, idea, status) VALUES (?, ?, ?, ?, ?, "Approved")';
        db.query(query, [id, name, email, applied_position, idea], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Join request approved automatically', id: results.insertId });
        });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
