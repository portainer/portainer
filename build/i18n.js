// WIP

const {relative, resolve, join} = require('path');
const {existsSync, readdirSync, readFileSync, writeFileSync, statSync} = require('fs');

const charset = 'utf-8';

const HTML = require('./html-ast');
const esprima = require('esprima');

const rootDir = resolve(__dirname, '..');
const appDir = join(rootDir, 'app');

if (!existsSync(appDir)) {
  console.log('script path error.');
  process.exit(404);
}

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

console.log(`find ${allTemplateFiles.length} HTML templates.`);

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

  // node tree with `text`
  // console.log(
  //     JSON.stringify(getNodeWithText(ast), null, 4),
  // );
});
// restore via HTML.stringify(...), keep newline etc...


// todo:: 1. save ast nodes which contains text someplace
// todo:: 2. check is there any type node lost
// todo:: 3. modify ng render func

const allScriptFiles = flatten(scandir(appDir, '.js')).slice(0, 1);

allScriptFiles.forEach(file => {

  const content = readFileSync(file, charset);
  const ast = esprima.tokenize(content, {range: true}).filter(token => token.type === 'String');

  // echo string write in js logic files.
  console.log(ast);
});
// restore via esprima.parse(...)
