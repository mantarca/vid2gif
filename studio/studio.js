// studio.js - Screen Recording, Canvas Processing, Timeline Trim/Cut & GIF Encoding Engine
import { GIFEncoder, quantize, applyPalette } from '../lib/gifenc.esm.js';

// DOM Panels
const panelSetup = document.getElementById('panelSetup');
const panelRecording = document.getElementById('panelRecording');
const panelEditor = document.getElementById('panelEditor');
const panelEncoding = document.getElementById('panelEncoding');
const panelResult = document.getElementById('panelResult');

const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');

// Setup Controls
const studioFps = document.getElementById('studioFps');
const studioWidth = document.getElementById('studioWidth');
const studioColors = document.getElementById('studioColors');
const studioDuration = document.getElementById('studioDuration');
const btnStartCapture = document.getElementById('btnStartCapture');

// Recording Controls & Monitor
const liveVideo = document.getElementById('liveVideo');
const videoOverlayPaused = document.getElementById('videoOverlayPaused');
const recordingTimer = document.getElementById('recordingTimer');
const liveFrameCount = document.getElementById('liveFrameCount');
const liveResolution = document.getElementById('liveResolution');
const liveFps = document.getElementById('liveFps');

const btnStopRecording = document.getElementById('btnStopRecording');
const btnPauseResume = document.getElementById('btnPauseResume');
const pauseIcon = document.getElementById('pauseIcon');
const pauseBtnText = document.getElementById('pauseBtnText');
const btnCancelRecording = document.getElementById('btnCancelRecording');

// Editor Controls & Monitor
const editorCanvas = document.getElementById('editorCanvas');
const editorCtx = editorCanvas.getContext('2d', { willReadFrequently: true });
const timelineSlider = document.getElementById('timelineSlider');
const btnEditorPrevFrame = document.getElementById('btnEditorPrevFrame');
const btnEditorPlayPause = document.getElementById('btnEditorPlayPause');
const editorPlayIcon = document.getElementById('editorPlayIcon');
const btnEditorNextFrame = document.getElementById('btnEditorNextFrame');

const editorCurrentFrameDisplay = document.getElementById('editorCurrentFrameDisplay');
const editorCurrentTimeDisplay = document.getElementById('editorCurrentTimeDisplay');
const editorRemainingDisplay = document.getElementById('editorRemainingDisplay');

const btnTrimStart = document.getElementById('btnTrimStart');
const btnTrimEnd = document.getElementById('btnTrimEnd');
const btnMarkCutStart = document.getElementById('btnMarkCutStart');
const btnMarkCutEnd = document.getElementById('btnMarkCutEnd');
const lblCutStart = document.getElementById('lblCutStart');
const lblCutEnd = document.getElementById('lblCutEnd');
const btnExecuteMiddleCut = document.getElementById('btnExecuteMiddleCut');
const middleCutLog = document.getElementById('middleCutLog');
const btnResetCuts = document.getElementById('btnResetCuts');
const btnDiscardToNew = document.getElementById('btnDiscardToNew');
const btnStartEncodingFromEditor = document.getElementById('btnStartEncodingFromEditor');

// Encoding UI
const progressBarFill = document.getElementById('progressBarFill');
const progressPercent = document.getElementById('progressPercent');
const progressDetails = document.getElementById('progressDetails');

// Result UI
const resultGifImage = document.getElementById('resultGifImage');
const infoFileSize = document.getElementById('infoFileSize');
const infoResolution = document.getElementById('infoResolution');
const infoDuration = document.getElementById('infoDuration');
const infoFrames = document.getElementById('infoFrames');
const infoFps = document.getElementById('infoFps');
const fileNameInput = document.getElementById('fileNameInput');
const btnDownloadGif = document.getElementById('btnDownloadGif');
const btnCopyClipboard = document.getElementById('btnCopyClipboard');
const copyToast = document.getElementById('copyToast');
const btnBackToEditor = document.getElementById('btnBackToEditor');
const btnRecordAgain = document.getElementById('btnRecordAgain');

// Processing Canvas (hidden)
const offscreenCanvas = document.getElementById('offscreenCanvas');
const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

