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
const babel = __importStar(require("@babel/parser"));
const path = __importStar(require("path"));
const myers_1 = __importDefault(require("./myers"));
const TNT = recast_1.types.namedTypes;
const { file, program, exportDefaultDeclaration, tsInterfaceDeclaration, tsInterfaceBody, tsMethodSignature, identifier, tsNumberKeyword, tsStringKeyword, tsAnyKeyword, tsNullKeyword, tsVoidKeyword, tsUndefinedKeyword, tsObjectKeyword, tsTypeAnnotation, tsTypeParameterInstantiation, tsTypeReference, } = recast_1.types.builders;
let interfaceBody = new Map();
let tsInstanceBody = new Map();
const BASE_PATH = path.join(__dirname, 'modules');
const fileList = [];
fs.promises.readdir(BASE_PATH, { encoding: 'utf-8' }).then(files => {
    files.forEach(file => {
        /.*\.js/.test(file) && fileList.push(file);
    });
    fileList.forEach(async (instance) => {
        const { name } = path.parse(instance);
        const apiJs = await fs.promises.readFile(path.join(BASE_PATH, instance), { encoding: 'utf-8' });
        const astJs = recast_1.parse(apiJs, { parser: { parse: babel.parse } });
        let resFile = null;
        try {
            await fs.promises.access(path.join(BASE_PATH, name + '.d.ts'), fs.constants.F_OK);
            const apiTs = await fs.promises.readFile(path.join(BASE_PATH, name + '.d.ts'), { encoding: 'utf-8' });
            const astTs = recast_1.parse(apiTs, { parser: require('recast/parsers/typescript') });
            visitAst(astTs);
            visitAst(astJs, tsInstanceBody);
            const nodes = astTs.program.body.filter((item) => !TNT.ExportDefaultDeclaration.check(item));
            const nodeBody = exportDefaultDeclaration(tsInterfaceDeclaration(identifier(name), tsInterfaceBody(diff(interfaceBody, tsInstanceBody))));
            const tsFile = file(program([...(nodes || []), nodeBody]));
            resFile = recast_1.prettyPrint(tsFile, { tabWidth: 2 }).code;
            console.log(`更新声明文件：${name}`);
        }
        catch (err) {
            err && console.log(err);
            console.log(`创建声明文件：${name}`);
            visitAst(astJs);
            const tsFile = file(program([
                exportDefaultDeclaration(tsInterfaceDeclaration(identifier(name), tsInterfaceBody(Object.values(interfaceBody))))
            ]));
            resFile = recast_1.prettyPrint(tsFile, { tabWidth: 2 }).code;
        }
        fs.promises.writeFile(path.join(BASE_PATH, name + '.d.ts'), resFile, { encoding: 'utf-8' });
        interfaceBody.clear();
        tsInstanceBody.clear();
    });
});
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
    const jsHash = [...jsList.entries()].reduce((obj, [name, item]) => {
        const hash = hashMethod(item);
        obj.set(hash, name);
        return obj;
    }, new Map());
    const tsHash = [...tsList.entries()].reduce((obj, [name, item]) => {
        const hash = hashMethod(item);
        obj.set(hash, name);
        return obj;
    }, new Map());
    const operate = myers_1.default(tsHash, jsHash);
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
    // return Object.keys(jsList).reduce((res, key) => {
    //   if (tsList[key]) {
    //     res.push(tsList[key]);
    //   } else {
    //     res.push(jsList[key])
    //   }
    //   return res;
    // }, [])
}
function visitAst(ast, existNode) {
    recast_1.visit(ast, {
        visitTSMethodSignature(path) {
            var _a;
            path.node.comments = (_a = path.node.comments) === null || _a === void 0 ? void 0 : _a.map(item => {
                const value = item.value.replace(/\r\n */g, '\r\n ');
                return recast_1.types.builders.commentBlock(value);
            });
            tsInstanceBody.set(path.node.key.name, path.node);
            this.traverse(path);
        },
        visitObjectMethod(path) {
            var _a;
            const astParam = parseParams(path.node);
            const name = identifier(astParam.name);
            // if (existNode && existNode[astParam.name]) {
            //   this.traverse(path);
            //   return;
            // }
            const astRes = tsMethodSignature.from({
                key: name,
                parameters: generateParams(astParam.params),
                typeAnnotation: tsTypeAnnotation.from({
                    typeAnnotation: generateReturns(astParam.return),
                })
            });
            astRes.comments = astParam.comments;
            (_a = astRes.comments) === null || _a === void 0 ? void 0 : _a.forEach(item => {
                if (TNT.CommentBlock.check(item)) {
                    item.value = formatComments(item.value);
                }
            });
            interfaceBody.set(astParam.name, astRes);
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
    astParam.name = node.key.name;
    // console.log(node.comments.value)
    astParam.comments = node.comments;
    // astParam.comments?.forEach(item => {
    //   item.value = item.value.replace(/\\r\\n */g, '\r\n');
    // })
    return astParam;
}
function generateParams(paramsList) {
    return Object.entries(paramsList).reduce((params, [key, value]) => {
        if (!key) {
            return params;
        }
        const name = identifier(key);
        const type = {
            'number': tsNumberKeyword(),
            'string': tsStringKeyword(),
            'null': tsNullKeyword(),
            'object': tsObjectKeyword(),
            'undefined': tsUndefinedKeyword(),
            '*': tsAnyKeyword(),
        };
        name.typeAnnotation = tsTypeAnnotation.from({
            typeAnnotation: type[value]
        });
        params.push(name);
        return params;
    }, []);
}
