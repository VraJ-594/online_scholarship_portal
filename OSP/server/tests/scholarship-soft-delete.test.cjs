const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Substitute only the external database boundary; execute the real controllers.
function controller(file, name, query, connect) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../controller', file), 'utf8'), {
    module, exports: module.exports,
    require: () => ({ query, connect }), console: { log() {}, warn() {}, error() {} },
  });
  return module.exports[name];
}
function response() {
  return { code: 200, body: undefined,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; } };
}

for (const rowCount of [1, 0]) {
  test(`delete marks only the scholarship; affected rows ${rowCount}`, async () => {
    const calls = [];
    const query = async (sql, params) => { calls.push({ sql, params }); return { rowCount }; };
    const fn = controller('deleteScholarship.js', 'deleteScholarship', query,
      async () => ({ query, release() {} }));
    const res = response();
    await fn({ params: { scholarship_id: '7' } }, res);
    assert.equal(res.code, rowCount ? 200 : 404);
    assert.equal(calls.length, 1, 'one atomic update; applications must never be deleted');
    assert.match(calls[0].sql, /UPDATE osp\.scholarships\s+SET deleted_at = (CURRENT_TIMESTAMP|NOW\(\))/i);
    assert.match(calls[0].sql, /WHERE scholarship_id = \$1 AND deleted_at IS NULL/i);
    assert.equal(calls[0].params[0], '7');
  });
}
test('delete database failure returns 500', async () => {
  const fail = async () => { throw new Error('offline'); };
  const fn = controller('deleteScholarship.js', 'deleteScholarship', fail, fail);
  const res = response();
  await fn({ params: { scholarship_id: '7' } }, res);
  assert.equal(res.code, 500);
});

for (const search of ['', 'merit']) {
  test(`active paginated list and total exclude deleted scholarships (search=${search})`, async () => {
    const calls = [];
    const fn = controller('getScholarships.js', 'getScholarships', async (sql, params) => {
      calls.push({ sql, params }); return { rows: /COUNT\(\*\)/.test(sql) ? [{ count: '0' }] : [] };
    });
    const res = response();
    await fn({ query: { search } }, res, (err) => { throw err; });
    assert.equal(res.code, 200);
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.match(call.sql, /WHERE (s\.)?deleted_at IS NULL/i);
      if (search) assert.match(call.sql, /AND (s\.)?scholarship_name ILIKE \$1/i);
    }
    assert.equal(res.body.meta.total, 0);
  });
}
for (const [file, name] of [
  ['getListforApplyScholarships.js', 'getListForApplyScholarships'],
  ['scholarshipListings.js', 'getListOfScholarships'],
]) {
  test(`${name} excludes deleted scholarships`, async () => {
    let sql;
    const fn = controller(file, name, async (query) => { sql = query; return { rows: [] }; });
    await fn({}, response());
    assert.match(sql, /WHERE (s\.)?deleted_at IS NULL/i);
  });
}
test('deleted or missing scholarship detail returns 404', async () => {
  let sql;
  const fn = controller('getScholarship.js', 'getScholarship', async (query) => {
    sql = query; return { rows: [] };
  });
  const res = response();
  await fn({ params: { scholarship_id: '7' } }, res);
  assert.match(sql, /AND deleted_at IS NULL/i);
  assert.equal(res.code, 404);
});
test('editing a deleted scholarship returns 404 and cannot revive it', async () => {
  let sql;
  const fn = controller('editScholarship.js', 'editScholarship', async (query) => {
    sql = query; return { rowCount: 0 };
  });
  const res = response();
  await fn({ params: { scholarship_id: '7' }, body: {
    scholarshipName: 'Merit', amount: 100, endDate: '2027-01-01', description: 'Merit',
    educationLevel: 'B.Tech', eligibleCourses: ['B.Tech ICT'], minPercentage: 7, annualFamilyIncome: 100000,
  } }, res);
  assert.match(sql, /WHERE scholarship_id = \$11 AND deleted_at IS NULL/i);
  assert.equal(res.code, 404);
});
test('student application history retains deleted scholarship records', async () => {
  const fn = controller('getAppliedScholarships.js', 'getAppliedScholarships', async (sql) => {
    assert.doesNotMatch(sql, /deleted_at IS NULL/i);
    return { rows: [{ scholarship_id: 7, status: 'Accepted' }] };
  });
  const res = response();
  await fn({ user: { email: 'student@example.test' } }, res);
  assert.equal(res.body[0].scholarship_id, 7);
});

for (const mode of ['deleted', 'eligible', 'ineligible', 'duplicate', 'offline']) {
  test(`application transaction handles ${mode} and releases connection`, async () => {
    const calls = [];
    let released = false;
    const query = async (sql) => {
      calls.push(sql);
      if (/SELECT applicant_id/.test(sql)) return { rows: [{ applicant_id: 3 }] };
      if (/FROM osp.Scholarships/i.test(sql)) {
        assert.match(sql, /deleted_at IS NULL\s+FOR SHARE/i);
        if (mode === 'offline') throw new Error('offline');
        return { rows: mode === 'deleted' ? [] : [{ min_percentage: 7, annual_family_income: 100000,
          education_level: 'B.Tech', eligible_courses: ['B.Tech ICT'] }] };
      }
      if (/FROM osp.applicants a/.test(sql)) return { rows: [{ income: 50000,
        current_cgpa_obtained: mode === 'ineligible' ? 6 : 8, education_level: 'B.Tech', course_name: 'B.Tech ICT' }] };
      if (/INSERT INTO/.test(sql) && mode === 'duplicate') throw Object.assign(new Error('duplicate'), { code: '23505' });
      return { rows: [], rowCount: 1 };
    };
    const fn = controller('applyForScholarship.js', 'applyForScholarship',
      async () => { throw new Error('application queries must use the same transaction client'); },
      async () => ({ query, release() { released = true; } }));
    const res = response();
    let error;
    await fn({ params: { scholarship_id: '7' }, body: { applied_date: '2026-11-16', status: 'Pending' },
      user: { email: 'student@example.test' } }, res, (err) => { error = err; });
    assert.equal(released, true);
    assert.equal(calls[0], 'BEGIN');
    assert.equal(calls.at(-1), mode === 'eligible' ? 'COMMIT' : 'ROLLBACK');
    if (mode === 'offline') assert.equal(error.message, 'offline');
    else assert.equal(res.code, { deleted: 404, eligible: 200, ineligible: 403, duplicate: 409 }[mode]);
    if (mode === 'deleted' || mode === 'ineligible') assert.ok(!calls.some(sql => /INSERT INTO/.test(sql)));
  });
}
