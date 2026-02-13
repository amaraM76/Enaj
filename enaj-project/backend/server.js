const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { initDatabase, run, get, all, saveDatabase } = require('./database');
const { AILMENTS_DATA, PERSONAL_PREFERENCES, getAvoidListForAilment, getAilmentInfo } = require('./ailmentsData');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'enaj-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ============== AUTH ROUTES ==============

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const existingUser = get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    run('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)', [userId, email, passwordHash, name || '']);
    
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' });
    
    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: { id: userId, email, name: name || '' }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({ 
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Guest login
app.post('/api/auth/guest', (req, res) => {
  try {
    const { name } = req.body;
    const userId = uuidv4();
    const guestEmail = `guest_${userId}@enaj.local`;
    
    run('INSERT INTO users (id, email, name) VALUES (?, ?, ?)', [userId, guestEmail, name || 'Guest']);
    
    const token = jwt.sign({ userId, email: guestEmail, isGuest: true }, JWT_SECRET, { expiresIn: '30d' });
    
    res.status(201).json({ 
      token,
      user: { id: userId, name: name || 'Guest', isGuest: true }
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Guest login failed' });
  }
});

// ============== USER PROFILE ROUTES ==============

app.get('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    
    const user = get('SELECT id, email, name, created_at FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const ailments = all('SELECT ailment_name FROM user_ailments WHERE user_id = ?', [userId]).map(a => a.ailment_name);
    const preferences = all('SELECT preference_name FROM user_preferences WHERE user_id = ?', [userId]).map(p => p.preference_name);
    const removedIngredients = all('SELECT ailment_name, ingredient_name FROM removed_ingredients WHERE user_id = ?', [userId]);
    const customAilments = all('SELECT ailment_text FROM custom_ailments WHERE user_id = ?', [userId]).map(c => c.ailment_text);
    
    const removedMap = {};
    removedIngredients.forEach(r => {
      if (!removedMap[r.ailment_name]) removedMap[r.ailment_name] = [];
      removedMap[r.ailment_name].push(r.ingredient_name);
    });
    
    res.json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at },
      ailments,
      preferences,
      removedIngredients: removedMap,
      customAilments
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/user/name', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { name } = req.body;
    
    run('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name, userId]);
    
    res.json({ message: 'Name updated', name });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update name' });
  }
});

// ============== AILMENTS ROUTES ==============

app.get('/api/ailments', (req, res) => {
  res.json(AILMENTS_DATA);
});

app.get('/api/user/ailments', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const ailments = all('SELECT ailment_name FROM user_ailments WHERE user_id = ?', [userId]).map(a => a.ailment_name);
    res.json(ailments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ailments' });
  }
});

app.put('/api/user/ailments', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { ailments } = req.body;
    
    run('DELETE FROM user_ailments WHERE user_id = ?', [userId]);
    
    for (const ailment of ailments) {
      run('INSERT INTO user_ailments (user_id, ailment_name) VALUES (?, ?)', [userId, ailment]);
    }
    
    res.json({ message: 'Ailments updated', ailments });
  } catch (error) {
    console.error('Ailments update error:', error);
    res.status(500).json({ error: 'Failed to update ailments' });
  }
});

app.post('/api/user/custom-ailment', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { ailmentText } = req.body;
    
    run('INSERT INTO custom_ailments (user_id, ailment_text) VALUES (?, ?)', [userId, ailmentText]);
    
    res.json({ message: 'Custom ailment added', ailmentText });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add custom ailment' });
  }
});

// ============== PREFERENCES ROUTES ==============

app.get('/api/preferences', (req, res) => {
  res.json(PERSONAL_PREFERENCES);
});

app.get('/api/user/preferences', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const preferences = all('SELECT preference_name FROM user_preferences WHERE user_id = ?', [userId]).map(p => p.preference_name);
    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

app.put('/api/user/preferences', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { preferences } = req.body;
    
    run('DELETE FROM user_preferences WHERE user_id = ?', [userId]);
    
    for (const pref of preferences) {
      run('INSERT INTO user_preferences (user_id, preference_name) VALUES (?, ?)', [userId, pref]);
    }
    
    res.json({ message: 'Preferences updated', preferences });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// ============== INGREDIENT MANAGEMENT ==============

app.post('/api/user/remove-ingredient', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { ailmentName, ingredientName } = req.body;
    
    run('INSERT OR REPLACE INTO removed_ingredients (user_id, ailment_name, ingredient_name) VALUES (?, ?, ?)', [userId, ailmentName, ingredientName]);
    
    res.json({ message: 'Ingredient removed', ailmentName, ingredientName });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove ingredient' });
  }
});

app.post('/api/user/restore-ingredient', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { ailmentName, ingredientName } = req.body;
    
    run('DELETE FROM removed_ingredients WHERE user_id = ? AND ailment_name = ? AND ingredient_name = ?', [userId, ailmentName, ingredientName]);
    
    res.json({ message: 'Ingredient restored', ailmentName, ingredientName });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore ingredient' });
  }
});

