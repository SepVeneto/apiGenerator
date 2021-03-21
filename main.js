"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var fs = require("fs");
var recast_1 = require("recast");
var babel = require("@babel/parser");
var path = require("path");
var TNT = recast_1.types.namedTypes;
var _a = recast_1.types.builders, file = _a.file, program = _a.program, exportDefaultDeclaration = _a.exportDefaultDeclaration, tsInterfaceDeclaration = _a.tsInterfaceDeclaration, tsInterfaceBody = _a.tsInterfaceBody, objectMethod = _a.objectMethod, interfaceDeclaration = _a.interfaceDeclaration, tsMethodSignature = _a.tsMethodSignature, identifier = _a.identifier, objectPattern = _a.objectPattern, tsTypeParameter = _a.tsTypeParameter, tsNumberKeyword = _a.tsNumberKeyword, tsStringKeyword = _a.tsStringKeyword, tsAnyKeyword = _a.tsAnyKeyword, tsNullKeyword = _a.tsNullKeyword, tsVoidKeyword = _a.tsVoidKeyword, tsBooleanKeyword = _a.tsBooleanKeyword, tsUndefinedKeyword = _a.tsUndefinedKeyword, tsObjectKeyword = _a.tsObjectKeyword, tsArrayType = _a.tsArrayType, tsTypeAnnotation = _a.tsTypeAnnotation, tsTypeParameterInstantiation = _a.tsTypeParameterInstantiation, tsTypeReference = _a.tsTypeReference;
var interfaceBody = {};
var tsInstanceBody = {};
var BASE_PATH = path.join(__dirname, 'api');
var fileList = [];
fs.promises.readdir(BASE_PATH, { encoding: 'utf-8' }).then(function (files) {
    files.forEach(function (file) {
        /.*\.js/.test(file) && fileList.push(file);
    });
    fileList.forEach(function (instance) { return __awaiter(void 0, void 0, void 0, function () {
        var name, apiJs, astJs, resFile, apiTs, astTs, nodes, nodeBody, tsFile, err_1, tsFile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = path.parse(instance).name;
                    return [4 /*yield*/, fs.promises.readFile(path.join(BASE_PATH, instance), { encoding: 'utf-8' })];
                case 1:
                    apiJs = _a.sent();
                    astJs = recast_1.parse(apiJs, { parser: { parse: babel.parse } });
                    resFile = null;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, fs.promises.access(path.join(BASE_PATH, name + '.d.ts'), fs.constants.F_OK)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, fs.promises.readFile(path.join(BASE_PATH, name + '.d.ts'), { encoding: 'utf-8' })];
                case 4:
                    apiTs = _a.sent();
                    astTs = recast_1.parse(apiTs, { parser: require('recast/parsers/typescript') });
                    visitAst(astTs);
                    visitAst(astJs, tsInstanceBody);
                    nodes = astTs.program.body.filter(function (item) { return !TNT.ExportDefaultDeclaration.check(item); });
                    nodeBody = exportDefaultDeclaration(tsInterfaceDeclaration(identifier(name), tsInterfaceBody(diff(interfaceBody, tsInstanceBody))));
                    tsFile = file(program(__spreadArrays((nodes || []), [nodeBody])));
                    resFile = recast_1.prettyPrint(tsFile, { tabWidth: 2 }).code;
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    console.log('创建声明文件');
                    visitAst(astJs);
                    tsFile = file(program([
                        exportDefaultDeclaration(tsInterfaceDeclaration(identifier(name), tsInterfaceBody(Object.values(interfaceBody))))
                    ]));
                    resFile = recast_1.prettyPrint(tsFile, { tabWidth: 2 }).code;
                    return [3 /*break*/, 6];
                case 6:
                    fs.promises.writeFile(path.join(BASE_PATH, name + '.d.ts'), resFile, { encoding: 'utf-8' });
                    interfaceBody = {};
                    tsInstanceBody = {};
                    return [2 /*return*/];
            }
        });
    }); });
});
function diff(jsList, tsList) {
    return Object.keys(jsList).reduce(function (res, key) {
        if (tsList[key]) {
            res.push(tsList[key]);
        }
        else {
            res.push(jsList[key]);
        }
        return res;
    }, []);
}
function visitAst(ast, existNode) {
    recast_1.visit(ast, {
        visitTSMethodSignature: function (path) {
            var _a;
            path.node.comments = (_a = path.node.comments) === null || _a === void 0 ? void 0 : _a.map(function (item) {
                var value = item.value.replace(/\r\n */g, '\r\n ');
                return recast_1.types.builders.commentBlock(value);
            });
            tsInstanceBody[path.node.key.name] = path.node;
            this.traverse(path);
        },
        visitObjectMethod: function (path) {
            var astParam = parseParams(path.node);
            var name = identifier(astParam.name);
            // if (existNode && existNode[astParam.name]) {
            //   this.traverse(path);
            //   return;
            // }
            var astRes = tsMethodSignature.from({
                key: name,
                parameters: generateParams(astParam.params),
                typeAnnotation: tsTypeAnnotation.from({
                    typeAnnotation: generateReturns(astParam["return"])
                })
            });
            astRes.comments = astParam.comments;
            // console.log(prettyPrint(astRes).code);
            // console.log(astRes)
            // text += prettyPrint(astRes).code;
            interfaceBody[astParam.name] = astRes;
            this.traverse(path);
        }
    });
}
function generateReturns(returns) {
    var ident = identifier(returns);
    var annotation = tsTypeReference(ident);
    if (returns === 'void') {
        return tsVoidKeyword();
    }
    else {
        var response = identifier('Response');
        var slot = tsTypeParameterInstantiation([tsTypeReference(response)]);
        annotation.typeParameters = slot;
    }
    return annotation;
}
function parseParams(node) {
    var _a, _b;
    var astParam = {
        name: '',
        params: {},
        "return": 'void',
        comments: []
    };
    var params = node.params.map(function (item) {
        if (TNT.AssignmentPattern.check(item)) {
            return item.left.name;
        }
        return item.name;
    });
    var paramsType = {};
    (_a = node.comments) === null || _a === void 0 ? void 0 : _a.forEach(function (item) {
        var regExp = /@(param|returns) {(.*)}\S*(.*)/;
        item.value.split("\r\n").forEach(function (each) {
            var _a = regExp.exec(each) || [], catalog = _a[1], type = _a[2], name = _a[3];
            if (catalog === 'param') {
                paramsType[name.trim()] = type;
            }
            else if (catalog === 'returns') {
                astParam["return"] = type;
            }
        });
    });
    params.forEach(function (item) {
        astParam.params[item] = paramsType[item] || '*';
    });
    astParam.name = node.key.name;
    // console.log(node.comments.value)
    astParam.comments = node.comments;
    (_b = astParam.comments) === null || _b === void 0 ? void 0 : _b.forEach(function (item) {
        item.value = item.value.replace(/\\r\\n */, '\r\n');
    });
    return astParam;
}
function generateParams(paramsList) {
    return Object.entries(paramsList).reduce(function (params, _a) {
        var key = _a[0], value = _a[1];
        if (!key) {
            return null;
        }
        var name = identifier(key);
        var type = {
            number: tsNumberKeyword(),
            string: tsStringKeyword(),
            "null": tsNullKeyword(),
            object: tsObjectKeyword(),
            undefined: tsUndefinedKeyword(),
            '*': tsAnyKeyword()
        }[value];
        name.typeAnnotation = tsTypeAnnotation.from({
            typeAnnotation: type
        });
        params.push(name);
        return params;
    }, []);
}
