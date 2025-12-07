// NovaCalc — lightweight expression parser + UI interactions
document.addEventListener('DOMContentLoaded', () => {
  // --- background canvas: dynamic Spiderman-style spiderweb ---
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  let W = window.innerWidth, H = window.innerHeight;
  function resize(){ if(!canvas || !ctx) return; W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();

  let mouse = {x: W/2, y: H/2};
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  // Settings and persistence (localStorage)
  const LS_KEY = 'novacalc_settings_v1';
  const defaultSettings = { webEnabled: true, intensity: 1.0, perfMode: false, theme: 'dark' };
  function loadSettings(){
    try{ const raw = localStorage.getItem(LS_KEY); if(!raw) return defaultSettings; const s = JSON.parse(raw); return Object.assign({}, defaultSettings, s); }catch(e){return defaultSettings}
  }
  function saveSettings(){ localStorage.setItem(LS_KEY, JSON.stringify(settings)); }
  const settings = loadSettings();

  // wire controls (may not exist in older versions)
  const webEnableEl = document.getElementById('web-enable');
  const webIntensityEl = document.getElementById('web-intensity');
  const perfModeEl = document.getElementById('perf-mode');
  const themeToggleEl = document.getElementById('theme-toggle');

  if(webEnableEl) webEnableEl.checked = !!settings.webEnabled;
  if(webIntensityEl) webIntensityEl.value = Math.round(settings.intensity*100);
  if(perfModeEl) perfModeEl.checked = !!settings.perfMode;
  if(themeToggleEl) document.documentElement.classList.toggle('light', settings.theme === 'light');

  webEnableEl?.addEventListener('change', ()=>{ settings.webEnabled = !!webEnableEl.checked; saveSettings(); });
  webIntensityEl?.addEventListener('input', ()=>{ settings.intensity = (Number(webIntensityEl.value)/100)||0; saveSettings(); });
  perfModeEl?.addEventListener('change', ()=>{ settings.perfMode = !!perfModeEl.checked; saveSettings(); });
  themeToggleEl?.addEventListener('click', ()=>{ const isLight = document.documentElement.classList.toggle('light'); settings.theme = isLight? 'light' : 'dark'; saveSettings(); });


  // Generate ring anchors for web
  const anchors = [];
  const rings = [60, 140, 260, 420];
  function generateAnchors(){
    anchors.length = 0;
    // intensity scales the number of points per ring
    const intensityScale = Math.max(0.2, settings.intensity);
    rings.forEach((r, ri) => {
      const base = Math.max(12 - ri*2, 6);
      const count = Math.max(4, Math.round(base * intensityScale));
      for(let i=0;i<count;i++){
        const a = {angle: (Math.PI*2*i)/count, radius: r, ox:0, oy:0, rx:0, ry:0, ring:ri};
        anchors.push(a);
      }
    });
  }
  generateAnchors();

  function updateAnchors(t){
    const cx = W/2, cy = H/2;
    for(const a of anchors){
      const baseX = cx + Math.cos(a.angle + t*0.0002*(1+a.ring)) * a.radius;
      const baseY = cy + Math.sin(a.angle + t*0.00017*(1+a.ring)) * a.radius;
      // slight attraction to mouse to create distortion
      const dx = mouse.x - baseX, dy = mouse.y - baseY;
      const dist = Math.sqrt(dx*dx+dy*dy)+0.001;
      // scale pull by intensity
      const pull = Math.max(0, 1 - dist/(200 + a.ring*80)) * settings.intensity;
      a.rx = baseX + dx*0.22*pull;
      a.ry = baseY + dy*0.22*pull;
    }
  }

  function drawWeb(t){
    if(!canvas || !ctx) return; // nothing to draw to
    if(!settings.webEnabled){ ctx.clearRect(0,0,W,H); return; }
    ctx.clearRect(0,0,W,H);
    // background vignette - very subtle to show web
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, 'rgba(1,6,10,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // draw radial threads connecting center to anchors - BRIGHT
    const cx = W/2, cy = H/2;
    for(const a of anchors){
      const hueMix = 0.5 + 0.5*Math.sin(t*0.001 + a.angle*6 + a.ring);
      const col = mixColor('#0b56b2', '#d9342a', hueMix);
      // adjust alpha and width by intensity - BOOSTED VISIBILITY
      ctx.strokeStyle = col; ctx.globalAlpha = Math.max(0.25, (0.65 - a.ring*0.06) * (0.5 + 0.95*settings.intensity));
      ctx.lineWidth = Math.max(0.6, (1.4 - a.ring*0.1) * (0.7 + 0.95*settings.intensity));
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(a.rx, a.ry); ctx.stroke();
    }

    // draw circular threads
    for(let ri=0; ri<rings.length; ri++){
      ctx.beginPath();
      const ringAnchors = anchors.filter(a=>a.ring===ri);
      for(let i=0;i<ringAnchors.length;i++){
        const a = ringAnchors[i];
        const b = ringAnchors[(i+1)%ringAnchors.length];
        // bezier to make organic curves
        const mx = (a.rx + b.rx)/2 + Math.sin(t*0.001 + i)*6*(1+ri*0.4);
        const my = (a.ry + b.ry)/2 + Math.cos(t*0.001 + i)*6*(1+ri*0.4);
        ctx.moveTo(a.rx, a.ry);
        ctx.quadraticCurveTo(mx,my,b.rx,b.ry);
      }
      const hueMix = 0.4 + 0.6*Math.sin(t*0.0007 + ri*1.2);
      ctx.strokeStyle = mixColor('#0b56b2', '#d9342a', hueMix);
      ctx.lineWidth = Math.max(0.6, (1.6 - ri*0.22) * (0.75 + 0.95*settings.intensity));
      ctx.globalAlpha = Math.max(0.18, (0.92 - ri*0.08) * (0.5 + 0.95*settings.intensity));
      ctx.stroke();
    }

    // subtle spider shimmer near mouse - MORE VISIBLE
    if(settings.intensity > 0.03){
      ctx.beginPath();
      const shimmerCount = Math.max(3, Math.round(8 * settings.intensity));
      for(let i=0;i<shimmerCount;i++){
        const a = anchors[Math.floor(Math.random()*anchors.length)];
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(a.rx + Math.sin(t*0.001+i)*8, a.ry + Math.cos(t*0.001+i)*8);
      }
      ctx.strokeStyle = 'rgba(255,255,255,' + String(0.08 + 0.12*settings.intensity) + ')'; ctx.lineWidth=0.8; ctx.globalAlpha=0.95; ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
  }

  function mixColor(a,b,t){
    // simple hex mix
    const pa = hexToRgb(a), pb = hexToRgb(b);
    const r = Math.round(pa.r*(1-t)+pb.r*t), g = Math.round(pa.g*(1-t)+pb.g*t), bl = Math.round(pa.b*(1-t)+pb.b*t);
    return `rgb(${r},${g},${bl})`;
  }
  function hexToRgb(hex){ const h = hex.replace('#',''); return {r:parseInt(h.slice(0,2),16), g:parseInt(h.slice(2,4),16), b:parseInt(h.slice(4,6),16)} }

  let lastT = performance.now();
  let frameCount = 0;
  function loop(t){
    frameCount++;
    // performance mode: skip frames to reduce CPU
    const skip = settings.perfMode ? 2 : 0; // skip 2 frames when perf mode
    if(skip && (frameCount % (skip+1) !== 0)) { requestAnimationFrame(loop); return; }
    // if intensity or perf mode changed, regenerate anchors when needed
    if((settings._lastIntensity !== settings.intensity) || (settings._lastPerf !== settings.perfMode)){
      settings._lastIntensity = settings.intensity; settings._lastPerf = settings.perfMode; generateAnchors();
    }
    updateAnchors(t);
    drawWeb(t);
    lastT = t; requestAnimationFrame(loop);
  }
  if(canvas && ctx) requestAnimationFrame(loop);
  // --- end canvas background ---
  const exprEl = document.getElementById('expr');
  const resultEl = document.getElementById('result');
  const historyList = document.getElementById('history-list');
  const historyPanel = document.getElementById('history');

  let expression = '';
  let lastAns = 0;
  let memory = 0;
  let angleMode = 'DEG';

  const functions = {
    sin: (x) => Math.sin(angleMode==='DEG' ? x * Math.PI/180 : x),
    cos: (x) => Math.cos(angleMode==='DEG' ? x * Math.PI/180 : x),
    tan: (x) => Math.tan(angleMode==='DEG' ? x * Math.PI/180 : x),
    asin: (x) => (angleMode==='DEG' ? (Math.asin(x)*180/Math.PI) : Math.asin(x)),
    acos: (x) => (angleMode==='DEG' ? (Math.acos(x)*180/Math.PI) : Math.acos(x)),
    atan: (x) => (angleMode==='DEG' ? (Math.atan(x)*180/Math.PI) : Math.atan(x)),
    ln: (x) => Math.log(x),
    log: (x) => Math.log10 ? Math.log10(x) : Math.log(x)/Math.LN10,
    sqrt: (x) => Math.sqrt(x),
    exp: (x) => Math.exp(x),
    abs: Math.abs,
    '^': (a,b) => Math.pow(a,b),
    fact: (n) => {
      if(n<0) return NaN; if(n===0) return 1;
      let res=1; for(let i=1;i<=Math.floor(n);i++) res*=i; return res;
    }
  };

  function updateDisplay(){
    exprEl.textContent = expression || '0';
  }

  function append(v){ expression += v; updateDisplay(); }
  function back(){ expression = expression.slice(0,-1); updateDisplay(); }
  function clearAll(){ expression=''; resultEl.textContent='0'; updateDisplay(); }

  // Shunting-yard tokenizer -> RPN -> evaluate
  function evalExpression(input){
    if(!input) return 0;
    // Normalize: replace unicode × ÷ − etc
    input = input.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/pi/g, String(Math.PI));
    // Tokenize
    const tokenRe = /([0-9]*\.?[0-9]+(?:e[+-]?\d+)?|[A-Za-z_][A-Za-z0-9_]*|\^|\*|\/|\+|\-|\%|\(|\)|\,|\!|\.)/g;
    let tokens = input.match(tokenRe);
    if(!tokens) throw new Error('Invalid expression');

    // shunting-yard
    const out = [], ops = [];
    const prec = {'+':2,'-':2,'*':3,'/':3,'%':3,'^':4};
    const rightAssoc = {'^':true};

    for(let i=0;i<tokens.length;i++){
      let t = tokens[i];
      if(/^\d|^\.\d/.test(t)) { out.push(parseFloat(t)); continue; }
      if(t==='pi') { out.push(Math.PI); continue; }
      if(t === ',') { while(ops.length && ops[ops.length-1] !== '(') out.push(ops.pop()); continue; }
      if(t.match(/^[A-Za-z_]/)) { // function or variable
        // if next token is '(' treat as function
        if(tokens[i+1] === '(') { ops.push(t); } else { throw new Error('Unknown identifier: '+t); }
        continue;
      }
      if(t === '!') { out.push({op:'fact'}); continue; }
      if(t === '(') { ops.push(t); continue; }
      if(t === ')'){
        while(ops.length && ops[ops.length-1] !== '(') out.push(ops.pop());
        if(!ops.length) throw new Error('Mismatched parentheses');
        ops.pop();
        if(ops.length && typeof ops[ops.length-1] === 'string' && ops[ops.length-1].match(/^[A-Za-z_]/)) out.push(ops.pop());
        continue;
      }
      // operator
      if(Object.keys(prec).includes(t)){
        // handle unary minus: if at start or previous token was operator or '('
        if(t==='-' && (i===0 || ['(','+','-','*','/','^',','].includes(tokens[i-1]))) { // unary
          // convert to (0 - x) by pushing 0 then - as binary
          out.push(0);
        }
        while(ops.length){
          const top = ops[ops.length-1];
          if(top==='(') break;
          const topPrec = prec[top]||0;
          const curPrec = prec[t];
          if((!rightAssoc[t] && curPrec <= topPrec) || (rightAssoc[t] && curPrec < topPrec)) out.push(ops.pop()); else break;
        }
        ops.push(t);
        continue;
      }
      throw new Error('Unexpected token: '+t);
    }
    while(ops.length){ const v = ops.pop(); if(v==='('||v===')') throw new Error('Mismatched parentheses'); out.push(v); }

    // evaluate RPN
    const stack = [];
    for(const token of out){
      if(typeof token === 'number') stack.push(token);
      else if(typeof token === 'string'){
        if(Object.keys(functions).includes(token)){
          // unary function: pop one
          const a = stack.pop(); if(a===undefined) throw new Error('Missing argument for '+token);
          stack.push(functions[token](a));
        } else if(['+','-','*','/','%','^'].includes(token)){
          const b = stack.pop(); const a = stack.pop(); if(a===undefined||b===undefined) throw new Error('Missing operand');
          if(token==='^') stack.push(Math.pow(a,b));
          else if(token==='+') stack.push(a+b);
          else if(token==='-') stack.push(a-b);
          else if(token==='*') stack.push(a*b);
          else if(token==='/') stack.push(a/b);
          else if(token==='%') stack.push(a%b);
        } else { throw new Error('Unknown op '+token); }
      } else if(typeof token === 'object' && token.op === 'fact'){
        const a = stack.pop(); if(a===undefined) throw new Error('Missing operand for !'); stack.push(functions.fact(a));
      } else {
        throw new Error('Unknown RPN token');
      }
    }
    if(stack.length !== 1) throw new Error('Invalid expression');
    return stack[0];
  }

  // UI wiring
  document.body.addEventListener('click', (ev) => {
    const t = ev.target;
    if(t.matches('[data-value]')){
      let v = t.getAttribute('data-value');
      if(v === ',') v = 'pi';
      append(v);
    }
    if(t.matches('[data-fn]')){
      const f = t.getAttribute('data-fn');
      if(f==='^'){ append('^'); } else if(f==='fact'){ append('!'); } else if(f==='exp'){ append('exp('); } else { append(f+'('); }
    }
    if(t.matches('[data-action]')){
      const a = t.getAttribute('data-action');
      if(a==='clear') clearAll();
      if(a==='back') back();
      if(a==='eval'){
        try{
          const res = evalExpression(expression);
          lastAns = res;
          resultEl.textContent = String(res);
          addHistory(expression, res);
        }catch(e){ resultEl.textContent = 'Err: '+e.message; }
      }
      if(a==='ans') append(String(lastAns));
      if(a==='mem-clear') memory = 0;
      if(a==='mem-recall') append(String(memory));
      if(a==='mem-plus'){ try{ memory += evalExpression(expression||String(lastAns)); }catch(e){} }
      if(a==='mem-minus'){ try{ memory -= evalExpression(expression||String(lastAns)); }catch(e){} }
    }
    if(t.id === 'history-toggle') historyPanel.classList.toggle('open');
    if(t.id === 'copy') navigator.clipboard?.writeText(resultEl.textContent||'');
  });

  function addHistory(expr, res){
    const li = document.createElement('li');
    li.textContent = expr + ' = ' + res;
    li.addEventListener('contextmenu', (ev)=>{ ev.preventDefault(); expression = String(expr); updateDisplay(); });
    historyList.prepend(li);
  }

  // keyboard support
  window.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){ document.querySelector('[data-action=eval]').click(); e.preventDefault(); }
    else if(e.key === 'Backspace') document.querySelector('[data-action=back]').click();
    else if(e.key === 'Escape') document.querySelector('[data-action=clear]').click();
    else if(/^[0-9.+\-*/%^(),!]$/.test(e.key)) append(e.key);
  });

  // toggles
  document.getElementById('angle-toggle').addEventListener('click', (e)=>{
    angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG'; e.target.textContent = angleMode;
  });
  // theme toggle is wired earlier (persisted); avoid adding duplicate listener here


  updateDisplay();
});
