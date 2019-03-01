function attrString(attrs) {
  var buff = [];
  for (var key in attrs) {
    buff.push(key + '="' + attrs[key] + '"');
  }
  if (!buff.length) {
    return '';
  }
  return ' ' + buff.join(' ');
}

function stringify(buff, doc) {
  switch (doc.type) {
    case 'text':
      return buff + doc.content;
    case 'tag':
      buff += '<' + doc.name + (doc.attrs ? attrString(doc.attrs) : '') + (doc.voidElement ? '/>' : '>');
      if (doc.voidElement) {
        return buff;
      }
      return buff + doc.children.reduce(stringify, '') + '</' + doc.name + '>';
  }
}

module.exports = function (doc) {
  return doc.reduce(function (token, rootEl) {
    return token + stringify('', rootEl);
  }, '');
};