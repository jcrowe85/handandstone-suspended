# Hand & Stone - Suspended Members Management

A web application for managing suspended members across multiple spa locations.

## Features

- **Multi-Location Support**: Manage suspended members for 6 locations (Huntington Beach, Laguna Beach, Costa Mesa, Pleasanton, Brentwood, Alameda)
- **CSV Upload**: Upload CSV files to update member lists
- **Smart Deduplication**: Automatically ignores duplicate members when uploading
- **Auto-Removal**: Removes members from the list if they're not in the new import (indicating they've renewed)
- **Editable Notes**: Add and edit notes for each member
- **Delete Functionality**: Remove individual members from the list
- **Persistent Storage**: Data is saved locally in the browser

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## How to Use

1. **Select a Location**: Click on a location in the sidebar to view its suspended members list
2. **Upload CSV**: Click "Upload CSV" to upload a new CSV file with suspended members
3. **View Members**: The table displays all suspended members with their information
4. **Add Notes**: Click on the notes cell to add or edit notes for a member
5. **Delete Members**: Click the delete button (🗑️) to remove a member from the list
6. **Clear All**: Use "Clear All" to remove all members from a location's list

## CSV Format

The application accepts CSV files with any column structure. Common columns might include:
- Name
- Phone
- Email
- Member ID
- Suspension Date
- etc.

The application will automatically detect and display all columns from your CSV file.

## Data Storage

The application uses **SQLite** database stored on the server. The database file is located at:
- `server/data/handandstone.db` (default location)

This means:
- ✅ Data is centralized and accessible from any device/browser
- ✅ All users see the same data for their location
- ✅ Data persists on the server, not in individual browsers
- ✅ Easy to backup and maintain

### Database Structure

- **Users table**: Stores authentication credentials and location permissions
- **Members table**: Stores suspended member data, organized by location

The database is automatically initialized on first server start with default users.

## Technical Details

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (lightweight, file-based)
- **CSV Parsing**: PapaParse
- **Deployment**: Can run on Ubuntu VPS (see DEPLOYMENT.md)

### Architecture

- **Client-Server**: Frontend communicates with backend API
- **RESTful API**: `/api/auth` for authentication, `/api/members` for member data
- **Location-based Access Control**: Each user can only access their assigned location(s)
- **Admin Access**: Admin user has access to all locations

## Development

### Running Locally

1. Install dependencies: `npm install`
2. Start development server: `npm run dev:full` (runs both frontend and backend)
3. Or separately:
   - Frontend: `npm run dev`
   - Backend: `npm run server`

### Building for Production

```bash
npm run build
npm start
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to Ubuntu Digital Ocean VPS.

