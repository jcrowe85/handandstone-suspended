import { useState } from 'react'
import './MemberTable.css'

function MemberTable({ members, onDelete, onUpdateNote, onUpdateContact }) {
  const [editingNoteIndex, setEditingNoteIndex] = useState(null)
  const [noteValue, setNoteValue] = useState('')
  const [editingContact, setEditingContact] = useState(null) // { index, field }
  const [contactValue, setContactValue] = useState('')
  const [copiedIndex, setCopiedIndex] = useState(null) // Track which phone was copied

  const CONTACT_FIELDS = [
    { key: 'firstContact', label: 'First Contact' },
    { key: 'secondContact', label: 'Second Contact' },
    { key: 'thirdContact', label: 'Third Contact' },
    { key: 'finalContact', label: 'Final Contact' }
  ]

  if (members.length === 0) {
    return (
      <div className="empty-state">
        <p>No suspended members yet. Upload a CSV file to get started.</p>
      </div>
    )
  }

  // Columns to hide from the UI
  const HIDDEN_COLUMNS = [
    'membership code',
    'start date',
    'end date',
    'credit balance',
    'payments',
    'due date',
    'membership status',
    'is recurring',
    'suspended by',
    'setup fee',
    'membership type',
    'recurrence status',
    'auto renewal'
  ]

  // Normalize column name: handle camelCase by adding spaces, then convert to lowercase
  const normalizeColumnName = (name) => {
    return name
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters (camelCase) - MUST be before toLowerCase
      .toLowerCase()
      .replace(/_/g, ' ') // Replace underscores with spaces
      .trim()
  }

  // Check if a column should be hidden
  const isColumnHidden = (columnName) => {
    const normalized = normalizeColumnName(columnName)
    return HIDDEN_COLUMNS.includes(normalized)
  }

  // Get all column names from members (exclude contact fields, notes, and hidden columns)
  const getColumns = () => {
    const columns = new Set()
    const excludeFields = ['notes', 'firstContact', 'secondContact', 'thirdContact', 'finalContact']
    members.forEach(member => {
      Object.keys(member).forEach(key => {
        if (!excludeFields.includes(key) && !isColumnHidden(key)) {
          columns.add(key)
        }
      })
    })
    return Array.from(columns)
  }

  const columns = getColumns()
  const dataColumns = columns

  const handleEditNote = (index, currentNote) => {
    setEditingNoteIndex(index)
    setNoteValue(currentNote || '')
  }

  const handleSaveNote = (index) => {
    onUpdateNote(index, noteValue)
    setEditingNoteIndex(null)
    setNoteValue('')
  }

  const handleCancelEdit = () => {
    setEditingNoteIndex(null)
    setNoteValue('')
  }

  const handleEditContact = (index, field, currentValue) => {
    setEditingContact({ index, field })
    setContactValue(currentValue || '')
  }

  const handleSaveContact = (index, field) => {
    onUpdateContact(index, field, contactValue)
    setEditingContact(null)
    setContactValue('')
  }

  const handleCancelContactEdit = () => {
    setEditingContact(null)
    setContactValue('')
  }

  const handleCopyPhone = async (phoneNumber, rowIndex, column) => {
    const rawPhone = getRawPhoneNumber(phoneNumber)
    if (!rawPhone) return
    
    try {
      await navigator.clipboard.writeText(rawPhone)
      // Show feedback
      const uniqueKey = `${rowIndex}-${column}`
      setCopiedIndex(uniqueKey)
      setTimeout(() => setCopiedIndex(null), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy phone number:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = rawPhone
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        const uniqueKey = `${rowIndex}-${column}`
        setCopiedIndex(uniqueKey)
        setTimeout(() => setCopiedIndex(null), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="table-container">
      <table className="member-table">
        <thead>
          <tr>
            {dataColumns.map((column) => {
              const normalizedCol = normalizeColumnName(column)
              const isPhoneColumn = normalizedCol.includes('phone') || normalizedCol.includes('mobile')
              return (
                <th 
                  key={column}
                  className={isPhoneColumn ? 'phone-column-header' : ''}
                >
                  {formatColumnName(column)}
                </th>
              )
            })}
            {CONTACT_FIELDS.map(({ key, label }) => (
              <th key={key}>{label}</th>
            ))}
            <th>Notes</th>
            <th className="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => (
            <tr key={index}>
            {dataColumns.map((column) => {
              const value = member[column]
              // Check if this is a phone column and format it
              const normalizedCol = normalizeColumnName(column)
              const isPhoneColumn = normalizedCol.includes('phone') || normalizedCol.includes('mobile')
              const displayValue = isPhoneColumn ? formatPhoneNumber(value) : (value || '-')
              const uniqueKey = `${index}-${column}`
              const isCopied = copiedIndex === uniqueKey
              
              return (
                <td 
                  key={column}
                  className={isPhoneColumn ? 'phone-column-cell' : ''}
                >
                  {isPhoneColumn && value ? (
                    <div className="phone-cell-content">
                      <span>{displayValue}</span>
                      <button
                        className="copy-phone-btn"
                        onClick={() => handleCopyPhone(value, index, column)}
                        title={isCopied ? 'Copied!' : 'Copy'}
                        aria-label="Copy phone number"
                      >
                        {isCopied ? (
                          <svg className="copy-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg className="copy-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="5.5" y="5.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                            <rect x="2.5" y="2.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="white"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  ) : (
                    displayValue
                  )}
                </td>
              )
            })}
              {CONTACT_FIELDS.map(({ key }) => (
                <td key={key} className="contact-cell">
                  {editingContact?.index === index && editingContact?.field === key ? (
                    <div className="note-editor">
                      <textarea
                        value={contactValue}
                        onChange={(e) => setContactValue(e.target.value)}
                        placeholder="Add contact note..."
                        rows="2"
                        autoFocus
                      />
                      <div className="note-actions">
                        <button
                          className="save-note-btn"
                          onClick={() => handleSaveContact(index, key)}
                        >
                          Save
                        </button>
                        <button
                          className="cancel-note-btn"
                          onClick={handleCancelContactEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="note-display"
                      onClick={() => handleEditContact(index, key, member[key])}
                      title="Click to edit contact note"
                    >
                      {member[key] || <span className="note-placeholder">Click to add note</span>}
                    </div>
                  )}
                </td>
              ))}
              <td className="notes-cell">
                {editingNoteIndex === index ? (
                  <div className="note-editor">
                    <textarea
                      value={noteValue}
                      onChange={(e) => setNoteValue(e.target.value)}
                      placeholder="Add a note..."
                      rows="2"
                      autoFocus
                    />
                    <div className="note-actions">
                      <button
                        className="save-note-btn"
                        onClick={() => handleSaveNote(index)}
                      >
                        Save
                      </button>
                      <button
                        className="cancel-note-btn"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="note-display"
                    onClick={() => handleEditNote(index, member.notes)}
                    title="Click to edit note"
                  >
                    {member.notes || <span className="note-placeholder">Click to add note</span>}
                  </div>
                )}
              </td>
              <td className="actions-cell">
                <button
                  className="delete-btn"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this member?')) {
                      onDelete(index)
                    }
                  }}
                  title="Delete member"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatColumnName(column) {
  // Convert column names to readable format
  return column
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

// Format phone number to (XXX) XXX-XXXX
function formatPhoneNumber(value) {
  if (!value) return value
  const phoneStr = String(value).replace(/[^\d]/g, '')
  if (phoneStr.length === 10) {
    return `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`
  }
  if (phoneStr.length === 11 && phoneStr[0] === '1') {
    return `+1 (${phoneStr.slice(1, 4)}) ${phoneStr.slice(4, 7)}-${phoneStr.slice(7)}`
  }
  return value // Return as-is if not standard format
}

// Get raw phone number (digits only) for copying
function getRawPhoneNumber(value) {
  if (!value) return ''
  return String(value).replace(/[^\d]/g, '')
}

export default MemberTable

