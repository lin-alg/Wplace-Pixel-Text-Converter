// 64-color palette, index 0 is Transparent
const PALETTE = [
  {name:'Transparent', rgb:[0,0,0,0]}, // 0 transparent
  [0,0,0], [60,60,60], [120,120,120], [210,210,210], [255,255,255],
  [96,0,24], [237,28,36], [255,127,39], [246,170,9], [249,221,59], [255,250,188],
  [14,185,104], [19,230,123], [135,255,94], [12,129,110], [16,174,166], [19,225,190],
  [40,80,158], [64,147,228], [96,247,242], [107,80,246], [153,177,251], [120,12,153],
  [170,56,185], [224,159,249], [203,0,122], [236,31,128], [243,141,169], [104,70,52],
  [149,104,42], [248,178,119], [170,170,170], [145,14,30], [250,128,114], [228,92,26],
  [214,181,148], [156,132,49], [197,173,49], [232,212,95], [74,107,58], [90,148,74],
  [132,197,115], [15,121,159], [187,250,242], [125,199,255], [77,49,184], [74,66,132],
  [122,113,196], [181,174,241], [219,164,99], [209,128,81], [255,197,165], [155,82,73],
  [209,128,120], [250,182,164], [123,99,82], [156,132,107], [51,57,65], [109,117,141],
  [179,185,209], [109,100,63], [148,140,107], [205,197,158]
];

// Normalize palette
const PAL = PALETTE.map((p,i)=>{
  if (i===0) return {r:0,g:0,b:0,a:0,name:'Transparent'};
  const obj = Array.isArray(p) ? {r:p[0],g:p[1],b:p[2],a:255} : p;
  obj.name = obj.name || `Color ${i}`;
  return obj;
});

// helpers
function colorDist(c1, c2){ const dr=c1.r-c2.r, dg=c1.g-c2.g, db=c1.b-c2.b; return dr*dr+dg*dg+db*db; }
function findNearestPaletteColor(rgb){ let best=1e12, idx=1; for (let i=1;i<PAL.length;i++){ const p=PAL[i]; const d=colorDist(rgb,p); if (d<best){best=d; idx=i;} } return {index:idx, color:PAL[idx]}; }
function getCanvasBoundingBox(canvas, ctx) {
    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) return { x: 0, y: 0, w: 0, h: 0 };

    const data = ctx.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            // 检查 Alpha 通道 (idx + 3)。使用 alpha > 10 来避免抗锯齿边缘被错误忽略。
            if (data[idx + 3] > 10) { 
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
                found = true;
            }
        }
    }

    if (!found) return { x: 0, y: 0, w: 0, h: 0 };

    const boxW = maxX - minX + 1;
    const boxH = maxY - minY + 1;
    return { x: minX, y: minY, w: boxW, h: boxH };
}

// DOM
const el = id => document.getElementById(id);
const textInput = el('textInput');
const fontFamily = el('fontFamily');
const fontSize = el('fontSize');
const fontWeight = el('fontWeight');
const fontStyle = el('fontStyle');
const pixelSize = el('pixelSize');
const thresholdInput = el('threshold'); // 确保获取了 threshold 元素
const canvasW = el('canvasW');
const canvasH = el('canvasH');
const previewCanvas = el('previewCanvas');
const renderBtn = el('renderBtn');
const downloadBtn = el('downloadBtn');
const resetBtn = el('resetBtn');
const artEffect = el('artEffect');
const bgMode = el('bgMode');
const canvasWrap = el('canvasWrap');

const previewFont = el('previewFont');
const previewEffectA = el('previewEffectA');
const previewEffectB = el('previewEffectB');
const previewBg = el('previewBg');
const labelEffectA = el('labelEffectA');
const labelEffectB = el('labelEffectB');
const labelFont = el('labelFont');

let offscreenCanvas = document.createElement('canvas');
let offCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
let ctx = previewCanvas.getContext('2d');

