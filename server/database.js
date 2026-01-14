import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DB_PATH = process.env.DB_PATH || join(__dirname, 'data', 'handandstone.db')

// Ensure data directory exists
import { mkdirSync } from 'fs'
const dataDir = join(__dirname, 'data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

// Create database connection
const db = new sqlite3.Database(DB_PATH)

// Promisify database methods
const dbRun = promisify(db.run.bind(db))
const dbGet = promisify(db.get.bind(db))
const dbAll = promisify(db.all.bind(db))

export const initializeDatabase = async () => {
  try {
    // Create users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        allowedLocations TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create members table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location TEXT NOT NULL,
        memberKey TEXT NOT NULL,
        data TEXT NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(location, memberKey)
      )
    `)

    // Create indexes
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_members_location ON members(location)`)
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`)

    // Check if users exist
    const userCount = await dbGet(`SELECT COUNT(*) as count FROM users`)
    
    if (userCount.count === 0) {
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
        await dbRun(
          `INSERT INTO users (username, password, role, allowedLocations) VALUES (?, ?, ?, ?)`,
          [username, 'handandstone', 'location', JSON.stringify(locations)]
        )
      }
      
      // Create admin user
      await dbRun(
        `INSERT INTO users (username, password, role, allowedLocations) VALUES (?, ?, ?, ?)`,
        ['admin', 'handandstone', 'admin', JSON.stringify(allLocations)]
      )
      
      console.log('Database initialized with default users')
    }
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

export const authenticateUser = async (username, password) => {
  try {
    const user = await dbGet(
      `SELECT username, password, role, allowedLocations FROM users WHERE username = ?`,
      [username]
    )
    
    if (user && user.password === password) {
      return {
        success: true,
        user: {
          username: user.username,
          role: user.role,
          allowedLocations: JSON.parse(user.allowedLocations)
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

export const getMembersForLocation = async (location) => {
  try {
    const rows = await dbAll(
      `SELECT data FROM members WHERE location = ?`,
      [location]
    )
    
    return rows.map(row => JSON.parse(row.data))
  } catch (error) {
    console.error('Error getting members:', error)
    return []
  }
}

export const saveMembersForLocation = async (location, members) => {
  try {
    // Start transaction
    await dbRun('BEGIN TRANSACTION')
    
    try {
      // Delete existing members for this location
      await dbRun(`DELETE FROM members WHERE location = ?`, [location])
      
      // Insert new members
      for (const member of members) {
        const memberKey = createMemberKey(member)
        await dbRun(
          `INSERT OR REPLACE INTO members (location, memberKey, data, updatedAt) VALUES (?, ?, ?, ?)`,
          [location, memberKey, JSON.stringify(member), new Date().toISOString()]
        )
      }
      
      await dbRun('COMMIT')
      return { success: true }
    } catch (error) {
      await dbRun('ROLLBACK')
      throw error
    }
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

export { db, dbRun, dbGet, dbAll }

