import * as fs from 'fs';
import { parse, visit, types, prettyPrint } from 'recast';
import * as babylon from 'babylon';
import * as path from 'path';
import diffMethod from './myers';
import { AnyType, InstanceBody } from './index';
import color from './color';
import * as K from 'ast-types/gen/kinds';
const TNT = types.namedTypes;
const {
  file,
  program,
  exportDefaultDeclaration,
  tsUnionType,
  tsArrayType,
  tsInterfaceDeclaration,
  tsInterfaceBody,
  tsMethodSignature,
  identifier,
  tsBooleanKeyword,
  tsNumberKeyword,
  tsStringKeyword,
  tsAnyKeyword,
  tsNullKeyword,
  tsVoidKeyword,
  tsUndefinedKeyword,
  tsObjectKeyword,
  tsTypeAnnotation,
  tsTypeParameterInstantiation,
  tsTypeReference,
} = types.builders;

let instanceBody = new Map();
let tsInstanceBody = new Map();

function generateMethod(method: types.namedTypes.TSMethodSignature) {
  return {
    name: (<types.namedTypes.Identifier>method.key).name,
    params: (method.parameters).map((item) => {
      const inst = <types.namedTypes.TSTypeParameter>item;
      return {
        name: inst.name,
        type: inst.typeAnnotation?.typeAnnotation?.type
      }
    }),
    comments: method.comments?.map(item => item.value),
  };
}
function hash(h: number, c: number) {
  return c + (h << 7 ) | h >> (8 * 8 - 7)
}
function hashMethod(params: types.namedTypes.TSMethodSignature) {
  const methodRes = generateMethod(params)
  const buffer = Buffer.from(JSON.stringify(methodRes));
  const hashValue = buffer.reduce((curr, hashValue) => {
    return hash(hashValue, curr);
  }, 0)
  return hashValue;
}
function diff(jsList: InstanceBody, tsList: InstanceBody) {
  const failList = [];
  const jsHash = [...jsList.entries()].reduce<Map<number, string>>((obj, [name, item]) => {
    const hash = hashMethod(item);
    if (obj.get(hash)) {
      failList.push(name);
      throw new Error(`生成hash失败，存在重复值, 请完善 ${color('bright', name)}`);
    }
    obj.set(hash, name);
    return obj;
  }, new Map());
  const tsHash = [...tsList.entries()].reduce<Map<number, string>>((obj, [name, item]) => {
    const hash = hashMethod(item);
    obj.set(hash, name);
    return obj;
  }, new Map());
  const operate = diffMethod(tsHash, jsHash, logDiff);
  let jsIndex = 0;
  let tsIndex = 0;
  const res: types.namedTypes.TSMethodSignature[] = [];
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
  })
  return res;
}
function visitAst(ast: types.ASTNode, body: InstanceBody, existNode?: AnyType) {
  visit(ast, {
    visitTSMethodSignature(path) {
      path.node.comments = path.node.comments?.map(item => {
        if (TNT.CommentBlock.check(item)) {
          const value = item.value.replace(/\r\n */g, '\r\n ');
          return types.builders.commentBlock(value)
        } else {
          return item;
        }
      })
      body.set((<types.namedTypes.Identifier>path.node.key).name, path.node);
      this.traverse(path);
    },
    visitObjectMethod(path) {
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
      astRes.comments?.forEach(item => {
        if (TNT.CommentBlock.check(item)) {
          item.value = formatComments(item.value);
        }
      })
      body.set(astParam.name, astRes)

      this.traverse(path);
    }
  })
}

function formatComments(comments: string) {
  if (/ *\*/g.test(comments)) {
    return comments
      .replace(/ *\*/g, ' *')
      .replace(/\r\n/g, '%^&')
      .trim()
      .replace(/\%\^\&/g, '\r\n') + ' '
  } else {
    return comments;
  }
}

function generateReturns(returns: string) {
  const ident = identifier(returns);
  const annotation = tsTypeReference(ident);
  if (returns === 'void') {
    return tsVoidKeyword();
  } else {
    const response = identifier('Response');
    const slot = tsTypeParameterInstantiation([tsTypeReference(response)])
    annotation.typeParameters = slot;
  }
  return annotation;
}

