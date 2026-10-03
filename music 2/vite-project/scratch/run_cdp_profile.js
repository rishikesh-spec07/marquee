async function getWsUrl() {
  const res = await fetch('http://localhost:9222/json');
  const list = await res.json();
  const page = list.find(p => p.type === 'page');
  return page ? page.webSocketDebuggerUrl : null;
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  const wsUrl = await getWsUrl();
  if (!wsUrl) {
    console.error('No page found on port 9222');
    process.exit(1);
  }
  const client = new CDPClient(wsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Network.enable');
  await client.send('Runtime.enable');
  await client.send('Performance.enable');

  // Clear browser cache for clean cold-load measurement
  await client.send('Network.clearBrowserCache');

  // Emulate Mobile Device (iPhone 14 / modern mobile 390x844 DPR 3)
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
    screenOrientation: { angle: 0, type: 'portraitPrimary' }
  });
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true });

  // 4x CPU Throttling
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  // Fast 3G Network Throttling
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    connectionType: 'cellular3g'
  });

  // Track long tasks
  await client.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__perfData = {
        fcp: 0,
        lcp: 0,
        cls: 0,
        longTasks: []
      };

      try {
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              window.__perfData.fcp = entry.startTime;
            }
          }
        }).observe({ type: 'paint', buffered: true });

        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            window.__perfData.lcp = entries[entries.length - 1].startTime;
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__perfData.cls += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });

        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            window.__perfData.longTasks.push({
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        }).observe({ type: 'longtask', buffered: true });
      } catch (e) {
        console.error('Observer error:', e);
      }
    `
  });

  const tStart = Date.now();
  await client.send('Page.navigate', { url: 'http://localhost:4173/' });

  // Wait for initial load under Fast 3G + 4x CPU
  await new Promise(r => setTimeout(r, 7000));

  // Measure scroll smoothness
  const scrollTest = await client.send('Runtime.evaluate', {
    expression: `
      (async () => {
        let frameCount = 0;
        let lastFrameTime = performance.now();
        let frameDeltas = [];
        let animActive = true;

        function recordFrame(now) {
          const dt = now - lastFrameTime;
          lastFrameTime = now;
          frameDeltas.push(dt);
          frameCount++;
          if (animActive) requestAnimationFrame(recordFrame);
        }
        requestAnimationFrame(recordFrame);

        // Perform smooth touch scrolls
        for (let i = 0; i < 15; i++) {
          window.scrollBy({ top: 150, behavior: 'smooth' });
          await new Promise(r => setTimeout(r, 100));
        }

        animActive = false;
        await new Promise(r => setTimeout(r, 100));

        // Evaluate metrics
        const totalDurationMs = frameDeltas.reduce((a, b) => a + b, 0);
        const fps = Math.round((frameCount / (totalDurationMs / 1000))) || 60;
        const droppedFrames = frameDeltas.filter(dt => dt > 20).length;

        // Extract timing
        const navEntries = performance.getEntriesByType('navigation');
        const nav = navEntries.length ? navEntries[0] : null;

        return {
          fps,
          droppedFrames,
          totalFrames: frameCount,
          data: window.__perfData,
          nav: nav ? {
            domContentLoaded: nav.domContentLoadedEventEnd,
            load: nav.loadEventEnd,
            transferSize: nav.transferSize
          } : null
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  const res = scrollTest.result.value;
  console.log(JSON.stringify(res, null, 2));

  client.close();
}

run().catch(console.error);
