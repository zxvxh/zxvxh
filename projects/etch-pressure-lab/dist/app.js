'use strict';
const D=window.EXPERIMENT_DATA,M=window.PressureModel,$=id=>document.getElementById(id);
const fmt=(v,d=2)=>v===null?'미안정화':Number(v).toFixed(d);
const initial=[0,4,12,20,24];
let observed=[],currentIndex=12,trace=M.simulate(12),cursor=0,playing=false,frame=null,lastTime=0;
let batchRunning=false;
function selectTab(name){document.querySelectorAll('.tab').forEach(el=>el.classList.toggle('active',el.id===name));document.querySelectorAll('nav button').forEach(el=>el.classList.toggle('active',el.dataset.tab===name));requestAnimationFrame(drawAll);}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>selectTab(b.dataset.tab));
function context(id){const canvas=$(id),rect=canvas.getBoundingClientRect();if(!rect.width)return null;const scale=devicePixelRatio||1;canvas.width=rect.width*scale;canvas.height=rect.height*scale;const c=canvas.getContext('2d');c.scale(scale,scale);return {c,w:rect.width,h:rect.height};}
function drawChamber(){const box=context('chamber');if(!box)return;const {c,w,h}=box;const r=trace[Math.min(3000,Math.floor(cursor))];const t=r[0],pressure=r[1],opening=r[2];c.save();const scale=Math.min(w/410,h/330);c.translate((w-410*scale)/2,(h-330*scale)/2);c.scale(scale,scale);
  c.lineCap='round';c.lineJoin='round';c.strokeStyle='#9eafb4';c.lineWidth=13;c.beginPath();c.moveTo(34,77);c.lineTo(120,77);c.lineTo(120,107);c.moveTo(205,238);c.lineTo(205,286);c.lineTo(324,286);c.stroke();
  c.strokeStyle='#3155cb';c.lineWidth=3;c.beginPath();c.moveTo(34,77);c.lineTo(120,77);c.lineTo(120,107);c.stroke();
  const g=c.createLinearGradient(90,0,315,0);g.addColorStop(0,'#bdcbd0');g.addColorStop(.3,'#f3f7f8');g.addColorStop(.7,'#dce6e9');g.addColorStop(1,'#a3b8bf');c.fillStyle=g;c.beginPath();c.roundRect(86,100,238,140,19);c.fill();c.strokeStyle='#a4b8bf';c.lineWidth=1;c.stroke();c.fillStyle='#edf2ff';c.beginPath();c.roundRect(102,116,206,107,10);c.fill();
  for(let i=0;i<24;i++){const x=111+((i*47+t*(7+i%4))%185),y=127+((i*23+t*(3+i%3))%79);c.fillStyle=`rgba(0,135,120,${.2+(pressure-40)/80})`;c.beginPath();c.arc(x,y,2.3,0,Math.PI*2);c.fill();}
  c.fillStyle='#445c67';c.fillRect(143,202,125,6);c.fillStyle='#596c8b';c.beginPath();c.ellipse(205,198,54,7,0,0,Math.PI*2);c.fill();c.strokeStyle='#9aaccb';c.stroke();
  c.fillStyle='#fff';c.beginPath();c.arc(205,267,18,0,Math.PI*2);c.fill();c.strokeStyle='#7e90ba';c.lineWidth=2;c.stroke();c.save();c.translate(205,267);c.rotate(opening*Math.PI/2);c.strokeStyle='#1428a0';c.lineWidth=5;c.beginPath();c.moveTo(-13,0);c.lineTo(13,0);c.stroke();c.restore();
  c.fillStyle='#182b55';c.beginPath();c.arc(335,286,25,0,Math.PI*2);c.fill();c.save();c.translate(335,286);c.rotate(t*2);c.fillStyle='#9daeea';for(let i=0;i<3;i++){c.rotate(Math.PI*2/3);c.beginPath();c.ellipse(9,0,11,5,0,0,Math.PI*2);c.fill();}c.restore();
  c.font='14px Pretendard, sans-serif';c.fillStyle='#536e76';c.textAlign='left';c.fillText('가스 유입',15,48);c.fillText('Q = 0.2 Torr·L/s',15,65);c.textAlign='center';c.fillText('웨이퍼',205,188);c.fillText('챔버 10 L',205,148);c.font='bold 22px Pretendard, sans-serif';c.fillStyle='#1428a0';c.fillText(pressure.toFixed(2)+' mTorr',205,174);c.font='13px Pretendard, sans-serif';c.textAlign='left';c.fillStyle='#536e76';c.fillText('배기 밸브',235,252);c.fillText((opening*100).toFixed(1)+'% 열림',235,270);c.fillText('진공펌프',308,327);c.restore();
}
function drawPlot(){const box=context('plot');if(!box)return;const {c,w,h}=box;const left=45,right=w-12,top=15,bottom=h-35;const max=Math.max(52,...trace.map(r=>r[1]))+1;const x=t=>left+t/30*(right-left),y=p=>bottom-(p-39)/(max-39)*(bottom-top);c.fillStyle='#e0f2ec';c.fillRect(left,y(50.2),right-left,y(49.8)-y(50.2));c.font='12px sans-serif';c.fillStyle='#71868b';c.strokeStyle='#e1e9eb';c.lineWidth=1;for(let t=0;t<=30;t+=5){c.beginPath();c.moveTo(x(t),top);c.lineTo(x(t),bottom);c.stroke();c.fillText(t+'',x(t)-4,bottom+19);}for(let p=40;p<=max;p+=2){c.beginPath();c.moveTo(left,y(p));c.lineTo(right,y(p));c.stroke();c.fillText(p+'',8,y(p)+4);}c.setLineDash([4,4]);c.strokeStyle='#c98454';c.beginPath();c.moveTo(left,y(50.5));c.lineTo(right,y(50.5));c.stroke();c.setLineDash([]);c.strokeStyle='#1428a0';c.lineWidth=2.5;c.beginPath();for(let i=0;i<=Math.floor(cursor);i+=2){const r=trace[i];if(i===0)c.moveTo(x(r[0]),y(r[1]));else c.lineTo(x(r[0]),y(r[1]));}c.stroke();const r=trace[Math.floor(cursor)];c.fillStyle='#1428a0';c.beginPath();c.arc(x(r[0]),y(r[1]),4,0,Math.PI*2);c.fill();c.fillStyle='#71868b';c.fillText('초',right-8,h-1);}
function drawSearch(){const box=context('search-plot');if(!box)return;const {c,w,h}=box;const left=50,right=w-30,top=25,bottom=h-42;const x=n=>left+(n-5)/5*(right-left),y=v=>bottom-v/18*(bottom-top);c.font='13px sans-serif';c.strokeStyle='#dfe8e9';c.fillStyle='#6a8187';for(let v=0;v<=18;v+=3){c.beginPath();c.moveTo(left,y(v));c.lineTo(right,y(v));c.stroke();c.fillText(v+' s',5,y(v)+4);}for(let n=5;n<=10;n++)c.fillText(n+'회',x(n)-9,bottom+25);let best=Infinity;const curve=D.ai.map(r=>{if(r.feasible)best=Math.min(best,r.settling_s);return best;}).slice(4);[[curve,'#1428a0'],[D.summary.random_curve_median,'#bb642c']].forEach(([values,color])=>{c.strokeStyle=color;c.lineWidth=3;c.beginPath();values.forEach((v,i)=>{if(!i)c.moveTo(x(5+i),y(v));else c.lineTo(x(5+i),y(v));});c.stroke();values.forEach((v,i)=>{c.fillStyle=color;c.beginPath();c.arc(x(5+i),y(v),4,0,Math.PI*2);c.fill();});});c.fillStyle='#1428a0';c.fillText('AI 추천',left+12,18);c.fillStyle='#bb642c';c.fillText('무작위 탐색 중앙값',left+95,18);}
function drawAll(){drawChamber();drawPlot();drawSearch();}
function updateReadouts(){const r=trace[Math.floor(cursor)];$('pressure').textContent=fmt(r[1]);$('opening').textContent=fmt(r[2]*100,1);$('time').textContent=fmt(r[0]);$('scrub').value=Math.floor(cursor);updateObservation(r);drawChamber();drawPlot();}
function showMetrics(row){$('qualification-label').textContent='5초 목표 최종 판정';$('overshoot').textContent=fmt(row.overshoot_step_pct)+' %';$('settling').textContent=row.settling_s===null?'30초 내 미확인':fmt(row.settling_s)+' s';$('qualified').textContent=row.qualified?'목표 달성':'목표 미달';}
function record(row){if(!observed.some(r=>r.index===row.index))observed.push(row);$('count').textContent=observed.length;renderHistory();}
function finish(){playing=false;$('scrub').disabled=false;$('pause').disabled=true;$('kp').disabled=false;$('ki').disabled=false;$('run').disabled=false;$('initial').disabled=false;$('recommend').disabled=false;$('status').textContent='계산·재생 완료';const row=M.metrics(currentIndex,trace);showMetrics(row);record(row);}
function animate(now){if(!playing)return;const elapsed=lastTime?(now-lastTime)/1000:0;lastTime=now;cursor=Math.min(3000,cursor+elapsed*100*Number($('speed').value));updateReadouts();if(cursor>=3000){finish();return;}frame=requestAnimationFrame(animate);}
function stop(){playing=false;cancelAnimationFrame(frame);lastTime=0;}
function launch(index){if(batchRunning)return;stop();$('qualification-label').textContent='현재 압력 상태';currentIndex=index;trace=M.simulate(index);cursor=0;$('kp').value=M.grid[index][0];$('ki').value=M.grid[index][1];$('status').textContent=`E${String(index+1).padStart(2,'0')} 실행 중`;$('overshoot').textContent='—';$('settling').textContent='—';$('qualified').textContent='—';$('pause').disabled=false;$('pause').textContent='일시정지';$('run').disabled=true;$('kp').disabled=true;$('ki').disabled=true;$('initial').disabled=true;$('recommend').disabled=true;$('scrub').disabled=true;playing=true;updateReadouts();frame=requestAnimationFrame(animate);}
$('run').onclick=()=>{const kp=Number($('kp').value),ki=Number($('ki').value);if(!$('kp').value||!$('ki').value||!Number.isFinite(kp)||!Number.isFinite(ki)||kp<0||kp>1||ki<0||ki>1){$('input-error').textContent='Kp와 Ki에 0~1 사이 숫자를 입력하세요.';return;}$('input-error').textContent='';launch(registerGain(kp,ki));};
$('pause').onclick=()=>{if(playing){stop();$('pause').textContent='계속 재생';$('status').textContent='일시정지';}else{playing=true;lastTime=0;$('pause').textContent='일시정지';$('status').textContent='재생 중';frame=requestAnimationFrame(animate);}};
$('scrub').oninput=()=>{cursor=Number($('scrub').value);updateReadouts();};
$('initial').onclick=()=>{stop();for(const index of initial){const samples=M.simulate(index);record(M.metrics(index,samples));}currentIndex=24;trace=M.simulate(24);cursor=3000;$('kp').value='0.25';$('ki').value='0.25';$('status').textContent='초기 5조건 완료';$('scrub').disabled=false;showMetrics(M.metrics(24,trace));updateReadouts();$('recommendation').textContent='초기 조건 E01, E05, E13, E21, E25를 계산했습니다. 다음 조건을 추천받아 보세요.';};
$('recommend').onclick=()=>{if(observed.length<2){$('recommendation').textContent='먼저 서로 다른 두 조건 이상을 실행하거나 초기 5조건을 실행하세요.';return;}const next=M.recommend(observed);if(!next){$('recommendation').textContent='등록한 후보를 모두 확인했습니다. 새 범위를 추가하면 다시 추천할 수 있습니다.';return;}const [kp,ki]=M.grid[next.index];$('kp').value=kp;$('ki').value=ki;$('recommendation').textContent=`E${String(next.index+1).padStart(2,'0')} 추천 · Kp ${fmt(kp,4)}, Ki ${fmt(ki,4)}. 예측 안정화 ${fmt(next.prediction[1])}초, 초과율 기준 만족 확률 ${fmt(next.probability*100,0)}%. 기대 개선량과 불확실성을 함께 고려했습니다. 실험 실행으로 확인하세요.`;};
$('reset').onclick=()=>{stop();observed=[];$('count').textContent='0';renderHistory();cursor=0;$('status').textContent='실행 대기';$('kp').disabled=false;$('ki').disabled=false;$('run').disabled=false;$('initial').disabled=false;$('recommend').disabled=false;$('pause').disabled=true;$('scrub').disabled=true;['overshoot','settling','qualified'].forEach(id=>$(id).textContent='—');$('recommendation').textContent='초기 5조건을 실행하거나 직접 조건을 선택하세요.';updateReadouts();};
function resultCells(r){return `<td>${r.id}</td><td>${fmt(r.kp,4)}</td><td>${fmt(r.ki,4)}</td><td>${fmt(r.peak_mTorr)}</td><td class="${r.overshoot_step_pct<=5?'good':'bad'}">${fmt(r.overshoot_step_pct)}</td><td>${fmt(r.settling_s)}</td>`;}
function renderHistory(){$('history').innerHTML=observed.length?observed.map((r,i)=>`<tr><td>${i+1}</td>${resultCells(r)}<td>${r.qualified?'달성':'미달'}</td></tr>`).join(''):'<tr><td colspan="8">실험을 실행하면 결과가 여기에 쌓입니다.</td></tr>';}
function downloadCSV(name,rows){if(!rows.length)return;const keys=Object.keys(rows[0]);const csv='\ufeff'+[keys.join(','),...rows.map(row=>keys.map(k=>row[k]??'').join(','))].join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('download-session').onclick=()=>downloadCSV('my_pressure_experiments.csv',observed);
const summary=D.summary;$('benchmark-metrics').innerHTML=[['AI가 찾은 최선',fmt(summary.ai_best_s)+' s','9번째 실험에서 최적 조합 발견'],['무작위 10회 최선 중앙값',fmt(summary.random_median_best_s)+' s','15,504개 추가 5조건 묶음 전수 계산'],['무작위 10회 최적 발견 확률',fmt(summary.random_optimum_probability*100,0)+' %','같은 초기 5조건 · 중복 없는 추가 5회']].map(([label,value,note])=>`<div class="panel metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');
$('ai-results').innerHTML=D.ai.map(r=>`<tr><td>${r.trial}</td><td>${r.id}</td><td>${fmt(r.kp)} / ${fmt(r.ki)}</td><td>${r.predicted_settling_s===undefined?'—':fmt(r.predicted_settling_s)+' s'}</td><td>${fmt(r.settling_s)}</td><td>${fmt(r.overshoot_step_pct)}%</td><td>${r.trial<=5?'초기 고정 조건':'제약 기대 개선량'}</td></tr>`).join('');
$('claim').textContent=`25개 후보 중 초과율 기준과 안정화 판정을 만족한 조건은 ${summary.feasible_count}개였습니다. AI는 9회차에 최적 조합 E22를 찾았습니다. 10회 예산에서 확보한 안정화 시간은 ${fmt(summary.ai_best_s)}초로, 무작위 탐색 중앙값 ${fmt(summary.random_median_best_s)}초 대비 ${fmt((1-summary.ai_best_s/summary.random_median_best_s)*100,1)}% 짧았습니다. 이는 확보한 제어 성능의 차이입니다. 25개 전수 평가 대비 해당 조합을 발견하기까지의 평가 횟수는 64% 적었으며, 전체 최적 여부는 전수 평가 후 확인했습니다.`;
$('validation').textContent=`RK4 적분 간격을 절반으로 줄인 25개 파형 비교에서 최대 압력 차이는 ${summary.integration_max_pressure_difference_mTorr.toExponential(2)} mTorr였습니다. 제어 주기는 동일하게 유지했습니다. 밸브 고정 시 해석적 평형압력과 계산값 차이는 ${summary.equilibrium_error_mTorr.toExponential(2)} mTorr였습니다. 이 검사는 수치 계산의 일관성을 확인합니다. 실제 장비와의 일치는 실측 파형으로 검증해야 합니다.`;
window.addEventListener('resize',drawAll);drawAll();

function updateObservation(r){
 const elapsed=r[0],inside=Math.abs(r[1]-50)<=.2;
 let message='목표는 50 mTorr입니다. 실행하면 30초 동안 도달 과정과 유지 상태를 관찰합니다.';
 $('observation-note').classList.toggle('reached',inside&&elapsed>0);
 if(elapsed>0&&elapsed<30){
  let start=Math.floor(cursor);
  while(start>0&&Math.abs(trace[start-1][1]-50)<=.2)start--;
  const hold=Math.max(0,elapsed-trace[start][0]);
  message=inside?'✓ 목표 범위 도달 · '+hold.toFixed(1)+'초째 유지 중':'목표 범위 밖 · 압력을 조절하고 있습니다';
  message+=' | 남은 관찰 '+(30-elapsed).toFixed(1)+'초';
  if(playing){$('status').textContent=inside?'✓ 목표 범위 도달':'압력 조절 중';$('qualified').textContent=inside?'도달 ✓':'범위 밖';$('qualified').classList.toggle('live-success',inside);}
 }
 if(elapsed>=30)message='30초 관찰 완료 · 아래에서 최종 안정화 시간과 5초 목표 판정을 확인하세요.';
 $('observation-note').textContent=message;
}
function registerGain(kp,ki){
 let index=M.grid.findIndex(g=>Math.abs(g[0]-kp)<1e-9&&Math.abs(g[1]-ki)<1e-9);
 if(index<0){index=M.grid.length;M.grid.push([kp,ki]);}
 $('candidate-count').textContent='/ '+M.grid.length+' 조건 확인';
 return index;
}
function rangeCandidates(){
 const values=['kp-min','kp-max','ki-min','ki-max','gain-step'].map(id=>Number($(id).value));
 const [pmin,pmax,imin,imax,step]=values;
 if(values.some(v=>!Number.isFinite(v))||pmin<0||imin<0||pmax>1||imax>1||pmin>pmax||imin>imax||step<.001)throw Error('0~1 안에서 시작 ≤ 끝, 간격 ≥ 0.001로 입력하세요.');
 const np=Math.floor((pmax-pmin+1e-9)/step)+1,ni=Math.floor((imax-imin+1e-9)/step)+1;
 if(np*ni>400)throw Error('한 번에 400조합까지 실행할 수 있어요. 간격을 넓히거나 범위를 나눠 주세요.');
 const ids=[];
 for(let i=0;i<np;i++)for(let j=0;j<ni;j++)ids.push(registerGain(Number((pmin+i*step).toFixed(6)),Number((imin+j*step).toFixed(6))));
 return ids;
}
$('register-grid').onclick=()=>{try{const ids=rangeCandidates();$('batch-status').textContent=ids.length+'조합을 탐색 후보에 등록했습니다. AI가 미실행 후보를 추천할 수 있습니다.';}catch(error){$('batch-status').textContent=error.message;}};
$('run-grid').onclick=async()=>{
 let ids;try{ids=rangeCandidates();}catch(error){$('batch-status').textContent=error.message;return;}
 stop();batchRunning=true;
 const locked=['run','pause','initial','recommend','reset','run-grid','register-grid','kp','ki'];
 locked.forEach(id=>$(id).disabled=true);
 try{
  for(let i=0;i<ids.length;i++){
   const index=ids[i];
   if(!observed.some(row=>row.index===index))record(M.metrics(index,M.simulate(index)));
   $('batch-status').textContent=(i+1)+' / '+ids.length+' 조건 확인 중';
   if(i%5===0)await new Promise(resolve=>setTimeout(resolve,0));
  }
  const best=observed.filter(row=>row.feasible).sort((a,b)=>a.settling_s-b.settling_s)[0];
  $('batch-status').textContent=ids.length+'조합 확인 완료. '+(best?'현재 기록의 최선 '+best.id+' · '+fmt(best.settling_s)+'초':'현재 기록에 합격 조건이 없습니다.');
 }finally{batchRunning=false;locked.forEach(id=>$(id).disabled=false);$('pause').disabled=true;}
};

let mapRows=[];
function mapState(r){return r.settling_s===null?'unsettled':r.qualified?'pass':r.overshoot_step_pct>5?'over':'slow';}
const mapLabels={pass:'✓ 목표 달성',slow:'◷ 시간 초과',over:'! 압력 초과',unsettled:'— 안정화 미확인'};
function renderMap(){
 const n=Number($('map-size').value), levels=Array.from({length:n},(_,i)=>(i+1)*.05);
 mapRows=levels.flatMap(kp=>levels.map(ki=>{const index=registerGain(Number(kp.toFixed(2)),Number(ki.toFixed(2)));return M.metrics(index,M.simulate(index));}));
 $('grid').style.gridTemplateColumns=`70px repeat(${n},minmax(115px,1fr))`;
 $('grid').innerHTML='<span class="axis">Kp / Ki</span>'+levels.map(v=>`<span class="axis">${fmt(v)}</span>`).join('')+levels.map((kp,i)=>`<span class="axis">${fmt(kp)}</span>`+levels.map((ki,j)=>{const r=mapRows[i*n+j],state=mapState(r);return `<button data-index="${r.index}" class="map-${state}" aria-label="${r.id}, Kp ${fmt(kp)}, Ki ${fmt(ki)}, ${mapLabels[state]}"><strong>${r.id}</strong><span>${mapLabels[state]}</span><span>${r.settling_s===null?'30초 내 미확인':fmt(r.settling_s)+'초'}</span><span>초과 ${fmt(r.overshoot_step_pct,1)}%</span></button>`;}).join('')).join('');
 $('all-results').innerHTML=mapRows.map(r=>`<tr data-index="${r.index}">${resultCells(r)}<td>${fmt(r.valve_travel_pct)}</td><td>${r.overshoot_step_pct<=5?'통과':'초과'}</td><td><span class="map-badge map-${mapState(r)}">${mapLabels[mapState(r)]}</span></td></tr>`).join('');
 const counts={pass:0,slow:0,over:0,unsettled:0};mapRows.forEach(r=>counts[mapState(r)]++);
 $('map-summary').textContent=`${n*n}조합 계산 완료 · 목표 달성 ${counts.pass}개 · 시간 초과 ${counts.slow}개 · 압력 초과 ${counts.over}개 · 안정화 미확인 ${counts.unsettled}개`;
 document.querySelectorAll('#results [data-index]').forEach(el=>el.onclick=()=>{selectTab('lab');launch(Number(el.dataset.index));window.scrollTo({top:0,behavior:'smooth'});});
}
$('map-size').onchange=renderMap;
$('download-map').onclick=()=>downloadCSV('pressure_map_'+mapRows.length+'.csv',mapRows);
renderMap();
