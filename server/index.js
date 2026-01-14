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

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/members', memberRoutes)

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')))
}

// Catch-all handler for SPA routing (must be last)
// This will catch all routes that don't start with /api
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    if (process.env.NODE_ENV === 'production') {
      return res.sendFile(join(__dirname, '../dist/index.html'))
    }
  }
  // If it's an API route that wasn't matched, return 404
  res.status(404).json({ error: 'Not found', message: `Route ${req.path} not found` })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

