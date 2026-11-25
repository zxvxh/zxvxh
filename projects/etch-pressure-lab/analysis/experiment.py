"""Reproduce the 25 virtual experiments. Python 3 + numpy, scipy, matplotlib.

Run from any directory. Outputs are written into the project dist/data directory.
Model structure follows Madhukar et al. (2002), eq. 3.8.
All numerical plant parameters are educational assumptions, not fitted data.
"""
import csv
import json
from itertools import product, combinations
from pathlib import Path

import numpy as np
from scipy.special import ndtr
from scipy.spatial.distance import cdist
import matplotlib.pyplot as plt

OUT = Path(__file__).resolve().parents[1] / 'dist' / 'data'
OUT.mkdir(parents=True, exist_ok=True)
LEVELS = [0.05, 0.10, 0.15, 0.20, 0.25]
GRID = np.array(list(product(LEVELS, LEVELS)))
INITIAL = [0, 4, 12, 20, 24]
DT = 0.01
HORIZON = 30.0
PARAMETERS = dict(volume_L=10, throughput_Torr_L_s=0.2,
                  pumping_speed_min_L_s=1, pumping_speed_span_L_s=8,
                  valve_time_constant_s=0.5, initial_pressure_mTorr=40,
                  target_pressure_mTorr=50, pressure_error_scale_mTorr=10,
                  controller_period_s=DT, observation_s=HORIZON,
                  settling_band_mTorr=0.2, overshoot_limit_step_pct=5,
                  qualification_time_s=5, minimum_hold_s=2)


def plant_step(pressure, opening, command, step):
    """RK4 integration of pressure/valve, command held for one control tick."""
    def derivative(p, u):
        return np.array([20 - (0.1 + 0.8*u)*p, (command-u)/0.5])
    state = np.array([pressure, opening])
    a = derivative(*state)
    b = derivative(*(state + step*a/2))
    c = derivative(*(state + step*b/2))
    d = derivative(*(state + step*c))
    return state + step*(a + 2*b + 2*c + d)/6


def simulate(kp, ki, substeps=1):
    times = np.arange(round(HORIZON/DT)+1)*DT
    pressure, opening, integral = 40.0, 0.5, 0.0
    records = []
    for t in times:
        error = (50-pressure)/10
        raw = 0.5-kp*error-integral
        command = np.clip(raw, 0, 1)
        records.append([t, pressure, opening, command, integral])
        # Conditional integration permits recovery from actuator saturation.
        if 0 < raw < 1 or (raw <= 0 and error < 0) or (raw >= 1 and error > 0):
            integral += ki*error*DT
        for _ in range(substeps):
            pressure, opening = plant_step(pressure, opening, command, DT/substeps)
    return np.array(records)


def metrics(trace):
    t, p, u, command, _ = trace.T
    outside = np.flatnonzero(np.abs(p-50) > 0.2)
    next_index = outside[-1]+1 if len(outside) else 0
    settled = next_index < len(t) and t[next_index] <= HORIZON-2
    settling = float(t[next_index]) if settled else None
    overshoot = float(max(0, p.max()-50)/10*100)
    feasible = overshoot <= 5 and settled
    return dict(peak_mTorr=float(p.max()), overshoot_step_pct=overshoot,
                settling_s=settling, feasible=bool(feasible),
                qualified=bool(feasible and settling <= 5),
                iae_mTorr_s=float(np.trapezoid(abs(p-50),t)),
                valve_travel_pct=float(np.abs(np.diff(u)).sum()*100),
                saturation_s=float(np.sum((command[:-1]<=0)|(command[:-1]>=1))*DT))


def recommend(observations):
    """Only evaluated rows enter the GP. No unevaluated output is accessible."""
    seen = [row['index'] for row in observations]
    candidates = np.array(sorted(set(range(25))-set(seen)))
    x = (GRID-0.05)/0.20
    values = np.array([[row['overshoot_step_pct'], row['settling_s']
                       if row['settling_s'] is not None else 30.01]
                      for row in observations])
    def kernel(a,b):
        return np.exp(-cdist(a,b,'sqeuclidean')/(2*0.4**2))
    cross = kernel(x[seen],x[candidates])
    weights = np.linalg.solve(kernel(x[seen],x[seen])+np.eye(len(seen))*1e-6,cross)
    variance = np.maximum(1e-10,1-(cross*weights).sum(axis=0))
    means = values.mean(axis=0)[:,None]+(values-values.mean(axis=0)).T@weights
    sigma = np.maximum(values.std(axis=0)[:,None],1e-5)*np.sqrt(variance)
    probability = ndtr((5-means[0])/sigma[0])
    feasible_times = [row['settling_s'] for row in observations if row['feasible']]
    score = probability.copy()
    if feasible_times:
        gain = min(feasible_times)-means[1]
        z = gain/sigma[1]
        improvement = gain*ndtr(z)+sigma[1]*np.exp(-z*z/2)/np.sqrt(2*np.pi)
        score = improvement*probability
    chosen = int(np.argmax(score))
    return int(candidates[chosen]), dict(predicted_overshoot_step_pct=float(means[0,chosen]),
        predicted_settling_s=float(means[1,chosen]), settling_std_s=float(sigma[1,chosen]),
        probability_overshoot_ok=float(probability[chosen]), acquisition=float(score[chosen]))


