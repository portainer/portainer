angular.module('portainer.app')
.filter('truncate', function () {
  'use strict';
  return function (text, length, end) {
    if (isNaN(length)) {
      length = 10;
    }

    if (end === undefined) {
      end = '...';
    }

    if (text.length <= length || text.length - end.length <= length) {
      return text;
    } else {
      return String(text).substring(0, length - end.length) + end;
    }
  };
})
.filter('truncatelr', function () {
  'use strict';
  return function (text, max, left, right) {
    max = isNaN(max) ? 50 : max;
    left = isNaN(left) ? 25 : left;
    right = isNaN(right) ? 25 : right;

    if (text.length <= max) {
      return text;
    } else {
      return text.substring(0, left) + '[...]' + text.substring(text.length - right, text.length);
    }
  };
})
.filter('capitalize', function () {
  'use strict';
  return function (text) {
    return _.capitalize(text);
  };
})
.filter('stripprotocol', function() {
  'use strict';
  return function (url) {
    return url.replace(/.*?:\/\//g, '');
  };
})
.filter('humansize', function () {
  'use strict';
  return function (bytes, round, base) {
    if (!round) {
      round = 1;
    }
    if (!base) {
      base = 10;
    }
    if (bytes || bytes === 0) {
      return filesize(bytes, {base: base, round: round});
    }
  };
})
.filter('getisodatefromtimestamp', function () {
  'use strict';
  return function (timestamp) {
    return moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss');
  };
})
.filter('getisodate', function () {
  'use strict';
  return function (date) {
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
  };
})
.filter('key', function () {
  'use strict';
  return function (pair, separator) {
    return pair.slice(0, pair.indexOf(separator));
  };
})
.filter('value', function () {
  'use strict';
  return function (pair, separator) {
    return pair.slice(pair.indexOf(separator) + 1);
  };
})
.filter('emptyobject', function () {
  'use strict';
  return function (obj) {
    return _.isEmpty(obj);
  };
})
.filter('ipaddress', function () {
  'use strict';
  return function (ip) {
    return ip.slice(0, ip.indexOf('/'));
  };
})
.filter('arraytostr', function () {
  'use strict';
  return function (arr, separator) {
    if (arr) {
      return _.join(arr, separator);
    }
    return '';
  };
})
.filter('ownershipicon', function () {
  'use strict';
  return function (ownership) {
    switch (ownership) {
      case 'private':
        return 'fa fa-eye-slash';
      case 'administrators':
        return 'fa fa-eye-slash';
      case 'restricted':
        return 'fa fa-users';
      default:
        return 'fa fa-eye';
    }
  };
});
