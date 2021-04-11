import * as fs from 'fs';
import { parse, visit, types, prettyPrint } from 'recast';
import * as babel from '@babel/parser';
import * as path from 'path';
import diffMethod from './myers';
import { Identifier, TSExpressionWithTypeArguments, TSMethodSignature } from '_@babel_types@7.13.0@@babel/types';
const TNT = types.namedTypes;
const {
  file,
  program,
  exportDefaultDeclaration,
  tsInterfaceDeclaration,
  tsInterfaceBody,
  tsMethodSignature,
  identifier,
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

interface InterfaceBody {
  [key: string]: types.namedTypes.TSMethodSignature
}

let interfaceBody = new Map<string, types.namedTypes.TSMethodSignature>();
let tsInstanceBody = new Map<string, types.namedTypes.TSMethodSignature>();
const BASE_PATH = path.join(__dirname, 'modules');
const fileList: any[] = [];
fs.promises.readdir(BASE_PATH, { encoding: 'utf-8' }).then(files => {
  files.forEach(file => {
    /.*\.js/.test(file) && fileList.push(file);
  })
  fileList.forEach(async instance => {
    const { name } = path.parse(instance);
    const apiJs = await fs.promises.readFile(path.join(BASE_PATH, instance), { encoding: 'utf-8'});
    const astJs = parse(apiJs, { parser: { parse: babel.parse } })
    let resFile = null;
    try {
      await fs.promises.access(path.join(BASE_PATH, name + '.d.ts'), fs.constants.F_OK);
      const apiTs = await fs.promises.readFile(path.join(BASE_PATH, name + '.d.ts'), { encoding: 'utf-8'});
      const astTs = parse(apiTs, { parser: require('recast/parsers/typescript') })
      visitAst(astTs);
      visitAst(astJs, tsInstanceBody);
      const nodes = astTs.program.body.filter((item: any) => !TNT.ExportDefaultDeclaration.check(item))
      const nodeBody = exportDefaultDeclaration(
        tsInterfaceDeclaration(
          identifier(name), tsInterfaceBody(diff(interfaceBody, tsInstanceBody))
        )
      );
      const tsFile = file(program([ ...(nodes || []), nodeBody]));
      resFile = prettyPrint(tsFile, { tabWidth: 2 }).code;
      console.log(`更新声明文件：${name}`)
    } catch (err) {
      err && console.log(err)
      console.log(`创建声明文件：${name}`)
      visitAst(astJs);
      const tsFile = file(
        program(
          [
            exportDefaultDeclaration(
              tsInterfaceDeclaration(
                identifier(name), tsInterfaceBody(Object.values(interfaceBody))
              )
            )
          ]
        )
      )
      resFile = prettyPrint(tsFile, { tabWidth: 2 }).code
    }

    fs.promises.writeFile(path.join(BASE_PATH, name + '.d.ts'), resFile, { encoding: 'utf-8' });
    interfaceBody.clear()
    tsInstanceBody.clear()
  })
})
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
function diff(jsList: Map<string, types.namedTypes.TSMethodSignature>, tsList: Map<string, types.namedTypes.TSMethodSignature>) {
  const jsHash = [...jsList.entries()].reduce<Map<number, string>>((obj, [name, item]) => {
    const hash = hashMethod(item);
    obj.set(hash, name);
    return obj;
  }, new Map());
  const tsHash = [...tsList.entries()].reduce<Map<number, string>>((obj, [name, item]) => {
    const hash = hashMethod(item);
    obj.set(hash, name);
    return obj;
  }, new Map());
  const operate = diffMethod(tsHash, jsHash);
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
  // return Object.keys(jsList).reduce((res, key) => {
  //   if (tsList[key]) {
  //     res.push(tsList[key]);
  //   } else {
  //     res.push(jsList[key])
  //   }
  //   return res;
  // }, [])
}
function visitAst(ast: types.ASTNode, existNode?: AnyType) {
  visit(ast, {
    visitTSMethodSignature(path) {
      path.node.comments = path.node.comments?.map(item => {
        const value = item.value.replace(/\r\n */g, '\r\n ');
        return types.builders.commentBlock(value)
      })
      tsInstanceBody.set((<types.namedTypes.Identifier>path.node.key).name, path.node);
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
      interfaceBody.set(astParam.name, astRes)

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
  // console.log(node.comments.value)
  astParam.comments = node.comments;
  // astParam.comments?.forEach(item => {
  //   item.value = item.value.replace(/\\r\\n */g, '\r\n');
  // })
  return astParam;
}

function generateParams(paramsList: AnyType) {
  return Object.entries(paramsList).reduce<types.namedTypes.Identifier[]>((params, [key, value]) => {
    if (!key) {
      return params;
    }
    const name = identifier(key);
    const type: AnyType = {
      'number': tsNumberKeyword(),
      'string': tsStringKeyword(),
      'null': tsNullKeyword(),
      'object': tsObjectKeyword(),
      'undefined': tsUndefinedKeyword(),
      '*': tsAnyKeyword(),
    };
    name.typeAnnotation = tsTypeAnnotation.from({
      typeAnnotation: type[<string>value]
    })
    params.push(name);
    return params;
  }, [])
}
