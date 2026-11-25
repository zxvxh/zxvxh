const assert = require('node:assert/strict');
const data = require('../dist/data/results.json');
const M = require('../dist/model.js');
for (const expected of data.experiments) {
 const actual = M.metrics(expected.index, M.simulate(expected.index));
 for (const key of ['peak_mTorr','overshoot_step_pct','valve_travel_pct'])
  assert.ok(Math.abs(actual[key]-expected[key]) < 1e-7, `${expected.id}: ${key}`);
 assert.equal(actual.settling_s, expected.settling_s, `${expected.id}: settling`);
 assert.equal(actual.qualified, expected.qualified, `${expected.id}: qualification`);
}
const observed = [0,4,12,20,24].map(i => M.metrics(i,M.simulate(i)));
while(observed.length < 10) {
 const next=M.recommend(observed);
 observed.push(M.metrics(next.index,M.simulate(next.index)));
}
assert.deepEqual(observed.map(r=>r.index), data.ai.map(r=>r.index));
assert.equal(observed[8].id, 'E22');
console.log('PASS: 25 model results and 10 sequential selections match Python.');
