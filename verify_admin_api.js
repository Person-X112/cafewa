async function testNewEndpoints() {
  console.log('Testing New Admin Endpoints...');
  
  const baseUrl = 'http://localhost:3000/api';
  
  // Test GET /api/users (should be 401 if not logged in)
  try {
    const res = await fetch(`${baseUrl}/users`);
    console.log(`GET /api/users (Unauthorized): ${res.status}`);
  } catch (err) {
    console.log('GET /api/users failed (as expected if no server)');
  }

  // Test GET /api/menu (should be 200)
  try {
    const res = await fetch(`${baseUrl}/menu`);
    console.log(`GET /api/menu: ${res.status}`);
    if (res.ok) {
        const data = await res.json();
        console.log(`Found ${data.length} menu items.`);
    }
  } catch (err) {
    console.log('GET /api/menu failed');
  }
}

testNewEndpoints();
