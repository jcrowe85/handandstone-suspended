import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import LocationView from './components/LocationView'
import Login from './components/Login'
import './App.css'

const LOCATIONS = [
  'Huntington Beach',
  'Laguna Beach',
  'Costa Mesa',
  'Pleasanton',
  'Brentwood',
  'Alameda'
]

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [allowedLocations, setAllowedLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)

  useEffect(() => {
    // Check if user is already logged in (from sessionStorage)
    const storedUser = sessionStorage.getItem('currentUser')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setCurrentUser(user)
        setAllowedLocations(user.allowedLocations || [])
        setIsAuthenticated(true)
        // Set default location to first allowed location
        if (user.allowedLocations && user.allowedLocations.length > 0) {
          setSelectedLocation(user.allowedLocations[0])
        }
      } catch (err) {
        console.error('Error parsing stored user:', err)
        sessionStorage.removeItem('currentUser')
      }
    }
  }, [])

  // Ensure selected location is valid (must be before any early returns)
  useEffect(() => {
    if (isAuthenticated && allowedLocations.length > 0) {
      if (!selectedLocation || !allowedLocations.includes(selectedLocation)) {
        setSelectedLocation(allowedLocations[0])
      }
    }
  }, [isAuthenticated, allowedLocations, selectedLocation])

  const handleLogin = (user) => {
    setCurrentUser(user)
    setAllowedLocations(user.allowedLocations || [])
    setIsAuthenticated(true)
    // Set default location to first allowed location
    if (user.allowedLocations && user.allowedLocations.length > 0) {
      setSelectedLocation(user.allowedLocations[0])
    }
    // Store user in sessionStorage
    sessionStorage.setItem('currentUser', JSON.stringify(user))
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setAllowedLocations([])
    setSelectedLocation(null)
    sessionStorage.removeItem('currentUser')
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  // Filter locations based on user permissions
  const availableLocations = LOCATIONS.filter(loc => 
    allowedLocations.includes(loc)
  )

  if (!selectedLocation) {
    return <div>Loading...</div>
  }

  return (
    <div className="app">
      <Sidebar
        locations={availableLocations}
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      <main className="main-content">
        <LocationView location={selectedLocation} currentUser={currentUser} />
      </main>
    </div>
  )
}

export default App

