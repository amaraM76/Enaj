const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const { AILMENTS_DATA, PERSONAL_PREFERENCES, getAvoidListForAilment, getAilmentInfo } = require('./ailmentsData');

const app = express();
const PORT = process.env.PORT || 3000;
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
    
    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(userId, email, passwordHash, name || '');
    
    // Generate token
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
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
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

// Guest login (create anonymous user)
app.post('/api/auth/guest', (req, res) => {
  try {
    const { name } = req.body;
    const userId = uuidv4();
    const guestEmail = `guest_${userId}@enaj.local`;
    
    db.prepare('INSERT INTO users (id, email, name) VALUES (?, ?, ?)').run(userId, guestEmail, name || 'Guest');
    
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

// Get user profile with all data
app.get('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    
    const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const ailments = db.prepare('SELECT ailment_name FROM user_ailments WHERE user_id = ?').all(userId).map(a => a.ailment_name);
    const preferences = db.prepare('SELECT preference_name FROM user_preferences WHERE user_id = ?').all(userId).map(p => p.preference_name);
    const removedIngredients = db.prepare('SELECT ailment_name, ingredient_name FROM removed_ingredients WHERE user_id = ?').all(userId);
    const customAilments = db.prepare('SELECT ailment_text FROM custom_ailments WHERE user_id = ?').all(userId).map(c => c.ailment_text);
    
    // Build removed ingredients map
    const removedMap = {};
    removedIngredients.forEach(r => {
      if (!removedMap[r.ailment_name]) {
        removedMap[r.ailment_name] = [];
      }
      removedMap[r.ailment_name].push(r.ingredient_name);
    });
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at
      },
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

// Update user name
app.put('/api/user/name', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { name } = req.body;
    
    db.prepare('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, userId);
    
    res.json({ message: 'Name updated', name });
  } catch (error) {
    console.error('Name update error:', error);
    res.status(500).json({ error: 'Failed to update name' });
  }
});

// ============== AILMENTS ROUTES ==============

// Get all available ailments
app.get('/api/ailments', (req, res) => {
  res.json(AILMENTS_DATA);
});

// Get user's selected ailments
app.get('/api/user/ailments', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const ailments = db.prepare('SELECT ailment_name FROM user_ailments WHERE user_id = ?').all(userId).map(a => a.ailment_name);
    res.json(ailments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ailments' });
  }
});

// Set user's ailments (replace all)
app.put('/api/user/ailments', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { ailments } = req.body; // Array of ailment names
    
    // Start transaction
    const transaction = db.transaction(() => {
      // Clear existing
      db.prepare('DELETE FROM user_ailments WHERE user_id = ?').run(userId);
      
      // Insert new
      const insert = db.prepare('INSERT INTO user_ailments (user_id, ailment_name) VALUES (?, ?)');
      for (const ailment of ailments) {
        insert.run(userId, ailment);
      }
    });
    
    transaction();
    
    res.json({ message: 'Ailments updated', ailments });
  } catch (error) {
    console.error('Ailments update error:', error);
    res.status(500).json({ error: 'Failed to update ailments' });
  }
});

// Add custom ailment text
app.post('/api/user/custom-ailment', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { ailmentText } = req.body;
    
    db.prepare('INSERT INTO custom_ailments (user_id, ailment_text) VALUES (?, ?)').run(userId, ailmentText);
    
    res.json({ message: 'Custom ailment added', ailmentText });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add custom ailment' });
  }
});

// ============== PREFERENCES ROUTES ==============

// Get all available preferences
app.get('/api/preferences', (req, res) => {
  res.json(PERSONAL_PREFERENCES);
});

