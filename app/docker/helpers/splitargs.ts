/**

Splits strings into tokens by given separator except treating quoted part as a single token.


#Usage
```javascript
var splitargs = require('splitargs');

var i1 = "I said 'I am sorry.', and he said \"it doesn't matter.\"";
var o1 = splitargs(i1);
console.log(o1);

[ 'I',
  'said',
  'I am sorry.,',
  'and',
  'he',
  'said',
  'it doesn\'t matter.' ]


var i2 = "I said \"I am sorry.\", and he said \"it doesn't matter.\"";
var o2 = splitargs(i2);
console.log(o2);

[ 'I',
  'said',
  'I am sorry.,',
  'and',
  'he',
  'said',
  'it doesn\'t matter.' ]


var i3 = 'I said "I am sorry.", and he said "it doesn\'t matter."';
var o3 = splitargs(i3);
console.log(o3);

[ 'I',
  'said',
  'I am sorry.,',
  'and',
  'he',
  'said',
  'it doesn\'t matter.' ]


var i4 = 'I said \'I am sorry.\', and he said "it doesn\'t matter."';
var o4 = splitargs(i4);
console.log(o4);

[ 'I',
  'said',
  'I am sorry.,',
  'and',
  'he',
  'said',
  'it doesn\'t matter.' ]
 ```
 */

export function splitargs(
  input: string,
  sep?: RegExp | string,
  keepQuotes = false
) {
  const separator = sep || /\s/g;
  let singleQuoteOpen = false;
  let doubleQuoteOpen = false;
  let tokenBuffer = [];
  const ret = [];

  const arr = input.split('');
  for (let i = 0; i < arr.length; ++i) {
    const element = arr[i];
    const matches = element.match(separator);
    // TODO rewrite without continue
    /* eslint-disable no-continue */
    if (element === "'" && !doubleQuoteOpen) {
      if (keepQuotes) {
        tokenBuffer.push(element);
      }
      singleQuoteOpen = !singleQuoteOpen;
      continue;
    } else if (element === '"' && !singleQuoteOpen) {
      if (keepQuotes) {
        tokenBuffer.push(element);
      }
      doubleQuoteOpen = !doubleQuoteOpen;
      continue;
    }
    /* eslint-enable no-continue */

    if (!singleQuoteOpen && !doubleQuoteOpen && matches) {
      if (tokenBuffer.length > 0) {
        ret.push(tokenBuffer.join(''));
        tokenBuffer = [];
      } else if (sep) {
        ret.push(element);
      }
    } else {
      tokenBuffer.push(element);
    }
  }

  if (tokenBuffer.length > 0) {
    ret.push(tokenBuffer.join(''));
  } else if (sep) {
    ret.push('');
  }

  return ret;
}