// Recording & Frame State
let currentStream = null;
let captureIntervalId = null;
let timerIntervalId = null;
let isRecording = false;
let isPaused = false;
let startTime = 0;
let pausedElapsed = 0;
let pauseStart = 0;

let targetWidth = 800;
let targetHeight = 450;
let fps = 10;
let colorCount = 256;
let maxDurationSec = 0;

// Frames storage
let originalRecordedFrames = []; // Original raw frames
let activeFrames = [];           // Current edited frames sequence

// Editor State
let currentPreviewIndex = 0;
let isPlayingPreview = false;
let previewTimerId = null;
let cutStartMark = null;
let cutEndMark = null;
let cutLogs = [];

// Output GIF
let currentGifBlob = null;
let currentGifUrl = null;

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved preferences
  try {
    const stored = await chrome.storage.local.get(['fps', 'widthPreset', 'colors', 'maxDuration']);
    if (stored.fps) studioFps.value = stored.fps;
    if (stored.widthPreset !== undefined) studioWidth.value = stored.widthPreset;
    if (stored.colors) studioColors.value = stored.colors;
    if (stored.maxDuration !== undefined) studioDuration.value = stored.maxDuration;
  } catch (err) {
    console.warn('Ayarlar yüklenirken hata:', err);
  }

  // Check URL parameters for autostart
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('autostart') === '1') {
    startCapture();
  }

  // Setup Event Listeners
  btnStartCapture.addEventListener('click', startCapture);
  btnStopRecording.addEventListener('click', stopRecording);
  btnPauseResume.addEventListener('click', togglePause);
  btnCancelRecording.addEventListener('click', cancelRecording);

  // Editor Events
  timelineSlider.addEventListener('input', onTimelineInput);
  btnEditorPlayPause.addEventListener('click', toggleEditorPlayback);
  btnEditorPrevFrame.addEventListener('click', stepPrevFrame);
  btnEditorNextFrame.addEventListener('click', stepNextFrame);

  btnTrimStart.addEventListener('click', handleTrimStart);
  btnTrimEnd.addEventListener('click', handleTrimEnd);
  btnMarkCutStart.addEventListener('click', handleMarkCutStart);
  btnMarkCutEnd.addEventListener('click', handleMarkCutEnd);
  btnExecuteMiddleCut.addEventListener('click', handleExecuteMiddleCut);
  btnResetCuts.addEventListener('click', handleResetCuts);
  btnDiscardToNew.addEventListener('click', resetToSetup);
  btnStartEncodingFromEditor.addEventListener('click', startEncodingActiveFrames);

  // Result Events
  btnBackToEditor.addEventListener('click', () => {
    setAppState('EDITOR');
    renderEditorFrame(currentPreviewIndex);
  });
  btnRecordAgain.addEventListener('click', resetToSetup);
  btnDownloadGif.addEventListener('click', downloadGif);
  btnCopyClipboard.addEventListener('click', copyGifToClipboard);

  // Auto-save Settings
  studioFps.addEventListener('change', saveSettings);
  studioWidth.addEventListener('change', saveSettings);
  studioColors.addEventListener('change', saveSettings);
  studioDuration.addEventListener('change', saveSettings);
});

function saveSettings() {
  chrome.storage.local.set({
    fps: parseInt(studioFps.value, 10),
    widthPreset: parseInt(studioWidth.value, 10),
    colors: parseInt(studioColors.value, 10),
    maxDuration: parseInt(studioDuration.value, 10)
  });
}

function setAppState(state) {
  panelSetup.classList.remove('active');
  panelRecording.classList.remove('active');
  panelEditor.classList.remove('active');
  panelEncoding.classList.remove('active');
  panelResult.classList.remove('active');

  statusBadge.className = 'status-badge';

  switch (state) {
    case 'SETUP':
      panelSetup.classList.add('active');
      statusBadge.classList.add('status-ready');
      statusText.textContent = 'Kayıt İçin Hazır';
      break;

    case 'RECORDING':
      panelRecording.classList.add('active');
      statusBadge.classList.add('status-recording');
      statusText.textContent = 'Canlı Kaydediliyor...';
      break;

    case 'EDITOR':
      panelEditor.classList.add('active');
      statusBadge.classList.add('status-editing');
      statusText.textContent = 'Kayıt Düzenleniyor';
      break;

    case 'ENCODING':
      panelEncoding.classList.add('active');
      statusBadge.classList.add('status-encoding');
      statusText.textContent = 'GIF İşleniyor...';
      break;

    case 'RESULT':
      panelResult.classList.add('active');
      statusBadge.classList.add('status-ready');
      statusText.textContent = 'GIF Hazır';
      break;
  }
}

