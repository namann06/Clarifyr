import React, { useState, useEffect } from 'react';
import { getMySchedule, updateBookingStatus, getCurrentUser, addReview } from '../api';
import { CalendarBlank, Clock, User, CurrencyDollar, CheckCircle, XCircle, Prohibit, Info, VideoCamera, Star } from '@phosphor-icons/react';

export default function ScheduleScreen() {
  const currentUser = getCurrentUser();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // stores booking ID currently updating
  const [filter, setFilter] = useState('ACTIVE'); // 'ACTIVE' (PENDING/CONFIRMED) or 'HISTORY' (COMPLETED/CANCELLED)

  // Review states
  const [reviewTarget, setReviewTarget] = useState(null); // { tutorId, tutorName, bookingId }
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const loadSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMySchedule();
      
      // Auto-complete past sessions silently on load
      const now = new Date();
      const pastConfirmed = data.filter(b => b.status === 'CONFIRMED' && new Date(b.endTime) < now);
      
      if (pastConfirmed.length > 0) {
        await Promise.all(
          pastConfirmed.map(b => updateBookingStatus(b.id, 'COMPLETED'))
        );
        const freshData = await getMySchedule();
        const sorted = freshData.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        setBookings(sorted);
        window.dispatchEvent(new Event('schedule_update'));
      } else {
        const sorted = data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        setBookings(sorted);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve your schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewTarget) return;

    setReviewSubmitting(true);
    setError('');
    try {
      await addReview(reviewTarget.tutorId, reviewRating, reviewComment.trim());
      localStorage.setItem(`clarifyr_reviewed_booking_${reviewTarget.bookingId}`, 'true');
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewTarget(null);
        setReviewRating(5);
        setReviewComment('');
        setReviewSuccess(false);
        // Refresh schedule to update Reviewed badge
        loadSchedule();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const [confirmAction, setConfirmAction] = useState(null); // { bookingId, status, partnerName, startTime, duration }

  const handleStatusUpdate = (bookingId, newStatus, partnerName, startTime, duration) => {
    setConfirmAction({
      bookingId,
      status: newStatus,
      partnerName,
      startTime,
      duration
    });
  };

  const executeStatusUpdate = async (bookingId, newStatus) => {
    setActionLoading(bookingId);
    setError('');
    try {
      await updateBookingStatus(bookingId, newStatus);
      // Refresh list
      const data = await getMySchedule();
      const sorted = data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      setBookings(sorted);
      window.dispatchEvent(new Event('schedule_update'));
    } catch (err) {
      setError(err.message || `Failed to update booking to ${newStatus}.`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge" style={{ backgroundColor: 'rgba(250, 250, 250, 0.05)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>Pending</span>;
      case 'CONFIRMED':
        return <span className="badge" style={{ backgroundColor: 'rgba(250, 250, 250, 0.12)', color: 'var(--text-primary)', border: '1px solid rgba(250, 250, 250, 0.2)' }}>Confirmed</span>;
      case 'CANCELLED':
        return <span className="badge" style={{ backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid rgba(250, 250, 250, 0.04)' }}>Cancelled</span>;
      case 'COMPLETED':
        return <span className="badge badge-secondary">Completed</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  const calculateDuration = (start, end) => {
    const diffMs = new Date(end) - new Date(start);
    return Math.round(diffMs / 60000); // duration in minutes
  };

  if (!currentUser) {
    return (
      <div className="card text-center" style={{ maxWidth: '500px', margin: '4rem auto', padding: '2.5rem' }}>
        <Info size={44} weight="bold" style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
        <h2>Access Restricted</h2>
        <p>Please sign in to view your schedule dashboard.</p>
      </div>
    );
  }

  const isTutor = currentUser.role === 'TUTOR';

  // Filter logic
  const filteredBookings = bookings.filter(b => {
    const isActive = b.status === 'PENDING' || b.status === 'CONFIRMED';
    return filter === 'ACTIVE' ? isActive : !isActive;
  });

  return (
    <div className="schedule-container">
      <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>My Schedule</h1>
          <p>Manage your booked tutoring sessions and lesson requests.</p>
        </div>

        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--border-radius-md)',
          padding: '2px'
        }}>
          <button
            onClick={() => setFilter('ACTIVE')}
            className="btn"
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--border-radius-sm)',
              backgroundColor: filter === 'ACTIVE' ? 'var(--color-primary)' : 'transparent',
              color: filter === 'ACTIVE' ? 'var(--bg-primary)' : 'var(--text-secondary)'
            }}
          >
            Active Sessions
          </button>
          <button
            onClick={() => setFilter('HISTORY')}
            className="btn"
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--border-radius-sm)',
              backgroundColor: filter === 'HISTORY' ? 'var(--color-primary)' : 'transparent',
              color: filter === 'HISTORY' ? 'var(--bg-primary)' : 'var(--text-secondary)'
            }}
          >
            Past & Cancelled
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">
          <WarningCircle size={18} weight="bold" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="spinner"></div>
      ) : filteredBookings.length === 0 ? (
        <div className="card text-center" style={{ padding: '4rem 2rem' }}>
          <CalendarBlank size={48} weight="light" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 0 }}>
            {filter === 'ACTIVE' 
              ? 'No active or pending sessions scheduled.' 
              : 'No historical session records found.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredBookings.map((booking) => {
            const duration = calculateDuration(booking.startTime, booking.endTime);
            const isUpdating = actionLoading === booking.id;

            const now = new Date();
            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);
            const isJoinable = booking.status === 'CONFIRMED' && 
                               now >= new Date(startTime.getTime() - 5 * 60 * 1000) && 
                               now <= endTime;
            const isReviewed = localStorage.getItem(`clarifyr_reviewed_booking_${booking.id}`) === 'true';

            return (
              <div 
                key={booking.id} 
                className="card flex justify-between items-center" 
                style={{ 
                  padding: '1.25rem 1.5rem', 
                  flexWrap: 'wrap', 
                  gap: '1.5rem',
                  opacity: isUpdating ? 0.6 : 1,
                  pointerEvents: isUpdating ? 'none' : 'auto'
                }}
              >
                {/* Details Section */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', flex: 1, alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                      {isTutor ? 'Student' : 'Tutor'}
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}>
                      <User size={16} style={{ color: 'var(--color-primary)' }} />
                      {isTutor ? booking.studentName : booking.tutorName}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                      Date & Time
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}>
                      <CalendarBlank size={16} style={{ color: 'var(--color-secondary)' }} />
                      {formatDateTime(booking.startTime)}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                      Duration
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}>
                      <Clock size={16} style={{ color: 'var(--color-primary)' }} />
                      {duration} minutes
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                      {isTutor ? 'Earnings' : 'Total Cost'}
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '1px', marginTop: '0.125rem' }}>
                      <CurrencyDollar size={16} style={{ color: 'var(--color-success)' }} />
                      {booking.totalPrice?.toFixed(2) || '0.00'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Status
                    </span>
                    {getStatusBadge(booking.status)}
                  </div>
                </div>

                {/* Actions Section */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {isJoinable && (
                    <a
                      href={`https://meet.ffmuc.net/clarifyr-session-${booking.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ 
                        padding: '0.45rem 1rem', 
                        fontSize: '0.8rem', 
                        backgroundColor: 'var(--color-secondary)', 
                        borderColor: 'transparent',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        textDecoration: 'none'
                      }}
                    >
                      <span className="pulsing-dot" style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: 'var(--color-success)',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'pulse 1.2s infinite'
                      }}></span>
                      <VideoCamera size={14} weight="bold" />
                      <span>Join Call</span>
                    </a>
                  )}

                  {!isTutor && booking.status === 'COMPLETED' && (
                    isReviewed ? (
                      <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.45rem 0.75rem', fontSize: '0.8rem', textTransform: 'none' }}>
                        <CheckCircle size={14} weight="bold" style={{ color: 'var(--color-success)' }} />
                        <span>Reviewed</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setReviewTarget({ tutorId: booking.tutorId, tutorName: booking.tutorName, bookingId: booking.id })}
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', backgroundColor: 'var(--color-primary)' }}
                      >
                        <Star size={14} weight="bold" />
                        <span>Leave Review</span>
                      </button>
                    )
                  )}

                  {isTutor && booking.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED', booking.studentName, booking.startTime, duration)}
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                      >
                        <CheckCircle size={14} weight="bold" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(booking.id, 'CANCELLED', booking.studentName, booking.startTime, duration)}
                        className="btn btn-secondary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                      >
                        <XCircle size={14} weight="bold" />
                        <span>Decline</span>
                      </button>
                    </>
                  )}

                  {!isTutor && (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'CANCELLED', booking.tutorName, booking.startTime, duration)}
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                    >
                      <Prohibit size={14} weight="bold" />
                      <span>Cancel Session</span>
                    </button>
                  )}

                  {isTutor && booking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'CANCELLED', booking.studentName, booking.startTime, duration)}
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                    >
                      <Prohibit size={14} weight="bold" />
                      <span>Cancel Session</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmAction && (
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
              backgroundColor: confirmAction.status === 'CONFIRMED' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              color: confirmAction.status === 'CONFIRMED' ? 'var(--color-success)' : 'var(--color-danger)',
              marginBottom: '1rem'
            }}>
              <CheckCircle size={28} weight="bold" />
            </div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>
              {confirmAction.status === 'CONFIRMED' ? 'Accept Session?' : 'Cancel Session?'}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Are you sure you want to {confirmAction.status === 'CONFIRMED' ? 'accept' : 'cancel'} the <strong>{confirmAction.duration} min</strong> tutoring session with <strong>{confirmAction.partnerName}</strong> scheduled for <strong>{formatDateTime(confirmAction.startTime)}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  const { bookingId, status } = confirmAction;
                  setConfirmAction(null);
                  executeStatusUpdate(bookingId, status);
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Yes, Confirm
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {reviewTarget && (
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
            maxWidth: '420px',
            width: '90%',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--glass-border)',
            background: 'var(--bg-secondary)',
            textAlign: 'left'
          }}>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={22} weight="fill" style={{ color: 'var(--color-warning)' }} />
              <span>Review your Session</span>
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Share your learning experience with <strong>{reviewTarget.tutorName}</strong> to help others.
            </p>

            {reviewSuccess ? (
              <div className="alert alert-success" style={{ margin: '1rem 0' }}>
                <CheckCircle size={18} weight="bold" />
                <span>Review submitted successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>Rating</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          color: star <= reviewRating ? 'var(--color-warning)' : 'var(--text-muted)',
                          transition: 'color var(--transition-fast)'
                        }}
                      >
                        <Star size={24} weight={star <= reviewRating ? 'fill' : 'bold'} />
                      </button>
                    ))}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
                      ({reviewRating} out of 5)
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Comments</label>
                  <textarea
                    rows={4}
                    className="form-input"
                    placeholder="What did you work on? How did the tutor help you?"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    style={{ resize: 'none', fontSize: '0.9rem' }}
                    disabled={reviewSubmitting}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={reviewSubmitting || !reviewComment.trim()}
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewTarget(null);
                      setReviewRating(5);
                      setReviewComment('');
                    }}
                    className="btn btn-secondary"
                    disabled={reviewSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
