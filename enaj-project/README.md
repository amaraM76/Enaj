# Enaj - Smart Shopping Assistant

Enaj helps you shop smarter by scanning product ingredients and flagging ones that conflict with your health conditions or personal preferences.

## Project Structure

```
enaj-project/
├── backend/           # Node.js/Express API with SQLite
│   ├── server.js      # Main API server
│   ├── database.js    # SQLite database setup
│   ├── ailmentsData.js # Ailments & preferences data
│   └── package.json
│
└── mobile/            # React Native Expo app
    ├── App.js         # Main app component
    ├── src/
    │   └── api.js     # API service
    ├── app.json       # Expo configuration
    └── package.json
```

## Backend Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Running the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/guest` - Create guest account

#### User Profile
- `GET /api/user/profile` - Get full user profile
- `PUT /api/user/name` - Update user name

#### Ailments
- `GET /api/ailments` - Get all available ailments
- `GET /api/user/ailments` - Get user's selected ailments
- `PUT /api/user/ailments` - Update user's ailments

#### Preferences
- `GET /api/preferences` - Get all available preferences
- `GET /api/user/preferences` - Get user's preferences
- `PUT /api/user/preferences` - Update preferences

#### Ingredient Management
- `POST /api/user/remove-ingredient` - Remove ingredient from monitoring
- `POST /api/user/restore-ingredient` - Restore removed ingredient
- `GET /api/user/removed-ingredients` - Get removed ingredients

#### Scanning
- `GET /api/user/avoid-list` - Get computed avoid list
- `POST /api/scan/analyze` - Analyze product ingredients
- `GET /api/user/scan-history` - Get scan history

---

## Mobile App Setup (Expo)

### Prerequisites
- Node.js 18+
- Expo Go app on your phone (iOS/Android)
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
cd mobile
npm install
```

### Configuration

1. Find your computer's local IP address:
   - Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig`
   - Linux: `hostname -I`

2. Update the API URL in `App.js`:
   ```javascript
   const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000';
   ```

3. Make sure your phone and computer are on the same WiFi network.

### Running the App

```bash
npx expo start
```

This will display a QR code. Scan it with:
- **iOS**: Camera app
- **Android**: Expo Go app

### Offline Mode

The app works offline with local data. When connected to the backend:
- User preferences are synced to the database
- Scan history is saved
- Data persists across sessions

---

## Database Schema

### Tables

**users**
- id (TEXT, PRIMARY KEY)
- email (TEXT, UNIQUE)
- password_hash (TEXT)
- name (TEXT)
- created_at, updated_at

**user_ailments**
- user_id → users(id)
- ailment_name (TEXT)

**user_preferences**
- user_id → users(id)
- preference_name (TEXT)

**removed_ingredients**
- user_id → users(id)
- ailment_name (TEXT)
- ingredient_name (TEXT)

**scan_history**
- user_id → users(id)
- product_name, brand, price
- flagged_ingredients (JSON)
- is_recommended (BOOLEAN)
- scanned_at (DATETIME)

**saved_alternatives**
- user_id → users(id)
- product details + saved_at

---

## Features

### Health Profile
- 30+ pre-defined health conditions
- Categorized: Skin, Digestive, Neurological, Autoimmune, Respiratory
- Each condition maps to specific ingredients to avoid
- Custom ailment text input

### Personal Preferences
- Artificial additives (sweeteners, colors, flavors)
- Chemicals (parabens, sulfates, phthalates)
- Lifestyle (vegan, organic, non-GMO)
- Environmental (recyclable, cruelty-free)

### Ingredient Monitoring
- View all monitored ingredients per condition
- Remove/restore individual ingredients
- Full customization of avoid lists

### Product Scanning
- Analyze product ingredient lists
- Flag problematic ingredients with reasons
- Trace flags back to specific conditions or preferences
- Suggest safe alternatives

---

## Tech Stack

**Backend**
- Node.js + Express
- SQLite (better-sqlite3)
- JWT authentication
- bcrypt password hashing

**Mobile**
- React Native
- Expo SDK 50
- AsyncStorage for local persistence
- Linear Gradient for styling

---

## Troubleshooting

### "Network request failed" on mobile
1. Ensure backend is running
2. Check IP address is correct
3. Verify same WiFi network
4. Try disabling firewall temporarily

### Database errors
Delete `enaj.db` and restart server to reset.

### Expo issues
```bash
npx expo start --clear
```

---

## License

MIT License - Feel free to use and modify for your projects.