// Get user's selected preferences
app.get('/api/user/preferences', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const preferences = db.prepare('SELECT preference_name FROM user_preferences WHERE user_id = ?').all(userId).map(p => p.preference_name);
    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Set user's preferences (replace all)
app.put('/api/user/preferences', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { preferences } = req.body; // Array of preference names
    
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM user_preferences WHERE user_id = ?').run(userId);
      
      const insert = db.prepare('INSERT INTO user_preferences (user_id, preference_name) VALUES (?, ?)');
      for (const pref of preferences) {
        insert.run(userId, pref);
      }
    });
    
    transaction();
    
    res.json({ message: 'Preferences updated', preferences });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// ============== INGREDIENT MANAGEMENT ROUTES ==============

// Remove an ingredient from an ailment's avoid list (user customization)
app.post('/api/user/remove-ingredient', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { ailmentName, ingredientName } = req.body;
    
    db.prepare('INSERT OR IGNORE INTO removed_ingredients (user_id, ailment_name, ingredient_name) VALUES (?, ?, ?)').run(userId, ailmentName, ingredientName);
    
    res.json({ message: 'Ingredient removed from monitoring', ailmentName, ingredientName });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove ingredient' });
  }
});

// Restore a removed ingredient
app.post('/api/user/restore-ingredient', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { ailmentName, ingredientName } = req.body;
    
    db.prepare('DELETE FROM removed_ingredients WHERE user_id = ? AND ailment_name = ? AND ingredient_name = ?').run(userId, ailmentName, ingredientName);
    
    res.json({ message: 'Ingredient restored to monitoring', ailmentName, ingredientName });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore ingredient' });
  }
});

// Get user's removed ingredients
app.get('/api/user/removed-ingredients', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const removed = db.prepare('SELECT ailment_name, ingredient_name FROM removed_ingredients WHERE user_id = ?').all(userId);
    
    const removedMap = {};
    removed.forEach(r => {
      if (!removedMap[r.ailment_name]) {
        removedMap[r.ailment_name] = [];
      }
      removedMap[r.ailment_name].push(r.ingredient_name);
    });
    
    res.json(removedMap);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch removed ingredients' });
  }
});

// ============== AVOID LIST COMPUTATION ==============

