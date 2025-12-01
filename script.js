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

// ==========================================================
// 🎨 新增：RGB 字符串到颜色名称的映射表
// ==========================================================
const RGB_TO_NAME_MAP = {
    "0,0,0": "Black",
    "60,60,60": "Dark Gray",
    "120,120,120": "Gray",
    "210,210,210": "Light Gray",
    "255,255,255": "White",
    "96,0,24": "Deep Red",
    "237,28,36": "Red",
    "255,127,39": "Orange",
    "246,170,9": "Gold",
    "249,221,59": "Yellow",
    "255,250,188": "Light Yellow",
    "14,185,104": "Dark Green",
    "19,230,123": "Green",
    "135,255,94": "Light Green",
    "12,129,110": "Dark Teal",
    "16,174,166": "Teal",
    "19,225,190": "Light Teal",
    "40,80,158": "Dark Blue",
    "64,147,228": "Blue",
    "96,247,242": "Cyan",
    "107,80,246": "Indigo",
    "153,177,251": "Light Indigo",
    "120,12,153": "Dark Purple",
    "170,56,185": "Purple",
    "224,159,249": "Light Purple",
    "203,0,122": "Dark Pink",
    "236,31,128": "Pink",
    "243,141,169": "Light Pink",
    "104,70,52": "Dark Brown",
    "149,104,42": "Brown",
    "248,178,119": "Beige", // 248,178,119
    "170,170,170": "Medium Gray",
    "145,14,30": "Dark Red",
    "250,128,114": "Light Red",
    "228,92,26": "Dark Orange",
    "214,181,148": "Light Tan",
    "156,132,49": "Dark Goldenrod",
    "197,173,49": "Goldenrod",
    "232,212,95": "Light Goldenrod",
    "74,107,58": "Dark Olive",
    "90,148,74": "Olive",
    "132,197,115": "Light Olive",
    "15,121,159": "Dark Cyan",
    "187,250,242": "Light Cyan",
    "125,199,255": "Light Blue",
    "77,49,184": "Dark Indigo",
    "74,66,132": "Dark Slate Blue",
    "122,113,196": "Slate Blue",
    "181,174,241": "Light Slate Blue",
    "219,164,99": "Light Brown",
    "209,128,81": "Dark Beige",
    "255,197,165": "Light Beige",
    "155,82,73": "Dark Peach",
    "209,128,120": "Peach",
    "250,182,164": "Light Peach",
    "123,99,82": "Dark Tan",
    "156,132,107": "Tan",
    "51,57,65": "Dark Slate",
    "109,117,141": "Slate",
    "179,185,209": "Light Slate",
    "109,100,63": "Dark Stone",
    "148,140,107": "Stone",
    "205,197,158": "Light Stone"
};


