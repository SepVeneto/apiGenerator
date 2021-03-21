import * as fs from 'fs';
import { parse, visit, types, prettyPrint, print } from 'recast';
import * as babel from '@babel/parser';
import * as path from 'path';
import { isTaggedTemplateExpression, TSMethodSignature } from '_@babel_types@7.13.0@@babel/types';
const TNT = types.namedTypes;
type AnyType = {
  [key: string]: any,
}
const {
  file,
  program,
  exportDefaultDeclaration,
  tsInterfaceDeclaration,
  tsInterfaceBody,
  objectMethod,
  interfaceDeclaration,
  tsMethodSignature,
  identifier,
  objectPattern,
  tsTypeParameter,
  tsNumberKeyword,
  tsStringKeyword,
  tsAnyKeyword,
  tsNullKeyword,
  tsVoidKeyword,
  tsBooleanKeyword,
  tsUndefinedKeyword,
  tsObjectKeyword,
  tsArrayType,
  tsTypeAnnotation,
  tsTypeParameterInstantiation,
  tsTypeReference,
} = types.builders;

let interfaceBody = {};
let tsInstanceBody = {};
const BASE_PATH = path.join(__dirname, 'api');
const fileList = [];
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
      const nodes = astTs.program.body.filter(item => !TNT.ExportDefaultDeclaration.check(item))
      const nodeBody = exportDefaultDeclaration(
        tsInterfaceDeclaration(
          identifier(name), tsInterfaceBody(diff(interfaceBody, tsInstanceBody))
        )
      );
      const tsFile = file(program([ ...(nodes || []), nodeBody]));
      resFile = prettyPrint(tsFile, { tabWidth: 2 }).code;
    } catch (err) {
      console.log('创建声明文件')
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
    interfaceBody = {};
    tsInstanceBody = {};
  })
})
function diff(jsList, tsList) {
  return Object.keys(jsList).reduce((res, key) => {
    if (tsList[key]) {
      res.push(tsList[key]);
    } else {
      res.push(jsList[key])
    }
    return res;
  }, [])
}
function visitAst(ast: types.ASTNode, existNode?: AnyType) {
  visit(ast, {
    visitTSMethodSignature(path) {
      path.node.comments = path.node.comments?.map(item => {
        const value = item.value.replace(/\r\n */g, '\r\n ');
        return types.builders.commentBlock(value)
      })
      tsInstanceBody[(<types.namedTypes.Identifier>path.node.key).name] = path.node;
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
      // console.log(prettyPrint(astRes).code);
      // console.log(astRes)
      // text += prettyPrint(astRes).code;
      interfaceBody[astParam.name] = astRes

      this.traverse(path);
    }
  })
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
  const astParam = {
    name: '',
    params: {},
    return: 'void',
    comments: [],
  };
  const params = node.params.map((item) => {
    if (TNT.AssignmentPattern.check(item)) {
      return (<types.namedTypes.Identifier>item.left).name;
    }
    return (<types.namedTypes.Identifier>item).name;
  })
  const paramsType = {};
  node.comments?.forEach(item => {
    const regExp = /@(param|returns) {(.*)}\S*(.*)/;
    item.value.split(`\r\n`).forEach(each => {
      const [,catalog, type, name] = regExp.exec(each) || [];
      if (catalog === 'param') {
        paramsType[name.trim()] = type;
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
  astParam.comments?.forEach(item => {
    item.value = item.value.replace(/\\r\\n */, '\r\n');
  })
  return astParam;
}

function generateParams(paramsList: AnyType) {
  return Object.entries(paramsList).reduce((params, [key, value]) => {
    if (!key) {
      return null;
    }
    const name = identifier(key);
    const type = {
      number: tsNumberKeyword(),
      string: tsStringKeyword(),
      null: tsNullKeyword(),
      object: tsObjectKeyword(),
      undefined: tsUndefinedKeyword(),
      '*': tsAnyKeyword(),
    }[value];
    name.typeAnnotation = tsTypeAnnotation.from({
      typeAnnotation: type
    })
    params.push(name);
    return params;
  }, [])
}