// Get user's complete avoid list (computed from ailments + preferences - removed)
app.get('/api/user/avoid-list', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    
    // Get user's ailments
    const ailments = db.prepare('SELECT ailment_name FROM user_ailments WHERE user_id = ?').all(userId).map(a => a.ailment_name);
    
    // Get user's preferences
    const preferences = db.prepare('SELECT preference_name FROM user_preferences WHERE user_id = ?').all(userId).map(p => p.preference_name);
    
    // Get removed ingredients
    const removed = db.prepare('SELECT ailment_name, ingredient_name FROM removed_ingredients WHERE user_id = ?').all(userId);
    const removedMap = {};
    removed.forEach(r => {
      if (!removedMap[r.ailment_name]) {
        removedMap[r.ailment_name] = [];
      }
      removedMap[r.ailment_name].push(r.ingredient_name);
    });
    
    // Compute avoid list
    const avoidSet = new Set();
    
    // Add ingredients from ailments (minus removed ones)
    for (const ailmentName of ailments) {
      const avoidList = getAvoidListForAilment(ailmentName);
      const removedForAilment = removedMap[ailmentName] || [];
      
      for (const ingredient of avoidList) {
        if (!removedForAilment.includes(ingredient)) {
          avoidSet.add(ingredient);
        }
      }
    }
    
    // Add preferences
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

// ============== SCAN & ANALYSIS ROUTES ==============

// Analyze a product's ingredients
app.post('/api/scan/analyze', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { productName, productBrand, productPrice, ingredients } = req.body;
    
    // Get user's avoid list
    const ailments = db.prepare('SELECT ailment_name FROM user_ailments WHERE user_id = ?').all(userId).map(a => a.ailment_name);
    const preferences = db.prepare('SELECT preference_name FROM user_preferences WHERE user_id = ?').all(userId).map(p => p.preference_name);
    const removed = db.prepare('SELECT ailment_name, ingredient_name FROM removed_ingredients WHERE user_id = ?').all(userId);
    
    const removedMap = {};
    removed.forEach(r => {
      if (!removedMap[r.ailment_name]) removedMap[r.ailment_name] = [];
      removedMap[r.ailment_name].push(r.ingredient_name);
    });
    
    // Build avoid list with reasons
    const avoidWithReasons = {};
    
    for (const ailmentName of ailments) {
      const avoidList = getAvoidListForAilment(ailmentName);
      const removedForAilment = removedMap[ailmentName] || [];
      const ailmentInfo = getAilmentInfo(ailmentName);
      
      for (const ingredient of avoidList) {
        if (!removedForAilment.includes(ingredient)) {
          if (!avoidWithReasons[ingredient.toLowerCase()]) {
            avoidWithReasons[ingredient.toLowerCase()] = { ailments: [], preferences: [] };
          }
          avoidWithReasons[ingredient.toLowerCase()].ailments.push({
            name: ailmentName,
            icon: ailmentInfo?.icon || '🩺'
          });
        }
      }
    }
    
    for (const pref of preferences) {
      if (!avoidWithReasons[pref.toLowerCase()]) {
        avoidWithReasons[pref.toLowerCase()] = { ailments: [], preferences: [] };
      }
      avoidWithReasons[pref.toLowerCase()].preferences.push(pref);
    }
    
    // Check ingredients against avoid list
    const flagged = [];
    const ingredientsList = ingredients.split(',').map(i => i.trim().toLowerCase());
    
    for (const ing of ingredientsList) {
      for (const [avoidKey, reasons] of Object.entries(avoidWithReasons)) {
        if (ing.includes(avoidKey) || avoidKey.includes(ing)) {
          flagged.push({
            ingredient: ing,
            matchedAvoid: avoidKey,
            reasons
          });
          break;
        }
      }
    }
    
    const isRecommended = flagged.length === 0;
    
    // Save to scan history
    db.prepare('INSERT INTO scan_history (user_id, product_name, product_brand, product_price, flagged_ingredients, is_recommended) VALUES (?, ?, ?, ?, ?, ?)').run(
      userId, productName, productBrand, productPrice, JSON.stringify(flagged), isRecommended ? 1 : 0
    );
    
    res.json({
      productName,
      productBrand,
      productPrice,
      isRecommended,
      flaggedCount: flagged.length,
      flaggedIngredients: flagged
    });
  } catch (error) {
    console.error('Scan analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze product' });
  }
});

// Get scan history
app.get('/api/user/scan-history', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const history = db.prepare('SELECT * FROM scan_history WHERE user_id = ? ORDER BY scanned_at DESC LIMIT 50').all(userId);
    
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

// ============== SAVED ALTERNATIVES ROUTES ==============

// Save an alternative product
app.post('/api/user/save-alternative', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { productName, productBrand, productPrice, productLink, productRating } = req.body;
    
    db.prepare('INSERT INTO saved_alternatives (user_id, product_name, product_brand, product_price, product_link, product_rating) VALUES (?, ?, ?, ?, ?, ?)').run(
      userId, productName, productBrand, productPrice, productLink, productRating
    );
    
    res.json({ message: 'Alternative saved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save alternative' });
  }
});

// Get saved alternatives
app.get('/api/user/saved-alternatives', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const alternatives = db.prepare('SELECT * FROM saved_alternatives WHERE user_id = ? ORDER BY saved_at DESC').all(userId);
    res.json(alternatives);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch saved alternatives' });
  }
});

// Delete saved alternative
app.delete('/api/user/saved-alternatives/:id', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    
    db.prepare('DELETE FROM saved_alternatives WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ message: 'Alternative removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove alternative' });
  }
});

// ============== HEALTH CHECK ==============

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🛡️  Enaj API server running on http://localhost:${PORT}`);
  console.log(`📊 Database initialized at ./enaj.db`);
});