// Normalize palette
// ==========================================================
// ✏️ 修改：使用 RGB_TO_NAME_MAP 查找正确的颜色名称
// ==========================================================
const PAL = PALETTE.map((p,i)=>{
  if (i===0) return {r:0,g:0,b:0,a:0,name:'Transparent'};
  
  // 确定 RGB 数组
  const rgbArray = Array.isArray(p) ? p : p.rgb;
  const r = rgbArray[0], g = rgbArray[1], b = rgbArray[2];
  
  // 构造查找键
  const rgbKey = `${r},${g},${b}`;
  
  // 查找名称，如果找不到，则使用默认的 Color X
  const name = RGB_TO_NAME_MAP[rgbKey] || `Color ${i}`;

  const obj = {r:r, g:g, b:b, a:255, name:name};
  
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

const writingMode = el('writingMode'); // <<< 新增：获取书写方向控制

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

// 绘制单行超高分辨率的源文本
// 接收要绘制的文本内容作为参数
// 添加了 isVertical 参数
function drawSourceText(scaleFactor, userFontSize, text, isVertical){ // <<< 新增 isVertical 参数
  // offscreenCanvas 尺寸由 renderPixelArt 确定并设置
  const w = offscreenCanvas.width;
  const h = offscreenCanvas.height;

  const sctx = offCtx;
  sctx.clearRect(0,0,w,h);
  
  const scaledSize = userFontSize * scaleFactor;

  const weight = fontWeight.value || '400';
  const style = fontStyle.value || 'normal';
  const family = fontFamily.value || 'Dingmao Pixel';
  
  // 文本绘制的基线设置为 'top'
  sctx.textBaseline = 'top'; 
  
  // 字体设置
  sctx.font = `${style} normal ${weight} ${scaledSize}px ${family}`;

  const x = 0;
  const y = 0;

  const fontC = PAL[STATE.fontIdx];
  const effA = PAL[STATE.effectAIdx];
  const effB = PAL[STATE.effectBIdx];
  const fontColorStr = fontC && fontC.a===0 ? 'rgba(0,0,0,0)' : `rgb(${fontC.r},${fontC.g},${fontC.b})`;
  
  const fillStyle = (artEffect.value === 'gradient') ?
    (function(){
      const a = effA || {r:0,g:0,b:0};
      const b = effB || {r:255,g:255,b:255};
      // 渐变色轴：水平模式下是单行高，垂直模式下是列的实际高度
      const gradientEnd = isVertical ? text.length * scaledSize : scaledSize;
      const grd = sctx.createLinearGradient(0, y, 0, y + gradientEnd);
      grd.addColorStop(0, `rgb(${a.r},${a.g},${a.b})`);
      grd.addColorStop(1, `rgb(${b.r},${b.g},${b.b})`);
      return grd;
    })() : fontColorStr;

  sctx.fillStyle = fillStyle;
  
  // ====================== 垂直书写模式逻辑 ======================
  if (isVertical) {
      sctx.textAlign = 'center'; // 垂直模式下，文本在列宽方向上居中对齐

      // 绘制每个字符
      Array.from(text).forEach((char, charIndex) => {
          // charX 是列宽方向的中心点
          const charX = w / 2;
          // charY 是垂直堆叠的起始位置
          const charY = y + charIndex * scaledSize;

          if (artEffect.value === 'shadow'){
              const sc = effA && effA.a===0 ? 'rgba(0,0,0,0)' : `rgb(${effA.r},${effA.g},${effA.b})`;
              const blur = scaledSize * 0.08;
              const off = scaledSize * 0.05;
              sctx.save();
              sctx.shadowColor = sc;
              sctx.shadowBlur = blur;
              sctx.shadowOffsetX = off;
              sctx.shadowOffsetY = off;
              sctx.fillText(char, charX, charY);
              sctx.restore();
          } else if (artEffect.value === 'outline'){
              const outer = effA && effA.a===0 ? '#000000' : `rgb(${effA.r},${effA.g},${effA.b})`;
              const inner = effB && effB.a===0 ? fontColorStr : `rgb(${effB.r},${effB.g},${effB.b})`;
              sctx.lineWidth = Math.max(2 * scaleFactor, scaledSize*0.06);
              sctx.strokeStyle = outer;
              sctx.strokeText(char, charX, charY);
              sctx.fillStyle = inner;
              sctx.fillText(char, charX, charY);
          } else {
              sctx.fillText(char, charX, charY);
          }
      });
      
  } else {
    // ====================== 水平书写模式逻辑 (保持原有) ======================
    sctx.textAlign = 'left';

    if (artEffect.value === 'shadow'){
      const sc = effA && effA.a===0 ? 'rgba(0,0,0,0)' : `rgb(${effA.r},${effA.g},${effA.b})`;
      const blur = scaledSize * 0.08;
      const off = scaledSize * 0.05;
      sctx.save();
      sctx.shadowColor = sc;
      sctx.shadowBlur = blur;
      sctx.shadowOffsetX = off;
      sctx.shadowOffsetY = off;
      sctx.fillText(text, x, y); // 使用传入的 text
      sctx.restore();
    } else if (artEffect.value === 'outline'){
      const outer = effA && effA.a===0 ? '#000000' : `rgb(${effA.r},${effA.g},${effA.b})`;
      const inner = effB && effB.a===0 ? fontColorStr : `rgb(${effB.r},${effB.g},${effB.b})`;
      sctx.lineWidth = Math.max(2 * scaleFactor, scaledSize*0.06);
      sctx.strokeStyle = outer;
      sctx.strokeText(text, x, y); // 使用传入的 text
      sctx.fillStyle = inner;
      sctx.fillText(text, x, y); // 使用传入的 text
    } else {
      sctx.fillText(text, x, y); // 使用传入的 text
    }
  }
}

// 渲染像素艺术：处理多行文本拼接 (新增竖排逻辑)
function renderPixelArt() {
  const userFontSize = parseInt(fontSize.value, 10);
  const targetUnitW  = parseInt(canvasW.value, 10); // 水平模式下是行宽，垂直模式下是列宽
  const targetUnitH  = parseInt(canvasH.value, 10); // 水平模式下是单行高，垂直模式下是单列高
  const pSize        = parseInt(pixelSize.value, 10) || 1;
  const currentFontFamily = fontFamily.value; 
  const isVertical = writingMode.value === 'vertical'; // <<< 获取书写方向

  // 分割文本
  const lines = (textInput.value || '').split('\n').filter(l => l.trim().length > 0); // 过滤空行
  const totalUnits = lines.length; // 水平模式下是总行数，垂直模式下是总列数

  // 用户手动输入的密度阈值
  const manualDensityThreshold = thresholdInput && thresholdInput.value 
    ? parseFloat(thresholdInput.value) 
    : 0.5;

  // ====================== 3000px 暴力超采样（或点阵字优化） ======================
  const BASE_FONT_SIZE = 50;
  const ULTRA_TARGET = 3000;
  const HARD_MAX = 16384;

  let scaleFactor;
  let finalDensityThreshold;

  // 丁卯点阵体和小字号的特殊处理
  if (currentFontFamily === 'Dingmao Pixel' && userFontSize < 100) {
    let scaleOverride = Math.ceil(100 / userFontSize);
    scaleFactor = Math.max(2, scaleOverride);
    finalDensityThreshold = 0.1;
  } else {
    // 默认的 3000px 暴力超采样逻辑
    scaleFactor = Math.floor(ULTRA_TARGET / BASE_FONT_SIZE); 
    finalDensityThreshold = manualDensityThreshold;
  }
  
  // HARD_MAX 限制
  scaleFactor = Math.min(scaleFactor,
    Math.floor(HARD_MAX / Math.max(targetUnitW, 1)),
    Math.floor(HARD_MAX / Math.max(targetUnitH, 1)) 
  );
  scaleFactor = Math.max(2, scaleFactor);

  // ====================== 1. 多行/列渲染和拼接 ======================
  const srcUnitW = targetUnitW * scaleFactor;
  const srcUnitH = targetUnitH * scaleFactor;

  let finalTargetW, finalTargetH; // 最终预览画布尺寸
  let fullSourceW, fullSourceH;   // 最终高分辨率源图尺寸
  let maxLineLength = 0;
  lines.forEach(line => maxLineLength = Math.max(maxLineLength, line.length));

  if (isVertical) {
      // 垂直模式: 
      // 最终画布的宽度是 (列数 * 列宽)
      finalTargetW = totalUnits * targetUnitW;
      
      // 最终高度应由最长列的字符数决定，并转换为像素高度，且不能小于用户设定的 targetUnitH
      const calculatedH = maxLineLength * userFontSize;
      finalTargetH = Math.max(targetUnitH, calculatedH);
      
      fullSourceW = finalTargetW * scaleFactor;
      fullSourceH = finalTargetH * scaleFactor;

  } else {
      // 水平模式: 
      // 最终画布的宽度是 (单行宽), 高度是 (行数 * 单行高)。
      finalTargetW = targetUnitW;
      finalTargetH = totalUnits * targetUnitH;
      fullSourceW = finalTargetW * scaleFactor;
      fullSourceH = finalTargetH * scaleFactor;
  }
  
  // 创建一个最终的高分辨率源画布来拼接每一行/列
  const fullSourceCanvas = document.createElement('canvas');
  fullSourceCanvas.width = fullSourceW;
  fullSourceCanvas.height = fullSourceH;
  const fullSourceCtx = fullSourceCanvas.getContext('2d', { willReadFrequently: true });

  // 循环绘制每一行/列并拼接
  lines.forEach((lineText, index) => {
      let currentSrcW = srcUnitW;
      let currentSrcH = srcUnitH;
      
      if (isVertical) {
          // 垂直模式: offscreenCanvas 的高度需要等于最终源图的高度
          currentSrcH = fullSourceH; 
          offscreenCanvas.width = currentSrcW;
          offscreenCanvas.height = currentSrcH;
      } else {
          // 水平模式: offscreenCanvas 尺寸为 [单行宽] x [单行高]
          offscreenCanvas.width = currentSrcW;
          offscreenCanvas.height = currentSrcH;
      }
      
      // 1a. 调用 drawSourceText 绘制当前行/列
      drawSourceText(scaleFactor, userFontSize, lineText, isVertical); 
      
      // 1b. 计算目标位置并复制到 fullSourceCanvas
      if (isVertical) {
          // 垂直模式: 从右到左 (RTL) 拼接列
          const destX = fullSourceW - (index + 1) * srcUnitW; // index=0 对应最右边的列
          const destY = 0; 
          
          // 复制 offscreenCanvas 的内容（一个垂直列）到 fullSourceCanvas
          fullSourceCtx.drawImage(offscreenCanvas, 0, 0, currentSrcW, currentSrcH, destX, destY, srcUnitW, fullSourceH);
          
      } else {
          // 水平模式: 从上到下 (TTB) 拼接行
          const destY = index * srcUnitH;
          fullSourceCtx.drawImage(offscreenCanvas, 0, 0, currentSrcW, currentSrcH, 0, destY, fullSourceW, srcUnitH);
      }
  });


  // ====================== 2. 目标画布 & 背景 (设置最终尺寸) ======================
  previewCanvas.width  = finalTargetW;
  previewCanvas.height = finalTargetH;
  ctx.clearRect(0, 0, finalTargetW, finalTargetH);

  if (bgMode.value === 'checker') {
    const s = 16;
    for (let y = 0; y < finalTargetH; y += s)
      for (let x = 0; x < finalTargetW; x += s)
        ctx.fillStyle = ((x/s + y/s) % 2 === 0) ? '#f0f6ff22' : '#d8e6ff22',
        ctx.fillRect(x, y, s, s);
  } else if (bgMode.value === 'solid') {
    const c = PAL[STATE.bgIdx];
    ctx.fillStyle = c && c.a === 0 ? 'transparent' : `rgb(${c.r},${c.g},${c.b})`;
    ctx.fillRect(0, 0, finalTargetW, finalTargetH);
  }

  // ====================== 3. 暴力全采样（基于拼接后的源图） ======================
  const finalSrcW = fullSourceCanvas.width;
  const finalSrcH = fullSourceCanvas.height;
  const finalSrcData = fullSourceCtx.getImageData(0, 0, finalSrcW, finalSrcH).data;

  const blockSize = pSize * scaleFactor;          // 完美整数

  // 循环遍历最终像素画布的区域
  for (let ty = 0; ty < finalTargetH; ty += pSize) {
    for (let tx = 0; tx < finalTargetW; tx += pSize) {
      const sx = tx * scaleFactor;                
      const sy = ty * scaleFactor;                

      let solidCount = 0;          // alpha ≥ 128 的像素数
      let totalCount = 0;
      let rSum = 0, gSum = 0, bSum = 0;

      const maxY = Math.min(sy + blockSize, finalSrcH);
      const maxX = Math.min(sx + blockSize, finalSrcW);

      // 在高分辨率源图上采样
      for (let iy = sy; iy < maxY; iy++) {
        const rowOffset = iy * finalSrcW;
        for (let ix = sx; ix < maxX; ix++) {
          const idx = (rowOffset + ix) * 4;
          const a = finalSrcData[idx + 3];

          totalCount++;

          if (a >= 128) {                    // 固定透明度硬阈值 128
            solidCount++;
            rSum += finalSrcData[idx];
            gSum += finalSrcData[idx + 1];
            bSum += finalSrcData[idx + 2];
          }
        }
      }

      if (totalCount === 0) continue;

      const coverage = solidCount / totalCount;   // 密度 0~1

      // 使用 finalDensityThreshold 决定是否绘制像素块
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
  textInput.value = ' Hello Wplace\
 你好 Wplace';
  fontFamily.value = 'Dingmao Pixel';
  fontSize.value = 8;
  fontWeight.value = 400;
  fontStyle.value = 'normal';
  pixelSize.value = 1;
  thresholdInput.value = 0.5; 
  canvasW.value = 45;
  canvasH.value = 8; // 重置时确保是单行/列高度
  artEffect.value = 'none';
  bgMode.value = 'transparent';
  writingMode.value = 'horizontal'; // <<< 新增重置
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
    // ✏️ 修改：在 title 中添加了颜色名称
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
['fontFamily','fontSize','fontWeight','fontStyle','pixelSize','threshold','canvasW','canvasH','bgMode', 'writingMode'].forEach(id=>{
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

const ALL_TRANSLATIONS = {
    // 侧栏 (Sidebar)
    "Wplace像素字转换器": "Wplace Pixel Text Converter",
    "使用 64 色画板，将任意文本转换为Wplace像素化艺术字并导出图片": "Use a 64-color palette to convert any text into Wplace pixel art and export as an image",
    "项目 GitHub 页面": "Github repo - Powered by linalg",
    "说明": "Instructions",
    "1. 点击任一颜色块打开画板；画板分「非付费色」与「付费色」。光标悬停显示颜色名称。": "1. Click any color button to open the palette; it is split into 'Free' and 'Paid' colors. Hover to see the color name.",
    "2. 丁卯点阵体的字号应设置为原字体大小加一的整倍数。比如丁卯点阵体（9px）的字体大小就要设置成10px的整倍数。": "2. The Dinkie Bitmap font size should be set to an integer multiple of the font's base size plus one. E.g., for the Dinkie Bitmap(9px), the size should be a multiple of 10px.",
    "3. 绘制模式分为横排和竖排。横排模式对应单行高和总宽，竖排模式对应单列宽和总高。": "3. The drawing mode has two options : horizontal and vertical. Horizontal mode corresponds to single row height and total column width; vertical mode corresponds to single column width and total row height.",
    "4. 绘制横排/竖排模式时，单行高/单列宽请设置为字号大小加2N。例如当字号为8时，单行高/单列宽的取值范围为8，10，12……": "4. When drawing in horizontal/vertical mode, single row height / column width should be set to font size plus 2N. For example, when font size is 8, the row height / column width should be 8, 10, 12, etc.",
    "5. 若字体样式不满足预期，请点击“渲染预览”按钮重新渲染。若有按钮被遮住，请用Ctrl+滚轮调整页面比例。": "5. If the font style is not as expected, adjust font and canvas size or click the 'Render Preview' button to re-render. If any button is obscured, use Ctrl + Scroll to adjust the page zoom.",

    // 主区 - 预览 (Main - Preview)
    "预览": "Preview",
    "使用画板 64 色映射输出像素艺术字": "Output pixel art using the 64-color palette mapping",
    "背景": "Background",
    "透明": "Transparent",
    "纯色": "Solid Color",
    "棋盘": "Checkerboard",

    // 主区 - 控件 (Main - Controls) - 标签 (Labels)
    "输入文字": "Input Text",
    "字体": "Font",
    "字号（px）": "Font Size (px)",
    "粗细": "Weight",
    "斜体": "Italic",
    "颗粒度（一个像素的大小）": "Granularity (Pixel Size)",
    "二值化阈值（控制字体精细度）": "Binarization Threshold (Fine-tune)",
    "数值越小笔画越粗，数值越大笔画越细": "Lower value for thicker strokes, higher value for thinner strokes", // Input title
    "书写方向": "Writing Mode",
    "（单列）宽（px）": "(Col) Width (px)",
    "（单行）高（px）": "(Row) Height (px)",
    "艺术字效果": "Art Effect",
    "字体色": "Font Color",
    "点击选择颜色": "Click to select color", // Button title
    "效果色 A": "Effect Color A",
    "效果色 B": "Effect Color B",
    
    // 主区 - 控件 (Main - Controls) - 按钮
    "渲染预览": "Render Preview",
    "导出 PNG": "Export PNG",
    "重置": "Reset",

    // 下拉菜单选项 (Select Options)
    'Arial（默认清晰）': 'Arial (Default Clear)',
    '微软雅黑（Win 默认）': 'Microsoft YaHei (Win Default)',
    '苹方 PingFang SC（macOS/iOS）': 'PingFang SC (macOS/iOS)',
    '思源黑体': 'Source Han Sans',
    '丁卯点阵体（7px）': 'Dinkie Bitmap (7px)',
    '丁卯点阵体（9px）': 'Dinkie Bitmap (9px)',
    '方正舒体': 'FZShuTi',
    '站酷快乐体': 'ZCOOL KuaiLe',
    '华文行楷': 'STXingkai',
    '楷体': 'KaiTi',
    '汇文明朝体（仿铅字印刷）': 'Huiwenmingchao (Printed)',
    '汉仪长美黑（上世纪字体）': 'HanYiChangMeiHeiJian (Vintage)',
    '方正小标宋': 'FangZheng XiaoBiaoSong',
    '仿宋_GB2312': 'Fangsong_GB2312',
    '毛体': 'Mao style',
    '衡水体': 'HengShui style',
    '中易宋体': 'SimSun',
    'Serif（衬线）': 'Serif',
    'Sans-Serif（无衬线）': 'Sans-Serif',
    '细': 'Light',
    '中': 'Medium',
    '粗': 'Bold',
    '厚重': 'Heavy',
    '否': 'No',
    '是': 'Yes',
    '水平 (从左往右)': 'Horizontal (LTR)',
    '垂直 (从右往左)': 'Vertical (RTL)',
    '无': 'None',
    '轮廓（描边）': 'Outline (Stroke)',
    '投影': 'Shadow',
    '渐变（两色）': 'Gradient (Two Colors)',
    
    // 弹窗 (Modal)
    "选择颜色": "Select Color",
    "关闭": "Close",
    "非付费色": "Free Colors",
    "付费色": "Paid Colors",
    "悬停查看颜色名称；点击选择并赋值到当前目标。": "Hover to see color name; click to select and assign to the target.",
    
    // 动态更新的颜色标签文字 (在 refreshEffectLabels 处被处理)
    '效果色 A（无效果）': 'Effect Color A (No Effect)',
    '效果色 B（无效果）': 'Effect Color B (No Effect)',
    '投影色': 'Shadow Color',
    '无效': 'N/A',
    '描边色 外': 'Outer Stroke',
    '描边色 内': 'Inner Stroke',
    '渐变色 A': 'Gradient A',
    '渐变色 B': 'Gradient B',
    '字体色（无效）': 'Font Color (N/A)',
};

// 2. 切换语言状态
let isEnglish = false;

// 3. 通用遍历函数：查找并替换文本
function findAndReplaceText(parentNode, toEnglish) {
    const map = ALL_TRANSLATIONS;
    const targetMap = toEnglish ? map : Object.fromEntries(
        Object.entries(map).map(([cn, en]) => [en, cn])
    );
    const sourceMap = toEnglish ? map : targetMap;

    function walk(node) {
        if (node.nodeType === 3) { // 文本节点
            let text = node.nodeValue.trim();
            if (text.length > 0) {
                // 排除语言切换按钮自身的文本
                if (node.parentNode && node.parentNode.id === 'langToggleBtn') {
                    return;
                }
                
                // 检查文本是否在源映射表中
                const sourceKeys = Object.keys(sourceMap);
                for (const key of sourceKeys) {
                    if (key === text) {
                        node.nodeValue = targetMap[key];
                        break;
                    }
                }
            }
        } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') { // 元素节点
            // 处理 Title 属性
            if (node.hasAttribute('title')) {
                const titleText = node.getAttribute('title');
                if (sourceMap[titleText]) {
                    node.setAttribute('title', targetMap[titleText]);
                }
            }
            
            // 递归遍历子节点
            node.childNodes.forEach(walk);
        }
    }
    
    // 从根元素开始遍历
    walk(parentNode);
}

// 4. 翻译主函数
function translatePage(toEnglish) {
    // 1. 通用遍历并替换所有可见文本节点和 title 属性
    findAndReplaceText(document.body, toEnglish);

    // 2. 特殊处理 <input> 的 title 属性（已在 findAndReplaceText 中处理，但这里可以再次明确处理，以防万一）
    const thresholdInput = el('threshold');
    if (thresholdInput && thresholdInput.title) {
        const cnTitle = ALL_TRANSLATIONS['数值越小笔画越粗，数值越大笔画越细'];
        const enTitle = 'Lower value for thicker strokes, higher value for thinner strokes';
        if (toEnglish && thresholdInput.title === cnTitle) {
             thresholdInput.title = enTitle;
        } else if (!toEnglish && thresholdInput.title === enTitle) {
             thresholdInput.title = cnTitle;
        }
    }
    const titleKey = "Wplace像素字转换器";
    
    if (toEnglish) {
        // 如果当前是中文标题，则切换到英文
        if (document.title === titleKey) {
            document.title = ALL_TRANSLATIONS[titleKey];
        }
    } else {
        // 如果当前是英文标题，则切换回中文
        if (document.title === ALL_TRANSLATIONS[titleKey]) {
            document.title = titleKey;
        }
    }

    // 3. 更新动态生成的颜色标签文字
    // 必须调用，因为 refreshEffectLabels 会根据 artEffect.value 动态设置标签文本
    refreshEffectLabels();
}


// 5. 覆盖 refreshEffectLabels 以确保其使用正确的语言
const originalRefreshEffectLabels = refreshEffectLabels;
refreshEffectLabels = function() {
    originalRefreshEffectLabels(); // 先执行原有逻辑设置中文/英文文本

    // 无论当前是中文还是英文，都确保它被转换到当前 isEnglish 状态
    const map = ALL_TRANSLATIONS;
    
    // 待转换的标签元素（假设它们已经在原始函数中被正确赋值）
    const labels = [labelEffectA, labelEffectB, labelFont];

    labels.forEach(label => {
        const currentText = label.textContent.trim();
        let newText = currentText;

        if (isEnglish) {
            // 查找中文 -> 英文
            if (map[currentText]) {
                newText = map[currentText];
            }
        } else {
            // 查找英文 -> 中文
            for (const cn in map) {
                if (map[cn] === currentText) {
                    newText = cn;
                    break;
                }
            }
        }

        // 只有当文本发生变化时才更新，防止不必要的DOM操作
        if (newText !== currentText) {
            label.textContent = newText;
        }
    });
};

// 6. 绑定按钮事件
const langToggleBtn = el('langToggleBtn'); 
if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
        isEnglish = !isEnglish;
        translatePage(isEnglish);
        
        // 确保语言按钮自身显示正确的状态
        langToggleBtn.textContent = isEnglish ? '中文 / CN' : 'EN / 中';
    });
}

// ==========================================================
// 7. 新增自动语言检测逻辑
// ==========================================================
function autoDetectLanguage() {
    // 检查浏览器语言，获取前两个字符（如 "zh" 或 "en"）
    const lang = (navigator.language || navigator.userLanguage || '').toLowerCase().substring(0, 2);
    
    // 如果语言不是中文，则切换到英文
    if (lang !== 'zh') {
        isEnglish = true;
        translatePage(isEnglish);
        langToggleBtn.textContent = '中文 / CN'; // 英文模式下，按钮显示切换到中文
    } else {
        isEnglish = false;
        langToggleBtn.textContent = 'EN / 中'; // 中文模式下，按钮显示切换到英文
    }
}


// 8. 调整初始化逻辑，在 load 事件中执行自动检测
// 确保初始状态正确（在 autoDetectLanguage 之前）
// 重新执行一次 refreshEffectLabels 确保初始状态正确
refreshEffectLabels();


window.addEventListener('load', () => {
  // 1. 自动检测语言并设置界面
  autoDetectLanguage();
  
  // 2. 初始渲染
  renderBtn.click();
});
renderBtn.click();