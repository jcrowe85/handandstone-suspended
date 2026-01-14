import express from 'express'
import { getMembersForLocation, saveMembersForLocation } from '../database.js'

const router = express.Router()

// Middleware to extract user from headers
router.use((req, res, next) => {
  const userInfo = req.headers['x-user-info']
  if (userInfo) {
    try {
      req.user = JSON.parse(userInfo)
    } catch (e) {
      // Ignore parse errors
    }
  }
  next()
})

// Middleware to verify user has access to location
const verifyLocationAccess = (req, res, next) => {
  const user = req.user
  const location = req.params.location || req.body.location
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    })
  }
  
  if (!user.allowedLocations.includes(location)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied to this location' 
    })
  }
  
  next()
}

// Get members for a location
router.get('/:location', verifyLocationAccess, async (req, res) => {
  try {
    const { location } = req.params
    const members = await getMembersForLocation(location)
    res.json({ success: true, members })
  } catch (error) {
    console.error('Error getting members:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve members' 
    })
  }
})

// Save members for a location
router.post('/:location', verifyLocationAccess, async (req, res) => {
  try {
    const { location } = req.params
    const { members } = req.body
    
    if (!Array.isArray(members)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Members must be an array' 
      })
    }
    
    const result = await saveMembersForLocation(location, members)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(500).json(result)
    }
  } catch (error) {
    console.error('Error saving members:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save members' 
    })
  }
})

export default router

