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

/* ---------- time-series lines with event markers ----------
   o: {dates:[...], series:[{name,color,values,dash}], events:[{i,n,tip,up}], height, unit, base, yMin}
*/
C.tsline=function(o){return w=>{
  const h=o.height||320,pl=44,pr=14,pt=30,pb=34;const iw=w-pl-pr,ih=h-pt-pb;const N=o.dates.length;
  const all=o.series.flatMap(s=>s.values.filter(v=>v!=null));
  let lo=o.yMin!=null?o.yMin:Math.min(...all),hi=Math.max(...all);const st=nice(hi-lo,4);lo=Math.floor(lo/st)*st;hi=Math.ceil(hi/st)*st;
  const X=i=>pl+i*iw/(N-1),Y=v=>pt+ih-(v-lo)/(hi-lo)*ih;
  let s=`<svg class="c-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.title||"")}">`;
  for(let t=lo;t<=hi+1e-9;t+=st){s+=`<line x1="${pl}" x2="${w-pr}" y1="${Y(t)}" y2="${Y(t)}" style="stroke:var(--grid)"/><text x="${pl-6}" y="${Y(t)+4}" text-anchor="end" class="c-ax">${fmt(t)}</text>`}
  if(o.base!=null&&o.base>=lo&&o.base<=hi){s+=`<line x1="${pl}" x2="${w-pr}" y1="${Y(o.base)}" y2="${Y(o.base)}" style="stroke:var(--axis)" stroke-width="1.2"/>`}
  let lastM="";const minGap=w<520?70:56;let lastX=-1e9;
  o.dates.forEach((d,i)=>{const m=d.slice(0,7);if(m!==lastM){lastM=m;const x=X(i);if(x-lastX>=minGap){lastX=x;s+=`<line x1="${x}" x2="${x}" y1="${pt+ih}" y2="${pt+ih+4}" style="stroke:var(--axis)"/><text x="${x}" y="${h-pb+18}" text-anchor="${i===0?"start":"middle"}" class="c-ax">${+d.slice(5,7)}월</text>`}}});
  (o.events||[]).forEach(e=>{const x=X(e.i);s+=`<line x1="${x}" x2="${x}" y1="${pt-14}" y2="${pt+ih}" style="stroke:${e.up?"var(--good)":"var(--bad)"}" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/>`});
  o.series.forEach(se=>{let d="";se.values.forEach((v,i)=>{if(v==null)return;d+=(d?"L":"M")+X(i).toFixed(1)+","+Y(v).toFixed(1)});
    s+=`<path d="${d}" fill="none" style="stroke:${se.color}" stroke-width="${se.width||2}" ${se.dash?'stroke-dasharray="5 4"':""} stroke-linejoin="round"/>`;
    const li=se.values.length-1;s+=`<circle cx="${X(li)}" cy="${Y(se.values[li])}" r="3.5" style="fill:${se.color}"/>`});
  // hover columns
  const cw=Math.max(iw/(N-1),2);
  o.dates.forEach((d,i)=>{const tip=`<b>${d}</b><br>`+o.series.map(se=>`${esc(se.name)} ${fmt(se.values[i],o.dec||0)}${o.unit||""}${se.pct?` (${se.pct[i]>=0?"+":""}${se.pct[i].toFixed(2)}%)`:""}`).join("<br>");
    s+=`<rect x="${X(i)-cw/2}" y="${pt}" width="${cw}" height="${ih}" fill="transparent" data-tip="${esc(tip)}"/>`});
  (o.events||[]).forEach(e=>{const x=X(e.i);s+=`<g data-tip="${esc(e.tip)}"><circle cx="${x}" cy="${pt-16}" r="10" style="fill:${e.up?"var(--good)":"var(--bad)"};stroke:var(--surface)" stroke-width="2"/><text x="${x}" y="${pt-12}" text-anchor="middle" class="c-num">${e.n}</text></g>`});
  return s+`</svg>`}};

