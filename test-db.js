const { Client } = require('pg');

async function testConnection(url) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log('Success:', url.split('@')[1]);
    await client.end();
  } catch (err) {
    console.error('Error for', url.split('@')[1], ':', err.message);
  }
}

const urls = [
  'postgresql://postgres.vqqiyqmlckwknutlbfvw:0746284433Peter@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true',
  'postgresql://postgres.vqqiyqmlckwknutlbfvw:0746284433Peter@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true',
  'postgresql://postgres:0746284433Peter@db.vqqiyqmlckwknutlbfvw.supabase.co:5432/postgres?sslmode=require'
];

(async () => {
  for (const url of urls) {
    await testConnection(url);
  }
})();
