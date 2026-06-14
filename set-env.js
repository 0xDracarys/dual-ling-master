const { execSync } = require('child_process');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const lines = envLocal.split('\n');

let privateKey;

for (const line of lines) {
  if (line.startsWith('FIREBASE_PRIVATE_KEY=')) {
    privateKey = line.substring(line.indexOf('=') + 1).trim();
  }
}

// Remove surrounding quotes if present
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}

console.log('Setting FIREBASE_PRIVATE_KEY...');
// Pass the value as an environment variable to the child process to avoid shell quoting hell
execSync(`npx netlify-cli env:set -- FIREBASE_PRIVATE_KEY "%THE_KEY%"`, { 
  stdio: 'inherit',
  env: { ...process.env, THE_KEY: privateKey }
});

console.log('Done!');