def write_csv(name, rows):
    with (OUT/name).open('w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def main():
    # Sequential search is executed before exhaustive assessment.
    observed, ai_log = [], []
    for trial in range(10):
        index, prediction = (INITIAL[trial], {}) if trial < 5 else recommend(observed)
        row = dict(index=index, id=f'E{index+1:02}', kp=float(GRID[index,0]), ki=float(GRID[index,1]),
                   **metrics(simulate(*GRID[index])))
        observed.append(row)
        ai_log.append(dict(trial=trial+1, **row, **prediction))
    traces = [simulate(*g) for g in GRID]
    rows = [dict(index=i,id=f'E{i+1:02}',kp=float(g[0]),ki=float(g[1]),**metrics(trace))
            for i,(g,trace) in enumerate(zip(GRID,traces))]
    scores = np.array([row['settling_s'] if row['feasible'] else np.inf for row in rows])
    best = int(np.argmin(scores))
    remaining = sorted(set(range(25))-set(INITIAL))
    random_sets = np.array(list(combinations(remaining,5)))
    random_best = np.minimum(scores[INITIAL].min(),scores[random_sets].min(axis=1))
    ai_best = min(row['settling_s'] for row in observed if row['feasible'])
    qualified = np.array([row['qualified'] for row in rows])
    initial_qualified = qualified[INITIAL].any()
    random_success = initial_qualified | qualified[random_sets].any(axis=1)
    ai_first = next((i+1 for i,r in enumerate(observed) if r['qualified']),None)
    rng = np.random.default_rng(42)
    random_curves, first_hits = [], []
    for _ in range(1000):
        order = INITIAL + list(rng.permutation(remaining))
        random_curves.append(np.minimum.accumulate(scores[order])[4:10])
        first_hits.append(next((j+1 for j,i in enumerate(order) if qualified[i]),26))
    numeric_errors = [float(np.max(abs(trace[:,1]-simulate(*g,substeps=2)[:,1])))
                      for g,trace in zip(GRID,traces)]
    assert max(numeric_errors) < 1e-5
    # Independent equilibrium check with held valve command.
    p,u = 40.,.5
    for _ in range(10000):
        p,u = plant_step(p,u,.45,.01)
    equilibrium_error = abs(p-20/.46)
    assert equilibrium_error < 1e-8
    summary = dict(best_id=rows[best]['id'], best_index=best, best_settling_s=scores[best],
        feasible_count=int(np.isfinite(scores).sum()), qualified_count=int(qualified.sum()),
        ai_best_s=ai_best, ai_first_qualified=ai_first, ai_order=[r['index'] for r in observed],
        random_exact_combinations=len(random_sets), random_median_best_s=float(np.median(random_best)),
        random_optimum_probability=float(np.mean(random_best==scores[best])),
        random_qualification_probability=float(np.mean(random_success)),
        random_at_least_as_good_as_ai=float(np.mean(random_best<=ai_best)),
        random_first_qualification_median=float(np.median(first_hits)),
        random_curve_median=np.median(random_curves,axis=0).tolist(),
        random_curve_q25=np.percentile(random_curves,25,axis=0).tolist(),
        random_curve_q75=np.percentile(random_curves,75,axis=0).tolist(),
        integration_max_pressure_difference_mTorr=max(numeric_errors),
        equilibrium_error_mTorr=equilibrium_error)
    write_csv('experiments_25.csv',rows)
    ai_fields = sorted(set().union(*(row.keys() for row in ai_log)))
    write_csv('ai_recommendations.csv',[{key:r.get(key,'') for key in ai_fields} for r in ai_log])
    with (OUT/'waveforms_25.csv').open('w',newline='',encoding='utf-8-sig') as f:
        writer=csv.writer(f)
        writer.writerow(['experiment_id','kp','ki_per_s','time_s','pressure_mTorr','valve_opening','command_opening','integral'])
        for row,trace in zip(rows,traces):
            writer.writerows([[row['id'],row['kp'],row['ki'],*sample] for sample in trace])
    write_csv('random_10_budget_exact.csv',[dict(subset=','.join(rows[i]['id'] for i in subset),best_feasible_s=float(value),qualified=bool(success)) for subset,value,success in zip(random_sets,random_best,random_success)])
    payload=dict(parameters=PARAMETERS,experiments=rows,ai=ai_log,summary=summary)
    (OUT/'results.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT.parent/'data.js').write_text('window.EXPERIMENT_DATA = '+json.dumps(payload,ensure_ascii=False)+';',encoding='utf-8')
    plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11})
    fig,axs=plt.subplots(1,2,figsize=(12,4.5))
    for index in [20,best,22]:
        axs[0].plot(traces[index][:,0],traces[index][:,1],label=f"{rows[index]['id']} Kp={GRID[index,0]:.2f}, Ki={GRID[index,1]:.2f}")
    axs[0].axhspan(49.8,50.2,color='teal',alpha=.12)
    axs[0].axhline(50.5,color='tomato',ls=':',label='Overshoot limit')
    axs[0].set(xlim=(0,20),xlabel='Time (s)',ylabel='Pressure (mTorr)',title='Same model, different PI settings')
    axs[0].legend(fontsize=8)
    ai_curve=np.minimum.accumulate([r['settling_s'] if r['feasible'] else np.inf for r in observed])[4:]
    count=np.arange(5,11)
    axs[1].plot(count,ai_curve,'o-',color='teal',label='Bayesian optimization')
    axs[1].plot(count,summary['random_curve_median'],'o-',color='#d88430',label='Random, 1000 orders (median)')
    axs[1].fill_between(count,summary['random_curve_q25'],summary['random_curve_q75'],alpha=.15,color='#d88430',label='Random interquartile range')
    axs[1].axhline(scores[best],color='gray',ls=':',label='Full-grid optimum')
    axs[1].set(xlabel='Evaluated settings (including 5 initial)',ylabel='Best feasible settling time (s)',title='Equal evaluation budget')
    axs[1].legend(fontsize=8)
    for ax in axs: ax.grid(alpha=.2)
    fig.tight_layout()
    fig.savefig(OUT/'comparison.png',dpi=180)
    print(json.dumps(summary,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
