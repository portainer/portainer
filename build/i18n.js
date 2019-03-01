// WIP

const {relative, resolve, join} = require('path');
const {existsSync, readdirSync, readFileSync, writeFileSync, statSync, mkdirSync} = require('fs');

const charset = 'utf-8';

const HTML = require('./html-ast');
const esprima = require('esprima');

const rootDir = resolve(__dirname, '..');
const appDir = join(rootDir, 'app');
const translateDir = join(rootDir, 'i18n');

let result = {};

if (!existsSync(appDir)) {
  console.log('script path error.');
  process.exit(404);
}

if (!existsSync(translateDir)) mkdirSync(translateDir);

/**
 * Scan file in dir, use ext to filter
 * @param dirPath
 * @param ext
 * @returns {Array}
 */
function scandir(dirPath, ext) {
  const result = readdirSync(dirPath);
  if (!result.length) return [];
  return result.map((dirName) => {
    const filePath = join(dirPath, dirName);
    if (statSync(filePath).isDirectory()) {
      return scandir(join(dirPath, dirName), ext);
    } else {
      if (!ext) return filePath;
      if (filePath.lastIndexOf(ext) === filePath.indexOf(ext) && filePath.indexOf(ext) > -1) return filePath;
      return null;
    }
  }).filter(fileIsExist => fileIsExist);
}

/**
 * flatten an array
 * @param arr
 */
function flatten(arr) {
  return arr.reduce(function(flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

/**
 * Stage 1: Process HTML Templates
 */

const allTemplateFiles = flatten(scandir(appDir, '.html'));
//.slice(0, 3);

console.log(`find ${allTemplateFiles.length} HTML templates.`);

/**
 * filter the node with text content or attr
 * @param nodeList
 * @return {*}
 */
function getNodeWithText(nodeList) {

  function isTextNode(node) {
    return node.type === 'text' && !node.children;
  }

  function isEmpty(textNode) {
    return textNode.content.match(/^\n\s+?$/);
  }

  function isInputNodeWithText(node) {
    return node.type === 'tag' && node.name === 'input'
        && node.children && node.children.filter((child) => child.attrs.type === 'text').length;
  }

  function isLabelNodeWithText(node) {
    return node.type === 'tag' && node.name === 'label' &&
        node.children && node.children.filter((child) => child.type === 'text' && child.content).length;
  }

  return nodeList.map((node) => {
    if ((isTextNode(node) && !isEmpty(node)) || isInputNodeWithText(node) || isLabelNodeWithText(node)) return node;

    if (node.children) {
      node.children = getNodeWithText(node.children);
      return node;
    } else {
      // todo: remove it when debug is not necessarily
      if (!(isTextNode(node) && isEmpty(node))) console.log('not support node', node);
      return null;
    }
  }).filter(nodeIsValid => nodeIsValid);
}

allTemplateFiles.forEach(file => {
  const content = readFileSync(file, charset);
  const ast = HTML.parse(content);
  const textNodes = getNodeWithText(ast);
  const fileName = relative(appDir, file);
  result[fileName] = result[fileName] || {};

  // todo recursive query html ast tree
  textNodes.forEach((node) => {
    if (node.type !== 'tag') {
      console.error('template maybe has error anonymous text');
      console.log(file, node);
    }
    node.children && node.children.forEach((child) => {
      if (child.idx) {
        // todo: just make a placeholder for cache key
        result[fileName][child.idx] = {};
      }
    });
  });
});
// restore via HTML.stringify(...), keep newline etc...

console.log(result);

// todo:: 1. save ast nodes which contains text someplace
// todo:: 2. check is there any type node lost
// todo:: 3. modify ng render func

const allScriptFiles = flatten(scandir(appDir, '.js'));
const esprimaTokenizeConfig = {loc: true, comment: false};

false && allScriptFiles.forEach(file => {
  const content = readFileSync(file, charset);
  const ast = esprima.tokenize(content, esprimaTokenizeConfig).filter(token => token.type === 'String');
  const fileName = relative(appDir, file);
  result[fileName] = result[fileName] || {};
  ast.forEach((astItem) => {
    const {start, end} = astItem.loc;
    // trim single quote
    if (astItem.value && astItem.value.length > 2) {
      result[fileName][`${start.line}_${start.column}_${end.line}_${end.column}`] = astItem.value.slice(1, -1);
    }
  });
});

// keep string result
writeFileSync(join(translateDir, 'en-US.json'), JSON.stringify(result, null, 2));

// restore via esprima.parse(...)
