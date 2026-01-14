import express from 'express'
import { authenticateUser } from '../database.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      })
    }
    
    const result = await authenticateUser(username, password)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(401).json(result)
    }
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
})

export default router

