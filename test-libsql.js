const { createClient } = require('@libsql/client');

async function testLibSql() {
  console.log('Testing LibSQL database client creation...');
  const dbUrl = process.env.DATABASE_URL || 'file:dev.db';
  console.log('Connection URL:', dbUrl);
  
  try {
    const client = createClient({ url: dbUrl });
    console.log('Client created successfully! Attempting raw query...');
    const result = await client.execute('SELECT 1 + 1 AS sum');
    console.log('Raw Query Result:', result.rows);
  } catch (err) {
    console.error('LibSQL Client Error:', err);
  }
}

testLibSql();
