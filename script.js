// 64-color palette, index 0 is Transparent
const PALETTE = [
  {name:'Transparent', rgb:[0,0,0,0]}, // 0 transparent
  [0,0,0], [60,60,60], [120,120,120], [210,210,210], [255,255,255],
  [96,0,24], [237,28,36], [255,127,39], [246,170,9], [249,221,59], [255,250,188],
  [14,185,104], [19,230,123], [135,255,94], [12,129,110], [16,174,166], [19,225,190],
  [40,80,158], [64,147,228], [96,247,242], [107,80,246], [153,177,251], [120,12,153],
  [170,56,185], [224,159,249], [203,0,122], [236,31,128], [243,141,169], [104,70,52],
  [149,104,42], [248,178,119], [170,170,170], [165,14,30], [250,128,114], [228,92,26],
  [214,181,148], [156,132,49], [197,173,49], [232,212,95], [74,107,58], [90,148,74],
  [132,197,115], [15,121,159], [187,250,242], [125,199,255], [77,49,184], [74,66,132],
  [122,113,196], [181,174,241], [219,164,99], [209,128,81], [255,197,165], [155,82,73],
  [209,128,120], [250,182,164], [123,99,82], [156,132,107], [51,57,65], [109,117,141],
  [179,185,209], [109,100,63], [148,140,107], [205,197,158]
];

// single list of friendly names (0..63) without RGB text
const COLOR_NAMES = {
  0: 'Transparent',
  1: 'Black',
  2: 'Dark Gray',
  3: 'Gray',
  4: 'Light Gray',
  5: 'White',
  6: 'Deep Red',
  7: 'Red',
  8: 'Orange',
  9: 'Gold',
  10: 'Yellow',
  11: 'Light Yellow',
  12: 'Dark Green',
  13: 'Green',
  14: 'Light Green',
  15: 'Dark Teal',
  16: 'Teal',
  17: 'Light Teal',
  18: 'Dark Blue',
  19: 'Blue',
  20: 'Cyan',
  21: 'Indigo',
  22: 'Light Indigo',
  23: 'Dark Purple',
  24: 'Purple',
  25: 'Light Purple',
  26: 'Dark Pink',
  27: 'Pink',
  28: 'Light Pink',
  29: 'Dark Brown',
  30: 'Brown',
  31: 'Beige',
  32: 'Medium Gray',
  33: 'Dark Red (paid)',
  34: 'Light Red (paid)',
  35: 'Dark Orange (paid)',
  36: 'Light Tan (paid)',
  37: 'Dark Goldenrod (paid)',
  38: 'Goldenrod (paid)',
  39: 'Light Goldenrod (paid)',
  40: 'Dark Olive (paid)',
  41: 'Olive (paid)',
  42: 'Light Olive (paid)',
  43: 'Dark Cyan (paid)',
  44: 'Light Cyan (paid)',
  45: 'Light Blue (paid)',
  46: 'Dark Indigo (paid)',
  47: 'Dark Slate Blue (paid)',
  48: 'Slate Blue (paid)',
  49: 'Light Slate Blue (paid)',
  50: 'Light Brown (paid)',
  51: 'Dark Beige (paid)',
  52: 'Light Beige (paid)',
  53: 'Dark Peach (paid)',
  54: 'Peach (paid)',
  55: 'Light Peach (paid)',
  56: 'Dark Tan (paid)',
  57: 'Tan (paid)',
  58: 'Dark Slate (paid)',
  59: 'Slate (paid)',
  60: 'Light Slate (paid)',
  61: 'Dark Stone (paid)',
  62: 'Stone (paid)',
  63: 'Light Stone (paid)'
};

// Normalize palette into objects with r,g,b,a,name
const PAL = PALETTE.map((p,i)=>{
  if (i===0) return {r:0,g:0,b:0,a:0,name:COLOR_NAMES[0] || 'Transparent'};
  const obj = Array.isArray(p) ? {r:p[0],g:p[1],b:p[2],a:255} : p;
  obj.name = obj.name || COLOR_NAMES[i] || `Color ${i}`;
  return obj;
});

// helpers
function colorDist(c1, c2){ const dr=c1.r-c2.r, dg=c1.g-c2.g, db=c1.b-c2.b; return dr*dr+dg*dg+db*db; }
function findNearestPaletteColor(rgb){ let best=1e12, idx=1; for (let i=1;i<PAL.length;i++){ const p=PAL[i]; const d=colorDist(rgb,p); if (d<best){best=d; idx=i;} } return {index:idx, color:PAL[idx]}; }