function parseParams(node: types.namedTypes.ObjectMethod) {
  const astParam: AnyType = {
    name: '',
    params: {},
    return: 'Promise',
    comments: [],
  };
  const params = node.params.map((item) => {
    if (TNT.AssignmentPattern.check(item)) {
      return (<types.namedTypes.Identifier>item.left).name;
    }
    return (<types.namedTypes.Identifier>item).name;
  })
  const paramsType: AnyType = {};
  node.comments?.forEach(item => {
    const regExp = /@(param|returns) {(.*)}\S*(.*)/;
    item.value.split(`\r\n`).forEach(each => {
      const [,catalog, type, name] = regExp.exec(each) || [];
      if (catalog === 'param') {
        paramsType[name.trim().split(' ')[0]] = type;
      } else if (catalog === 'returns') {
        astParam.return = type;
      }
    })
  })
  params.forEach(item => {
    astParam.params[item] = paramsType[item] || '*';
  })
  astParam.name = (<types.namedTypes.Identifier>node.key).name;
  astParam.comments = node.comments;
  // astParam.comments?.forEach(item => {
  //   item.value = item.value.replace(/\\r\\n */g, '\r\n');
  // })
  return astParam;
}
const type: AnyType = {
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
function generateType(value: string): K.TSTypeKind {
  const union = value.split('|').map(item => item.trim());
  if (union && Array.isArray(union) && union.length > 1) {
    return tsUnionType(union.map(item => generateType(item) || tsTypeReference(identifier(value))));
  }
  // 生成hash值时只基于最外面的类型，泛型会被视为tsTypeReference，所以没做处理
  const unionReg = /(\S*)(\[\])+/;
  if (unionReg.test(value)) {
    const [, typeName, reference] = unionReg.exec(value) || [];
    if (reference) {
      return tsArrayType(type[typeName]);
    } else {
      return type[value]
    }
  }
  return type[value];
}

function generateParams(paramsList: AnyType) {
  return Object.entries(paramsList).reduce<types.namedTypes.Identifier[]>((params, [key, value]) => {
    if (!key) {
      return params;
    }
    const name = identifier(key);

    name.typeAnnotation = tsTypeAnnotation.from({
      typeAnnotation: generateType(value) || tsTypeReference(identifier(value))
    })
    params.push(name);
    return params;
  }, [])
}
function main( fileList: string[], basePath: string) {
  const BASE_PATH = basePath;
  fileList.forEach(async instance => {
    const { name } = path.parse(instance);
    const apiJs = await fs.promises.readFile(path.join(BASE_PATH, instance), { encoding: 'utf-8'});
    const astJs = parse(apiJs, { parser: { parse: (code: string) => babylon.parse(code, {
      sourceType: 'module',
      plugins: ['decorators', 'objectRestSpread'],
    }) } })
    let resFile = '';
    try {
      if (fs.existsSync(path.join(BASE_PATH, name + '.d.ts'))) {
        const apiTs = await fs.promises.readFile(path.join(BASE_PATH, name + '.d.ts'), { encoding: 'utf-8'});
        const astTs = parse(apiTs, { parser: require('recast/parsers/typescript') })

        visitAst(astJs, instanceBody);
        visitAst(astTs, tsInstanceBody);

        const nodes = astTs.program.body.filter((item: any) => !TNT.ExportDefaultDeclaration.check(item))
        const nodeBody = exportDefaultDeclaration(
          tsInterfaceDeclaration(
            identifier(name), tsInterfaceBody(diff(instanceBody, tsInstanceBody))
          )
        );
        const tsFile = file(program([ ...(nodes || []), nodeBody]));
        resFile = prettyPrint(tsFile, { tabWidth: 2 }).code;
        console.log(`更新声明文件：${name}`)
      } else {
        console.log(`创建声明文件：${name}`)
        visitAst(astJs, instanceBody);
        const tsFile = file(
          program(
            [
              exportDefaultDeclaration(
                tsInterfaceDeclaration(
                  identifier(name), tsInterfaceBody([...instanceBody.values()])
                )
              )
            ]
          )
        )
        resFile = prettyPrint(tsFile, { tabWidth: 2 }).code
      }
      fs.promises.writeFile(path.join(BASE_PATH, name + '.d.ts'), resFile, { encoding: 'utf-8' });
    } catch (err) {
      const message = `文件 ${color('bright', instance)} 发生异常。`;
      err.message = message + err.message
      console.error(err)
    }
    instanceBody.clear()
    tsInstanceBody.clear()
  })
}
let logDiff = true;
export default async function apiGenerate(dirpath: string, moduleName: string, files: string[], verbose: boolean) {
  logDiff = !!verbose;
  const BASE_PATH = path.join(dirpath, moduleName);
  if (!fs.existsSync(BASE_PATH)) {
    throw new Error(`路径${BASE_PATH}非法`);
  }

  let fileList: string[] = [];
  if (files && files.length > 0) {
    files.forEach(file => {
      if (!fs.statSync(path.join(BASE_PATH, file))) {
        throw new Error(`路径${BASE_PATH}上不存在文件${file}`);
      }
      fileList.push(file);
    })
  } else {
    fileList = (await fs.promises.readdir(BASE_PATH, { encoding: 'utf-8' })).filter(file => /.*\.js/.test(file))
  }
  main(fileList, BASE_PATH);
}

if (module.id === '.') {
  const BASE_PATH = path.join(__dirname, '../modules');
  main(['api.js'], BASE_PATH);
}
