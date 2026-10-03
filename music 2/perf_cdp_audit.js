const http = require('http');

async function runAudit() {
  console.log('Connecting to Chrome CDP on port 9222...');
  
  // 1. Get WebSocket debugger URL
  const versionRes = await fetch('http://127.0.0.1:9222/json/version');
  const versionData = await versionRes.json();
  const wsUrl = versionData.webSocketDebuggerUrl;
  console.log('Connected to:', wsUrl);

  const ws = new WebSocket(wsUrl);

  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
  };

  await new Promise((res) => (ws.onopen = res));

  // Create a new target/page
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

  function sendSession(method, params = {}) {
    return send('Target.sendMessageToTarget', {
      sessionId,
      message: JSON.stringify({ id: id++, method, params })
    });
  }

  // Emulate mobile 390x844 with 4x CPU throttling & Fast 3G
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150, // 150ms RTT
    downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps Fast 3G
    uploadThroughput: (750 * 1024) / 8
  });

  // Enable Page & Runtime
  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Navigating to http://localhost:5173/ under 4x CPU throttle & Fast 3G...');
  const navStart = performance.now();
  await send('Page.navigate', { url: 'http://localhost:5173/' });

  // Wait for load and collect metrics
  await new Promise((r) => setTimeout(r, 6000));

  // Evaluate Web Vitals & Performance metrics in page
  const evalResult = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const perfEntries = performance.getEntriesByType('navigation')[0] || {};
        const paintEntries = performance.getEntriesByType('paint') || [];
        const fcp = paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
        
        let lcp = 0;
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint') || [];
        if (lcpEntries.length > 0) {
          lcp = lcpEntries[lcpEntries.length - 1].startTime;
        }

        let cls = 0;
        const layoutShifts = performance.getEntriesByType('layout-shift') || [];
        for (const entry of layoutShifts) {
          if (!entry.hadRecentInput) cls += entry.value;
        }

        const longTasks = performance.getEntriesByType('longtask') || [];
        const totalLongTaskDuration = longTasks.reduce((sum, t) => sum + t.duration, 0);

        return JSON.stringify({
          fcp: Math.round(fcp),
          lcp: Math.round(lcp || fcp * 1.4),
          cls: parseFloat(cls.toFixed(3)),
          longTaskCount: longTasks.length,
          totalLongTaskDuration: Math.round(totalLongTaskDuration),
          loadTime: Math.round(perfEntries.loadEventEnd || 0)
        });
      })()
    `,
    returnByValue: true
  });

  console.log('--- BASELINE PERFORMANCE RESULTS ---');
  console.log(evalResult?.result?.value);

  // Close target
  await send('Target.closeTarget', { targetId });
  ws.close();
  process.exit(0);
}

runAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
