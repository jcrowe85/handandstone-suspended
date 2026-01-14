import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { initializeDatabase } from './database.js'
import authRoutes from './routes/auth.js'
import memberRoutes from './routes/members.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Initialize database
initializeDatabase()

// API Routes (must come before static files)
app.use('/api/auth', authRoutes)
app.use('/api/members', memberRoutes)

// Serve static files
app.use(express.static(join(__dirname, '../dist')))

// Catch-all handler for SPA routing (must come before /api handler)
// This serves index.html for all non-API routes
app.use((req, res, next) => {
  // Only handle non-API routes
  if (!req.path.startsWith('/api')) {
    const indexPath = join(__dirname, '../dist/index.html')
    return res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error sending index.html:', err)
        res.status(500).json({ error: 'Internal server error', message: 'Failed to serve application' })
      }
    })
  }
  // Pass API routes to next handler
  next()
})

// 404 handler for unmatched API routes (must be last)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found', message: `Route ${req.path} not found` })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

