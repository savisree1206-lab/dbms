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

// --- Authentication Routes ---
const clubDomains = {
    'csi.com': 1,
    'ieee.com': 2,
    'sdc.com': 3,
    'robotics.com': 4,
    'imc.com': 5,
    'finearts.com': 6
};

app.post('/api/auth/signup', (req, res) => {
    const { name, email, password, requested_role, requested_club_id } = req.body;
    
    if (!email || !password || !name) return res.status(400).json({ error: 'All fields are required.' });

    // Allow explicit role assignment for demo purposes
    let role = requested_role || 'student';
    let club_id = requested_club_id || null;

    // Optional: Keep domain check as a fallback
    const domain = email.split('@')[1];
    if (!requested_role && clubDomains[domain]) {
        role = 'club_member';
        club_id = clubDomains[domain];
    }

    const query = 'INSERT INTO users (name, email, password, role, club_id) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, email, password, role, club_id], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'This email is already registered.' });
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        res.status(201).json({ 
            message: role === 'club_member' ? 'Welcome Admin! Club assigned.' : 'Signup successful!', 
            user: { id: results.insertId, name, email, role, club_id } 
        });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Invalid email or password.' });
        
        const user = results[0];
        res.json({ 
            message: 'Login successful!', 
            user: { id: user.id, name: user.name, email: user.email, role: user.role, club_id: user.club_id } 
        });
    });
});

// --- Main App Routes ---
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

app.post('/api/clubs/:id/join', (req, res) => {
    const { id } = req.params;
    const { name, email, applied_position, idea } = req.body;
    
    if (!name || !email || !applied_position) {
        return res.status(400).json({ error: 'Please fill all required fields.' });
    }

    // Check if already a member
    db.query('SELECT id FROM members WHERE club_id = ? AND email = ?', [id, email], (err, memberResults) => {
        if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
        if (memberResults.length > 0) return res.status(400).json({ error: 'You are already a member of this club!' });

        // Check for existing pending request
        db.query("SELECT id FROM join_requests WHERE club_id = ? AND email = ? AND status = 'Pending'", [id, email], (err, requestResults) => {
            if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
            if (requestResults.length > 0) return res.status(400).json({ error: 'You already have a pending application for this club.' });

            // Record the request as Pending
            const query = "INSERT INTO join_requests (club_id, name, email, applied_position, idea, status) VALUES (?, ?, ?, ?, ?, 'Pending')";
            db.query(query, [id, name, email, applied_position, idea], (err, results) => {
                if (err) return res.status(500).json({ error: 'Failed to submit request: ' + err.message });
                res.status(201).json({ message: 'Join request submitted! Awaiting club approval.' });
            });
        });
    });
});

// GET pending join requests for a club
app.get('/api/clubs/:id/join_requests', (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM join_requests WHERE club_id = ? AND status = 'Pending'", [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Approve a join request
app.post('/api/join_requests/:reqId/approve', (req, res) => {
    const { reqId } = req.params;
    db.query('SELECT * FROM join_requests WHERE id = ?', [reqId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Request not found' });
        
        const request = results[0];
        
        db.query("UPDATE join_requests SET status = 'Approved' WHERE id = ?", [reqId], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message });
            
            db.query('INSERT INTO members (club_id, name, email, role) VALUES (?, ?, ?, ?)', 
                [request.club_id, request.name, request.email, request.applied_position || 'New Member'], 
                (insertErr) => {
                    if (insertErr) return res.status(500).json({ error: insertErr.message });
                    res.json({ message: 'Member approved and added to club!' });
            });
        });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