/* ---------- grouped vertical bars ----------
   o: {groups:[label], series:[{name,color,values,texts?}], unit, dec, height}
*/
C.gbars=function(o){return w=>{
  const h=o.height||230,pl=o.padL||40,pr=10,pt=24,pb=36;const iw=w-pl-pr,ih=h-pt-pb;const G=o.groups.length,S=o.series.length;
  const all=o.series.flatMap(s=>s.values);const hi0=Math.max(...all,0),lo0=Math.min(...all,0);const st=nice(hi0-lo0||1,4);
  const hi=Math.ceil(hi0*1.12/st)*st||st,lo=Math.floor(lo0/st)*st;const Y=v=>pt+ih-(v-lo)/(hi-lo)*ih;
  const gw=iw/G,bw=Math.min(34,(gw*0.78)/S);
  let s=`<svg class="c-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.title||"")}">`;
  for(let t=lo;t<=hi+1e-9;t+=st){s+=`<line x1="${pl}" x2="${w-pr}" y1="${Y(t)}" y2="${Y(t)}" style="stroke:var(--grid)"/><text x="${pl-6}" y="${Y(t)+4}" text-anchor="end" class="c-ax">${fmt(t,st<1?1:0)}</text>`}
  o.groups.forEach((g,gi)=>{const cx=pl+gw*gi+gw/2;const x0=cx-bw*S/2;
    o.series.forEach((se,si)=>{const v=se.values[gi];if(v==null)return;const x=x0+si*bw,y=Math.min(Y(v),Y(0)),hh=Math.abs(Y(v)-Y(0));
      const t=se.texts?se.texts[gi]:fmt(v,o.dec||0);
      s+=`<g data-tip="${esc(g+" · "+se.name+": "+(se.tips?se.tips[gi]:t+(o.unit||"")))}"><rect x="${x+1}" y="${y}" width="${bw-2}" height="${Math.max(hh,1)}" rx="2" style="fill:${se.color}"/>${bw>=18||S===1?`<text x="${x+bw/2}" y="${v>=0?y-5:y+hh+12}" text-anchor="middle" class="c-val" style="font-size:${bw<26?10:11}px">${t}</text>`:""}</g>`});
    s+=`<text x="${cx}" y="${h-pb+18}" text-anchor="middle" class="c-ax-b">${esc(g)}</text>`});
  s+=`</svg><div class="c-leg">${o.series.map(se=>`<span><i style="background:${se.color}"></i>${esc(se.name)}</span>`).join("")}</div>`;return s}};


/* ---------- yline: 연도(숫자) x축 + 시대 구간 + 공백은 점선 ---------- */
C.yline=function(o){return w=>{
  const h=o.height||290,pl=o.padL||44,pr=16,pt=30,pb=30;const iw=w-pl-pr,ih=h-pt-pb;
  const [x0,x1]=o.x;const ys=o.points.map(p=>p.y);let lo=o.yMin!=null?o.yMin:Math.min(...ys),hi=Math.max(...ys);
  const st=nice(hi-lo);lo=Math.floor(lo/st)*st;hi=Math.ceil((hi+(hi-lo)*0.1)/st)*st;
  const X=t=>pl+(t-x0)/(x1-x0)*iw,Y=v=>pt+ih-(v-lo)/(hi-lo)*ih;
  let s=`<svg class="c-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.title||"")}">`;
  (o.bands||[]).forEach((b,i)=>{const a=X(b.from),z=X(b.to);s+=`<g data-tip="${esc(b.tip||b.label)}"><rect x="${a}" y="${pt}" width="${z-a}" height="${ih}" style="fill:${b.color}" opacity=".13"/><text x="${(a+z)/2}" y="${pt-10}" text-anchor="middle" class="c-zone" style="fill:${b.color}">${esc(b.short||String(i+1))}</text></g>`});
  for(let t=lo;t<=hi+1e-9;t+=st){s+=`<line x1="${pl}" x2="${w-pr}" y1="${Y(t)}" y2="${Y(t)}" style="stroke:var(--grid)"/><text x="${pl-6}" y="${Y(t)+4}" text-anchor="end" class="c-ax">${fmt(t,st<1?1:0)}</text>`}
  const step=o.tick||5;for(let t=Math.ceil(x0/step)*step;t<=x1;t+=step){s+=`<text x="${X(t)}" y="${h-pb+18}" text-anchor="middle" class="c-ax">${t}</text><line x1="${X(t)}" x2="${X(t)}" y1="${pt+ih}" y2="${pt+ih+4}" style="stroke:var(--axis)"/>`}
  const P=o.points.map(p=>[X(p.t),Y(p.y),p]);const gap=o.gap||2;
  for(let i=1;i<P.length;i++){const d=P[i][2].t-P[i-1][2].t>gap;s+=`<line x1="${P[i-1][0]}" y1="${P[i-1][1]}" x2="${P[i][0]}" y2="${P[i][1]}" style="stroke:${o.color||"var(--sea)"}" stroke-width="${d?1.5:2.2}" ${d?'stroke-dasharray="4 5" opacity=".6"':""}/>`}
  P.forEach(([px,py,p])=>{s+=`<g data-tip="${esc(p.tip||(p.when+": "+fmt(p.y,o.dec||0)+(o.unit||"")))}"><circle cx="${px}" cy="${py}" r="13" fill="transparent"/><circle cx="${px}" cy="${py}" r="${p.big?5.5:4}" style="fill:${p.big?(o.color||"var(--sea)"):"var(--surface)"};stroke:${o.color||"var(--sea)"}" stroke-width="2"/></g>`;
    if(p.label){const anc=px<pl+40?"start":px>w-pr-40?"end":"middle";s+=`<text x="${px}" y="${p.below?py+18:py-10}" text-anchor="${anc}" class="c-val">${esc(p.label)}</text>`}});
  s+=`<line x1="${pl}" x2="${w-pr}" y1="${pt+ih}" y2="${pt+ih}" style="stroke:var(--axis)"/></svg>`;
  if(o.bands)s+=`<div class="c-leg">${o.bands.map((b,i)=>`<span><i style="background:${b.color};opacity:.7"></i>${esc(b.short||String(i+1))} ${esc(b.label)}</span>`).join("")}</div>`;
  return s}};

