import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTutorProfile, getTutorReviews, getTutorAverageRating, addReview, getCurrentUser, createBooking } from '../api';
import StarRating from '../components/StarRating';
import { ArrowLeft, BookOpen, CurrencyDollar, CalendarBlank, ChatCenteredText, PlusCircle, WarningCircle, CheckCircle } from '@phosphor-icons/react';

export default function TutorProfileScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const tutorId = parseInt(id, 10);

  const [tutor, setTutor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  
  // Submit Review state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Booking panel state
  const [bookingDate, setBookingDate] = useState('');
  const [bookingDuration, setBookingDuration] = useState(60);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null); // { date, duration, cost } or null

  const handleBookingPreSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!bookingDate) {
      setBookingError('Please select a date and time.');
      return;
    }
    setBookingError('');
    setBookingSuccess(false);

    const cost = tutor.pricing * (bookingDuration / 60);
    setPendingBooking({
      date: bookingDate,
      duration: bookingDuration,
      cost: cost.toFixed(2)
    });
  };

  const executeBookingSubmit = async () => {
    if (!pendingBooking) return;
    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess(false);

    try {
      const { date, duration } = pendingBooking;
      const startTimeISO = date.includes(':') && date.split(':').length === 2 
        ? `${date}:00` 
        : date;
      
      await createBooking(tutorId, startTimeISO, parseInt(duration, 10));
      setBookingSuccess(true);
      setBookingDate('');
      setBookingDuration(60);
      window.dispatchEvent(new Event('schedule_update'));
    } catch (err) {
      setBookingError(err.message || 'Failed to submit booking request.');
    } finally {
      setBookingLoading(false);
      setPendingBooking(null);
    }
  };

  const loadProfileData = async () => {
    setLoading(true);
    setProfileError('');
    try {
      const [profileData, reviewsData, ratingData] = await Promise.all([
        getTutorProfile(tutorId),
        getTutorReviews(tutorId),
        getTutorAverageRating(tutorId)
      ]);
      setTutor(profileData);
      setReviews(reviewsData);
      setAvgRating(ratingData);
    } catch (err) {
      setProfileError(err.message || 'Failed to load tutor profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [tutorId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (newRating < 1 || newRating > 5) {
      setSubmitError('Please select a rating between 1 and 5.');
      return;
    }

    setSubmitLoading(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      await addReview(tutorId, newRating, newComment);
      setSubmitSuccess(true);
      setNewComment('');
      setNewRating(5);
      
      // Reload reviews and rating
      const [reviewsData, ratingData] = await Promise.all([
        getTutorReviews(tutorId),
        getTutorAverageRating(tutorId)
      ]);
      setReviews(reviewsData);
      setAvgRating(ratingData);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit review.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (profileError || !tutor) {
    return (
      <div className="card text-center" style={{ maxWidth: '500px', margin: '4rem auto', padding: '2.5rem' }}>
        <WarningCircle size={44} weight="bold" style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
        <h2>Profile Not Found</h2>
        <p style={{ margin: '1rem 0', fontSize: '0.95rem' }}>{profileError || 'The requested tutor profile could not be loaded.'}</p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={16} weight="bold" />
          <span>Back to Tutors List</span>
        </Link>
      </div>
    );
  }

  const isStudent = currentUser && currentUser.role === 'STUDENT';

  return (
    <div className="tutor-profile-container">
      <Link to="/" className="btn btn-secondary flex items-center gap-2 mb-4" style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>
        <ArrowLeft size={14} weight="bold" />
        <span>Back to Tutors</span>
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'start', marginTop: '1rem' }}>
        {/* Left Side: Tutor Card Details */}
        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="text-center mb-4">
              <img 
                src={`https://picsum.photos/seed/tutor-${tutor.userId}/150/150`} 
                alt={tutor.tutorName}
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid rgba(250, 250, 250, 0.15)',
                  margin: '0 auto 1.25rem auto',
                  display: 'block',
                  boxShadow: 'var(--shadow-glow)'
                }}
              />
              <h2 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>{tutor.tutorName}</h2>
              <div style={{ display: 'inline-flex', justifyContent: 'center' }}>
                <StarRating rating={avgRating} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', padding: '1.25rem 0', margin: '1.25rem 0' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <CurrencyDollar size={18} style={{ color: 'var(--color-success)' }} />
                  Hourly Rate:
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: '800' }}>${tutor.pricing?.toFixed(2) || '0.00'}/hr</span>
              </div>

              <div className="flex justify-between items-center mb-3">
                <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <CalendarBlank size={18} style={{ color: 'var(--color-primary)' }} />
                  Availability:
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{tutor.availability || 'Flexible'}</span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <BookOpen size={18} style={{ color: 'var(--color-secondary)' }} />
                  Subjects Taught:
                </span>
                <div className="flex gap-2" style={{ flexWrap: 'wrap', marginTop: '0.15rem' }}>
                  {tutor.subjects && tutor.subjects.length > 0 ? (
                    tutor.subjects.map((sub, idx) => (
                      <span key={idx} className="badge badge-primary">{sub}</span>
                    ))
                  ) : (
                    <span className="badge badge-secondary" style={{ textTransform: 'none' }}>General</span>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Biography</h4>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                {tutor.description || 'This tutor has not written a biography yet.'}
              </p>
            </div>

            {currentUser && isStudent && (
              <button 
                className="btn btn-secondary flex items-center justify-center gap-2"
                style={{ width: '100%', marginTop: '1.25rem' }}
                onClick={() => navigate(`/chat/${tutor.userId}`)}
              >
                <ChatCenteredText size={18} weight="bold" />
                <span>Message Tutor</span>
              </button>
            )}

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>Book a Session</h4>
              
              {!currentUser ? (
                <div className="text-center" style={{ padding: '0.5rem 0' }}>
                  <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                    Sign in to book private sessions.
                  </p>
                  <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>Sign In to Book</Link>
                </div>
              ) : !isStudent ? (
                <div className="alert alert-danger" style={{ margin: 0, padding: '0.5rem 0.75rem', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <WarningCircle size={16} weight="bold" />
                  <span>Only Students can book sessions.</span>
                </div>
              ) : (
                <form onSubmit={handleBookingPreSubmit} className="flex flex-col gap-3">
                  {bookingError && (
                    <div className="alert alert-danger" style={{ padding: '0.5rem 0.75rem', marginBottom: 0, fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <WarningCircle size={16} weight="bold" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {bookingSuccess && (
                    <div className="alert alert-success" style={{ padding: '0.5rem 0.75rem', marginBottom: 0, fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <CheckCircle size={16} weight="bold" />
                      <span>Booking requested successfully!</span>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Select Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={bookingDate}
                      onChange={(e) => {
                        setBookingDate(e.target.value);
                        setBookingSuccess(false);
                      }}
                      min={new Date().toISOString().slice(0, 16)}
                      disabled={bookingLoading}
                      required
                      style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Duration</label>
                    <select
                      className="form-input"
                      value={bookingDuration}
                      onChange={(e) => {
                        setBookingDuration(parseInt(e.target.value, 10));
                        setBookingSuccess(false);
                      }}
                      disabled={bookingLoading}
                      style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', appearance: 'none', backgroundPosition: 'right 12px center' }}
                    >
                      <option value={30}>30 Minutes</option>
                      <option value={60}>1 Hour</option>
                      <option value={90}>1.5 Hours</option>
                      <option value={120}>2 Hours</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimated Cost:</span>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                      ${(tutor.pricing * (bookingDuration / 60)).toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '0.5rem', padding: '0.55rem' }}
                    disabled={bookingLoading || !bookingDate}
                  >
                    {bookingLoading ? 'Requesting...' : 'Request Booking'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Reviews & Review Form */}
        <div className="flex flex-col gap-4">
          {/* Reviews List */}
          <div className="card">
            <h3 className="flex items-center gap-2 mb-4" style={{ fontSize: '1.15rem' }}>
              <ChatCenteredText size={20} style={{ color: 'var(--color-primary)' }} />
              <span>Reviews ({reviews.length})</span>
            </h3>

            {reviews.length === 0 ? (
              <div className="text-center" style={{ padding: '1.5rem 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '0.9rem' }}>No reviews yet for this tutor.</p>
                {isStudent && <p style={{ fontSize: '0.8rem' }}>Be the first to share your experience!</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-3" style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {reviews.map((rev) => (
                  <div key={rev.id} style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '0.875rem',
                  }}>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{rev.studentName}</h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {rev.timestamp ? new Date(rev.timestamp).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <StarRating rating={rev.rating} />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Write a Review Form */}
          <div className="card">
            <h3 className="flex items-center gap-2 mb-4" style={{ fontSize: '1.15rem' }}>
              <PlusCircle size={20} style={{ color: 'var(--color-secondary)' }} />
              <span>Write a Review</span>
            </h3>

            {!currentUser ? (
              <div className="text-center" style={{ padding: '0.75rem 0' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>You must be signed in as a student to write reviews.</p>
                <Link to="/login" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>Sign In</Link>
              </div>
            ) : !isStudent ? (
              <div className="alert alert-danger" style={{ margin: 0 }}>
                <WarningCircle size={18} weight="bold" />
                <span style={{ fontSize: '0.85rem' }}>Only accounts registered as Students can write reviews. Your current role is {currentUser.role}.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview}>
                {submitError && (
                  <div className="alert alert-danger">
                    <WarningCircle size={18} weight="bold" />
                    <span>{submitError}</span>
                  </div>
                )}

                {submitSuccess && (
                  <div className="alert alert-success">
                    <CheckCircle size={18} weight="bold" />
                    <span>Review submitted successfully!</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StarRating
                      rating={newRating}
                      interactive={true}
                      onChange={(val) => {
                        setNewRating(val);
                        setSubmitSuccess(false);
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({newRating} out of 5 stars)</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Review Comment</label>
                  <textarea
                    rows="3"
                    className="form-input"
                    placeholder="Describe your learning experience with this tutor..."
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value);
                      setSubmitSuccess(false);
                    }}
                    disabled={submitLoading}
                    style={{ resize: 'vertical', minHeight: '70px', fontSize: '0.9rem' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Submitting Review...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      {/* Custom Confirmation Modal */}
      {pendingBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(8, 11, 17, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card" style={{
            maxWidth: '400px',
            width: '90%',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--glass-border)',
            textAlign: 'center',
            background: 'var(--bg-secondary)'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-glow)',
              color: 'var(--color-primary)',
              marginBottom: '1rem'
            }}>
              <CalendarBlank size={28} weight="bold" />
            </div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>Confirm Booking</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Are you sure you want to request a tutoring session of <strong>{pendingBooking.duration} minutes</strong> with <strong>{tutor.tutorName}</strong> for <strong>{
                (() => {
                  if (!pendingBooking.date) return '';
                  const d = new Date(pendingBooking.date);
                  return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
                })()
              }</strong>?
            </p>
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.02)', 
              padding: '0.75rem', 
              borderRadius: 'var(--border-radius-sm)', 
              border: '1px solid var(--glass-border)', 
              marginBottom: '1.5rem', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Cost:</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-success)' }}>${pendingBooking.cost}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={executeBookingSubmit}
                className="btn btn-primary"
                style={{ flex: 1, borderColor: 'transparent' }}
              >
                Yes, Request
              </button>
              <button
                onClick={() => setPendingBooking(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
