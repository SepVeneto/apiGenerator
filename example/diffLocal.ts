import fs from 'fs';
import readline from 'readline'
import md5 from 'js-md5';
import diff from '../myers';

function hashLine(line: string) {
  return md5(line);
}

function logSrc(readLine: readline.Interface) {
  return new Promise((resolve, reject) => {
    readLine.on('close', () => {
      resolve(true);
    })
  })
}
function logDist(distLine: readline.Interface) {
  return new Promise((resolve, reject) => {
    distLine.on('close', () => {
      resolve(true);
    })
  })
}

export default async function logFile() {
  const readStream = fs.createReadStream('./example/1.txt', { encoding: 'utf-8' });
  const distStream = fs.createReadStream('./example/2.txt', { encoding: 'utf-8' });
  const src = new Map();
  const dist = new Map();
  const readLine = readline.createInterface({
    input: readStream,
    terminal: true,
  })
  const distLine = readline.createInterface({
    input: distStream,
    terminal: true,
  })
  readLine.on('line', (line) => {
    const hash = hashLine(`${line}`);
    src.set(hash, line);
  })
  distLine.on('line', line => {
    const hash = hashLine(`${line}`);
    dist.set(hash, line);
  })
  await logSrc(readLine);
  await logDist(distLine);
  diff(src as any, dist as any, true);
}

logFile();