"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const recast_1 = require("recast");
const babylon = __importStar(require("babylon"));
const path = __importStar(require("path"));
const myers_1 = __importDefault(require("./myers"));
const color_1 = __importDefault(require("./color"));
const TNT = recast_1.types.namedTypes;
const { file, program, exportDefaultDeclaration, tsUnionType, tsArrayType, tsInterfaceDeclaration, tsInterfaceBody, tsMethodSignature, identifier, tsBooleanKeyword, tsNumberKeyword, tsStringKeyword, tsAnyKeyword, tsNullKeyword, tsVoidKeyword, tsUndefinedKeyword, tsObjectKeyword, tsTypeAnnotation, tsTypeParameterInstantiation, tsTypeReference, } = recast_1.types.builders;
let instanceBody = new Map();
let tsInstanceBody = new Map();
function generateMethod(method) {
    var _a;
    return {
        name: method.key.name,
        params: (method.parameters).map((item) => {
            var _a, _b;
            const inst = item;
            return {
                name: inst.name,
                type: (_b = (_a = inst.typeAnnotation) === null || _a === void 0 ? void 0 : _a.typeAnnotation) === null || _b === void 0 ? void 0 : _b.type
            };
        }),
        comments: (_a = method.comments) === null || _a === void 0 ? void 0 : _a.map(item => item.value),
    };
}
function hash(h, c) {
    return c + (h << 7) | h >> (8 * 8 - 7);
}
function hashMethod(params) {
    const methodRes = generateMethod(params);
    const buffer = Buffer.from(JSON.stringify(methodRes));
    const hashValue = buffer.reduce((curr, hashValue) => {
        return hash(hashValue, curr);
    }, 0);
    return hashValue;
}
function diff(jsList, tsList) {
    const failList = [];
    const jsHash = [...jsList.entries()].reduce((obj, [name, item]) => {
        const hash = hashMethod(item);
        if (obj.get(hash)) {
            failList.push(name);
            throw new Error(`生成hash失败，存在重复值, 请完善 ${color_1.default('bright', name)}`);
        }
        obj.set(hash, name);
        return obj;
    }, new Map());
    const tsHash = [...tsList.entries()].reduce((obj, [name, item]) => {
        const hash = hashMethod(item);
        obj.set(hash, name);
        return obj;
    }, new Map());
    const operate = myers_1.default(tsHash, jsHash, logDiff);
    let jsIndex = 0;
    let tsIndex = 0;
    const res = [];
    const jsValues = [...jsList.values()];
    const tsValues = [...tsList.values()];
    if (operate.length === 0) {
        return [...tsValues];
    }
    operate.forEach(item => {
        switch (item) {
            case 'insert':
                res.push(jsValues[jsIndex++]);
                break;
            case 'move':
                res.push(tsValues[tsIndex++]);
                ++jsIndex;
                break;
            case 'delete':
                ++tsIndex;
                break;
        }
    });
    return res;
}
function visitAst(ast, body, existNode) {
    recast_1.visit(ast, {
        visitTSMethodSignature(path) {
            var _a;
            path.node.comments = (_a = path.node.comments) === null || _a === void 0 ? void 0 : _a.map(item => {
                if (TNT.CommentBlock.check(item)) {
                    const value = item.value.replace(/\r\n */g, '\r\n ');
                    return recast_1.types.builders.commentBlock(value);
                }
                else {
                    return item;
                }
            });
            body.set(path.node.key.name, path.node);
            this.traverse(path);
        },
        visitFunctionDeclaration(path) {
            var _a;
            if (!includeFunction) {
                return false;
            }
            const astParam = parseParams(path.node);
            const name = identifier(astParam.name);
            const astRes = tsMethodSignature.from({
                key: name,
                parameters: generateParams(astParam.params),
                typeAnnotation: tsTypeAnnotation.from({
                    typeAnnotation: generateReturns(astParam.return),
                })
            });
            astRes.comments = astParam.comments;
            // 如果是行注释就不需要做对应的处理了
            (_a = astRes.comments) === null || _a === void 0 ? void 0 : _a.forEach(item => {
                if (TNT.CommentBlock.check(item)) {
                    item.value = formatComments(item.value);
                }
            });
            body.set(astParam.name, astRes);
            this.traverse(path);
        },
        visitObjectMethod(path) {
            var _a;
            const astParam = parseParams(path.node);
            const name = identifier(astParam.name);
            const astRes = tsMethodSignature.from({
                key: name,
                parameters: generateParams(astParam.params),
                typeAnnotation: tsTypeAnnotation.from({
                    typeAnnotation: generateReturns(astParam.return),
                })
            });
            astRes.comments = astParam.comments;
            // 如果是行注释就不需要做对应的处理了
            (_a = astRes.comments) === null || _a === void 0 ? void 0 : _a.forEach(item => {
                if (TNT.CommentBlock.check(item)) {
                    item.value = formatComments(item.value);
                }
            });
            body.set(astParam.name, astRes);
            this.traverse(path);
        }
    });
}
function formatComments(comments) {
    if (/ *\*/g.test(comments)) {
        return comments
            .replace(/ *\*/g, ' *')
            .replace(/\r\n/g, '%^&')
            .trim()
            .replace(/\%\^\&/g, '\r\n') + ' ';
    }
    else {
        return comments;
    }
}
function generateReturns(returns) {
    const ident = identifier(returns);
    const annotation = tsTypeReference(ident);
    if (returns === 'void') {
        return tsVoidKeyword();
    }
    else {
        const response = identifier('Response');
        const slot = tsTypeParameterInstantiation([tsTypeReference(response)]);
        annotation.typeParameters = slot;
    }
    return annotation;
}
function parseParams(node) {
    var _a;
    const astParam = {
        name: '',
        params: {},
        return: 'Promise',
        comments: [],
    };
    const params = node.params.map((item) => {
        if (TNT.AssignmentPattern.check(item)) {
            return item.left.name;
        }
        return item.name;
    });
    const paramsType = {};
    (_a = node.comments) === null || _a === void 0 ? void 0 : _a.forEach(item => {
        const regExp = /@(param|returns) {(.*)}\S*(.*)/;
        item.value.split(`\r\n`).forEach(each => {
            const [, catalog, type, name] = regExp.exec(each) || [];
            if (catalog === 'param') {
                paramsType[name.trim().split(' ')[0]] = type;
            }
            else if (catalog === 'returns') {
                astParam.return = type;
            }
        });
    });
    params.forEach(item => {
        astParam.params[item] = paramsType[item] || '*';
    });
    if (TNT.ObjectMethod.check(node)) {
        astParam.name = node.key.name;
    }
    else if (TNT.FunctionDeclaration.check(node)) {
        astParam.name = node.id.name;
    }
    astParam.comments = node.comments;
    // astParam.comments?.forEach(item => {
    //   item.value = item.value.replace(/\\r\\n */g, '\r\n');
    // })
    return astParam;
}
const type = {
    boolean: tsBooleanKeyword(),
    number: tsNumberKeyword(),
    string: tsStringKeyword(),
    null: tsNullKeyword(),
    object: tsObjectKeyword(),
    undefined: tsUndefinedKeyword(),
    any: tsAnyKeyword(),
    '*': tsAnyKeyword(),
    '': tsAnyKeyword(),
};
function generateType(value) {
    const union = value.split('|').map(item => item.trim());
    if (union && Array.isArray(union) && union.length > 1) {
        return tsUnionType(union.map(item => generateType(item) || identifier(value)));
    }
    // 生成hash值时只基于最外面的类型，泛型会被视为tsTypeReference，所以没做处理
    const unionReg = /(\S*)(\[\])+/;
    if (unionReg.test(value)) {
        const [, typeName, reference] = unionReg.exec(value) || [];
        if (reference) {
            return tsArrayType(type[typeName]);
        }
        else {
            return type[value];
        }
    }
    return type[value];
}
function generateParams(paramsList) {
    return Object.entries(paramsList).reduce((params, [key, value]) => {
        if (!key) {
            return params;
        }
        const name = identifier(key);
        name.typeAnnotation = tsTypeAnnotation.from({
            typeAnnotation: generateType(value) || identifier(value)
        });
        params.push(name);
        return params;
    }, []);
}
function main(fileList, basePath) {
    const BASE_PATH = basePath;
    fileList.forEach(async (instance) => {
        const { name } = path.parse(instance);
        const apiJs = await fs.promises.readFile(path.join(BASE_PATH, instance), { encoding: 'utf-8' });
        const astJs = recast_1.parse(apiJs, { parser: { parse: (code) => babylon.parse(code, {
                    sourceType: 'module',
                    plugins: ['decorators', 'objectRestSpread'],
                }) } });
        let resFile = '';
        try {
            if (fs.existsSync(path.join(BASE_PATH, name + '.d.ts'))) {
                const apiTs = await fs.promises.readFile(path.join(BASE_PATH, name + '.d.ts'), { encoding: 'utf-8' });
                const astTs = recast_1.parse(apiTs, { parser: require('recast/parsers/typescript') });
                visitAst(astJs, instanceBody);
                visitAst(astTs, tsInstanceBody);
                const nodes = astTs.program.body.filter((item) => !TNT.ExportDefaultDeclaration.check(item));
                const nodeBody = exportDefaultDeclaration(tsInterfaceDeclaration(identifier(name), tsInterfaceBody(diff(instanceBody, tsInstanceBody))));
                const tsFile = file(program([...(nodes || []), nodeBody]));
                resFile = recast_1.prettyPrint(tsFile, { tabWidth: 2 }).code;
                console.log(`更新声明文件：${name}`);
            }
            else {
                console.log(`创建声明文件：${name}`);
                visitAst(astJs, instanceBody);
                const tsFile = file(program([
                    exportDefaultDeclaration(tsInterfaceDeclaration(identifier(name), tsInterfaceBody([...instanceBody.values()])))
                ]));
                resFile = recast_1.prettyPrint(tsFile, { tabWidth: 2 }).code;
            }
            fs.promises.writeFile(path.join(BASE_PATH, name + '.d.ts'), resFile, { encoding: 'utf-8' });
        }
        catch (err) {
            const message = `文件 ${color_1.default('bright', instance)} 发生异常。`;
            err.message = message + err.message;
            console.error(err);
        }
        instanceBody.clear();
        tsInstanceBody.clear();
    });
}
let logDiff = true;
let includeFunction = false;
async function apiGenerate(dirpath, moduleName, files, verbose, functions) {
    logDiff = !!verbose;
    includeFunction = !!functions;
    const BASE_PATH = path.join(dirpath, moduleName);
    if (!fs.existsSync(BASE_PATH)) {
        throw new Error(`路径${BASE_PATH}非法`);
    }
    let fileList = [];
    if (files && files.length > 0) {
        files.forEach(file => {
            if (!fs.statSync(path.join(BASE_PATH, file))) {
                throw new Error(`路径${BASE_PATH}上不存在文件${file}`);
            }
            fileList.push(file);
        });
    }
    else {
        fileList = (await fs.promises.readdir(BASE_PATH, { encoding: 'utf-8' })).filter(file => /.*\.js/.test(file));
    }
    main(fileList, BASE_PATH);
}
exports.default = apiGenerate;
if (module.id === '.') {
    const BASE_PATH = path.join(__dirname, '../modules');
    main(['api.js'], BASE_PATH);
}
