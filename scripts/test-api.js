const testUrls = [
  'http://localhost:3000/api/wishlist',
  'http://localhost:3000/product/jordan-4-retro',
  'http://localhost:3000/api/reviews?productId=123',
  'http://localhost:3000/api/products/batch'
];

async function testUrl(url, method = 'GET', body = null) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    await res.text();
    const duration = Date.now() - start;
    console.log(`[${method}] ${url} - ${res.status} (${duration}ms)`);
  } catch (err) {
    console.log(`[${method}] ${url} - ERROR: ${err.message}`);
  }
}

async function run() {
  await testUrl(testUrls[0]);
  await testUrl(testUrls[1]);
  await testUrl(testUrls[2]);
  await testUrl(testUrls[3], 'POST', { ids: ['123', '456'] });
}
run();
