"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
const js_md5_1 = __importDefault(require("js-md5"));
function travse(src, dist) {
    const N = src.length;
    const M = dist.length;
    const max = N + M;
    const v = [new Map([[0, 0]])];
    for (let d = 0; d <= max; ++d) {
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
            const isDown = k === -d || (k !== d && lastV.get(k - 1) < lastV.get(k + 1));
            const kPrev = isDown ? k + 1 : k - 1;
            const xStart = lastV.get(kPrev);
            const xNext = isDown ? xStart : xStart + 1;
            const yNext = xNext - k;
            let xEnd = xNext;
            let yEnd = yNext;
            while (xEnd < N && yEnd < M && src[xEnd] === dist[yEnd]) {
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
function travseReverse(src, dist, traceV) {
    const N = src.length;
    const M = dist.length;
    const point = {
        x: N,
        y: M,
    };
    const trace = [];
    const operate = [];
    for (let d = traceV.length - 1; d > 0; --d) {
        const lastV = traceV[d - 1];
        const k = point.x - point.y;
        const isUp = k === -d || (k !== -d && lastV.get(k - 1) < lastV.get(k + 1));
        const kPrev = isUp ? k + 1 : k - 1;
        const xStart = lastV.get(kPrev);
        const yStart = xStart - kPrev;
        trace.push({ ...point });
        while (point.x > xStart && point.y > yStart) {
            operate.push('move');
            point.x -= 1;
            point.y -= 1;
        }
        if (point.x === xStart) {
            operate.push('insert');
        }
        else {
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
function logDiff(src, dist, operate) {
    let distIndex = 0;
    let srcIndex = 0;
    operate.forEach(item => {
        switch (item) {
            case 'insert':
                console.log(`${"\x1b[42;30m"}+${dist[distIndex++]}${"\x1b[0m"}`);
                // console.log(`+${dist[distIndex++]}`);
                break;
            case 'move':
                srcIndex++;
                // console.log(` ${src[srcIndex++] } `);
                ++distIndex;
                break;
            case 'delete':
                console.log(`${"\x1b[41;30m"}-${src[srcIndex++]}${"\x1b[0m"}`);
                break;
        }
    });
}
function diff(src, dist, needLog = true) {
    const srcObj = {};
    const distObj = {};
    if (src instanceof Map) {
        srcObj.keys = [...src.keys()];
        srcObj.values = [...src.values()];
    }
    else {
        srcObj.keys = src;
        srcObj.values = src;
    }
    if (dist instanceof Map) {
        distObj.keys = [...dist.keys()];
        distObj.values = [...dist.values()];
    }
    else {
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
    needLog && logDiff(srcObj.values, distObj.values, operate);
    return operate;
}
exports.default = diff;
const readStream = fs_1.default.createReadStream('./7.211.2.1_v1.1.txt', { encoding: 'utf-8' });
const distStream = fs_1.default.createReadStream('./7.211.2.2_v1.1.txt', { encoding: 'utf-8' });
const src = new Map();
const dist = new Map();
const readLine = readline_1.default.createInterface({
    input: readStream,
    terminal: true,
});
const distLine = readline_1.default.createInterface({
    input: distStream,
    terminal: true,
});
function hash(h, c) {
    return c + (h << 7) | h >> (8 * 8 - 6);
}
function hashLine(line) {
    return js_md5_1.default(line);
    // const buffer = Buffer.from(line);
    // const hashValue = buffer.reduce((curr, hashValue) => {
    //   return hash(hashValue, curr);
    // }, 0)
    // return hashValue;
}
let srcIndex = 0;
let distIndex = 0;
readLine.on('line', (line) => {
    const hash = hashLine(`${line}`);
    src.set(hash, line);
});
distLine.on('line', line => {
    const hash = hashLine(`${line}`);
    dist.set(hash, line);
});
function logSrc() {
    return new Promise((resolve, reject) => {
        readLine.on('close', () => {
            resolve(src);
        });
    });
}
function logDist() {
    return new Promise((resolve, reject) => {
        distLine.on('close', () => {
            resolve(dist);
        });
    });
}
async function log() {
    const src = await logSrc();
    const dist = await logDist();
    diff(src, dist, true);
}
log();
// console.log(diff(src, dist, true));
// diff('ABC', 'BDA')
