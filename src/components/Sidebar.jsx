import './Sidebar.css'

function Sidebar({ locations, selectedLocation, onSelectLocation, onLogout, currentUser }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Hand & Stone</h1>
        <p className="sidebar-subtitle">Suspended Members</p>
        {currentUser && (
          <p className="user-info">
            {currentUser.role === 'admin' ? 'Admin' : currentUser.username}
          </p>
        )}
      </div>
      <nav className="sidebar-nav">
        <ul>
          {locations.map((location) => (
            <li key={location}>
              <button
                className={`nav-item ${selectedLocation === location ? 'active' : ''}`}
                onClick={() => onSelectLocation(location)}
              >
                {location}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

