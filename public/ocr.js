// ocr.js
export async function recognizeText(offscreenCanvas, ocrWorker) {
  // 1) Preprocess (contrast, threshold, blur, etc.)—and feel free to
  //    pull these into helper functions if they get big.
  const ctx = offscreenCanvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  const px = imgData.data;
  for (let i = 0; i < px.length; i += 4) {
    const luma = px[i]*0.3 + px[i+1]*0.59 + px[i+2]*0.11;
    const b = luma > 150 ? 255 : 0;
    px[i] = px[i+1] = px[i+2] = b;
  }
  ctx.putImageData(imgData, 0, 0);

  // 2) OCR
  const { data: { text } } = await ocrWorker.recognize(offscreenCanvas);
  return text.trim();
}