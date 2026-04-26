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
  const [eventRegisterData, setEventRegisterData] = useState({ 
    name: '', 
    email: '', 
    registration_type: 'Individual', 
    team_name: '',
    team_size: 1,
    team_members: [] 
  });
  const [formData, setFormData] = useState({
    club_id: 1,
    title: '',
    description: '',
    event_date: '',
    location: '',
    capacity: 50,
    team_size: 1
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
      if (selectedClub) fetchMembersAndEvents(selectedClub.id); // Auto-refresh club events
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event.');
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/clubs/${selectedClub.id}/join`, {
        ...joinFormData,
        club_name: selectedClub.name
      });
      alert(response.data.message);
      setShowJoinForm(false);
      setJoinFormData({ name: '', email: '', applied_position: 'New Member', idea: '' });
      await fetchMembersAndEvents(selectedClub.id); // Auto-refresh immediately
    } catch (error) {
      console.error('Error submitting join request:', error);
      alert(error.response?.data?.error || 'Failed to submit request. Please try again.');
    }
  };

  const handleEventRegisterSubmit = async (e) => {
    e.preventDefault();
    if (eventRegisterData.registration_type === 'Team' && !eventRegisterData.team_name) {
      alert('Please enter your Team Name');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/register`, {
        event_id: selectedEventToRegister.id,
        name: eventRegisterData.name,
        email: eventRegisterData.email,
        registration_type: eventRegisterData.registration_type,
        team_name: eventRegisterData.registration_type === 'Team' ? eventRegisterData.team_name : null,
        team_members: eventRegisterData.registration_type === 'Team' ? eventRegisterData.team_members : null
      });
      setRegisteredEvents([...registeredEvents, selectedEventToRegister.id]);
      alert('Registered successfully!');
      setShowEventRegisterForm(false);
      setEventRegisterData({ 
        name: '', email: '', registration_type: 'Individual', team_name: '', team_size: 1, team_members: [] 
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed. Please try again.');
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
      <header className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '8rem' }}>
        <h1 style={{ fontSize: '4.5rem', marginBottom: '2rem', lineHeight: 1 }}>
          Kongu Engineering <br />
          <span className="gradient-text">Club Management</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto 3rem' }}>
          Empowering innovation and leadership through student-led organizations at KEC.
        </p>
      </header>

      {/* Event Form Modal */}
      {showForm && (
        <div className="modal-overlay high-z" onClick={() => setShowForm(false)}>
          <div className="glass-panel modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Event</h2>
              <X className="close-btn" size={24} onClick={() => setShowForm(false)} />
            </div>
            <form onSubmit={handleSubmit} className="event-form">
              <input type="text" placeholder="Event Title" required onChange={(e) => setFormData({...formData, title: e.target.value})} />
              <textarea placeholder="Description" onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
              <div className="form-row">
                <input 
                  type="datetime-local" 
                  required 
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setFormData({...formData, event_date: e.target.value})} 
                />
                <input type="text" placeholder="Location" required onChange={(e) => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="form-row">
                <input type="number" placeholder="Total Capacity" onChange={(e) => setFormData({...formData, capacity: e.target.value})} />
                <input type="number" placeholder="Max Team Size" onChange={(e) => setFormData({...formData, team_size: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Create Event</button>
            </form>
          </div>
        </div>
      )}

      {/* Club Detail Modal */}
      {selectedClub && !showJoinForm && (
        <div className="modal-overlay" onClick={() => setSelectedClub(null)}>
          <div className="glass-panel modal-content animate-fade-in" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="gradient-text">{selectedClub.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Club ID: #{selectedClub.id}</p>
              </div>
              <X className="close-btn" size={24} onClick={() => setSelectedClub(null)} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Faculty In-charge</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Users size={24} className="gradient-text" />
                    <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{selectedClub.faculty_incharge}</span>
                  </div>
                </div>

                <div>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>About the Club</h4>
                  <p style={{ color: 'var(--text-main)', fontSize: '1.05rem', lineHeight: '1.8' }}>{selectedClub.description}</p>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={() => setShowJoinForm(true)} style={{ flex: 1 }}>Join Club</button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setFormData({ ...formData, club_id: selectedClub.id });
                      setShowForm(true);
                    }}
                  >
                    <Plus size={20} /> Create Event
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                <div>
                  <h4 style={{ color: 'var(--secondary)', marginBottom: '1.25rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Active Members</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                    {clubMembers.length > 0 ? clubMembers.map(member => (
                      <div key={member.id} className="list-item">
                        <span style={{ fontWeight: 600 }}>{member.name}</span>
                        <span style={{ fontSize: '0.7rem', padding: '0.3rem 0.7rem', borderRadius: '2rem', background: member.role === 'Office Bearer' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--glass-border)' }}>
                          {member.role === 'Office Bearer' ? (member.position || 'Office Bearer') : member.role}
                        </span>
                      </div>
                    )) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No public members listed yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{ color: 'var(--accent)', marginBottom: '1.25rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Recent Events</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                    {clubEvents.length > 0 ? clubEvents.map(event => (
                      <div key={event.id} className="list-item">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontWeight: 600 }}>{event.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(event.event_date).toLocaleDateString()} • {event.location}</span>
                        </div>
                      </div>
                    )) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No events created yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '1.25rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Participants</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                    {clubRegistrations.length > 0 ? clubRegistrations.map((reg, index) => (
                      <div key={index} className="list-item">
                        <span style={{ fontWeight: 600 }}>{reg.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{reg.event_title}</span>
                      </div>
                    )) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No registrations yet.</p>
                    )}
                  </div>
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
            <div className="modal-header">
              <div>
                <h2 className="gradient-text">Join {selectedClub?.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Submit your interest and ideas!</p>
              </div>
              <X className="close-btn" size={24} onClick={() => setShowJoinForm(false)} />
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
        <div className="modal-overlay high-z" onClick={() => setShowEventRegisterForm(false)}>
          <div className="glass-panel modal-content animate-fade-in" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Register for {selectedEventToRegister?.title}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Choose registration type</p>
              </div>
              <X className="close-btn" size={24} onClick={() => setShowEventRegisterForm(false)} />
            </div>
            <form onSubmit={handleEventRegisterSubmit} className="event-form">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{ flex: 1, cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="regType" 
                    checked={eventRegisterData.registration_type === 'Individual'} 
                    onChange={() => setEventRegisterData({...eventRegisterData, registration_type: 'Individual'})}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Individual
                </label>
                <label style={{ flex: 1, cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="regType" 
                    checked={eventRegisterData.registration_type === 'Team'} 
                    onChange={() => setEventRegisterData({...eventRegisterData, registration_type: 'Team'})}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Team
                </label>
              </div>

              {eventRegisterData.registration_type === 'Team' && (
                <>
                  <input 
                    type="text" 
                    placeholder="Team Name" 
                    required 
                    value={eventRegisterData.team_name} 
                    onChange={(e) => setEventRegisterData({...eventRegisterData, team_name: e.target.value})} 
                  />
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Number of Members (including lead)</label>
                    <input 
                      type="number" 
                      min="2"
                      max={selectedEventToRegister?.team_size || 10}
                      placeholder="Team Size" 
                      required 
                      value={eventRegisterData.team_size} 
                      onChange={(e) => {
                        const size = parseInt(e.target.value) || 0;
                        const newMembers = [...eventRegisterData.team_members];
                        if (size > newMembers.length) {
                          for(let i=newMembers.length; i<size-1; i++) newMembers.push('');
                        } else {
                          newMembers.length = Math.max(0, size - 1);
                        }
                        setEventRegisterData({...eventRegisterData, team_size: size, team_members: newMembers});
                      }} 
                    />
                  </div>
                  
                  {eventRegisterData.team_members.map((member, index) => (
                    <input 
                      key={index}
                      type="text" 
                      placeholder={`Member ${index + 2} Name`} 
                      required 
                      value={member}
                      onChange={(e) => {
                        const newMembers = [...eventRegisterData.team_members];
                        newMembers[index] = e.target.value;
                        setEventRegisterData({...eventRegisterData, team_members: newMembers});
                      }}
                    />
                  ))}
                </>
              )}

              <input type="text" placeholder="Lead Name" required value={eventRegisterData.name} onChange={(e) => setEventRegisterData({...eventRegisterData, name: e.target.value})} />
              <input type="email" placeholder="Lead Email" required value={eventRegisterData.email} onChange={(e) => setEventRegisterData({...eventRegisterData, email: e.target.value})} />
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                {eventRegisterData.registration_type === 'Team' ? 'Register Team' : 'Confirm Registration'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }} className="gradient-text">
              {activeTab === 'events' ? 'Explore Events' : 'Student Communities'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              {activeTab === 'events' ? 'Find and participate in the latest campus activities' : 'Discover and join vibrant clubs at Kongu Engineering College'}
            </p>
          </div>
        </div>

        <div className="main-grid">
          {activeTab === 'events' ? (
            events.map((event) => (
              <div key={event.id} className="glass-panel event-card animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: '700', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    {event.club_name ? event.club_name : `Club #${event.club_id}`}
                  </span>
                  <Calendar size={20} style={{ color: 'var(--primary)' }} />
                </div>
                <h3 style={{ fontSize: '1.75rem', margin: '1rem 0' }}>{event.title}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1rem', minHeight: '3em' }}>{event.description}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-main)' }}>
                    <MapPin size={18} className="gradient-text" /> 
                    <span style={{ fontSize: '0.95rem' }}>{event.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-main)' }}>
                    <Users size={18} className="gradient-text" /> 
                    <span style={{ fontSize: '0.95rem' }}>{event.capacity} capacity • Max Team: {event.team_size}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-main)' }}>
                    <Calendar size={18} className="gradient-text" /> 
                    <span style={{ fontSize: '0.95rem' }}>{new Date(event.event_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>
                </div>
                
                <button 
                  className={`btn ${registeredEvents.includes(event.id) ? 'btn-secondary' : 'btn-primary'}`} 
                  style={{ width: '100%', marginTop: 'auto' }}
                  onClick={() => {
                    if (!registeredEvents.includes(event.id)) {
                      setSelectedEventToRegister(event);
                      setShowEventRegisterForm(true);
                    }
                  }}
                >
                  {registeredEvents.includes(event.id) ? 'Registered Successfully' : 'Secure Your Spot'}
                </button>
              </div>
            ))
          ) : (
            clubs.map((club) => (
              <div key={club.id} className="glass-panel event-card animate-fade-in" onClick={() => setSelectedClub(club)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    Official Community
                  </span>
                  <ArrowRight size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <h3 className="gradient-text" style={{ fontSize: '1.75rem', margin: '1rem 0' }}>{club.name}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '4.5em' }}>
                  {club.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-main)', marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                  <LogIn size={20} className="gradient-text" /> 
                  <span style={{ fontWeight: 500 }}>Lead: {club.faculty_incharge}</span>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }}>View Club Profile</button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default App;