// DOM
const el = id => document.getElementById(id);
const textInput = el('textInput');
const fontFamily = el('fontFamily');
const fontSize = el('fontSize');
const fontWeight = el('fontWeight');
const fontStyle = el('fontStyle');
const pixelSize = el('pixelSize');
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

const modal = el('paletteModal');
const modalPalette = el('modalPalette');
const closeModal = el('closeModal');
const tabBtns = Array.from(document.getElementsByClassName('tabBtn'));

let offscreenCanvas = document.createElement('canvas');
let offCtx = offscreenCanvas.getContext('2d');
let ctx = previewCanvas.getContext('2d');

// state: chosen palette indices
const STATE = {
  fontIdx: 21,
  effectAIdx: 21,
  effectBIdx: 11,
  bgIdx: 5
};

let modalOpenFor = 'font';
let activeTab = 'free';

// update labels depending on artEffect mode
function refreshEffectLabels() {
  const mode = artEffect.value;
  // 默认启用所有
  let fontEnabled = true, aEnabled = true, bEnabled = true;
  let labelFontText = '字体色';
  let labelAText = '效果色 A';
  let labelBText = '效果色 B';

  if (mode === 'none') {
    labelAText = '效果色 A（无效果下无效）';
    labelBText = '效果色 B（无效果下无效）';
    aEnabled = false;
    bEnabled = false;
  } else if (mode === 'shadow') {
    labelAText = '投影色';
    labelBText = '效果色 B（投影模式下无效）';
    bEnabled = false;
  } else if (mode === 'outline') {
    labelAText = '描边色 外';
    labelBText = '描边色 内';
    // outline 模式下 inner 可能使用 fontColor 作为 fallback，但 UI 应保持 font 启用或根据实际调整
  } else if (mode === 'gradient') {
    labelAText = '渐变色 A';
    labelBText = '渐变色 B';
    fontEnabled = false; // gradient 忽略 fontColor
    labelFontText = '字体色（渐变模式下无效）';
  }

  labelFont.textContent = labelFontText;
  labelEffectA.textContent = labelAText;
  labelEffectB.textContent = labelBText;

  // 应用样式
  previewFont.style.opacity = fontEnabled ? '1' : '0.45';
  previewFont.style.pointerEvents = fontEnabled ? 'auto' : 'none';
  previewEffectA.style.opacity = aEnabled ? '1' : '0.45';
  previewEffectA.style.pointerEvents = aEnabled ? 'auto' : 'none';
  previewEffectB.style.opacity = bEnabled ? '1' : '0.45';
  previewEffectB.style.pointerEvents = bEnabled ? 'auto' : 'none';
}

// update small preview swatches
function updatePreviews(){
  const apply = (el, idx) => {
    if (!el) return;
    if (idx===0) el.style.background = 'repeating-linear-gradient(45deg,#eee 0 6px,#ccc 6px 12px)';
    else el.style.background = `rgb(${PAL[idx].r},${PAL[idx].g},${PAL[idx].b})`;
    // tooltip shows friendly name
    el.title = PAL[idx] && PAL[idx].name ? PAL[idx].name : `Color ${idx}`;
  };
  apply(previewFont, STATE.fontIdx);
  apply(previewEffectA, STATE.effectAIdx);
  apply(previewEffectB, STATE.effectBIdx);
  apply(previewBg, STATE.bgIdx);
}

// palette modal: render indices by activeTab
function range(a,b){ const out=[]; for (let i=a;i<=b;i++) out.push(i); return out; }
function paidStart(){ return 32; } // paid colors start at index 32

function renderModalPalette(){
  modalPalette.innerHTML = '';
  const indices = (activeTab === 'paid') ? range(paidStart(), PALETTE.length-1) : range(1, paidStart()-1);
  indices.forEach(i=>{
    const p = PAL[i];
    if (!p) return;
    const btn = document.createElement('button');
    btn.className = 'mSwatch';
    btn.type = 'button';
    btn.dataset.index = i;
    btn.title = `${i}: ${p.name || `Color ${i}`}`;
    btn.style.background = p.a===0 ? 'linear-gradient(45deg,#eee 0%, #ccc 100%)' : `rgb(${p.r},${p.g},${p.b})`;
    btn.addEventListener('click', ()=> {
      assignPaletteIndexToTarget(parseInt(btn.dataset.index,10));
      closePalette();
    });
    modalPalette.appendChild(btn);
  });
}

// open / close modal
function openPalette(target){
  modalOpenFor = target;
  activeTab = 'free';
  tabBtns.forEach(b=>b.classList.toggle('active', b.dataset.tab===activeTab));
  renderModalPalette();
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  closeModal.focus();
}
function closePalette(){ modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }

