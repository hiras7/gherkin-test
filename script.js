
// ===== Modern Enhanced Frontend =====
// API base URL: ?api=... > localStorage(apiBaseUrl) > FALLBACK_API
const FALLBACK_API = ""; // optional default e.g. "https://your-app.onrender.com"
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));
function getQueryParam(name){ const u=new URL(window.location.href); return u.searchParams.get(name); }
function getApiBaseUrl(){ const q=getQueryParam('api'); if(q){ try{localStorage.setItem('apiBaseUrl', q);}catch(e){} return q; } try{const s=localStorage.getItem('apiBaseUrl'); if(s) return s;}catch(e){} return FALLBACK_API; }
function api(p){ return (getApiBaseUrl()||"") + p; }

// Theme toggle
qs('#themeBtn')?.addEventListener('click', ()=>{ document.body.classList.toggle('light'); qs('#themeBtn').textContent = document.body.classList.contains('light') ? '☀️ Day' : '🌙 Night'; });

// Settings dialog
const dlg=qs('#settingsDialog'); const apiInput=qs('#apiBaseInput');
qs('#settingsBtn')?.addEventListener('click', ()=>{ try{ apiInput.value=getApiBaseUrl()||'';}catch(e){} dlg.showModal(); });
qs('#saveSettingsBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); const v=(apiInput.value||'').trim(); try{ if(v) localStorage.setItem('apiBaseUrl', v); else localStorage.removeItem('apiBaseUrl'); }catch(e){} dlg.close(); toast('Saved settings','ok'); });

// Drag & Drop + file state
function initDragDrop(){ const z=qs('#dropZone'); if(!z) return; ['dragenter','dragover'].forEach(e=>z.addEventListener(e,ev=>{ev.preventDefault(); z.classList.add('dragging');})); ['dragleave','drop'].forEach(e=>z.addEventListener(e,ev=>{ev.preventDefault(); z.classList.remove('dragging');})); z.addEventListener('drop', ev=>{ const f=ev.dataTransfer?.files?.[0]; if(f){ if(!f.name.toLowerCase().endsWith('.docx')){ toast('Please drop a .docx file','err'); return;} const i=qs('#fileInput'); if(i) i.files=ev.dataTransfer.files; const nm=qs('#droppedName'); if(nm) nm.textContent=f.name; enableButtons(); }}); }
function enableButtons(){ const has=!!qs('#fileInput')?.files?.length; qs('#previewBtn')?.toggleAttribute('disabled', !has); qs('#generateBtn')?.toggleAttribute('disabled', !has); }
qs('#fileInput')?.addEventListener('change', ()=>{ const f=qs('#fileInput')?.files?.[0]; if(f){ const nm=qs('#droppedName'); if(nm) nm.textContent=f.name; } enableButtons(); });

// Build payload
function appendOptions(fd){ qsa('input[type="checkbox"][data-opt]').forEach(cb=>fd.append(cb.getAttribute('data-opt'), cb.checked?'1':'0')); const mode=qs('input[name="gherkinMode"]:checked'); fd.append('mode', mode?mode.value:'optimized'); const g=(qs('#guidelinesInput')?.value||'').trim(); if(g) fd.append('guidelines', g); }

// Helpers
function setStatus(m,b){ const el=qs('#status'); if(el){ el.textContent=m; el.classList.toggle('busy', !!b);} }
function setTime(m){ const el=qs('#time'); if(el) el.textContent=m; }
function setStats(m){ const el=qs('#stats'); if(el) el.textContent=m; }
function escapeHtml(s){ return String(s).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
function clearSkeleton(){ qsa('#overviewTable .skeleton').forEach(tr=>tr.remove()); }
function toast(msg,kind){ const t=qs('#toast'); if(!t) return; t.className='toast '+(kind||''); t.textContent=msg; requestAnimationFrame(()=>{ t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2600); }); }

// Renderers
function renderOverview(list){ const tb=qs('#overviewTable tbody'); if(!tb) return; tb.innerHTML=''; (list||[]).forEach(r=>{ const tr=document.createElement('tr'); const req=r.ReqName||r.ReqID||'—'; const fit=r.FitCount??0; const scen=r.ScenarioCount??1; tr.innerHTML=`<td>${escapeHtml(req)}</td><td>${fit}</td><td>${scen}</td>`; tb.appendChild(tr); }); }
function renderRules(rules){ const ul=qs('#rulesList'); if(!ul) return; ul.innerHTML=''; (rules||[]).forEach(x=>{ const li=document.createElement('li'); li.textContent=x; ul.appendChild(li); }); }

// Actions
async function previewFile(){ const f=qs('#fileInput')?.files?.[0]; if(!f){ toast('Choose a .docx first','err'); return;} const base=getApiBaseUrl(); if(!base){ toast('Set backend URL in Settings (top-right)','err'); return; } setStatus('Preview running…', true); clearSkeleton(); const fd=new FormData(); fd.append('file', f); appendOptions(fd); const t0=performance.now(); const res=await fetch(api('/preview'), {method:'POST', body:fd}).catch(()=>null); const t=((performance.now()-t0)/1000).toFixed(3); if(!res||!res.ok){ setStatus('Preview failed.', false); toast('Preview failed','err'); return; } const payload=await res.json(); setStatus('Preview complete.', false); setTime(`Server: ${payload.time}s • Client: ${t}s`); setStats(`Total Requirements: ${(payload.data||[]).length}`); renderOverview(payload.overview||[]); renderRules(payload.rules||[]); toast('Preview ready','ok'); }
async function generateFile(){ const f=qs('#fileInput')?.files?.[0]; if(!f){ toast('Choose a .docx first','err'); return;} const base=getApiBaseUrl(); if(!base){ toast('Set backend URL in Settings','err'); return; } setStatus('Generating…', true); const fd=new FormData(); fd.append('file', f); appendOptions(fd); const t0=performance.now(); const res=await fetch(api('/upload'), {method:'POST', body:fd}).catch(()=>null); const t=((performance.now()-t0)/1000).toFixed(3); if(!res||!res.ok){ setStatus('Generation failed.', false); toast('Generation failed','err'); return; } const serverTime=res.headers.get('X-Process-Time'); const blob=await res.blob(); const url=URL.createObjectURL(blob); const d=qs('#downloadLink'); if(d) d.innerHTML=`<a class="btn primary" href="${url}" download="gherkin_output.docx">Download Gherkin Document (.docx)</a>`; setStatus('Generated successfully.', false); setTime(`Server: ${serverTime??'n/a'}s • Client: ${t}s`); toast('Document ready','ok'); }

// Init
window.addEventListener('DOMContentLoaded', ()=>{ initDragDrop(); enableButtons(); qs('#previewBtn')?.addEventListener('click', previewFile); qs('#generateBtn')?.addEventListener('click', generateFile); });
