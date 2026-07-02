const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Helper to construct fetch headers with JWT token if available.
 */
function getHeaders(authRequired = false) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const user = getCurrentUser();
  if (user && user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }
  
  return headers;
}

/**
 * Handle HTTP response and throw descriptive errors.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // Ignore if response is not JSON
    }
    throw new Error(errorMessage);
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('clarifyr_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    localStorage.removeItem('clarifyr_user');
    return null;
  }
}

export async function login(email, password) {
  const response = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ email, password }),
  });
  
  const authData = await handleResponse(response);
  // authData is { token, id, name, email, role }
  localStorage.setItem('clarifyr_user', JSON.stringify(authData));
  return authData;
}

export async function register(name, email, password, role) {
  const response = await fetch(`${BASE_URL}/users/register`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ name, email, password, role }),
  });
  return handleResponse(response);
}

export function logout() {
  localStorage.removeItem('clarifyr_user');
}

export async function getTutors() {
  const response = await fetch(`${BASE_URL}/tutors`, {
    method: 'GET',
    headers: getHeaders(false),
  });
  return handleResponse(response);
}

export async function searchTutors(subject, query) {
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (query) params.append('query', query);
  
  const response = await fetch(`${BASE_URL}/tutors/search?${params.toString()}`, {
    method: 'GET',
    headers: getHeaders(false),
  });
  return handleResponse(response);
}

export async function getTutorProfile(userId) {
  const response = await fetch(`${BASE_URL}/tutor/profile/${userId}`, {
    method: 'GET',
    headers: getHeaders(false),
  });
  return handleResponse(response);
}

export async function getTutorReviews(tutorId) {
  const response = await fetch(`${BASE_URL}/reviews/tutor/${tutorId}`, {
    method: 'GET',
    headers: getHeaders(false),
  });
  return handleResponse(response);
}

export async function getTutorAverageRating(tutorId) {
  const response = await fetch(`${BASE_URL}/reviews/tutor/${tutorId}/average`, {
    method: 'GET',
    headers: getHeaders(false),
  });
  // Average rating is returned as a plain double (or NaN/Null)
  if (!response.ok) {
    return 0.0;
  }
  try {
    const text = await response.text();
    const val = parseFloat(text);
    return isNaN(val) ? 0.0 : val;
  } catch (e) {
    return 0.0;
  }
}

export async function addReview(tutorId, rating, comment) {
  const response = await fetch(`${BASE_URL}/reviews`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ tutorId, rating, comment }),
  });
  return handleResponse(response);
}

export async function createBooking(tutorId, startTime, durationInMinutes) {
  const response = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ tutorId, startTime, durationInMinutes }),
  });
  return handleResponse(response);
}

export async function updateBookingStatus(bookingId, status) {
  const params = new URLSearchParams();
  params.append('status', status);
  
  const response = await fetch(`${BASE_URL}/bookings/${bookingId}/status?${params.toString()}`, {
    method: 'PATCH',
    headers: getHeaders(true),
  });
  return handleResponse(response);
}

export async function getMySchedule() {
  const response = await fetch(`${BASE_URL}/bookings/my-schedule`, {
    method: 'GET',
    headers: getHeaders(true),
  });
  return handleResponse(response);
}

export async function getChatHistory(u1, u2) {
  const response = await fetch(`${BASE_URL}/messages/history/${u1}/${u2}`, {
    method: 'GET',
    headers: getHeaders(true),
  });
  return handleResponse(response);
}

export async function sendMessageHttp(senderId, receiverId, content) {
  const response = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ senderId, receiverId, content }),
  });
  return handleResponse(response);
}

export async function getAllUsers() {
  const response = await fetch(`${BASE_URL}/users`, {
    method: 'GET',
    headers: getHeaders(true),
  });
  return handleResponse(response);
}

export async function saveTutorProfile(profileRequest) {
  const response = await fetch(`${BASE_URL}/tutor/profile`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(profileRequest),
  });
  return handleResponse(response);
}

