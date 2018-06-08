var attrRE = /([\w-]+)|(['"])(.*?)\2/g;

// create optimized lookup object for
// void elements as listed here:
// http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
var lookup = (Object.create) ? Object.create(null) : {};
lookup.area = true;
lookup.base = true;
lookup.br = true;
lookup.col = true;
lookup.embed = true;
lookup.hr = true;
lookup.img = true;
lookup.input = true;
lookup.keygen = true;
lookup.link = true;
lookup.menuitem = true;
lookup.meta = true;
lookup.param = true;
lookup.source = true;
lookup.track = true;
lookup.wbr = true;

module.exports = function(tag) {
  var i = 0;
  var key;
  var res = {
    type: 'tag',
    name: '',
    voidElement: false,
    attrs: {},
    children: [],
  };

  tag.replace(attrRE, function(match) {
    if (i % 2) {
      key = match;
    } else {
      if (i === 0) {
        if (lookup[match] || tag.charAt(tag.length - 2) === '/') {
          res.voidElement = true;
        }
        res.name = match;
      } else {
        res.attrs[key] = match.replace(/^['"]|['"]$/g, '');
      }
    }
    i++;
  });

  return res;
};