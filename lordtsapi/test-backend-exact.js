// Simulate EXACT backend behavior
const odbc = require('odbc');

console.log('=== Testing Backend EXACT Behavior ===');

// Simulate what backend does
const dsnName = 'DtsPrdEmp';
const user = 'sysprogress';
const password = 'sysprogress';  // Now without quotes
const connString = `DSN=${dsnName};UID=${user};PWD=${password}`;

console.log('Connection string:', connString.replace(/PWD=[^;]+/, 'PWD=***'));

// Test 1: Direct connection (how my test worked)
console.log('\n--- Test 1: Direct odbc.connect() ---');
odbc.connect(connString)
  .then(conn => {
    console.log('✅ Direct connection: SUCCESS');
    return conn.close();
  })
  .catch(err => {
    console.log('❌ Direct connection: FAILED');
    console.log('Error:', err.message);
    console.log('odbcErrors:', err.odbcErrors);
  })
  .finally(() => {
    // Test 2: Connection with options (how backend does it)
    console.log('\n--- Test 2: With connectionString option (backend way) ---');

    // Simulate OdbcConnection constructor behavior with options
    const options = {
      connectionString: connString
    };

    // This is NOT how to use odbc library with options!
    // The odbc.connect() doesn't take options like this
    console.log('Options:', { connectionString: options.connectionString.replace(/PWD=[^;]+/, 'PWD=***') });

    // The problem might be here!
    console.log('\n⚠️  The backend passes options.connectionString to OdbcConnection constructor,');
    console.log('   then inside connect(), it just uses this.connectionString directly.');
    console.log('   Let me test if odbc.connect() supports this format...');

    odbc.connect(options.connectionString)
      .then(conn => {
        console.log('✅ With options: SUCCESS');
        return conn.close();
      })
      .catch(err => {
        console.log('❌ With options: FAILED');
        console.log('Error:', err.message);
        console.log('odbcErrors:', JSON.stringify(err.odbcErrors));
        process.exit(1);
      })
      .then(() => process.exit(0));
  });
