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

// Serve static files (but don't handle 404s - let catch-all do it)
app.use(express.static(join(__dirname, '../dist'), { fallthrough: true }))

// Catch-all handler for SPA routing (must be absolutely last)
app.use((req, res) => {
  // Skip API routes - they should have been handled above
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found', message: `Route ${req.path} not found` })
  }
  // For all other routes, serve the SPA index.html
  const indexPath = join(__dirname, '../dist/index.html')
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err)
      res.status(500).json({ error: 'Internal server error', message: 'Failed to serve application' })
    }
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

