const http = require('http');

// Function to fetch and inspect the initial load HTML/JS
async function testMetrics() {
  console.log("Measuring baseline performance on localhost:5173...");
  const t0 = Date.now();
  http.get('http://localhost:5173/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const duration = Date.now() - t0;
      console.log(`Initial HTML fetch: ${duration}ms, size: ${data.length} bytes`);
    });
  });
}
testMetrics();
