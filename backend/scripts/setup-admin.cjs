/**
 * Admin Setup — Creates/resets admin credentials
 * Run: node scripts/setup-admin.cjs
 */
const path = require('path');
const https = require('https');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ADMIN_EMAIL = 'admin@tficlub.com';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_NAME = 'TFI Admin';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function supabaseReq(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + apiPath);
    const req = https.request({
      hostname: url.hostname, port: 443, path: url.pathname + url.search, method,
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY },
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } }); });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function backendReq(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 5000, path: '/api' + apiPath, method,
      headers: { 'Content-Type': 'application/json' },
    }, res => {
      let d = '', cookies = res.headers['set-cookie'] || [];
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(d), cookies }); } catch { resolve({ status: res.statusCode, data: d, cookies }); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('Setting up admin user...\n');

  // Step 1: Create or reset in Supabase
  const users = await supabaseReq('GET', '/auth/v1/admin/users?page=1&per_page=200');
  const existing = users?.users?.find(u => u.email === ADMIN_EMAIL);

  if (existing) {
    console.log('  Supabase user exists: ' + existing.id);
    await supabaseReq('PUT', '/auth/v1/admin/users/' + existing.id, { password: ADMIN_PASSWORD, email_confirm: true });
    console.log('  Password reset OK');
  } else {
    const created = await supabaseReq('POST', '/auth/v1/admin/users', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, email_confirm: true, user_metadata: { name: ADMIN_NAME } });
    console.log('  Created Supabase user: ' + (created?.id || 'OK'));
  }

  // Step 2: Sign in via backend (this auto-creates DB record with ADMIN role)
  const res = await backendReq('POST', '/auth/admin/signin', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (res.status >= 400) {
    console.error('  Backend signin failed:', res.data?.message || res.data);
    process.exit(1);
  }
  console.log('  Backend DB user: ' + res.data?.user?.id + ' (role: ' + res.data?.user?.role + ')');

  console.log('\n===================================');
  console.log('  ADMIN CREDENTIALS READY');
  console.log('===================================');
  console.log('  URL:      http://localhost:5174');
  console.log('  Email:    ' + ADMIN_EMAIL);
  console.log('  Password: ' + ADMIN_PASSWORD);
  console.log('===================================\n');
}

main();
