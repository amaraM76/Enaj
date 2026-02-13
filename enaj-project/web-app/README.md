# Enaj Web App - Backend Integration

The web app (`enaj-app.html`) is now fully integrated with the backend API server.

## Setup Instructions

### 1. Start the Backend Server

First, make sure the backend server is running:

```bash
cd backend
npm install  # if you haven't already
npm start
```

The server will start on `http://localhost:3001`

### 2. Open the Web App

Simply open `enaj-app.html` in your web browser. You can:

- **Double-click** the file to open it in your default browser
- Or use a local web server:
  ```bash
  # Using Python 3
  python3 -m http.server 8000
  
  # Using Node.js http-server
  npx http-server -p 8000
  ```
  Then navigate to `http://localhost:8000/enaj-app.html`

### 3. Using the App

1. **Welcome Screen**: Enter your name and click "Get Started"
   - This creates a guest account in the backend
   - Your data will be saved and persist across sessions

2. **Select Conditions**: Choose any health conditions you have
   - Data is loaded from the backend
   - Your selections are automatically saved

3. **Set Preferences**: Select ingredients you want to avoid
   - Preferences are synced with the backend

4. **Scan Products**: Use the extension demo to scan products
   - Product analysis is performed by the backend API
   - Results are saved to your scan history

## Features

- ✅ **Authentication**: Guest login creates a user account automatically
- ✅ **Data Persistence**: All selections are saved to the backend database
- ✅ **Real-time Sync**: Changes are immediately saved to the backend
- ✅ **Product Scanning**: Uses backend API for ingredient analysis
- ✅ **Profile Loading**: Automatically loads your saved profile on app start

## API Configuration

The API base URL is set in `api.js`:

```javascript
const API_BASE_URL = 'http://localhost:3001';
```

If your backend is running on a different host/port, update this value.

## Troubleshooting

### "Connection Error" Message

- Make sure the backend server is running on `http://localhost:3001`
- Check that CORS is enabled in the backend (it should be by default)
- Verify the API_BASE_URL in `api.js` matches your backend URL

### Data Not Loading

- Check the browser console for errors (F12 → Console)
- Verify the backend server is responding at `http://localhost:3001/api/health`
- Ensure you're opening the HTML file from the same origin or using a local server

### Changes Not Saving

- Check that you're authenticated (token should be in localStorage)
- Verify the backend server is running and accessible
- Check browser console for API errors

## File Structure

```
web-app/
├── enaj-app.html    # Main React app (single HTML file)
├── api.js           # API service module
└── README.md        # This file
```

## Notes

- The app uses localStorage to persist the authentication token
- Guest accounts are created automatically - no email/password required
- All data is stored in the backend SQLite database
- The app gracefully handles offline mode (shows error but continues to work)
