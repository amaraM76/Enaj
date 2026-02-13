#!/usr/bin/env node

/**
 * Enaj Extension Token Generator
 *
 * This script helps you quickly get a connection token for the browser extension.
 * It can either:
 * 1. Create a guest account and get the token
 * 2. Login with existing credentials and get the token
 */

const readline = require('readline');

const API_BASE = 'http://localhost:3001';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function checkBackend() {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    if (response.ok) {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

async function createGuestAccount(name) {
  const response = await fetch(`${API_BASE}/api/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    throw new Error('Failed to create guest account');
  }

  return await response.json();
}

async function login(email, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return await response.json();
}

async function main() {
  console.log('\n🛡️  Enaj Extension Token Generator\n');
  console.log('═══════════════════════════════════\n');

  // Check backend
  console.log('🔍 Checking backend status...');
  const backendRunning = await checkBackend();

  if (!backendRunning) {
    console.log('❌ Backend is not running on http://localhost:3001');
    console.log('\n💡 Start the backend first:');
    console.log('   cd backend && npm start\n');
    rl.close();
    process.exit(1);
  }

  console.log('✅ Backend is running\n');

  // Ask user preference
  console.log('How would you like to proceed?\n');
  console.log('1. Create a quick guest account (fastest)');
  console.log('2. Login with existing credentials');
  console.log('3. Exit\n');

  const choice = await question('Enter your choice (1-3): ');
  console.log('');

  let token = null;
  let userData = null;

  try {
    if (choice === '1') {
      const name = await question('Enter your name (or press Enter for "Guest"): ');
      console.log('\n⏳ Creating guest account...');

      const result = await createGuestAccount(name || 'Guest');
      token = result.token;
      userData = result.user;

      console.log('✅ Guest account created!');

    } else if (choice === '2') {
      const email = await question('Email: ');
      const password = await question('Password: ');
      console.log('\n⏳ Logging in...');

      const result = await login(email, password);
      token = result.token;
      userData = result.user;

      console.log('✅ Logged in successfully!');

    } else {
      console.log('Exiting...');
      rl.close();
      process.exit(0);
    }

    // Display token
    console.log('\n═══════════════════════════════════');
    console.log('🎉 YOUR CONNECTION TOKEN:');
    console.log('═══════════════════════════════════\n');
    console.log(`\x1b[32m${token}\x1b[0m\n`);
    console.log('═══════════════════════════════════\n');

    if (userData) {
      console.log(`👤 Account: ${userData.name}${userData.email ? ` (${userData.email})` : ''}`);
      if (userData.isGuest) {
        console.log('📝 Note: This is a guest account\n');
      } else {
        console.log('');
      }
    }

    // Instructions
    console.log('📋 NEXT STEPS:\n');
    console.log('1. Open Chrome and go to: chrome://extensions/');
    console.log('2. Enable "Developer mode" (toggle in top-right)');
    console.log('3. Click "Load unpacked"');
    console.log('4. Select the folder: enaj-project/enaj-extension/');
    console.log('5. Click the Enaj icon in your browser toolbar');
    console.log('6. Click "Link" under "Enaj account"');
    console.log('7. Enter:');
    console.log('   • API URL: http://localhost:3001');
    console.log('   • Token: (paste the token above)');
    console.log('8. Click "Save & connect"\n');

    console.log('═══════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  rl.close();
}

main();
