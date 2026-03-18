async function testAPIs() {
  try {
    console.log('Testing GET /api/categories...');
    const catRes = await fetch('http://localhost:3000/api/categories');
    const categories = await catRes.json();
    console.log('Categories:', JSON.stringify(categories, null, 2));

    console.log('Testing GET /api/menu...');
    const menuRes = await fetch('http://localhost:3000/api/menu');
    const menuItems = await menuRes.json();
    console.log('Menu Items:', JSON.stringify(menuItems, null, 2));
    
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testAPIs();
