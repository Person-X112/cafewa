const http = require('http');

async function makeRequest(path, method = 'GET', body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Accept': 'application/json',
      }
    };

    if (body) {
      const jsonBody = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(jsonBody);
    }

    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    const req = http.request(options, (res) => {
      let data = '';
      
      const newCookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0] : null;

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data ? JSON.parse(data) : null,
          cookie: newCookie
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("Waiting for Next.js to be ready...");
  await new Promise(r => setTimeout(r, 2000));

  try {
    console.log("\n--- Testing GET /api/categories ---");
    const categories = await makeRequest('/api/categories');
    console.log(`Status: ${categories.statusCode}`);
    console.log(`Response length: ${categories.body?.length || 0} categories`);
    
    console.log("\n--- Testing GET /api/menu ---");
    const menu = await makeRequest('/api/menu');
    console.log(`Status: ${menu.statusCode}`);
    console.log(`Response length: ${menu.body?.length || 0} menu items`);

    console.log("\n--- Testing POST /api/auth/login ---");
    const login = await makeRequest('/api/auth/login', 'POST', {
      username: 'admin',
      password: 'admin123'
    });
    console.log(`Status: ${login.statusCode}`);
    console.log(`Response:`, login.body);
    
    let tokenCookie = login.cookie;
    if (tokenCookie) {
      console.log("\nGot cookie for authentication!");
      
      console.log("\n--- Testing GET /api/auth/me ---");
      const me = await makeRequest('/api/auth/me', 'GET', null, tokenCookie);
      console.log(`Status: ${me.statusCode}`);
      console.log(`Response:`, me.body);

      console.log("\n--- Testing GET /api/orders ---");
      const orders = await makeRequest('/api/orders', 'GET', null, tokenCookie);
      console.log(`Status: ${orders.statusCode}`);
      if (orders.body && orders.body.error) {
         console.log(`Error Response:`, orders.body);
      } else {
         console.log(`Response length: ${orders.body?.length || 0} orders`);
      }
    } else {
      console.log("\nFailed to get authentication cookie.");
    }

  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

runTests();
