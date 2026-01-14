import Dexie from 'dexie'

// Create database instance
const db = new Dexie('HandAndStoneDB')

// Define database schema
db.version(1).stores({
  users: 'username, password, role, allowedLocations',
  members: '++id, location, [location+memberKey], data, updatedAt'
})

// Initialize default users
export const initializeDatabase = async () => {
  try {
    // Check if old "pleaston" user exists and migrate to "pleasanton"
    const oldUser = await db.users.where('username').equals('pleaston').first()
    if (oldUser) {
      // Delete old user
      await db.users.where('username').equals('pleaston').delete()
    }
    
    // Check if users already exist
    const existingUsers = await db.users.count()
    
    if (existingUsers === 0) {
      // Location mapping
      const locationMap = {
        'laguna': ['Laguna Beach'],
        'costa': ['Costa Mesa'],
        'huntington': ['Huntington Beach'],
        'almeada': ['Alameda'],
        'brentwood': ['Brentwood'],
        'pleasanton': ['Pleasanton']
      }
      
      const allLocations = [
        'Huntington Beach',
        'Laguna Beach',
        'Costa Mesa',
        'Pleasanton',
        'Brentwood',
        'Alameda'
      ]
      
      // Create location-specific users
      for (const [username, locations] of Object.entries(locationMap)) {
        await db.users.add({
          username,
          password: 'kasey#1',
          role: 'location',
          allowedLocations: locations
        })
      }
      
      // Create admin user
      await db.users.add({
        username: 'admin',
        password: 'kasey#1',
        role: 'admin',
        allowedLocations: allLocations
      })
    } else {
      // If users exist but "pleasanton" doesn't, add it (in case of partial initialization)
      const pleasantonUser = await db.users.where('username').equals('pleasanton').first()
      if (!pleasantonUser) {
        await db.users.add({
          username: 'pleasanton',
          password: 'kasey#1',
          role: 'location',
          allowedLocations: ['Pleasanton']
        })
      }
    }
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

// Authentication functions
export const authenticateUser = async (username, password) => {
  try {
    const user = await db.users.where('username').equals(username).first()
    
    if (user && user.password === password) {
      return {
        success: true,
        user: {
          username: user.username,
          role: user.role,
          allowedLocations: user.allowedLocations
        }
      }
    }
    
    return {
      success: false,
      error: 'Invalid username or password'
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed'
    }
  }
}

// Member data functions
export const getMembersForLocation = async (location) => {
  try {
    const members = await db.members
      .where('location')
      .equals(location)
      .toArray()
    
    return members.map(m => m.data)
  } catch (error) {
    console.error('Error getting members:', error)
    return []
  }
}

export const saveMembersForLocation = async (location, members) => {
  try {
    // Delete existing members for this location
    await db.members.where('location').equals(location).delete()
    
    // Add new members
    const membersToAdd = members.map(member => ({
      location,
      memberKey: createMemberKey(member),
      data: member,
      updatedAt: new Date().toISOString()
    }))
    
    if (membersToAdd.length > 0) {
      await db.members.bulkAdd(membersToAdd)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error saving members:', error)
    return { success: false, error: error.message }
  }
}

// Helper function to create a unique key for a member
const createMemberKey = (member) => {
  if (!member || typeof member !== 'object') {
    return `member_${Date.now()}_${Math.random()}`
  }
  const keys = Object.keys(member).sort()
  if (keys.length === 0) {
    return `member_${Date.now()}_${Math.random()}`
  }
  return keys.map(key => `${key}:${String(member[key] || '').trim()}`).join('|')
}

// Export database instance
export default db

