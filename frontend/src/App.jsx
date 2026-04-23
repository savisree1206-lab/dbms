import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Users, MapPin, Plus, ArrowRight, LogIn, X } from 'lucide-react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const App = () => {
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [activeTab, setActiveTab] = useState('events'); // 'events' or 'clubs'
  const [showForm, setShowForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubMembers, setClubMembers] = useState([]);
  const [clubEvents, setClubEvents] = useState([]);
  const [clubRegistrations, setClubRegistrations] = useState([]);
  const [showEventRegisterForm, setShowEventRegisterForm] = useState(false);
  const [selectedEventToRegister, setSelectedEventToRegister] = useState(null);
  const [eventRegisterData, setEventRegisterData] = useState({ name: '', email: '' });
  const [formData, setFormData] = useState({
    club_id: 1,
    title: '',
    description: '',
    event_date: '',
    location: '',
    capacity: 50
  });
  const [joinFormData, setJoinFormData] = useState({
    name: '',
    email: '',
    applied_position: 'New Member',
    idea: ''
  });

  // Fetch events from Backend
  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([{ id: 1, title: 'Annual Tech Fest 2026', club_id: 1, event_date: '2026-05-15', location: 'Main Auditorium', capacity: 50 }]);
    }
  };

  const [registeredEvents, setRegisteredEvents] = useState([]);
  const fetchClubs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs`);
      setClubs(response.data);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchClubs();
  }, []);

  const fetchMembersAndEvents = async (clubId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs/${clubId}/members`);
      setClubMembers(response.data);
      const eventResponse = await axios.get(`${API_BASE_URL}/clubs/${clubId}/events`);
      setClubEvents(eventResponse.data);
      const regResponse = await axios.get(`${API_BASE_URL}/clubs/${clubId}/registrations`);
      setClubRegistrations(regResponse.data);
    } catch (error) {
      console.error('Error fetching members or events:', error);
    }
  };

  useEffect(() => {
    if (selectedClub) {
      fetchMembersAndEvents(selectedClub.id);
    }
  }, [selectedClub]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/events`, formData);
      alert('Event Created Successfully!');
      setShowForm(false);
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event.');
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/clubs/${selectedClub.id}/join`, joinFormData);
      alert(`Join request for ${selectedClub.name} submitted! Our office bearers will review your idea.`);
      setShowJoinForm(false);
      setJoinFormData({ name: '', email: '', applied_position: 'New Member', idea: '' });
    } catch (error) {
      console.error('Error submitting join request:', error);
      alert('Failed to submit request.');
    }
  };

  const handleEventRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/register`, {
        event_id: selectedEventToRegister.id,
        name: eventRegisterData.name,
        email: eventRegisterData.email
      });
      setRegisteredEvents([...registeredEvents, selectedEventToRegister.id]);
      alert('Registered successfully!');
      setShowEventRegisterForm(false);
      setEventRegisterData({ name: '', email: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div className="premium-container">
      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '2rem' }}>ClubHub</h2>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#" onClick={() => setActiveTab('events')} style={{ color: activeTab === 'events' ? 'var(--primary)' : 'var(--text-main)', textDecoration: 'none' }}>Events</a>
          <a href="#" onClick={() => setActiveTab('clubs')} style={{ color: activeTab === 'clubs' ? 'var(--primary)' : 'var(--text-main)', textDecoration: 'none' }}>Clubs</a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '6rem' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
          Kongu Engineering <br />
          <span className="gradient-text">Club Management</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
          Elevating student excellence through collaboration and innovation at KEC.
        </p>
      </header>

      {/* Event Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="glass-panel modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2>Create New Event</h2>
              <X className="close-btn" onClick={() => setShowForm(false)} />
            </div>
            <form onSubmit={handleSubmit} className="event-form">
              <input type="text" placeholder="Event Title" required onChange={(e) => setFormData({...formData, title: e.target.value})} />
              <textarea placeholder="Description" onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
              <div className="form-row">
                <input type="datetime-local" required onChange={(e) => setFormData({...formData, event_date: e.target.value})} />
                <input type="text" placeholder="Location" required onChange={(e) => setFormData({...formData, location: e.target.value})} />
              </div>
              <input type="number" placeholder="Capacity" onChange={(e) => setFormData({...formData, capacity: e.target.value})} />
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Save Event</button>
            </form>
          </div>
        </div>
      )}

      {/* Club Detail Modal */}
      {selectedClub && !showJoinForm && (
        <div className="modal-overlay" onClick={() => setSelectedClub(null)}>
          <div className="glass-panel modal-content animate-fade-in" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div>
                <h2 className="gradient-text">{selectedClub.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Club ID: #{selectedClub.id}</p>
              </div>
              <X className="close-btn" onClick={() => setSelectedClub(null)} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Faculty In-charge</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Users size={20} />
                    <span style={{ fontSize: '1.1rem' }}>{selectedClub.faculty_incharge}</span>
                  </div>
                </div>

                <div>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Description</h4>
                  <p style={{ color: 'var(--text-main)', fontSize: '1rem', lineHeight: '1.7' }}>{selectedClub.description}</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                    onClick={() => {
                      setFormData({ ...formData, club_id: selectedClub.id });
                      setShowForm(true);
                      setSelectedClub(null); // Close detail modal to show event form
                    }}
                  >
                    Create Event
                  </button>
                  <button className="btn btn-primary" onClick={() => setShowJoinForm(true)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Join Club</button>
                </div>
              </div>

              <div style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '2rem' }}>
                <h4 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Active Members</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                  {clubMembers.length > 0 ? clubMembers.map(member => (
                    <div key={member.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{member.name}</span>
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', background: member.role === 'Office Bearer' ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}>
                          {member.role === 'Office Bearer' ? member.position : member.role}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No public members listed yet.</p>
                  )}
                </div>

                <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Events Created</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {clubEvents.length > 0 ? clubEvents.map(event => (
                    <div key={event.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontWeight: 600 }}>{event.title}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(event.event_date).toLocaleDateString()} at {event.location}</span>
                      </div>
                    </div>
                  )) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No events created yet.</p>
                  )}
                </div>

                <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', marginTop: '1.5rem' }}>Registered Participants</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {clubRegistrations.length > 0 ? clubRegistrations.map((reg, index) => (
                    <div key={index} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{reg.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{reg.event_title}</span>
                      </div>
                    </div>
                  )) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No registrations yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Club Form Modal */}
      {showJoinForm && (
        <div className="modal-overlay" onClick={() => setShowJoinForm(false)}>
          <div className="glass-panel modal-content animate-fade-in" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div>
                <h2 className="gradient-text">Join {selectedClub?.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Submit your interest and ideas!</p>
              </div>
              <X className="close-btn" onClick={() => setShowJoinForm(false)} />
            </div>
            
            <form onSubmit={handleJoinSubmit} className="event-form">
              <input 
                type="text" 
                placeholder="Full Name" 
                required 
                value={joinFormData.name}
                onChange={(e) => setJoinFormData({...joinFormData, name: e.target.value})} 
              />
              <input 
                type="email" 
                placeholder="Student Email (Gmail/KEC)" 
                required 
                value={joinFormData.email}
                onChange={(e) => setJoinFormData({...joinFormData, email: e.target.value})} 
              />
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Position Interest</label>
                <select 
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '0.5rem' }}
                  value={joinFormData.applied_position}
                  onChange={(e) => setJoinFormData({...joinFormData, applied_position: e.target.value})}
                >
                  <option value="New Member">New Member (Junior)</option>
                  <option value="Old Member">Senior Member</option>
                  <option value="Office Bearer">Office Bearer (Leadership Role)</option>
                </select>
              </div>
              <textarea 
                placeholder="Share your ideas for the club or why you want to join..." 
                required
                style={{ height: '120px' }}
                value={joinFormData.idea}
                onChange={(e) => setJoinFormData({...joinFormData, idea: e.target.value})}
              ></textarea>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Submit Application</button>
            </form>
          </div>
        </div>
      )}

      {/* Event Register Form Modal */}
      {showEventRegisterForm && (
        <div className="modal-overlay" onClick={() => setShowEventRegisterForm(false)}>
          <div className="glass-panel modal-content animate-fade-in" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>Register for {selectedEventToRegister?.title}</h2>
              <X className="close-btn" onClick={() => setShowEventRegisterForm(false)} />
            </div>
            <form onSubmit={handleEventRegisterSubmit} className="event-form">
              <input type="text" placeholder="Full Name" required value={eventRegisterData.name} onChange={(e) => setEventRegisterData({...eventRegisterData, name: e.target.value})} />
              <input type="email" placeholder="Email" required value={eventRegisterData.email} onChange={(e) => setEventRegisterData({...eventRegisterData, email: e.target.value})} />
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Confirm Registration</button>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {activeTab === 'events' ? 'Upcoming Events' : 'Available Clubs'}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {activeTab === 'events' ? 'Pulling live events from your Database' : 'Explore diverse student organizations at KEC'}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {activeTab === 'events' ? (
            events.map((event) => (
              <div key={event.id} className="glass-panel event-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: '600' }}>
                    {event.club_name ? event.club_name : `Club #${event.club_id}`}
                  </span>
                  <Calendar size={18} color="var(--text-muted)" />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{event.title}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{event.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                    <MapPin size={18} /> <span>{event.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                    <Users size={18} /> <span>{event.capacity} capacity</span>
                  </div>
                </div>
                <button 
                  className={`btn ${registeredEvents.includes(event.id) ? 'btn-secondary' : 'btn-primary'}`} 
                  style={{ width: '100%', cursor: registeredEvents.includes(event.id) ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (!registeredEvents.includes(event.id)) {
                      setSelectedEventToRegister(event);
                      setShowEventRegisterForm(true);
                    }
                  }}
                >
                  {registeredEvents.includes(event.id) ? 'Registered' : 'Register Now'}
                </button>
              </div>
            ))
          ) : (
            clubs.map((club) => (
              <div key={club.id} className="glass-panel event-card" onClick={() => setSelectedClub(club)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: '600' }}>
                    KEC Club
                  </span>
                  <ArrowRight size={18} color="var(--text-muted)" />
                </div>
                <h3 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{club.name}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {club.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                  <LogIn size={18} /> <span>Lead: {club.faculty_incharge}</span>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }}>View Details</button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default App;