// state
const STATE = { fontIdx: 19, effectAIdx: 21, effectBIdx: 11, bgIdx: 5 };
let modalOpenFor = 'font';
let activeTab = 'free';

// UI Helpers
function refreshEffectLabels() {
  const mode = artEffect.value;
  let fontEnabled = true, aEnabled = true, bEnabled = true;
  let labelFontText = '字体色';
  let labelAText = '效果色 A';
  let labelBText = '效果色 B';

  if (mode === 'none') {
    labelAText = '效果色 A（无效果）'; labelBText = '效果色 B（无效果）'; aEnabled = false; bEnabled = false;
  } else if (mode === 'shadow') {
    labelAText = '投影色'; labelBText = '无效'; bEnabled = false;
  } else if (mode === 'outline') {
    labelAText = '描边色 外'; labelBText = '描边色 内';
  } else if (mode === 'gradient') {
    labelAText = '渐变色 A'; labelBText = '渐变色 B'; fontEnabled = false; labelFontText = '字体色（无效）';
  }

  if (labelFont) labelFont.textContent = labelFontText;
  labelEffectA.textContent = labelAText;
  labelEffectB.textContent = labelBText;

  previewFont.style.opacity = fontEnabled ? '1' : '0.45';
  previewEffectA.style.opacity = aEnabled ? '1' : '0.45';
  previewEffectB.style.opacity = bEnabled ? '1' : '0.45';
}

function updatePreviews(){
  const apply = (el, idx) => {
    if (!el) return;
    if (idx===0) el.style.background = 'repeating-linear-gradient(45deg,#eee 0 6px,#ccc 6px 12px)';
    else el.style.background = `rgb(${PAL[idx].r},${PAL[idx].g},${PAL[idx].b})`;
  };
  apply(previewFont, STATE.fontIdx);
  apply(previewEffectA, STATE.effectAIdx);
  apply(previewEffectB, STATE.effectBIdx);
  apply(previewBg, STATE.bgIdx);
}

// 绘制超高分辨率的源文本
// **[修改]** 接受 userFontSize 参数
function drawSourceText(scaleFactor, userFontSize){
  const baseW = parseInt(canvasW.value,10);
  const baseH = parseInt(canvasH.value,10);
  
  const w = baseW * scaleFactor;
  const h = baseH * scaleFactor;

  offscreenCanvas.width = w; 
  offscreenCanvas.height = h;
  const sctx = offCtx;
  
  sctx.clearRect(0,0,w,h);
  
  // **[修改]** 使用传入的 userFontSize
  // const baseSize = parseInt(fontSize.value,10); // 原代码
  const scaledSize = userFontSize * scaleFactor; // 保证等比放大，且放大后的字号足够大

  const weight = fontWeight.value || '400';
  const style = fontStyle.value || 'normal';
  const family = fontFamily.value || 'Dingmao Pixel';
  
  sctx.textBaseline = 'top';
  sctx.textAlign = 'left';
  sctx.font = `${style} normal ${weight} ${scaledSize}px ${family}`;

  const text = textInput.value || '';
  const x = 0;
  const y = 0;

  const fontC = PAL[STATE.fontIdx];
  const effA = PAL[STATE.effectAIdx];
  const effB = PAL[STATE.effectBIdx];
  const fontColorStr = fontC && fontC.a===0 ? 'rgba(0,0,0,0)' : `rgb(${fontC.r},${fontC.g},${fontC.b})`;

  if (artEffect.value === 'shadow'){
    const sc = effA && effA.a===0 ? 'rgba(0,0,0,0)' : `rgb(${effA.r},${effA.g},${effA.b})`;
    const blur = scaledSize * 0.08;
    const off = scaledSize * 0.05;
    sctx.save();
    sctx.shadowColor = sc;
    sctx.shadowBlur = blur;
    sctx.shadowOffsetX = off;
    sctx.shadowOffsetY = off;
    sctx.fillStyle = fontColorStr;
    sctx.fillText(text, x, y);
    sctx.restore();
  } else if (artEffect.value === 'outline'){
    const outer = effA && effA.a===0 ? '#000000' : `rgb(${effA.r},${effA.g},${effA.b})`;
    const inner = effB && effB.a===0 ? fontColorStr : `rgb(${effB.r},${effB.g},${effB.b})`;
    sctx.lineWidth = Math.max(2 * scaleFactor, scaledSize*0.06);
    sctx.strokeStyle = outer;
    sctx.strokeText(text, x, y);
    sctx.fillStyle = inner;
    sctx.fillText(text, x, y);
  } else if (artEffect.value === 'gradient'){
    const a = effA || {r:0,g:0,b:0};
    const b = effB || {r:255,g:255,b:255};
    const grd = sctx.createLinearGradient(0, y - scaledSize/2, 0, y + scaledSize/2);
    grd.addColorStop(0, `rgb(${a.r},${a.g},${a.b})`);
    grd.addColorStop(1, `rgb(${b.r},${b.g},${b.b})`);
    sctx.fillStyle = grd;
    sctx.fillText(text, x, y);
  } else {
    sctx.fillStyle = fontColorStr;
    sctx.fillText(text, x, y);
  }
}

