import fs from 'fs';
import path from 'path';

const ConfigDir = path.join(__dirname, '../tests/config');

const firebaseExample = fs.readFileSync(
  path.join(ConfigDir, 'firebase.example.json'),
);
const firebase = firebaseExample
  .toString()
  .replace(/\$[A-Za-z0-9_-]+/g, substring => {
    return process.env[substring.substr(1)] || '';
  });
fs.writeFileSync(path.join(ConfigDir, 'firebase.json'), firebase);