// Helpers
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatTimecode(milliseconds) {
  const totalSeconds = milliseconds / 1000;
  const mins = Math.floor(totalSeconds / 60);
  const secs = (totalSeconds % 60).toFixed(1);
  return `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ==========================================
// 1. CAPTURE LOGIC
// ==========================================
async function startCapture() {
  fps = parseInt(studioFps.value, 10);
  const widthPreset = parseInt(studioWidth.value, 10);
  colorCount = parseInt(studioColors.value, 10);
  maxDurationSec = parseInt(studioDuration.value, 10);

  saveSettings();

  try {
    currentStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'monitor',
        cursor: 'always'
      },
      audio: false
    });
  } catch (err) {
    console.warn('Ekran yakalama izni verilmedi veya kullanıcı iptal etti:', err);
    return;
  }

  // Handle native "Stop Sharing" floating button
  const videoTrack = currentStream.getVideoTracks()[0];
  videoTrack.onended = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  liveVideo.srcObject = currentStream;
  await liveVideo.play();

  // Determine actual dimensions
  const originalWidth = liveVideo.videoWidth || 1920;
  const originalHeight = liveVideo.videoHeight || 1080;

  if (widthPreset > 0 && originalWidth > widthPreset) {
    targetWidth = widthPreset;
    targetHeight = Math.round(widthPreset * (originalHeight / originalWidth));
  } else {
    targetWidth = originalWidth;
    targetHeight = originalHeight;
  }

  // Ensure even dimensions
  targetWidth = targetWidth & ~1;
  targetHeight = targetHeight & ~1;

  offscreenCanvas.width = targetWidth;
  offscreenCanvas.height = targetHeight;

  editorCanvas.width = targetWidth;
  editorCanvas.height = targetHeight;

  // Live Stats
  liveResolution.textContent = `${targetWidth} × ${targetHeight}`;
  liveFps.textContent = `${fps} FPS`;
  liveFrameCount.textContent = '0';
  recordingTimer.textContent = '00:00';

  originalRecordedFrames = [];
  activeFrames = [];
  isRecording = true;
  isPaused = false;
  pausedElapsed = 0;
  startTime = performance.now();

  setAppState('RECORDING');

  // Capture loop
  const frameIntervalMs = 1000 / fps;

  captureIntervalId = setInterval(() => {
    if (!isRecording || isPaused) return;

    try {
      offscreenCtx.drawImage(liveVideo, 0, 0, targetWidth, targetHeight);
      const imgData = offscreenCtx.getImageData(0, 0, targetWidth, targetHeight);
      originalRecordedFrames.push(new Uint8Array(imgData.data));
      liveFrameCount.textContent = originalRecordedFrames.length;
    } catch (e) {
      console.error('Kare yakalama hatası:', e);
    }
  }, frameIntervalMs);

  // Timer Tick
  timerIntervalId = setInterval(() => {
    if (!isRecording || isPaused) return;

    const elapsedMs = performance.now() - startTime - pausedElapsed;
    const elapsedSec = Math.floor(elapsedMs / 1000);
    recordingTimer.textContent = formatTime(elapsedSec);

    if (maxDurationSec > 0 && elapsedSec >= maxDurationSec) {
      stopRecording();
    }
  }, 250);
}

function togglePause() {
  if (!isRecording) return;

  isPaused = !isPaused;

  if (isPaused) {
    pauseStart = performance.now();
    videoOverlayPaused.classList.remove('hidden');
    pauseBtnText.textContent = 'Devam Et';
    pauseIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    statusText.textContent = 'Kayıt Duraklatıldı';
  } else {
    pausedElapsed += performance.now() - pauseStart;
    videoOverlayPaused.classList.add('hidden');
    pauseBtnText.textContent = 'Duraklat';
    pauseIcon.innerHTML = '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
    statusText.textContent = 'Canlı Kaydediliyor...';
  }
}

function cancelRecording() {
  cleanUpCapture();
  originalRecordedFrames = [];
  activeFrames = [];
  setAppState('SETUP');
}

function stopRecording() {
  if (!isRecording) return;
  isRecording = false;

  cleanUpCapture();

  if (originalRecordedFrames.length === 0) {
    alert('Hiçbir kare kaydedilemedi. Lütfen tekrar deneyin.');
    setAppState('SETUP');
    return;
  }

  // Populate active frames
  activeFrames = [...originalRecordedFrames];
  currentPreviewIndex = 0;
  cutStartMark = null;
  cutEndMark = null;
  cutLogs = [];

  setupEditor();
}

function cleanUpCapture() {
  clearInterval(captureIntervalId);
  clearInterval(timerIntervalId);
  captureIntervalId = null;
  timerIntervalId = null;

  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  if (liveVideo.srcObject) {
    liveVideo.srcObject = null;
  }
}

// ==========================================
// 2. TIMELINE & TRIM EDITOR LOGIC
// ==========================================
function setupEditor() {
  timelineSlider.min = 0;
  timelineSlider.max = activeFrames.length - 1;
  timelineSlider.value = 0;

  updateCutMarksUI();
  updateEditorStats();
  renderEditorFrame(0);

  setAppState('EDITOR');
}

function renderEditorFrame(index) {
  if (!activeFrames || activeFrames.length === 0) return;
  if (index < 0) index = 0;
  if (index >= activeFrames.length) index = activeFrames.length - 1;

  currentPreviewIndex = index;
  timelineSlider.value = index;

  const rawBytes = activeFrames[index];
  const clampedData = new Uint8ClampedArray(rawBytes.buffer);
  const imgData = new ImageData(clampedData, targetWidth, targetHeight);
  editorCtx.putImageData(imgData, 0, 0);

  // Update Displays
  editorCurrentFrameDisplay.textContent = `Kare: ${index + 1} / ${activeFrames.length}`;
  const timeMs = index * (1000 / fps);
  editorCurrentTimeDisplay.textContent = formatTimecode(timeMs);
}

function updateEditorStats() {
  const origCount = originalRecordedFrames.length;
  const currentCount = activeFrames.length;
  const origSec = (origCount / fps).toFixed(1);
  const currentSec = (currentCount / fps).toFixed(1);

  if (origCount === currentCount) {
    editorRemainingDisplay.textContent = `${currentCount} kare (${currentSec}s)`;
  } else {
    const diff = origCount - currentCount;
    editorRemainingDisplay.textContent = `${currentCount} kare (${currentSec}s) [${diff} kare kesildi]`;
  }
}

function onTimelineInput(e) {
  pauseEditorPlayback();
  const index = parseInt(e.target.value, 10);
  renderEditorFrame(index);
}

function stepPrevFrame() {
  pauseEditorPlayback();
  if (currentPreviewIndex > 0) {
    renderEditorFrame(currentPreviewIndex - 1);
  }
}

function stepNextFrame() {
  pauseEditorPlayback();
  if (currentPreviewIndex < activeFrames.length - 1) {
    renderEditorFrame(currentPreviewIndex + 1);
  }
}

function toggleEditorPlayback() {
  if (isPlayingPreview) {
    pauseEditorPlayback();
  } else {
    startEditorPlayback();
  }
}

function startEditorPlayback() {
  if (activeFrames.length <= 1) return;
  isPlayingPreview = true;
  editorPlayIcon.innerHTML = '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';

  const frameIntervalMs = 1000 / fps;
  previewTimerId = setInterval(() => {
    let nextIndex = currentPreviewIndex + 1;
    if (nextIndex >= activeFrames.length) {
      nextIndex = 0; // Loop playback
    }
    renderEditorFrame(nextIndex);
  }, frameIntervalMs);
}

function pauseEditorPlayback() {
  if (!isPlayingPreview) return;
  isPlayingPreview = false;
  clearInterval(previewTimerId);
  previewTimerId = null;
  editorPlayIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
}

// 2.1 Baştan Kırp (Trim Start)
function handleTrimStart() {
  pauseEditorPlayback();
  if (currentPreviewIndex <= 0) {
    alert('Zaten en baştaki karedesiniz. Kırpmak için zaman çubuğunda ileri bir kareye gelin.');
    return;
  }

  const removedCount = currentPreviewIndex;
  activeFrames = activeFrames.slice(currentPreviewIndex);
  timelineSlider.max = activeFrames.length - 1;
  currentPreviewIndex = 0;

  cutLogs.push(`Baştan ${removedCount} kare kesilip atıldı.`);
  cutStartMark = null;
  cutEndMark = null;

  updateCutMarksUI();
  updateEditorStats();
  renderEditorFrame(0);
}

// 2.2 Sondan Kırp (Trim End)
function handleTrimEnd() {
  pauseEditorPlayback();
  if (currentPreviewIndex >= activeFrames.length - 1) {
    alert('Zaten en sondaki karedesiniz. Kırpmak için zaman çubuğunda daha önceki bir kareye gelin.');
    return;
  }

  const removedCount = activeFrames.length - 1 - currentPreviewIndex;
  activeFrames = activeFrames.slice(0, currentPreviewIndex + 1);
  timelineSlider.max = activeFrames.length - 1;

  cutLogs.push(`Sondan ${removedCount} kare kesilip atıldı.`);
  cutStartMark = null;
  cutEndMark = null;

  updateCutMarksUI();
  updateEditorStats();
  renderEditorFrame(currentPreviewIndex);
}

// 2.3 Ortadan Kesim (Cut Middle Range)
function handleMarkCutStart() {
  cutStartMark = currentPreviewIndex;
  updateCutMarksUI();
}

function handleMarkCutEnd() {
  cutEndMark = currentPreviewIndex;
  updateCutMarksUI();
}

function updateCutMarksUI() {
  if (cutStartMark !== null) {
    lblCutStart.textContent = `Kare ${cutStartMark + 1}`;
  } else {
    lblCutStart.textContent = 'Seçilmedi';
  }

  if (cutEndMark !== null) {
    lblCutEnd.textContent = `Kare ${cutEndMark + 1}`;
  } else {
    lblCutEnd.textContent = 'Seçilmedi';
  }

  const canCut = (cutStartMark !== null && cutEndMark !== null && cutStartMark !== cutEndMark);
  btnExecuteMiddleCut.disabled = !canCut;

  if (cutLogs.length > 0) {
    middleCutLog.innerHTML = cutLogs.map(l => `<div>• ${l}</div>`).join('');
  } else {
    middleCutLog.textContent = 'Henüz ortadan bir aralık kesilmedi.';
  }
}

function handleExecuteMiddleCut() {
  pauseEditorPlayback();
  if (cutStartMark === null || cutEndMark === null || cutStartMark === cutEndMark) return;

  const start = Math.min(cutStartMark, cutEndMark);
  const end = Math.max(cutStartMark, cutEndMark);
  const removeCount = end - start + 1;

  if (removeCount >= activeFrames.length) {
    alert('Tüm kareleri silemezsiniz! Lütfen daha dar bir aralık seçin.');
    return;
  }

  // Remove the range from activeFrames
  activeFrames.splice(start, removeCount);
  timelineSlider.max = activeFrames.length - 1;

  cutLogs.push(`Kare ${start + 1} ile ${end + 1} arası (${removeCount} kare) kesilip çıkarıldı.`);

  cutStartMark = null;
  cutEndMark = null;
  updateCutMarksUI();
  updateEditorStats();

  currentPreviewIndex = Math.min(start, activeFrames.length - 1);
  renderEditorFrame(currentPreviewIndex);
}

// 2.4 Sıfırla (Reset Cuts)
function handleResetCuts() {
  pauseEditorPlayback();
  activeFrames = [...originalRecordedFrames];
  currentPreviewIndex = 0;
  cutStartMark = null;
  cutEndMark = null;
  cutLogs = [];

  setupEditor();
}

// ==========================================
// 3. GIF ENCODING LOGIC
// ==========================================
async function startEncodingActiveFrames() {
  pauseEditorPlayback();

  if (!activeFrames || activeFrames.length === 0) {
    alert('GIF oluşturmak için en az bir kare bulunmalıdır.');
    return;
  }

  setAppState('ENCODING');
  await encodeGif(activeFrames);
}

async function encodeGif(framesToEncode) {
  const totalFrames = framesToEncode.length;
  const frameDelay = Math.round(1000 / fps);

  progressBarFill.style.width = '0%';
  progressPercent.textContent = '0%';
  progressDetails.textContent = `Toplam ${totalFrames} kare hazırlanıyor...`;

  const gif = GIFEncoder();

  // Yield to DOM
  await new Promise(r => setTimeout(r, 60));

  for (let i = 0; i < totalFrames; i++) {
    const frameData = framesToEncode[i];

    // Quantize and apply palette
    const palette = quantize(frameData, colorCount);
    const indexed = applyPalette(frameData, palette);

    gif.writeFrame(indexed, targetWidth, targetHeight, {
      palette: palette,
      delay: frameDelay,
      repeat: 0 // Loop indefinitely
    });

    // Update Progress
    const percent = Math.round(((i + 1) / totalFrames) * 100);
    progressBarFill.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    progressDetails.textContent = `Kare ${i + 1} / ${totalFrames} işlendi...`;

    // Periodically yield to prevent UI freeze
    if (i % 2 === 0 || i === totalFrames - 1) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  progressDetails.textContent = 'GIF paketi sonlandırılıyor...';
  await new Promise(r => setTimeout(r, 50));

  gif.finish();
  const bytes = gif.bytesView();

  if (currentGifUrl) {
    URL.revokeObjectURL(currentGifUrl);
  }

  currentGifBlob = new Blob([bytes], { type: 'image/gif' });
  currentGifUrl = URL.createObjectURL(currentGifBlob);

  // Set Default Filename
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  fileNameInput.value = `vid2gif-${dateStr}-${timeStr}`;

  // Populate Result Details
  const durationSec = (totalFrames / fps).toFixed(1);
  resultGifImage.src = currentGifUrl;
  infoFileSize.textContent = formatBytes(currentGifBlob.size);
  infoResolution.textContent = `${targetWidth} × ${targetHeight} px`;
  infoDuration.textContent = `${durationSec} sn`;
  infoFrames.textContent = totalFrames;
  infoFps.textContent = `${fps} FPS`;

  setAppState('RESULT');
}

// ==========================================
// 4. EXPORT / DOWNLOAD / CLIPBOARD
// ==========================================
function downloadGif() {
  if (!currentGifBlob) return;

  let filename = fileNameInput.value.trim() || 'ekran-kaydi';
  if (!filename.toLowerCase().endsWith('.gif')) {
    filename += '.gif';
  }

  if (chrome.downloads && chrome.downloads.download) {
    chrome.downloads.download({
      url: currentGifUrl,
      filename: filename,
      saveAs: true
    });
  } else {
    const a = document.createElement('a');
    a.href = currentGifUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

async function copyGifToClipboard() {
  if (!currentGifBlob) return;

  try {
    const item = new ClipboardItem({ 'image/gif': currentGifBlob });
    await navigator.clipboard.write([item]);
    showToast('✓ GIF panoya başarıyla kopyalandı!');
  } catch (err) {
    console.warn('GIF panoya kopyalanamadı:', err);
    showToast('⚠️ Tarayıcı GIF panoya yazmayı desteklemiyor. Lütfen "GIF İndir" butonunu kullanın.');
  }
}

function showToast(message) {
  copyToast.textContent = message;
  copyToast.classList.remove('hidden');
  setTimeout(() => {
    copyToast.classList.add('hidden');
  }, 4000);
}

function resetToSetup() {
  pauseEditorPlayback();
  cleanUpCapture();
  originalRecordedFrames = [];
  activeFrames = [];
  cutLogs = [];
  setAppState('SETUP');
}