function renderPixelArt() {
  const userFontSize = parseInt(fontSize.value, 10);
  const targetW      = parseInt(canvasW.value, 10);
  const targetH      = parseInt(canvasH.value, 10);
  const pSize        = parseInt(pixelSize.value, 10);
  const currentFontFamily = fontFamily.value; // **[新增]** 获取当前字体

  // 用户手动输入的密度阈值（0.01~1.00），你原来的滑块
  const manualDensityThreshold = thresholdInput && thresholdInput.value 
    ? parseFloat(thresholdInput.value) 
    : 0.5;

  // ====================== 3000px 暴力超采样（或点阵字优化） ======================
  const BASE_FONT_SIZE = 50;                      // 基准字号，用于固定倍率
  const ULTRA_TARGET = 3000;                      // 目标字体高度 ≈3000px
  const HARD_MAX = 16384;                         // 浏览器单边安全上限

  let scaleFactor;
  let finalDensityThreshold;

  // **[新增逻辑]** 丁卯点阵体和小字号的特殊处理：强制放大到字号 >= 100，并固定阈值为 0.1
  if (currentFontFamily === 'Dingmao Pixel' && userFontSize < 100) {
    // 1. 乘以最小整数倍让它大于等于 100
    let scaleOverride = Math.ceil(100 / userFontSize);
    scaleFactor = Math.max(2, scaleOverride); // 确保至少是 2 倍
    
    // 2. 固定二值化阈值为 0.1 (覆盖率阈值)
    finalDensityThreshold = 0.1;
    
  } else {
    // 默认的 3000px 暴力超采样逻辑
    scaleFactor = Math.floor(ULTRA_TARGET / BASE_FONT_SIZE); 
    finalDensityThreshold = manualDensityThreshold; // 使用用户输入的阈值
  }
  
  // HARD_MAX 限制必须应用于两种情况
  scaleFactor = Math.min(scaleFactor,
    Math.floor(HARD_MAX / Math.max(targetW, 1)),
    Math.floor(HARD_MAX / Math.max(targetH, 1))
  );
  scaleFactor = Math.max(2, scaleFactor);         // 保证至少 2 倍，整数倍

  // **[修改]** 传入 userFontSize
  drawSourceText(scaleFactor, userFontSize);

  // ====================== 目标画布 & 背景 ======================
  previewCanvas.width  = targetW;
  previewCanvas.height = targetH;
  ctx.clearRect(0, 0, targetW, targetH);

  if (bgMode.value === 'checker') {
    const s = 16;
    for (let y = 0; y < targetH; y += s)
      for (let x = 0; x < targetW; x += s)
        ctx.fillStyle = ((x/s + y/s) % 2 === 0) ? '#f0f6ff22' : '#d8e6ff22',
        ctx.fillRect(x, y, s, s);
  } else if (bgMode.value === 'solid') {
    const c = PAL[STATE.bgIdx];
    ctx.fillStyle = c && c.a === 0 ? 'transparent' : `rgb(${c.r},${c.g},${c.b})`;
    ctx.fillRect(0, 0, targetW, targetH);
  }

  // ====================== 暴力全采样（步长1 + alpha≥128） ======================
  const srcW = offscreenCanvas.width;
  const srcH = offscreenCanvas.height;
  const srcData = offCtx.getImageData(0, 0, srcW, srcH).data;

  const blockSize = pSize * scaleFactor;          // 完美整数

  for (let ty = 0; ty < targetH; ty += pSize) {
    for (let tx = 0; tx < targetW; tx += pSize) {
      const sx = tx * scaleFactor;                // 整数
      const sy = ty * scaleFactor;                // 整数

      let solidCount = 0;          // alpha ≥ 128 的像素数
      let totalCount = 0;
      let rSum = 0, gSum = 0, bSum = 0;

      const maxY = Math.min(sy + blockSize, srcH);
      const maxX = Math.min(sx + blockSize, srcW);

      for (let iy = sy; iy < maxY; iy++) {
        const rowOffset = iy * srcW;
        for (let ix = sx; ix < maxX; ix++) {
          const idx = (rowOffset + ix) * 4;
          const a = srcData[idx + 3];

          totalCount++;

          if (a >= 128) {                    // 固定透明度硬阈值 250
            solidCount++;
            rSum += srcData[idx];
            gSum += srcData[idx + 1];
            bSum += srcData[idx + 2];
          }
        }
      }

      if (totalCount === 0) continue;

      const coverage = solidCount / totalCount;   // 密度 0~1

      // **[修改]** 使用 finalDensityThreshold
      // 用户手动控制的阈值决定是否绘制这个像素块
      if (coverage >= finalDensityThreshold) {
        let finalIdx = STATE.fontIdx;
        if (solidCount > 0) {
          const avgR = Math.round(rSum / solidCount);
          const avgG = Math.round(gSum / solidCount);
          const avgB = Math.round(bSum / solidCount);
          finalIdx = findNearestPaletteColor({r: avgR, g: avgG, b: avgB}).index;
        }

        const c = PAL[finalIdx];
        if (c.a !== 0) {
          ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
          ctx.fillRect(tx, ty, pSize, pSize);
        }
      }
    }
  }

  fitPreviewCanvasToContainer();
}

