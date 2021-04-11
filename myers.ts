function travse(src: Array<string | number> | string, dist: Array<string | number> | string) {
  const N = src.length;
  const M = dist.length;
  const max = N + M;
  const v = [new Map([[0, 0]])];
  for (let d = 0; d < max; ++d) {
    if (d === 0) {
      let t = 0;
      while (N > t && M > t && src[t] === dist[t]) {
        ++t;
      }
      v[0].set(0, t);
      if (t === N && t === M) {
        return [];
      }
      continue;
    }
    const lastV = new Map([...Array.from(v[d - 1])]);
    const vInst = new Map();
    for (let k = -d; k <= d; k += 2) {
      const isDown = k === -d || (k !== d && <number>lastV.get(k-1) < <number>lastV.get(k + 1))
      const kPrev = isDown ? k + 1 : k - 1;
      const xStart = lastV.get(kPrev);
      const xNext = isDown ? xStart : <number>xStart + 1;
      const yNext = <number>xNext - k;

      let xEnd = <number>xNext;
      let yEnd = yNext;

      while(xEnd < N && yEnd < M && src[xEnd] === dist[yEnd]) {
        ++xEnd;
        ++yEnd;
      }
      vInst.set(k, xEnd);
      if (xEnd === N && yEnd === M) {
        v.push(vInst);
        return v;
      }
    }
    v.push(vInst);
  }
  return [];
}
function travseReverse(src: Array<string | number> | string, dist: Array<string | number> | string, traceV: Map<number, number>[]) {
  const N = src.length;
  const M = dist.length;
  const point = {
    x: N,
    y: M,
  }
  const trace = [];
  const operate = [];
  for (let d = traceV.length - 1; d > 0; --d) {
    const lastV = traceV[d - 1];
    const k = point.x - point.y;

    const isUp = k === -d || (k !== -d && <number>lastV.get(k - 1) < <number>lastV.get(k + 1));
    const kPrev = isUp ? k + 1 : k - 1;
    const xStart = <number>lastV.get(kPrev)
    const yStart = <number>xStart - kPrev;

    trace.push({ ...point });
    while (point.x > <number>xStart && point.y > yStart) {
      operate.push('move');
      point.x -= 1;
      point.y -= 1;
    }
    if (point.x === xStart) {
      operate.push('insert');
    } else {
      operate.push('delete');
    }

    point.x = xStart;
    point.y = yStart;
  }
  let equalNum = traceV[0] ? traceV[0].get(0) : 0;
  while (equalNum) {
    operate.push('move');
    --equalNum;
  }
  return operate;
}
function logDiff(src: Array<number | string> | string, dist: Array<number | string> | string, operate: string[]) {
  let distIndex = 0;
  let srcIndex = 0;
  operate.forEach(item => {
    switch (item) {
      case 'insert':
        console.log(`${"\x1b[42;30m"}+${dist[distIndex++]}${"\x1b[0m"}`);
        // console.log(`+${dist[distIndex++]}`);
        break;
      case 'move':
        console.log(` ${src[srcIndex++] } `);
        ++distIndex;
        break;
      case 'delete':
        console.log(`${"\x1b[41;30m"}-${src[srcIndex++]}${"\x1b[0m"}`);
        break;
    }
  })
}

export default function diff(src: string | Map<number, string>, dist: string | Map<number, string>) {
  const srcObj: AnyType = {}
  const distObj: AnyType = {};
  if (src instanceof Map) {
      srcObj.keys = [...src.keys()];
      srcObj.values = [...src.values()];
  } else {
    srcObj.keys = src;
    srcObj.values = src;
  }
  if (dist instanceof Map) {
    distObj.keys = [...dist.keys()];
    distObj.values = [...dist.values()];
  } else {
    distObj.keys = distObj.values = src;
  }
  const srcKeys = srcObj.keys;
  const distKeys = distObj.keys;
  const traceV = travse(srcKeys, distKeys);
  let operate = travseReverse(srcKeys, distKeys, traceV).reverse();
  if (srcKeys.length === 0 && distKeys.length !== 0) {
      operate = Array(distKeys.length).fill('insert');
  }
  if (distKeys.length === 0 && srcKeys.length !== 0) {
      operate = Array(srcKeys.length).fill('delete');
  }
  logDiff(srcObj.values, distObj.values, operate)
  return operate;
}
// console.log(traceV)
// console.log(traceV, trace)
diff('ABC', 'BDA')
