// Test PARALLEL connections like backend does
const odbc = require('odbc');

console.log('=== Testing PARALLEL Connections (Backend Behavior) ===\n');

const connStringEmp = 'DSN=DtsPrdEmp;UID=sysprogress;PWD=sysprogress';
const connStringMult = 'DSN=DtsPrdMult;UID=sysprogress;PWD=sysprogress';

console.log('Testing simultaneous connections to:');
console.log('1. DtsPrdEmp');
console.log('2. DtsPrdMult');
console.log('\nStarting parallel connection attempts...\n');

Promise.all([
  odbc.connect(connStringEmp),
  odbc.connect(connStringMult)
])
  .then(([connEmp, connMult]) => {
    console.log('✅ SUCCESS: Both connections established!');
    console.log('EMP connection:', typeof connEmp);
    console.log('MULT connection:', typeof connMult);

    return Promise.all([
      connEmp.close(),
      connMult.close()
    ]);
  })
  .then(() => {
    console.log('\n✅ Test PASSED - Parallel connections work!');
    process.exit(0);
  })
  .catch(err => {
    console.log('\n❌ FAILED: Error during parallel connection');
    console.log('Error message:', err.message);
    console.log('odbcErrors:', JSON.stringify(err.odbcErrors || []));
    console.log('odbcErrors length:', (err.odbcErrors || []).length);

    if ((err.odbcErrors || []).length === 0) {
      console.log('\n⚠️  Empty odbcErrors array - same as backend error!');
      console.log('   This suggests a driver initialization or concurrency issue.');
    }

    process.exit(1);
  });
