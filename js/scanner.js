let html5QrCode = null;

export async function startScanner(elementId, onResult) {
  if (!elementId) throw new Error('Element ID required');
  if (typeof Html5Qrcode === 'undefined') {
    throw new Error('QR scanner library not loaded');
  }

  html5QrCode = new Html5Qrcode(elementId);
  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  };

  await html5QrCode.start(
    { facingMode: 'environment' },
    config,
    onResult,
    () => {}
  );

  return html5QrCode;
}

export function stopScanner() {
  if (html5QrCode) {
    html5QrCode.stop().catch(() => {});
    html5QrCode = null;
  }
}

export function handleScanResult(decodedText) {
  stopScanner();
  const text = (decodedText || '').trim();

  const resultEl = document.getElementById('scanResult');
  if (!resultEl) return;

  if (text && text.length === 36) {
    resultEl.innerHTML = `
      <div class="toast toast-success">
        <i class="bi bi-check-circle" aria-hidden="true"></i>
        Found! Redirecting...
      </div>`;
    setTimeout(() => {
      window.location.href = `member.html?id=${encodeURIComponent(text)}`;
    }, 500);
  } else {
    resultEl.innerHTML = `
      <div class="toast toast-error">
        <i class="bi bi-exclamation-circle" aria-hidden="true"></i>
        Invalid QR code. Expected a member ID.
      </div>`;
  }
}
