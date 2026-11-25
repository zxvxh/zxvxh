/* Same RK4 plant and sampled PI controller as analysis/experiment.py. */
(function(root) {
  const levels = [.05,.10,.15,.20,.25];
  const grid = levels.flatMap(kp => levels.map(ki => [kp,ki]));
  function plantStep(p,u,command,dt=.01) {
    const derivative=(p,u)=>[20-(.1+.8*u)*p,(command-u)/.5];
    const a=derivative(p,u);
    const b=derivative(p+dt*a[0]/2,u+dt*a[1]/2);
    const c=derivative(p+dt*b[0]/2,u+dt*b[1]/2);
    const d=derivative(p+dt*c[0],u+dt*c[1]);
    return [p+dt*(a[0]+2*b[0]+2*c[0]+d[0])/6,u+dt*(a[1]+2*b[1]+2*c[1]+d[1])/6];
  }
  function simulate(index) {
    const [kp,ki]=grid[index];
    let p=40,u=.5,integral=0;
    const rows=[];
    for(let tick=0;tick<=3000;tick++) {
      const error=(50-p)/10;
      const raw=.5-kp*error-integral;
      const command=Math.max(0,Math.min(1,raw));
      rows.push([tick*.01,p,u,command,integral]);
      if((raw>0&&raw<1)||(raw<=0&&error<0)||(raw>=1&&error>0)) integral+=ki*error*.01;
      [p,u]=plantStep(p,u,command);
    }
    return rows;
  }
  function metrics(index,rows) {
    let peak=40,lastOutside=-1,travel=0,iae=0,saturation=0;
    rows.forEach((r,i)=>{
      peak=Math.max(peak,r[1]);
      if(Math.abs(r[1]-50)>.2)lastOutside=i;
      if(i>0){travel+=Math.abs(r[2]-rows[i-1][2])*100;iae+=(Math.abs(r[1]-50)+Math.abs(rows[i-1][1]-50))*.005;}
      if(i<3000&&(r[3]<=0||r[3]>=1))saturation+=.01;
    });
    const settling=(lastOutside+1)*.01<=28?(lastOutside+1)*.01:null;
    const overshoot=Math.max(0,peak-50)*10;
    const feasible=overshoot<=5&&settling!==null;
    return {index,id:`E${String(index+1).padStart(2,'0')}`,kp:grid[index][0],ki:grid[index][1],peak_mTorr:peak,overshoot_step_pct:overshoot,settling_s:settling,feasible,qualified:feasible&&settling<=5,iae_mTorr_s:iae,valve_travel_pct:travel,saturation_s:saturation};
  }
  function cholesky(matrix) {
    const n=matrix.length,lower=Array.from({length:n},()=>Array(n).fill(0));
    for(let i=0;i<n;i++)for(let j=0;j<=i;j++){
      let value=matrix[i][j];
      for(let k=0;k<j;k++)value-=lower[i][k]*lower[j][k];
      lower[i][j]=i===j?Math.sqrt(Math.max(value,1e-12)):value/lower[j][j];
    }
    return lower;
  }
  function forward(lower,vector){
    const result=[];
    for(let i=0;i<vector.length;i++){
      let value=vector[i];
      for(let j=0;j<i;j++)value-=lower[i][j]*result[j];
      result.push(value/lower[i][i]);
    }
    return result;
  }
  function solveFactor(lower,vector){
    const result=forward(lower,vector);
    for(let i=result.length-1;i>=0;i--){
      for(let j=i+1;j<result.length;j++)result[i]-=lower[j][i]*result[j];
      result[i]/=lower[i][i];
    }
    return result;
  }
  function normalCDF(x) {
    const sign=x<0?-1:1,z=Math.abs(x)/Math.sqrt(2),t=1/(1+.3275911*z);
    const erf=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-z*z);
    return (1+sign*erf)/2;
  }
  function recommend(observed) {
    const candidates=grid.map((_,i)=>i).filter(i=>!observed.some(r=>r.index===i));
    if(!candidates.length||observed.length<2)return null;
    const kernel=(i,j)=>Math.exp(-grid[i].reduce((s,v,k)=>s+((v-grid[j][k])/.2)**2,0)/(2*.4**2));
    const matrix=observed.map((r,i)=>observed.map((s,j)=>kernel(r.index,s.index)+(i===j?1e-6:0)));
    const values=observed.map(r=>[r.overshoot_step_pct,r.settling_s??30.01]);
    const mean=[0,1].map(k=>values.reduce((s,v)=>s+v[k],0)/values.length);
    const std=[0,1].map(k=>Math.max(1e-5,Math.sqrt(values.reduce((s,v)=>s+(v[k]-mean[k])**2,0)/values.length)));
    const best=Math.min(...observed.filter(r=>r.feasible).map(r=>r.settling_s));
    const factor=cholesky(matrix);
    const alpha=[0,1].map(k=>solveFactor(factor,values.map(v=>v[k]-mean[k])));
    let chosen=null;
    for(const index of candidates){
      const cross=observed.map(r=>kernel(r.index,index)),weight=forward(factor,cross);
      const variance=Math.max(1e-10,1-weight.reduce((s,v)=>s+v*v,0));
      const prediction=[0,1].map(k=>mean[k]+cross.reduce((s,v,i)=>s+v*alpha[k][i],0));
      const sigma=std.map(s=>s*Math.sqrt(variance));
      const probability=normalCDF((5-prediction[0])/sigma[0]);
      let score=probability;
      if(Number.isFinite(best)){
        const gain=best-prediction[1],z=gain/sigma[1];
        score=(gain*normalCDF(z)+sigma[1]*Math.exp(-z*z/2)/Math.sqrt(2*Math.PI))*probability;
      }
      if(chosen===null||score>chosen.score)chosen={index,score,prediction,sigma,probability};
    }
    return chosen;
  }
  const api={levels,grid,simulate,metrics,recommend};
  if(typeof module!=='undefined')module.exports=api;
  root.PressureModel=api;
})(typeof window!=='undefined'?window:globalThis);
