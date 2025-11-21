const crypto = require('crypto');

const THIRD_PARTY_SECRET = 'your-secret-key-for-third-party-auth';
const SERVICE_URL = 'https://yourservice.com';

function generateThirdPartyToken(userId, expiresInMinutes = 60) {
  const payload = {
    userId,
    exp: Date.now() + expiresInMinutes * 60 * 1000
  };

  const iv = crypto.randomBytes(16);
  const key = Buffer.from(THIRD_PARTY_SECRET, 'utf-8').subarray(0, 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(JSON.stringify(payload), 'utf-8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function generateAuthUrl(userId, expiresInMinutes = 60) {
  const token = generateThirdPartyToken(userId, expiresInMinutes);
  return `${SERVICE_URL}/auth/third-party?access_token=${encodeURIComponent(token)}`;
}

const steamUserId = '76561198000000000';
const authUrl = generateAuthUrl(steamUserId, 60);

console.log('Authentication URL:');
console.log(authUrl);
console.log('\nRedirect your user to this URL to authenticate them.');