// assign chosen palette idx to the button that opened modal
function assignPaletteIndexToTarget(idx){
  const t = modalOpenFor;
  if (t === 'font') STATE.fontIdx = idx;
  else if (t === 'effectA') STATE.effectAIdx = idx;
  else if (t === 'effectB') STATE.effectBIdx = idx;
  else if (t === 'bg') STATE.bgIdx = idx;
  updatePreviews();

  // If in shadow mode, render immediately so shadow color change is visible right away
  if (artEffect.value === 'shadow') {
    renderPixelArt();
  } else {
    renderPixelArtDebounced();
  }
}

// wire picker buttons to open modal
Array.from(document.getElementsByClassName('pickerBtn')).forEach(btn=>{
  btn.addEventListener('click', ()=> {
    const target = btn.dataset.target;
    openPalette(target);
  });
});

// modal controls
closeModal.addEventListener('click', closePalette);
modal.querySelector('.modalBackdrop').addEventListener('click', closePalette);
document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closePalette(); });
Array.from(tabBtns).forEach(b=>{
  b.addEventListener('click', ()=> {
    tabBtns.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    activeTab = b.dataset.tab;
    renderModalPalette();
  });
});

// drawing pipeline
function drawSourceText(){
  const w = Math.max(64, Math.min(5000, parseInt(canvasW.value,10)));
  const h = Math.max(64, Math.min(5000, parseInt(canvasH.value,10)));
  offscreenCanvas.width = w; offscreenCanvas.height = h;
  const sctx = offCtx;
  sctx.clearRect(0,0,w,h);

  // background on source canvas (full-res)
  if (bgMode.value === 'checker'){
    const s = 16;
    for (let y=0;y<h;y+=s){
      for (let x=0;x<w;x+=s){
        sctx.fillStyle = ((x/s+y/s)%2===0) ? '#e6eef833' : '#cbd9e633';
        sctx.fillRect(x,y,s,s);
      }
    }
  } else if (bgMode.value === 'solid'){
    const c = PAL[STATE.bgIdx];
    sctx.fillStyle = c && c.a===0 ? 'rgba(0,0,0,0)' : `rgb(${c.r},${c.g},${c.b})`;
    sctx.fillRect(0,0,w,h);
  } else {
    sctx.clearRect(0,0,w,h);
  }

  const size = Math.max(8, Math.min(2000, parseInt(fontSize.value,10)));
  const weight = fontWeight.value || '400';
  const style = fontStyle.value || 'normal';
  const family = fontFamily.value || 'Arial';
  sctx.textBaseline = 'middle';
  sctx.textAlign = 'center';
  sctx.font = `${style} normal ${weight} ${size}px ${family}`;

  const text = textInput.value || '';
  const x = w/2;
  const y = h/2;

  const fontC = PAL[STATE.fontIdx];
  const effA = PAL[STATE.effectAIdx];
  const effB = PAL[STATE.effectBIdx];

  const fontColorStr = fontC && fontC.a===0 ? 'rgba(0,0,0,0)' : `rgb(${fontC.r},${fontC.g},${fontC.b})`;

  if (artEffect.value === 'shadow'){
  // 只使用 effectA 作为阴影色，忽略 effectB
  const sc = effA && effA.a===0 ? 'rgba(0,0,0,0)' : `rgb(${effA.r},${effA.g},${effA.b})`;
  const blur = size * 0.08
  const off = size * 0.05
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
    sctx.lineWidth = Math.max(2, size*0.06);
    sctx.strokeStyle = outer;
    sctx.strokeText(text, x, y);
    sctx.fillStyle = inner;
    sctx.fillText(text, x, y);
  } else if (artEffect.value === 'gradient'){
    const a = effA || {r:0,g:0,b:0};
    const b = effB || {r:255,g:255,b:255};
    const grd = sctx.createLinearGradient(0,0,w,0);
    grd.addColorStop(0, `rgb(${a.r},${a.g},${a.b})`);
    grd.addColorStop(1, `rgb(${b.r},${b.g},${b.b})`);
    sctx.fillStyle = grd;
    sctx.fillText(text, x, y);
  } else {
    sctx.fillStyle = fontColorStr;
    sctx.fillText(text, x, y);
  }
}

function fitPreviewCanvasToContainer(){
  if (!previewCanvas || !canvasWrap) return;
  const cw = Math.max(1, canvasWrap.clientWidth - 8);
  const ch = Math.max(1, canvasWrap.clientHeight - 8);
  const w = previewCanvas.width || 1;
  const h = previewCanvas.height || 1;
  const scale = Math.min(cw / w, ch / h);
  const displayW = Math.max(1, Math.floor(w * scale));
  const displayH = Math.max(1, Math.floor(h * scale));
  previewCanvas.style.width = `${displayW}px`;
  previewCanvas.style.height = `${displayH}px`;
  previewCanvas.style.imageRendering = 'pixelated';
}

