import { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'
import MemberTable from './MemberTable'
import { getMembersForLocation, saveMembersForLocation } from '../utils/api'
import './LocationView.css'

function LocationView({ location, currentUser }) {
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Load members from database on mount and when location changes
  useEffect(() => {
    loadMembers()
  }, [location, currentUser])

  // Normalize column name for matching (handle camelCase)
  const normalizeColumnNameForMatching = (name) => {
    return name
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters (camelCase)
      .toLowerCase()
      .replace(/_/g, ' ') // Replace underscores with spaces
      .trim()
  }

  // Find the suspend date column key (case-insensitive, handles camelCase)
  const getSuspendDateKey = (member) => {
    if (!member || Object.keys(member).length === 0) return null
    const keys = Object.keys(member)
    const dateKey = keys.find(key => {
      const normalized = normalizeColumnNameForMatching(key)
      return normalized === 'suspend date' || normalized === 'suspended date'
    })
    return dateKey || null
  }

  // Parse date string to Date object, handling various formats
  const parseDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return new Date(0)
    const trimmed = dateString.trim()
    if (!trimmed) return new Date(0)
    
    // Try parsing as-is first
    let date = new Date(trimmed)
    if (!isNaN(date.getTime())) return date
    
    // Try common formats
    // MM/DD/YYYY or M/D/YYYY
    const mmddyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mmddyyyy) {
      date = new Date(parseInt(mmddyyyy[3]), parseInt(mmddyyyy[1]) - 1, parseInt(mmddyyyy[2]))
      if (!isNaN(date.getTime())) return date
    }
    
    // YYYY-MM-DD
    const yyyymmdd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (yyyymmdd) {
      date = new Date(parseInt(yyyymmdd[1]), parseInt(yyyymmdd[2]) - 1, parseInt(yyyymmdd[3]))
      if (!isNaN(date.getTime())) return date
    }
    
    // Return epoch if can't parse
    return new Date(0)
  }

  // Sort members by suspend date (oldest to newest)
  const sortMembersBySuspendDate = (membersList) => {
    if (!membersList || membersList.length === 0) return membersList
    
    const dateKey = getSuspendDateKey(membersList[0])
    if (!dateKey) return membersList // If no suspend date column, return unsorted
    
    return [...membersList].sort((a, b) => {
      const dateA = parseDate(a[dateKey])
      const dateB = parseDate(b[dateKey])
      return dateA - dateB // Oldest to newest (ascending)
    })
  }

  // Clean hidden columns from member data
  const cleanHiddenColumns = (member) => {
    const HIDDEN_COLUMNS = [
      'membership code', 'start date', 'end date', 'credit balance', 'payments',
      'due date', 'membership status', 'is recurring', 'suspended by', 'setup fee',
      'membership type', 'recurrence status', 'auto renewal'
    ]
    // Normalize column name: handle camelCase by adding spaces, then convert to lowercase
    const normalizeColumnName = (name) => {
      return name
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters (camelCase) - MUST be before toLowerCase
        .toLowerCase()
        .replace(/_/g, ' ') // Replace underscores with spaces
        .trim()
    }
    const isHiddenColumn = (colName) => HIDDEN_COLUMNS.includes(normalizeColumnName(colName))
    
    const cleaned = {}
    Object.entries(member).forEach(([key, value]) => {
      if (!isHiddenColumn(key)) {
        cleaned[key] = value
      }
    })
    return cleaned
  }

  const loadMembers = async () => {
    if (!currentUser) return
    
    try {
      setIsLoading(true)
      const loaded = await getMembersForLocation(location, currentUser)
      // Clean hidden columns from loaded data
      const cleaned = loaded.map(cleanHiddenColumns)
      setMembers(sortMembersBySuspendDate(cleaned))
      setIsLoading(false)
    } catch (err) {
      console.error('Error loading members:', err)
      setError('Error loading saved data')
      setIsLoading(false)
    }
  }

  const saveMembers = async (newMembers) => {
    if (!currentUser) return
    
    try {
      // Clean hidden columns from all members before saving
      const cleaned = newMembers.map(cleanHiddenColumns)
      const sorted = sortMembersBySuspendDate(cleaned)
      const result = await saveMembersForLocation(location, sorted, currentUser)
      if (result.success) {
        setMembers(sorted)
      } else {
        throw new Error(result.error || 'Failed to save')
      }
    } catch (err) {
      console.error('Error saving members:', err)
      setError('Error saving data')
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          processCSVData(results.data)
          setIsLoading(false)
          // Reset file input
          event.target.value = ''
        } catch (err) {
          console.error('Error processing CSV:', err)
          setError('Error processing CSV file. Please check the format.')
          setIsLoading(false)
          event.target.value = ''
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error)
        setError('Error parsing CSV file')
        setIsLoading(false)
        event.target.value = ''
      }
    })
  }

  const processCSVData = (newData) => {
    // Fields to exclude from storage and key generation
    const HIDDEN_COLUMNS = [
      'membership code', 'start date', 'end date', 'credit balance', 'payments',
      'due date', 'membership status', 'is recurring', 'suspended by', 'setup fee',
      'membership type', 'recurrence status', 'auto renewal'
    ]
    const UI_ONLY_FIELDS = ['notes', 'firstContact', 'secondContact', 'thirdContact', 'finalContact']
    
    // Normalize column name: handle camelCase by adding spaces, then convert to lowercase
    const normalizeColumnName = (name) => {
      return name
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters (camelCase) - MUST be before toLowerCase
        .toLowerCase()
        .replace(/_/g, ' ') // Replace underscores with spaces
        .trim()
    }
    const isHiddenColumn = (colName) => HIDDEN_COLUMNS.includes(normalizeColumnName(colName))
    
    // Filter out hidden columns from CSV data
    const filterHiddenColumns = (member) => {
      const filtered = {}
      Object.entries(member).forEach(([key, value]) => {
        if (!isHiddenColumn(key)) {
          filtered[key] = value
        }
      })
      return filtered
    }
    
    // Normalize member data - create a unique key using stable identifiers
    // Use name, phone, email, or member ID if available
    const normalizeMember = (member) => {
      const filtered = filterHiddenColumns(member)
      // Try to find stable identifier fields (case-insensitive)
      const keys = Object.keys(filtered)
      const nameKey = keys.find(k => normalizeColumnName(k).includes('name') && !normalizeColumnName(k).includes('member'))
      const phoneKey = keys.find(k => normalizeColumnName(k).includes('phone'))
      const emailKey = keys.find(k => normalizeColumnName(k).includes('email'))
      const idKey = keys.find(k => normalizeColumnName(k).includes('id') || normalizeColumnName(k).includes('member id'))
      
      const identifiers = []
      if (nameKey && filtered[nameKey]) identifiers.push(`name:${String(filtered[nameKey]).trim().toLowerCase()}`)
      if (phoneKey && filtered[phoneKey]) identifiers.push(`phone:${String(filtered[phoneKey]).trim().toLowerCase()}`)
      if (emailKey && filtered[emailKey]) identifiers.push(`email:${String(filtered[emailKey]).trim().toLowerCase()}`)
      if (idKey && filtered[idKey]) identifiers.push(`id:${String(filtered[idKey]).trim().toLowerCase()}`)
      
      // Fallback: use all non-empty fields if no standard identifiers found
      if (identifiers.length === 0) {
        Object.entries(filtered).forEach(([key, value]) => {
          if (!UI_ONLY_FIELDS.includes(key) && value && typeof value === 'string' && value.trim()) {
            identifiers.push(`${key}:${value.trim().toLowerCase()}`)
          }
        })
      }
      
      return identifiers.sort().join('|')
    }

    // Create a map of existing members by their key (clean existing members first)
    const existingMembersMap = new Map()
    members.forEach(member => {
      const cleanedMember = filterHiddenColumns(member) // Clean existing members
      const key = normalizeMember(cleanedMember)
      if (key) {
        existingMembersMap.set(key, cleanedMember) // Store cleaned member
      }
    })

    const existingKeys = new Set(existingMembersMap.keys())

    // Process new data - filter hidden columns and match with existing
    const newMembersMap = new Map()
    const newMembers = []
    const matchedKeys = new Set()
    
    newData.forEach(member => {
      const filteredMember = filterHiddenColumns(member)
      const key = normalizeMember(filteredMember)
      if (key) {
        newMembersMap.set(key, filteredMember)
        if (existingKeys.has(key)) {
          matchedKeys.add(key)
        } else {
          newMembers.push(filteredMember)
        }
      }
    })

    // Preserve existing members who are still suspended (merge CSV data if needed, but preserve UI fields)
    const stillSuspended = []
    existingMembersMap.forEach((existingMember, key) => {
      if (matchedKeys.has(key)) {
        // Member still exists - merge CSV data but preserve UI fields (notes, contacts)
        const csvData = newMembersMap.get(key)
        const merged = {
          ...csvData, // CSV data (latest info)
          ...UI_ONLY_FIELDS.reduce((acc, field) => {
            if (existingMember[field]) acc[field] = existingMember[field]
            return acc
          }, {})
        }
        stillSuspended.push(merged)
      }
      // If key not matched, member has renewed and will be removed
    })

    // Combine: existing members (merged) + new members
    const updatedMembers = [
      ...stillSuspended,
      ...newMembers
    ]

    saveMembers(updatedMembers)
  }

  // Filter members by search term (Guest name or MobilePhone)
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members
    if (members.length === 0) return members
    
    const keys = Object.keys(members[0])
    
    // Find Guest column key (handles camelCase)
    const guestKey = keys.find(key => {
      const normalized = normalizeColumnNameForMatching(key)
      return normalized === 'guest'
    })
    
    // Find MobilePhone column key (handles camelCase)
    const mobilePhoneKey = keys.find(key => {
      const normalized = normalizeColumnNameForMatching(key)
      return normalized === 'mobile phone' || normalized === 'mobilephone' || normalized === 'phone'
    })
    
    const search = searchTerm.toLowerCase().trim()
    const containsNumbers = /\d/.test(searchTerm)
    
    return members.filter(member => {
      // If input contains numbers, search in MobilePhone, otherwise search in Guest
      if (containsNumbers && mobilePhoneKey) {
        const phone = member[mobilePhoneKey]
        if (phone) {
          // Remove common phone formatting characters for matching
          const phoneStr = String(phone).replace(/[^\d]/g, '')
          const searchDigits = searchTerm.replace(/[^\d]/g, '')
          return phoneStr.includes(searchDigits)
        }
        return false
      } else if (guestKey) {
        const guestName = member[guestKey]
        if (guestName) {
          return String(guestName).toLowerCase().includes(search)
        }
        return false
      }
      return false
    })
  }, [members, searchTerm])

  // Helper to find member index in full members array by matching member data
  const findMemberIndex = (targetMember) => {
    // Create a simple key from member data for comparison
    const createKey = (member) => {
      const keys = Object.keys(member).sort()
      return keys.map(key => `${key}:${member[key]}`).join('|')
    }
    const targetKey = createKey(targetMember)
    return members.findIndex(member => createKey(member) === targetKey)
  }

  const handleDeleteMember = (index) => {
    // index is from filtered list, find the actual member
    const memberToDelete = filteredMembers[index]
    const actualIndex = findMemberIndex(memberToDelete)
    if (actualIndex !== -1) {
      const updated = members.filter((_, i) => i !== actualIndex)
      saveMembers(updated)
    }
  }

  const handleUpdateNote = (index, note) => {
    // index is from filtered list, find the actual member
    const memberToUpdate = filteredMembers[index]
    const actualIndex = findMemberIndex(memberToUpdate)
    if (actualIndex !== -1) {
      const updated = members.map((member, i) => 
        i === actualIndex ? { ...member, notes: note } : member
      )
      saveMembers(updated)
    }
  }

  const handleUpdateContact = (index, field, value) => {
    // index is from filtered list, find the actual member
    const memberToUpdate = filteredMembers[index]
    const actualIndex = findMemberIndex(memberToUpdate)
    if (actualIndex !== -1) {
      const updated = members.map((member, i) => 
        i === actualIndex ? { ...member, [field]: value } : member
      )
      saveMembers(updated)
    }
  }

  const handleClearAll = () => {
    if (window.confirm(`Are you sure you want to clear all members for ${location}?`)) {
      saveMembers([])
      setSearchTerm('')
    }
  }

  return (
    <div className="location-view">
      <div className="location-header">
        <div className="location-title-section">
          <h2>{location}</h2>
          {members.length > 0 && (
            <span className="member-count">
              Total: {members.length} suspended member{members.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="header-actions">
          <label className="upload-button">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isLoading}
              style={{ display: 'none' }}
            />
            {isLoading ? 'Processing...' : 'Upload CSV'}
          </label>
          {members.length > 0 && (
            <button className="clear-button" onClick={handleClearAll}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {members.length > 0 && (
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search by guest name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <MemberTable
        members={filteredMembers}
        onDelete={handleDeleteMember}
        onUpdateNote={handleUpdateNote}
        onUpdateContact={handleUpdateContact}
      />
    </div>
  )
}

export default LocationView