/* ---------- pncols: 음수도 그리는 세로 막대 ---------- */
C.pncols=function(o){return w=>{
  const h=o.height||240,pl=o.padL||40,pr=12,pt=24,pb=34;const iw=w-pl-pr,ih=h-pt-pb;
  const vals=o.data.map(d=>d.value).concat(o.ref?[o.ref.value]:[]);let max=Math.max(0,...vals),min=Math.min(0,...vals);
  const st=nice(max-min);max=Math.ceil(max*1.12/st)*st;min=min<0?Math.floor(min*1.2/st)*st:0;
  const y=v=>pt+(max-v)/(max-min)*ih;const n=o.data.length,slot=iw/n,bw=Math.min(54,slot*0.58);
  let s=`<svg class="c-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.title||"")}">`;
  for(let t=min;t<=max+1e-9;t+=st){s+=`<line x1="${pl}" x2="${w-pr}" y1="${y(t)}" y2="${y(t)}" style="stroke:var(--grid)"/><text x="${pl-6}" y="${y(t)+4}" text-anchor="end" class="c-ax">${fmt(t,st<1?1:0)}</text>`}
  o.data.forEach((d,i)=>{const cx=pl+slot*i+slot/2,x=cx-bw/2,a=y(Math.max(0,d.value)),b=y(Math.min(0,d.value));const col=d.color||(d.value<0?"var(--bad)":"var(--sea)");
    s+=`<g data-tip="${esc(d.tip||(d.label+": "+fmt(d.value,o.dec||0)+(o.unit||"")))}"><rect x="${cx-slot/2}" y="${pt}" width="${slot}" height="${ih}" fill="transparent"/><rect x="${x}" y="${a}" width="${bw}" height="${Math.max(1,b-a)}" rx="3" style="fill:${col};${d.dim?"opacity:.5":""}"/>`;
    s+=`<text x="${cx}" y="${d.value<0?b+15:a-7}" text-anchor="middle" class="c-val">${esc(d.text||fmt(d.value,o.dec||0))}</text>`;
    s+=`<text x="${cx}" y="${h-pb+18}" text-anchor="middle" class="c-ax">${esc(d.label)}</text></g>`});
  s+=`<line x1="${pl}" x2="${w-pr}" y1="${y(0)}" y2="${y(0)}" style="stroke:var(--axis)"/>`;
  if(o.ref){const ry=y(o.ref.value);s+=`<line x1="${pl}" x2="${w-pr}" y1="${ry}" y2="${ry}" style="stroke:var(--hull)" stroke-width="1.5" stroke-dasharray="5 4"/>`}
  s+=`</svg>`;if(o.ref)s+=`<p class="c-note"><i class="c-key-ref"></i>${esc(o.ref.label)}</p>`;return s}};

window.Charts=C;
})();