function fitPreviewCanvasToContainer(){
  if (!previewCanvas || !canvasWrap) return;
  const cw = Math.max(1, canvasWrap.clientWidth - 8);
  const ch = Math.max(1, canvasWrap.clientHeight - 8);
  const w = previewCanvas.width || 1;
  const h = previewCanvas.height || 1;
  const scale = Math.min(cw / w, ch / h);
  previewCanvas.style.width = `${Math.max(1, Math.floor(w * scale))}px`;
  previewCanvas.style.height = `${Math.max(1, Math.floor(h * scale))}px`;
  previewCanvas.style.imageRendering = 'pixelated';
}

// debounce
let debounceTimer = null;
function renderPixelArtDebounced(){ clearTimeout(debounceTimer); debounceTimer = setTimeout(()=> renderPixelArt(), 150); }

// Event Listeners
renderBtn.addEventListener('click', ()=> renderPixelArt());
downloadBtn.addEventListener('click', ()=>{
  renderPixelArt();
  const w = previewCanvas.width, h = previewCanvas.height;
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const octx = out.getContext('2d');
  if (bgMode.value === 'solid'){
    const c = PAL[STATE.bgIdx]; octx.fillStyle = c && c.a===0 ? 'rgba(0,0,0,0)' : `rgb(${c.r},${c.g},${c.b})`; octx.fillRect(0,0,w,h);
  } else if (bgMode.value === 'checker'){
    const s = 16;
    for (let y=0;y<h;y+=s){ for (let x=0;x<w;x+=s){ octx.fillStyle = ((x/s+y/s)%2===0) ? '#f0f6ff22' : '#d8e6ff22'; octx.fillRect(x,y,s,s); } }
  }
  octx.drawImage(previewCanvas,0,0);
  const link = document.createElement('a'); link.download = `pixel-text-${Date.now()}.png`; link.href = out.toDataURL('image/png'); link.click();
});

