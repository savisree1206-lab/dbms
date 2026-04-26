const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'club_management',
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud') ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('MySQL Database pool created.');

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
    const { club_id, title, description, event_date, location, capacity, team_size } = req.body;
    const query = 'INSERT INTO events (club_id, title, description, event_date, location, capacity, team_size) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    db.query(query, [club_id, title, description, event_date, location, capacity, team_size || 1], (err, results) => {
        if (err) {
            console.error('Error inserting event:', err);
            return res.status(500).json({ error: 'Failed to create event: ' + err.message });
        }
        res.status(201).json({ message: 'Event created successfully!', id: results.insertId });
    });
});

app.post('/api/register', (req, res) => {
    const { event_id, name, email, registration_type, team_name, team_members } = req.body;
    db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
        if (results.length > 0) {
            insertRegistration(results[0].id, event_id, registration_type, team_name, team_members, res);
        } else {
            db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, 'defaultpass'], (err, insertRes) => {
               if (err) return res.status(500).json({ error: 'Failed to create user: ' + err.message });
               insertRegistration(insertRes.insertId, event_id, registration_type, team_name, team_members, res);
            });
        }
    });
});

function insertRegistration(user_id, event_id, registration_type, team_name, team_members, res) {
    const query = 'INSERT INTO registrations (user_id, event_id, registration_type, team_name, team_members) VALUES (?, ?, ?, ?, ?)';
    const membersStr = Array.isArray(team_members) ? team_members.join(', ') : team_members;
    db.query(query, [user_id, event_id, registration_type || 'Individual', team_name || null, membersStr || null], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'You are already registered for this event!' });
            }
            return res.status(500).json({ error: 'Registration failed: ' + err.message });
        }
        res.json({ message: 'Successfully registered for the event!', id: results.insertId });
    });
}

// GET club members
app.get('/api/clubs/:id/members', (req, res) => {
    const { id } = req.params;
    const query = "SELECT * FROM members WHERE club_id = ? ORDER BY FIELD(role, 'Office Bearer', 'Old Member', 'New Member')";
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
    
    // Check if already a member to avoid "error message but saving" confusion
    db.query('SELECT id FROM members WHERE club_id = ? AND email = ?', [id, email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
        
        if (results.length > 0) {
            return res.status(400).json({ error: 'You are already a member of this club!' });
        }

        // Insert directly to members for immediate display
        db.query('INSERT INTO members (club_id, name, email, role) VALUES (?, ?, ?, ?)', [id, name, email, role], (err, memberRes) => {
            if (err) return res.status(500).json({ error: 'Failed to add member: ' + err.message });
            
            // Also record the request
            const query = 'INSERT INTO join_requests (club_id, name, email, applied_position, idea, status) VALUES (?, ?, ?, ?, ?, "Approved")';
            db.query(query, [id, name, email, applied_position, idea], (err, results) => {
                if (err) {
                    console.error('Record request error:', err);
                    // We don't return error here because member was already added successfully
                    return res.status(201).json({ message: 'Welcome to the club! Your membership is active.', id: memberRes.insertId });
                }
                res.status(201).json({ message: 'Your application has been approved! Welcome to ' + (req.body.club_name || 'the club') + '.', id: memberRes.insertId });
            });
        });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
