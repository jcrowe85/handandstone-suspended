// Use relative URL in production (same server), absolute URL in development
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3003/api')

// Helper to get auth headers
const getAuthHeaders = () => {
  const userInfo = sessionStorage.getItem('currentUser')
  const headers = {
    'Content-Type': 'application/json'
  }
  
  if (userInfo) {
    headers['x-user-info'] = userInfo
  }
  
  return headers
}

// Authentication API
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'Network error. Please check your connection.'
    }
  }
}

// Members API
export const getMembersForLocation = async (location, user) => {
  try {
    const headers = getAuthHeaders()
    if (user) {
      headers['x-user-info'] = JSON.stringify(user)
    }
    
    const response = await fetch(`${API_BASE_URL}/members/${encodeURIComponent(location)}`, {
      method: 'GET',
      headers
    })
    
    const data = await response.json()
    
    if (data.success) {
      return data.members || []
    } else {
      console.error('Error getting members:', data.error)
      return []
    }
  } catch (error) {
    console.error('Error fetching members:', error)
    return []
  }
}

export const saveMembersForLocation = async (location, members, user) => {
  try {
    const headers = getAuthHeaders()
    if (user) {
      headers['x-user-info'] = JSON.stringify(user)
    }
    
    const response = await fetch(`${API_BASE_URL}/members/${encodeURIComponent(location)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ members })
    })
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error saving members:', error)
    return {
      success: false,
      error: 'Network error. Please check your connection.'
    }
  }
}

