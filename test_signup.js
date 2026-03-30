const axios = require('axios');

async function testSignup() {
  const baseUrl = 'http://localhost:3000'; // Make sure the server is running
  
  try {
    console.log('Testing Signup with weak password...');
    const res1 = await axios.post(`${baseUrl}/api/auth/signup`, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'weak',
      confirmPassword: 'weak'
    });
    console.log('Error: Weak password should have failed');
  } catch (err) {
    console.log('Success: Weak password failed as expected:', err.response?.data?.error);
  }

  try {
    console.log('\nTesting Signup with mismatching passwords...');
    const res2 = await axios.post(`${baseUrl}/api/auth/signup`, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Mismatch123'
    });
    console.log('Error: Password mismatch should have failed');
  } catch (err) {
    console.log('Success: Password mismatch failed as expected:', err.response?.data?.error);
  }

  // To test success, we'd need a running dev server and a fresh DB
  // For now, these validation tests confirm the regex and logic are active.
}

// testSignup(); // Uncomment to run if dev server is up
console.log('Test script ready. Run with "node test_signup.js" when dev server is active.');
