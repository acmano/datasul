const odbc = require('odbc');

console.log('=== ODBC Diagnostic Test ===');
console.log('Step 1: ODBC module loaded successfully');

const connString = 'DSN=DtsPrdEmp;UID=sysprogress;PWD=sysprogress';
console.log('Step 2: Connection string:', connString.replace(/PWD=[^;]+/, 'PWD=***'));

odbc.connect(connString)
  .then(conn => {
    console.log('Step 3: SUCCESS - Connection established!');
    console.log('Connection type:', typeof conn);
    return conn.query('SELECT COUNT(*) as total FROM pub.item');
  })
  .then(result => {
    console.log('Step 4: Query result:', JSON.stringify(result));
    console.log('=== TEST PASSED ===');
    process.exit(0);
  })
  .catch(err => {
    console.log('=== ERROR ===');
    console.log('Message:', err.message);
    console.log('Name:', err.name);
    console.log('Code:', err.code || 'none');
    console.log('odbcErrors:', JSON.stringify(err.odbcErrors || []));
    console.log('odbcErrors length:', (err.odbcErrors || []).length);
    console.log('Error keys:', Object.keys(err));
    console.log('Full error object:', JSON.stringify(err, null, 2));
    console.log('=== TEST FAILED ===');
    process.exit(1);
  });
