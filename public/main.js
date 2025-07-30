const video  = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d', { willReadFrequently: true });

const ocrHistory = [];
const MAX_HISTORY = 60;   // how many frames to remember

let ocrWorker;
let workerReady = false;

// 1) Create & initialize the Tesseract worker once
(async () => {
  ocrWorker = await Tesseract.createWorker('eng', 1, {
    logger: m => console.log('OCR:', m),
  });
  await ocrWorker.setParameters({
    tessedit_char_whitelist: 'BCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz',
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE
  })
  workerReady = true;
  console.log('Tesseract worker ready');
})();

/**
 * OCR a rectangular region of interest (ROI) from a canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {{ x:number, y:number, width:number, height:number }} roi
 * @param {Tesseract.Worker} worker
 * @returns {Promise<string>}
 */
async function parseCanvasROI(canvas, roi, worker) {
  const { x, y, width, height } = roi;
  const offscreen = document.createElement('canvas');
  offscreen.width  = width;
  offscreen.height = height;

  const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
  offCtx.drawImage(
    canvas,
    x, y, width, height,   // src
    0, 0, width, height    // dst
  );

  const { data: { text } } = await worker.recognize(offscreen);
  return text.trim();
}

// 2) Start camera
navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'environment', width: { ideal: 1280 } }
})
.then(stream => {
  video.srcObject = stream;
  video.play();
  video.addEventListener('loadedmetadata', () => {
    requestAnimationFrame(scanFrame);
  });
})
.catch(err => console.error('getUserMedia error:', err));

// 3) Scan loop: draw video, detect QR, draw ROI, then OCR it
async function scanFrame() {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) {
    return requestAnimationFrame(scanFrame);
  }

  // 1) Draw current video frame
  canvas.width  = w;
  canvas.height = h;
  ctx.drawImage(video, 0, 0, w, h);

  // 2) Detect QR code
  const imageData = ctx.getImageData(0, 0, w, h);
  const qr = jsQR(imageData.data, imageData.width, imageData.height);

  if (qr) {
    const { topLeftCorner: tl, topRightCorner: tr, bottomRightCorner: br, bottomLeftCorner: bl } = qr.location;

    // 3) Draw QR bounding box
    ctx.strokeStyle = 'red';
    ctx.lineWidth   = 4;
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.stroke();

    // 4) Compute unit vectors along QR and perpendicular downwards
    const dx = tr.x - tl.x, dy = tr.y - tl.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;      // along top edge
    const vx = -uy, vy = ux;                 // downwards

    // 5) Define padding and ROI origin at rotated bottom-left
    const padding = 10;
    const originX = bl.x + vx * padding - 20;
    const originY = bl.y + vy * padding;

    // 6) Define ROI size
    const w0 = len + 100;
    const h0 = Math.floor(w0 * 0.25);

    // 7) Draw the rotated ROI on‐screen
    const angle = Math.atan2(uy, ux);
    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(angle);
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth   = 4;
    ctx.strokeRect(0, 0, w0, h0);
    ctx.restore();

    // 8) OCR the rotated ROI
    if (workerReady) {
      const offscreen = document.createElement('canvas');
      offscreen.width  = w0;
      offscreen.height = h0;
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });

      offCtx.save();
      offCtx.translate(w0 / 2, h0 / 2);
      offCtx.rotate(angle);
      offCtx.drawImage(
        canvas,
        originX, originY, w0, h0,     // source
        -w0 / 2, -h0 / 2, w0, h0      // destination, centered
      );
      offCtx.restore();

      try {
        const { data: { text } } = await ocrWorker.recognize(offscreen);
        const ocrText = text.trim();
        if (ocrText && ocrText.length > 9) {
          // push & cap history
          ocrHistory.push(ocrText);
          if (ocrHistory.length > MAX_HISTORY) ocrHistory.shift();
          // tally frequencies
          const freq = ocrHistory.reduce((m, t) => {
            m[t] = (m[t]||0) + 1;
            return m;
          }, {});
          // pick the entry with the highest count
          const best = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
          document.getElementById('ocrText').textContent = best;
        }
        if (ocrText && ocrText.length > 8) {
          console.log('OCR text:', ocrText);
          // socket.emit('code', ocrText);
          document.getElementById('ocrText').textContent = ocrText;
        }
      } catch (err) {
        console.error('OCR error:', err);
      }
    }
  }

  // 9) Loop
  requestAnimationFrame(scanFrame);
}


// (Optional) clean up on page unload
window.addEventListener('beforeunload', async () => {
  if (workerReady) await ocrWorker.terminate();
});