function renderPixelArt(){
  drawSourceText();

  const w = offscreenCanvas.width;
  const h = offscreenCanvas.height;
  const step = Math.max(1, parseInt(pixelSize.value,10));
  const src = offCtx.getImageData(0,0,w,h).data;

  previewCanvas.width = w;
  previewCanvas.height = h;
  ctx.clearRect(0,0,w,h);

  if (bgMode.value === 'checker'){
    const s = 16;
    for (let y=0;y<h;y+=s){
      for (let x=0;x<w;x+=s){
        ctx.fillStyle = ((x/s+y/s)%2===0) ? '#f0f6ff22' : '#d8e6ff22';
        ctx.fillRect(x,y,s,s);
      }
    }
  } else if (bgMode.value === 'solid'){
    const c = PAL[STATE.bgIdx];
    ctx.fillStyle = c && c.a===0 ? 'rgba(0,0,0,0)' : `rgb(${c.r},${c.g},${c.b})`;
    ctx.fillRect(0,0,w,h);
  }

  for (let by=0; by<h; by+=step){
    for (let bx=0; bx<w; bx+=step){
      let r=0,g=0,b=0,a=0,count=0;
      for (let yy=by; yy<Math.min(h,by+step); yy++){
        for (let xx=bx; xx<Math.min(w,bx+step); xx++){
          const idx = (yy*w + xx)*4;
          const alpha = src[idx+3];
          if (alpha===0) continue;
          r+=src[idx]; g+=src[idx+1]; b+=src[idx+2]; a+=alpha; count++;
        }
      }
      if (count===0) continue;
      const avgR = Math.round(r/count);
      const avgG = Math.round(g/count);
      const avgB = Math.round(b/count);
      const avgA = a / count;
      if (avgA < 32) continue;  // Threshold to ignore faint anti-aliased pixels for sharper pixel art
      const rgb = { r: avgR, g: avgG, b: avgB };
      const nearest = findNearestPaletteColor(rgb);
      if (nearest.index === 0) continue;
      ctx.fillStyle = `rgb(${nearest.color.r},${nearest.color.g},${nearest.color.b})`;
      ctx.fillRect(bx, by, step, step);
    }
  }

  fitPreviewCanvasToContainer();
}

// debounce
let debounceTimer = null;
function renderPixelArtDebounced(){ clearTimeout(debounceTimer); debounceTimer = setTimeout(()=> renderPixelArt(), 220); }

// button handling
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
  textInput.value = '像素 字示例 你好';
  fontFamily.value = 'Arial';
  fontSize.value = 120;
  fontWeight.value = 400;
  fontStyle.value = 'normal';
  pixelSize.value = 8;
  canvasW.value = 1200;
  canvasH.value = 400;
  artEffect.value = 'none';
  bgMode.value = 'transparent';
  STATE.fontIdx = 21; STATE.effectAIdx = 21; STATE.effectBIdx = 11; STATE.bgIdx = 5;
  refreshEffectLabels();
  updatePreviews();
  renderPixelArt();
});

// initialize UI
refreshEffectLabels();
updatePreviews();
renderPixelArt();

// picker wiring (single bindings)
Array.from(document.getElementsByClassName('pickerBtn')).forEach(btn=>{
  btn.addEventListener('click', ()=> {
    openPalette(btn.dataset.target);
  });
});

// modal wiring (single bindings)
closeModal.addEventListener('click', closePalette);
modal.querySelector('.modalBackdrop').addEventListener('click', closePalette);
document.addEventListener('keydown', (e)=> { if (e.key === 'Escape') closePalette(); });
Array.from(tabBtns).forEach(b=>{
  b.addEventListener('click', ()=> {
    tabBtns.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    activeTab = b.dataset.tab;
    renderModalPalette();
  });
});

// update labels and previews when effect changes
artEffect.addEventListener('change', ()=>{ refreshEffectLabels(); });

// live preview debounce on inputs
['fontFamily','fontSize','fontWeight','fontStyle','pixelSize','canvasW','canvasH','bgMode','artEffect'].forEach(id=>{
  const node = el(id);
  if (node) node.addEventListener('input', ()=> renderPixelArtDebounced());
});

// keyboard shortcut
textInput.addEventListener('keydown',(e)=>{ if ((e.ctrlKey||e.metaKey)&&e.key==='Enter'){ e.preventDefault(); renderPixelArt(); }});

// Window resize: refit preview to container
window.addEventListener('resize', ()=>{ fitPreviewCanvasToContainer(); });
