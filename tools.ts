import md5 from 'js-md5';

function hashLine(line: string) {
  return md5(line);
}

export function generateMap(text: string) {
  const map = new Map<string, string>();
  const list = text.split('\r\n' ? '\r\n' : '\n');
  list.forEach(line => {
    map.set(hashLine(line), line);
  })
  return map;
}