resetBtn.addEventListener('click', ()=>{
  textInput.value = '你好 Hello';
  fontFamily.value = 'Dingmao Pixel';
  fontSize.value = 8;
  fontWeight.value = 400;
  fontStyle.value = 'normal';
  pixelSize.value = 1;
  thresholdInput.value = 0.5; 
  canvasW.value = 35;
  canvasH.value = 8;
  artEffect.value = 'none';
  bgMode.value = 'transparent';
  STATE.fontIdx = 19; STATE.effectAIdx = 21; STATE.effectBIdx = 11; STATE.bgIdx = 5;
  refreshEffectLabels();
  updatePreviews();
  renderPixelArt();
});

// Modal Logic
const modal = el('paletteModal');
const modalPalette = el('modalPalette');
const closeModal = el('closeModal');
const tabBtns = document.querySelectorAll('.tabBtn');

function paidStart(){ return 32; }
function range(a,b){ const out=[]; for (let i=a;i<=b;i++) out.push(i); return out; }

function renderModalPalette(){
  modalPalette.innerHTML = '';
  const indices = (activeTab === 'paid') ? range(paidStart(), PALETTE.length-1) : range(1, paidStart()-1);
  indices.forEach(i=>{
    const p = PAL[i]; if (!p) return;
    const btn = document.createElement('button');
    btn.className = 'mSwatch';
    btn.type = 'button';
    btn.dataset.index = i;
    btn.title = `${i}: ${p.name}`;
    btn.style.background = p.a===0 ? 'linear-gradient(45deg,#eee 0%, #ccc 100%)' : `rgb(${p.r},${p.g},${p.b})`;
    btn.addEventListener('click', ()=> { assignPaletteIndexToTarget(parseInt(btn.dataset.index,10)); closePalette(); });
    modalPalette.appendChild(btn);
  });
}

function openPalette(target){
  modalOpenFor = target;
  activeTab = 'free';
  tabBtns.forEach(b=>b.classList.toggle('active', b.dataset.tab===activeTab));
  renderModalPalette();
  modal.classList.remove('hidden');
}
function closePalette(){ modal.classList.add('hidden'); }
function assignPaletteIndexToTarget(idx){
  if (modalOpenFor === 'font') STATE.fontIdx = idx;
  else if (modalOpenFor === 'effectA') STATE.effectAIdx = idx;
  else if (modalOpenFor === 'effectB') STATE.effectBIdx = idx;
  else if (modalOpenFor === 'bg') STATE.bgIdx = idx;
  updatePreviews();
  renderPixelArtDebounced();
}

// Wiring
Array.from(document.getElementsByClassName('pickerBtn')).forEach(btn=> btn.addEventListener('click', ()=> openPalette(btn.dataset.target)));
closeModal.addEventListener('click', closePalette);
modal.querySelector('.modalBackdrop').addEventListener('click', closePalette);
Array.from(tabBtns).forEach(b=>{
  b.addEventListener('click', ()=> {
    tabBtns.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    activeTab = b.dataset.tab;
    renderModalPalette();
  });
});

// Live Updates: 这里必须包含 threshold
['fontFamily','fontSize','fontWeight','fontStyle','pixelSize','threshold','canvasW','canvasH','bgMode'].forEach(id=>{
  const node = el(id);
  if (node) node.addEventListener('input', ()=> renderPixelArtDebounced());
});
textInput.addEventListener('input', ()=> renderPixelArtDebounced());
artEffect.addEventListener('change', ()=>{ refreshEffectLabels(); renderPixelArtDebounced(); });
window.addEventListener('resize', fitPreviewCanvasToContainer);

// Init
refreshEffectLabels();
updatePreviews();
window.addEventListener('load', () => {
  renderBtn.click();
});
renderBtn.click();