app.get('/api/user/removed-ingredients', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const removed = all('SELECT ailment_name, ingredient_name FROM removed_ingredients WHERE user_id = ?', [userId]);
    
    const removedMap = {};
    removed.forEach(r => {
      if (!removedMap[r.ailment_name]) removedMap[r.ailment_name] = [];
      removedMap[r.ailment_name].push(r.ingredient_name);
    });
    
    res.json(removedMap);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch removed ingredients' });
  }
});

// ============== AVOID LIST ==============

app.get('/api/user/avoid-list', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    
    const ailments = all('SELECT ailment_name FROM user_ailments WHERE user_id = ?', [userId]).map(a => a.ailment_name);
    const preferences = all('SELECT preference_name FROM user_preferences WHERE user_id = ?', [userId]).map(p => p.preference_name);
    const removed = all('SELECT ailment_name, ingredient_name FROM removed_ingredients WHERE user_id = ?', [userId]);
    
    const removedMap = {};
    removed.forEach(r => {
      if (!removedMap[r.ailment_name]) removedMap[r.ailment_name] = [];
      removedMap[r.ailment_name].push(r.ingredient_name);
    });
    
    const avoidSet = new Set();
    
    for (const ailmentName of ailments) {
      const avoidList = getAvoidListForAilment(ailmentName);
      const removedForAilment = removedMap[ailmentName] || [];
      
      for (const ingredient of avoidList) {
        if (!removedForAilment.includes(ingredient)) {
          avoidSet.add(ingredient);
        }
      }
    }
    
    for (const pref of preferences) {
      avoidSet.add(pref);
    }
    
    res.json({
      avoidList: Array.from(avoidSet),
      count: avoidSet.size,
      ailments,
      preferences
    });
  } catch (error) {
    console.error('Avoid list error:', error);
    res.status(500).json({ error: 'Failed to compute avoid list' });
  }
});

// ============== SCAN ==============

app.post('/api/scan/analyze', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { productName, productBrand, productPrice, ingredients } = req.body;
    
    const ailments = all('SELECT ailment_name FROM user_ailments WHERE user_id = ?', [userId]).map(a => a.ailment_name);
    const preferences = all('SELECT preference_name FROM user_preferences WHERE user_id = ?', [userId]).map(p => p.preference_name);
    const removed = all('SELECT ailment_name, ingredient_name FROM removed_ingredients WHERE user_id = ?', [userId]);
    
    const removedMap = {};
    removed.forEach(r => {
      if (!removedMap[r.ailment_name]) removedMap[r.ailment_name] = [];
      removedMap[r.ailment_name].push(r.ingredient_name);
    });
    
    const avoidWithReasons = {};
    
    for (const ailmentName of ailments) {
      const avoidList = getAvoidListForAilment(ailmentName);
      const removedForAilment = removedMap[ailmentName] || [];
      const ailmentInfo = getAilmentInfo(ailmentName);
      
      for (const ingredient of avoidList) {
        if (!removedForAilment.includes(ingredient)) {
          const key = ingredient.toLowerCase();
          if (!avoidWithReasons[key]) avoidWithReasons[key] = { ailments: [], preferences: [] };
          avoidWithReasons[key].ailments.push({ name: ailmentName, icon: ailmentInfo?.icon || '🩺' });
        }
      }
    }
    
    for (const pref of preferences) {
      const key = pref.toLowerCase();
      if (!avoidWithReasons[key]) avoidWithReasons[key] = { ailments: [], preferences: [] };
      avoidWithReasons[key].preferences.push(pref);
    }
    
    const flagged = [];
    const ingredientsList = ingredients.split(',').map(i => i.trim().toLowerCase());
    
    for (const ing of ingredientsList) {
      for (const [avoidKey, reasons] of Object.entries(avoidWithReasons)) {
        if (ing.includes(avoidKey) || avoidKey.includes(ing)) {
          flagged.push({ ingredient: ing, matchedAvoid: avoidKey, reasons });
          break;
        }
      }
    }
    
    const isRecommended = flagged.length === 0;
    
    run('INSERT INTO scan_history (user_id, product_name, product_brand, product_price, flagged_ingredients, is_recommended) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, productName, productBrand, productPrice, JSON.stringify(flagged), isRecommended ? 1 : 0]);
    
    res.json({ productName, productBrand, productPrice, isRecommended, flaggedCount: flagged.length, flaggedIngredients: flagged });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to analyze product' });
  }
});

app.get('/api/user/scan-history', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const history = all('SELECT * FROM scan_history WHERE user_id = ? ORDER BY scanned_at DESC LIMIT 50', [userId]);
    
    const parsed = history.map(h => ({
      ...h,
      flagged_ingredients: JSON.parse(h.flagged_ingredients || '[]'),
      is_recommended: h.is_recommended === 1
    }));
    
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
});

// ============== ROOT ROUTE ==============

app.get('/', (req, res) => {
  res.json({ 
    message: 'Enaj API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      user: '/api/user/*',
      ailments: '/api/ailments',
      preferences: '/api/preferences',
      scan: '/api/scan/*'
    },
    docs: 'See README.md for API documentation'
  });
});

// ============== HEALTH CHECK ==============

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  await initDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🛡️  Enaj API server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);