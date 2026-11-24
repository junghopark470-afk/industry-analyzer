/* 산업동향 분석기 공용 차트 (SVG/HTML, 라이브러리 없음).
   모든 색은 CSS 토큰(var(--x))으로 받아 라이트/다크 모두에서 읽힙니다.
   mount(el, fn): 컨테이너 폭으로 그리고, 폭이 바뀌면 다시 그립니다. */
(function(){
const C={};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
C.esc=esc;
const fmt=(v,d=0)=>Number(v).toLocaleString("ko-KR",{minimumFractionDigits:d,maximumFractionDigits:d});
C.fmt=fmt;
function nice(max,n=4){const raw=max/n;const p=Math.pow(10,Math.floor(Math.log10(raw)));const m=raw/p;const s=(m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p;return s}
C.nice=nice;

/* ---------- tooltip ---------- */
let tip;
function ensureTip(){if(tip)return tip;tip=document.createElement("div");tip.className="c-tip";tip.hidden=true;document.body.appendChild(tip);
  const show=(e)=>{const t=e.target.closest&&e.target.closest("[data-tip]");if(!t){tip.hidden=true;return}
    tip.innerHTML=t.getAttribute("data-tip");tip.hidden=false;
    const r=tip.getBoundingClientRect();let x=e.clientX+14,y=e.clientY+14;
    if(x+r.width>innerWidth-8)x=e.clientX-r.width-14; if(y+r.height>innerHeight-8)y=e.clientY-r.height-14;
    tip.style.left=Math.max(8,x)+"px";tip.style.top=Math.max(8,y)+"px";};
  document.addEventListener("pointermove",show);document.addEventListener("pointerdown",show);
  document.addEventListener("scroll",()=>{tip.hidden=true},{passive:true});
  return tip}

C.mount=function(el,fn){if(!el)return;ensureTip();const draw=()=>{const w=Math.max(260,el.clientWidth||600);el.innerHTML=fn(w)};draw();
  if(window.ResizeObserver){let last=el.clientWidth;new ResizeObserver(()=>{if(Math.abs(el.clientWidth-last)>4){last=el.clientWidth;draw()}}).observe(el)}};

/* ---------- vertical columns ---------- */
C.columns=function(o){return w=>{
  const h=o.height||220,pl=o.padL||40,pr=12,pt=26,pb=34;const iw=w-pl-pr,ih=h-pt-pb;
  const vals=o.data.map(d=>d.value);let max=Math.max(...vals,o.ref?o.ref.value:0);const st=nice(max);max=Math.ceil(max*1.08/st)*st;
  const y=v=>pt+ih-(v/max*ih);const n=o.data.length;const slot=iw/n;const bw=Math.min(56,slot*0.56);
  let s=`<svg class="c-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.title||"")}">`;
  for(let t=0;t<=max+1e-9;t+=st){s+=`<line x1="${pl}" x2="${w-pr}" y1="${y(t)}" y2="${y(t)}" style="stroke:var(--grid)" stroke-width="1"/><text x="${pl-6}" y="${y(t)+4}" text-anchor="end" class="c-ax">${fmt(t,st<1?1:0)}</text>`}
  o.data.forEach((d,i)=>{const cx=pl+slot*i+slot/2,x=cx-bw/2,top=y(d.value),bh=pt+ih-top;const r=Math.min(4,bh);
    const col=d.color||"var(--sea)";
    s+=`<g data-tip="${esc(d.tip||(d.label+": "+fmt(d.value,o.dec||0)+(o.unit||"")))}"><rect x="${cx-slot/2}" y="${pt}" width="${slot}" height="${ih}" fill="transparent"/>`;
    s+=`<path d="M${x},${pt+ih} V${top+r} Q${x},${top} ${x+r},${top} H${x+bw-r} Q${x+bw},${top} ${x+bw},${top+r} V${pt+ih} Z" style="fill:${col};${d.dim?"opacity:.45":""}"/>`;
    s+=`<text x="${cx}" y="${top-7}" text-anchor="middle" class="c-val">${fmt(d.value,o.dec||0)}${o.unitShort||""}</text>`;
    s+=`<text x="${cx}" y="${h-pb+18}" text-anchor="middle" class="c-ax">${esc(d.label)}</text></g>`});
  if(o.ref){const ry=y(o.ref.value);s+=`<line x1="${pl}" x2="${w-pr}" y1="${ry}" y2="${ry}" style="stroke:var(--hull)" stroke-width="1.5" stroke-dasharray="5 4"/>`}
  s+=`<line x1="${pl}" x2="${w-pr}" y1="${pt+ih}" y2="${pt+ih}" style="stroke:var(--axis)"/></svg>`;if(o.ref)s+=`<p class="c-note"><i class="c-key-ref"></i>${esc(o.ref.label)}</p>`;return s}};

/* ---------- line (category x) ---------- */
C.line=function(o){return w=>{
  const h=o.height||210,pl=o.padL||44,pr=o.padR||20,pt=22,pb=32;const iw=w-pl-pr,ih=h-pt-pb;
  const all=o.series.flatMap(s=>s.points.map(p=>p.y)).concat(o.ref?[o.ref.value]:[]);
  let lo=o.yMin!=null?o.yMin:0,hi=Math.max(...all);const st=nice(hi-lo);hi=Math.ceil((hi+(hi-lo)*0.08)/st)*st;lo=Math.floor(lo/st)*st;
  const labels=o.labels;const x=i=>pl+(labels.length===1?iw/2:i*iw/(labels.length-1));const y=v=>pt+ih-((v-lo)/(hi-lo)*ih);
  let s=`<svg class="c-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.title||"")}">`;
  for(let t=lo;t<=hi+1e-9;t+=st){s+=`<line x1="${pl}" x2="${w-pr}" y1="${y(t)}" y2="${y(t)}" style="stroke:var(--grid)"/><text x="${pl-6}" y="${y(t)+4}" text-anchor="end" class="c-ax">${fmt(t,st<1?1:0)}</text>`}
  labels.forEach((l,i)=>{s+=`<text x="${x(i)}" y="${h-pb+18}" text-anchor="${i===0&&labels.length>1?"start":i===labels.length-1&&labels.length>1?"end":"middle"}" class="c-ax">${esc(l)}</text>`});
  if(o.ref){const ry=y(o.ref.value);s+=`<line x1="${pl}" x2="${w-pr}" y1="${ry}" y2="${ry}" style="stroke:var(--hull)" stroke-width="1.5" stroke-dasharray="5 4"/>`}
  o.series.forEach(se=>{const pts=se.points.map((p,i)=>[x(p.i!=null?p.i:i),y(p.y),p]);
    if(o.area){s+=`<path d="M${pts[0][0]},${pt+ih} ${pts.map(p=>"L"+p[0]+","+p[1]).join(" ")} L${pts[pts.length-1][0]},${pt+ih} Z" style="fill:${se.color};opacity:.12"/>`}
    s+=`<path d="${pts.map((p,i)=>(i?"L":"M")+p[0]+","+p[1]).join(" ")}" fill="none" style="stroke:${se.color}" stroke-width="2" ${se.dash?'stroke-dasharray="5 4"':""}/>`;
    pts.forEach(([px,py,p],i)=>{const last=i===pts.length-1;s+=`<g data-tip="${esc(p.tip||(labels[p.i!=null?p.i:i]+": "+fmt(p.y,o.dec||0)+(o.unit||"")))}"><circle cx="${px}" cy="${py}" r="14" fill="transparent"/><circle cx="${px}" cy="${py}" r="${last?5:4}" style="fill:${last?se.color:"var(--surface)"};stroke:${se.color}" stroke-width="2"/></g>`;
      if(o.labelAll||last){s+=`<text x="${px}" y="${py-10}" text-anchor="${i===0?"start":last?"end":"middle"}" class="c-val">${fmt(p.y,o.dec||0)}${o.unitShort||""}</text>`}})});
  s+=`</svg>`;if(o.ref)s+=`<p class="c-note"><i class="c-key-ref"></i>${esc(o.ref.label)}</p>`;return s}};

/* ---------- horizontal bars (HTML) ---------- */
C.hbars=function(el,o){if(!el)return;const max=o.max||Math.max(...o.data.map(d=>Math.abs(d.value)),o.ref?o.ref.value:0)*1.05;
  el.innerHTML=`<div class="c-hb">${o.data.map(d=>`<div class="c-hb-row" data-tip="${esc(d.tip||d.label+": "+(d.text||fmt(d.value,o.dec||0)+(o.unit||"")))}"><span class="c-hb-l">${esc(d.label)}</span><div class="c-hb-t">${o.ref?`<i class="c-hb-ref" style="left:${o.ref.value/max*100}%"></i>`:""}<div class="c-hb-f" style="width:${Math.abs(d.value)/max*100}%;background:${d.color||"var(--sea)"}"></div></div><span class="c-hb-v">${d.text||fmt(d.value,o.dec||0)+(o.unit||"")}</span></div>`).join("")}</div>${o.ref?`<p class="c-note"><i class="c-key-ref"></i>${esc(o.ref.label)}</p>`:""}`;ensureTip()};

/* ---------- 100% stacked (HTML) ---------- */
C.stack=function(el,o){if(!el)return;const tot=o.data.reduce((a,d)=>a+d.value,0);
  el.innerHTML=`<div class="c-st">${o.data.map(d=>`<div class="c-st-s" style="flex:${d.value};background:${d.color}" data-tip="${esc(d.label+": "+fmt(d.value,o.dec||0)+(o.unit||""))}">${d.value/tot>0.22?`<span>${esc(d.short||d.label)} ${fmt(d.value,o.dec||0)}${o.unit||""}</span>`:""}</div>`).join("")}</div><div class="c-leg">${o.data.map(d=>`<span><i style="background:${d.color}"></i>${esc(d.label)} ${fmt(d.value,o.dec||0)}${o.unit||""}</span>`).join("")}</div>`;ensureTip()};

/* ---------- radar ---------- */
C.radar=function(o){return w=>{const size=Math.min(w,380),h=size;const cx=w/2,cy=h/2+4,R=size/2-58;const n=o.axes.length;
  const pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/n;return [cx+Math.cos(a)*R*v/o.max,cy+Math.sin(a)*R*v/o.max]};
  let s=`<svg class="c-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.title||"")}">`;
  for(let k=1;k<=o.max;k++){s+=`<polygon points="${o.axes.map((_,i)=>pt(i,k).join(",")).join(" ")}" fill="none" style="stroke:var(--grid)"/>`}
  o.axes.forEach((a,i)=>{const [x,y]=pt(i,o.max);s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" style="stroke:var(--grid)"/>`;
    const [lx,ly]=pt(i,o.max+0.9);s+=`<text x="${lx}" y="${ly}" text-anchor="${Math.abs(lx-cx)<10?"middle":lx>cx?"start":"end"}" class="c-ax-b">${esc(a.label)}</text><text x="${lx}" y="${ly+14}" text-anchor="${Math.abs(lx-cx)<10?"middle":lx>cx?"start":"end"}" class="c-ax">${a.value}/${o.max}</text>`});
  s+=`<polygon points="${o.axes.map((a,i)=>pt(i,a.value).join(",")).join(" ")}" style="fill:var(--hull);fill-opacity:.16;stroke:var(--hull)" stroke-width="2"/>`;
  o.axes.forEach((a,i)=>{const [x,y]=pt(i,a.value);s+=`<g data-tip="${esc(a.label+" "+a.value+"/"+o.max+(a.tip?" · "+a.tip:""))}"><circle cx="${x}" cy="${y}" r="14" fill="transparent"/><circle cx="${x}" cy="${y}" r="4.5" style="fill:var(--hull);stroke:var(--surface)" stroke-width="2"/></g>`});
  return s+`</svg>`}};

/* ---------- scatter ---------- */
C.scatter=function(o){return w=>{const h=o.height||300,pl=48,pr=20,pt=18,pb=42;const iw=w-pl-pr,ih=h-pt-pb;
  const [x0,x1]=o.x,[y0,y1]=o.y;const X=v=>pl+(v-x0)/(x1-x0)*iw,Y=v=>pt+ih-(v-y0)/(y1-y0)*ih;
  let s=`<svg class="c-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.title||"")}">`;
  if(o.zones)o.zones.forEach(z=>{s+=`<rect x="${X(z.x[0])}" y="${Y(z.y[1])}" width="${X(z.x[1])-X(z.x[0])}" height="${Y(z.y[0])-Y(z.y[1])}" style="fill:${z.color}" opacity="${z.op||.12}"/>`});
  for(let t=x0;t<=x1+1e-9;t+=o.xs){s+=`<line x1="${X(t)}" x2="${X(t)}" y1="${pt}" y2="${pt+ih}" style="stroke:var(--grid)"/><text x="${X(t)}" y="${pt+ih+16}" text-anchor="middle" class="c-ax">${o.xf?o.xf(t):fmt(t)}</text>`}
  for(let t=y0;t<=y1+1e-9;t+=o.ys){s+=`<line x1="${pl}" x2="${w-pr}" y1="${Y(t)}" y2="${Y(t)}" style="stroke:var(--grid)"/><text x="${pl-6}" y="${Y(t)+4}" text-anchor="end" class="c-ax">${o.yf?o.yf(t):fmt(t)}</text>`}
  s+=`<text x="${pl+iw/2}" y="${h-4}" text-anchor="middle" class="c-ax-b">${esc(o.xLabel)}</text><text x="12" y="${pt+ih/2}" text-anchor="middle" class="c-ax-b" transform="rotate(-90 12 ${pt+ih/2})">${esc(o.yLabel)}</text>`;
  if(o.fn){const N=40;let d="";for(let i=0;i<=N;i++){const xv=x0+(x1-x0)*i/N,yv=o.fn(xv);d+=(i?"L":"M")+X(xv)+","+Math.max(pt,Math.min(pt+ih,Y(yv)))}
    s+=`<path d="${d}" fill="none" style="stroke:var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/>`;if(o.fnLabel){const xv=x1-(x1-x0)*0.02,yv=o.fn(xv);if(yv<=y1)s+=`<text x="${X(xv)}" y="${Y(yv)-8}" text-anchor="end" class="c-ax">${esc(o.fnLabel)}</text>`}}
  if(o.zoneLabels)o.zoneLabels.forEach(z=>{s+=`<text x="${X(z.x)}" y="${Y(z.y)}" text-anchor="${z.anchor||"start"}" class="c-zone">${esc(z.t)}</text>`});
  o.points.forEach(p=>{const x=X(p.x),y=Y(p.y),r=p.r||8;s+=`<g data-tip="${esc(p.tip||p.label)}"><circle cx="${x}" cy="${y}" r="${r+8}" fill="transparent"/><circle cx="${x}" cy="${y}" r="${r}" style="fill:${p.color};stroke:var(--surface)" stroke-width="2"/>`;
    if(p.num!=null)s+=`<text x="${x}" y="${y+4}" text-anchor="middle" class="c-num">${p.num}</text>`;
    if(p.label&&p.showLabel!==false){const right=p.side?p.side!=="left":x<w-130;s+=`<text x="${right?x+r+6:x-r-6}" y="${y+4}" text-anchor="${right?"start":"end"}" class="c-val">${esc(p.label)}</text>`}s+=`</g>`});
  return s+`</svg>`}};

/* ---------- range strip (bear–base–bull + current) ---------- */
C.range=function(o){const lo=Math.min(o.min,o.now)*0.92,hi=Math.max(o.max,o.now)*1.05;const p=v=>(v-lo)/(hi-lo)*100;
  return `<div class="c-rg" data-tip="${esc(o.tip||"")}"><div class="c-rg-t"><div class="c-rg-band" style="left:${p(o.min)}%;width:${p(o.max)-p(o.min)}%"></div><i class="c-rg-mid" style="left:${p(o.mid)}%"></i><i class="c-rg-now" style="left:${p(o.now)}%"></i></div>
  <div class="c-rg-k"><span><i class="k-band"></i>약세~강세 ${o.minL}~${o.maxL}</span><span><i class="k-mid"></i>기본 ${o.midL}</span><span><i class="k-now"></i>현재 ${o.nowL}</span></div></div>`};

window.Charts=C;
})();
