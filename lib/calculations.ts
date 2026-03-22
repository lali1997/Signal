export interface Entry { date: string; weight: number; steps: number }
export interface Meta { name: string; goal_weight: number; start_date: string; log_gap_warn: number }

const parseDate = (s: string) => new Date(s.replace(/(\d{2}) (\w{3}) (\d{4})/, '$2 $1, $3'))
const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }
const slp = (arr: number[]) => {
  const xs = arr.map((_, i) => i), mx = avg(xs), my = avg(arr)
  const n = xs.reduce((s, x, i) => s + (x - mx) * (arr[i] - my), 0)
  const d = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
  return d ? n / d : 0
}
export function rollingAvg(arr: number[], w: number) {
  return arr.map((_, i) => avg(arr.slice(Math.max(0, i - w + 1), i + 1)))
}
export function computeAll(entries: Entry[], meta: Meta, todayStr: string) {
  const W = entries.map(e => e.weight), S = entries.map(e => e.steps), DT = entries.map(e => e.date), N = entries.length
  const TODAY = new Date(todayStr), RA = rollingAvg(W, 7)
  const noiseFloor = med(W.slice(1).map((v, i) => Math.abs(v - W[i])))
  const ss = [...S].sort((a, b) => a - b)
  const cands = [...new Set([.3,.4,.5,.6,.7].map(p => Math.round(ss[Math.floor(N*p)]/500)*500))]
  let thr = cands[0], sep = 0
  cands.forEach(t => {
    const hi: number[] = [], lo: number[] = []
    for (let i = 0; i < N-1; i++) (S[i]>=t?hi:lo).push(W[i+1]-W[i])
    if (hi.length && lo.length) { const s2=avg(lo)-avg(hi); if(s2>sep){sep=s2;thr=t} }
  })
  const xs=S.slice(0,-1), ys=W.slice(1).map((v,i)=>v-W[i]), mx=avg(xs), my=avg(ys)
  const rN=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0), rD=xs.reduce((s,x)=>s+(x-mx)**2,0)
  const regSlope=rN/rD, regIntercept=my-regSlope*mx
  const yH=xs.map(x=>regSlope*x+regIntercept)
  const r2=Math.max(0,1-ys.reduce((s,y,i)=>s+(y-yH[i])**2,0)/ys.reduce((s,y)=>s+(y-my)**2,0))
  const wm=Math.min(21,N), rW=W.slice(-wm), wts=rW.map((_,i)=>1+(i/(wm-1))*2)
  const wD=rW.slice(1).map((v,i)=>(rW[i]-v)*wts[i+1])
  const wA=wD.reduce((a,b)=>a+b,0)/wts.slice(1).reduce((a,b)=>a+b,0)
  const df=rW.map((v,i)=>i?v-rW[i-1]:0), dSd=Math.sqrt(avg(df.map(d=>(d-avg(df))**2)))
  const momentum=Math.max(0,Math.min(100,Math.round((wA/0.1)*60+40-Math.min(dSd*20,30))))
  const totalDays=Math.max(1,Math.round((TODAY.getTime()-parseDate(DT[0]).getTime())/86400000)+1)
  const consistency=Math.round(Math.min(95,(1-Math.exp(-(N/totalDays)*3.5))*100))
  const l14=W.slice(-14), tV=l14.slice(1).reduce((s,v,i)=>s+Math.abs(v-l14[i]),0)
  const signal=!tV?50:Math.round(Math.min(100,Math.max(10,20+(Math.max(0,tV-noiseFloor*(l14.length-1))/tV)*80)))
  const lS=S[N-1], activity=lS>=ss[Math.floor(N*.9)]?95:lS>=ss[Math.floor(N*.75)]?82:lS>=ss[Math.floor(N*.6)]?68:lS>=ss[Math.floor(N*.4)]?52:lS>=ss[Math.floor(N*.2)]?32:14
  const gaps=DT.slice(1).map((_,i)=>(parseDate(DT[i+1]).getTime()-parseDate(DT[i]).getTime())/86400000)
  const onTime=gaps.filter(g=>g<=meta.log_gap_warn).length/gaps.length
  const months=Math.max(1,(parseDate(DT[N-1]).getTime()-parseDate(DT[0]).getTime())/86400000/30)
  const habit=Math.round(Math.min(95,(onTime*0.6+Math.min(1,N/(months*10))*0.4)*100))
  const spikes: number[]=[]
  for(let i=1;i<N;i++) if(W[i]-W[i-1]>noiseFloor) spikes.push(i)
  const lss=spikes.filter(i=>S[i-1]<thr), spikePct=spikes.length?Math.round(lss.length/spikes.length*100):0
  const l5=S.slice(-5), debt=l5.reduce((s,v)=>s+Math.max(0,thr-v),0)
  const rb=Math.min(3,0.65/((debt/(thr*5))||0.01))
  const riskScore=Math.min(100,Math.round(debt/(thr*5)*rb*100))
  const battery=Math.round(momentum*0.35+activity*0.3+Math.max(0,100-riskScore)*0.25+habit*0.1)
  const mood=momentum>=65&&riskScore<40?'thriving':momentum>=50&&riskScore<60?'progressing':slp(W.slice(-7))>-noiseFloor*0.3?'plateau':'caution'
  const k=-slp(W.slice(-7))
  const phase=k>noiseFloor*0.5?{word:'Active',label:'Active Loss',color:'#4a7c59'}:k>0?{word:'Settling',label:'Consolidation',color:'#6b6b6b'}:Math.abs(k)<noiseFloor*0.3?{word:'Plateau',label:'Plateau',color:'#c8793a'}:{word:'Volatile',label:'High Variance',color:'#c45c4a'}
  const vS: number[]=[]
  for(let i=6;i<N;i++){const sl=RA.slice(i-6,i+1),x2=sl.map((_,j)=>j),mx2=avg(x2),my2=avg(sl);const n2=x2.reduce((s,x,j)=>s+(x-mx2)*(sl[j]-my2),0),d2=x2.reduce((s,x)=>s+(x-mx2)**2,0);vS.push(d2?n2/d2:0)}
  const t3=Math.floor(vS.length/3), avgGap=avg(gaps)
  const earlyVel=avg(vS.slice(0,t3))*7, recentVel=avg(vS.slice(2*t3))*7
  const currentVel=(-slp(W.slice(-14))*7)/avgGap*7
  const velTrend=recentVel<earlyVel*0.8?'accelerating':recentVel>earlyVel*1.2?'decelerating':'stable'
  const lost=W[0]-W[N-1], total=W[0]-meta.goal_weight, remaining=Math.max(0,W[N-1]-meta.goal_weight)
  const goalPct=Math.min(100,Math.round(lost/total*100))
  const daysNeeded=currentVel<0?Math.round(remaining/Math.abs(currentVel)*avgGap*7):null
  const goalDate=daysNeeded?new Date(TODAY.getTime()+daysNeeded*86400000):null
  const minW=Math.min(...W), minWDate=DT[W.indexOf(minW)]
  let streak=1,cur=1
  for(let i=N-1;i>0;i--){if((parseDate(DT[i]).getTime()-parseDate(DT[i-1]).getTime())/86400000<=3)cur++;else break;streak=cur}
  const streakDays=Math.round((parseDate(DT[N-1]).getTime()-parseDate(DT[N-streak]).getTime())/86400000)+1
  const daysSinceLog=Math.round((TODAY.getTime()-parseDate(DT[N-1]).getTime())/86400000)
  const earlySteps=avg(S.slice(0,14)),recentSteps=avg(S.slice(-14))
  const stepChangePct=(recentSteps-earlySteps)/earlySteps*100
  const dayMap: Record<string,number[]>={}
  for(let i=0;i<N-1;i++){if(S[i]>=5000){const d=parseDate(DT[i+1]).toLocaleDateString('en-GB',{weekday:'long'});if(!dayMap[d])dayMap[d]=[];dayMap[d].push(W[i+1]-W[i])}}
  const optimalDays=Object.entries(dayMap).map(([d,c])=>({day:d,avg:avg(c),n:c.length})).filter(x=>x.n>=2).sort((a,b)=>a.avg-b.avg)
  const lC=W[N-1]-W[N-2],pS=S[N-2],isNoise=Math.abs(lC)<noiseFloor
  const sDesc=pS>=thr?`active (${(pS/1000).toFixed(1)}k steps)`:`sedentary (${(pS/1000).toFixed(1)}k steps)`
  let ydayText:string,ydayTag:string,ydayColor:string
  if(isNoise&&lC<=0){ydayText=`Down ${Math.abs(lC).toFixed(2)} kg — within ±${noiseFloor.toFixed(2)} kg noise floor. Clean reading. Day before: ${sDesc}.`;ydayTag='✓ Real signal';ydayColor='#4a7c59'}
  else if(isNoise&&lC>0){ydayText=`Up ${lC.toFixed(2)} kg inside noise floor. Biologically meaningless. Day before: ${sDesc}.`;ydayTag='Within noise — ignore';ydayColor='#6b6b6b'}
  else if(!isNoise&&lC>0&&pS<thr){ydayText=`Up ${lC.toFixed(2)} kg above noise. Day before: ${sDesc}. Low-step days preceded ${spikePct}% of spikes.`;ydayTag='⚠ Spike — low steps prior';ydayColor='#c8793a'}
  else if(!isNoise&&lC>0){ydayText=`Up ${lC.toFixed(2)} kg above noise. Day before: ${sDesc}. Watch next entry.`;ydayTag='Monitor next reading';ydayColor='#c8793a'}
  else{ydayText=`Down ${Math.abs(lC).toFixed(2)} kg — meaningful drop above noise. Day before: ${sDesc}.`;ydayTag='✓ Strong signal';ydayColor='#4a7c59'}
  const weekMap: Record<string,number[]>={}
  entries.forEach(e=>{const dt=parseDate(e.date),k=`${dt.getFullYear()}-W${String(dt.getMonth()*4+Math.floor(dt.getDate()/7)+1).padStart(2,'0')}`;if(!weekMap[k])weekMap[k]=[];weekMap[k].push(e.weight)})
  const weeklyBlocks=Object.keys(weekMap).sort().slice(-12).map(k=>{const e=weekMap[k];return{key:k,change:e.length>=2?e[0]-e[e.length-1]:0}})
  const dB: number[][]=Array(7).fill(null).map(()=>[])
  entries.forEach(e=>dB[parseDate(e.date).getDay()].push(e.weight))
  const dowAvg=dB.map(b=>b.length?avg(b):null)
  const dV=dowAvg.filter((v): v is number=>v!==null)
  const dN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const recs: number[]=[]; let iS=false,sI=0,bW=0
  for(let i=1;i<N;i++){if(!iS&&W[i]-W[i-1]>noiseFloor*1.5){iS=true;sI=i;bW=W[i-1]}if(iS&&W[i]<=bW){recs.push(i-sI);iS=false}}
  const miles=[]
  for(let m=Math.ceil(W[0]);m>=Math.floor(meta.goal_weight);m--){const ci=entries.findIndex(e=>e.weight<=m);miles.push({kg:m,crossed:ci>=0,date:ci>=0?DT[ci]:null,isCurrent:ci>=0&&W[N-1]<=m&&W[N-1]>m-1})}
  const p15=ss[Math.floor(N*.15)],p60=ss[Math.floor(N*.6)],p75=ss[Math.floor(N*.75)],p90=ss[Math.floor(N*.9)],p50=ss[Math.floor(N*.5)],p25=ss[Math.floor(N*.25)]
  const bds=[{l:`0–${Math.round(p25/1000)}k`,lo:0,hi:p25},{l:`${Math.round(p25/1000)}–${Math.round(p50/1000)}k`,lo:p25,hi:p50},{l:`${Math.round(p50/1000)}–${Math.round(p75/1000)}k`,lo:p50,hi:p75},{l:`${Math.round(p75/1000)}–${Math.round(p90/1000)}k`,lo:p75,hi:p90},{l:`${Math.round(p90/1000)}k+`,lo:p90,hi:Infinity}]
  const stepBands=bds.map(b=>{const ch: number[]=[]; for(let i=0;i<N-1;i++) if(S[i]>=b.lo&&S[i]<b.hi)ch.push(W[i+1]-W[i]);return{label:b.l,avg:ch.length?avg(ch):null,n:ch.length}}).filter(b=>b.avg!==null)
  const wC=S.map((s,i)=>i<N-1&&s<=p15?W[i+1]-W[i]:null).filter((v): v is number=>v!==null)
  const aC=S.map((s,i)=>i<N-1&&s>=p60?W[i+1]-W[i]:null).filter((v): v is number=>v!==null)
  return {
    entries,W,S,DT,N,RA,noiseFloor,stepThreshold:thr,
    regression:{slope:regSlope,intercept:regIntercept,r2,n:xs.length},
    scores:{momentum,consistency,signal,activity,habit,battery},
    mood,phase,riskScore,spikePct,totalSpikes:spikes.length,
    velocity:{early:earlyVel,recent:recentVel,current:currentVel,trend:velTrend,avgGap},
    goal:{pct:goalPct,remaining,lost,date:goalDate,daysNeeded},
    atl:{weight:minW,date:minWDate},
    streak:streakDays,daysSinceLog,
    adapt:{changePct:stepChangePct,isBehavioural:stepChangePct<-10,earlySteps,recentSteps},
    optimalDays,
    ydayExplainer:{text:ydayText,tag:ydayTag,color:ydayColor},
    weeklyBlocks,
    dow:{avg:dowAvg,heaviest:dN[dowAvg.indexOf(Math.max(...dV))],lightest:dN[dowAvg.indexOf(Math.min(...dV))]},
    recovery:{avg:recs.length?avg(recs).toFixed(1):'--',improving:recs.length>=3?avg(recs.slice(Math.floor(recs.length/2)))<avg(recs.slice(0,Math.floor(recs.length/2))):null},
    milestones:miles,stepBands,
    actGap:Math.abs((aC.length?avg(aC):0)-(wC.length?avg(wC):0)),
    wfhAvg:wC.length?avg(wC):0,activeAvg:aC.length?avg(aC):0,
    meta,TODAY:todayStr,
  }
}
