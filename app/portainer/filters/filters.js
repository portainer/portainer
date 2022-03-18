import moment from 'moment';
import _ from 'lodash-es';
import filesize from 'filesize';

import { ResourceControlOwnership as RCO } from '@/portainer/access-control/types';

export function truncateLeftRight(text, max, left, right) {
  max = isNaN(max) ? 50 : max;
  left = isNaN(left) ? 25 : left;
  right = isNaN(right) ? 25 : right;

  if (text.length <= max) {
    return text;
  } else {
    return text.substring(0, left) + '[...]' + text.substring(text.length - right, text.length);
  }
}

export function stripProtocol(url) {
  return url.replace(/.*?:\/\//g, '');
}

export function humanize(bytes, round, base) {
  if (!round) {
    round = 1;
  }
  if (!base) {
    base = 10;
  }
  if (bytes || bytes === 0) {
    return filesize(bytes, { base: base, round: round });
  }
}

export function isoDateFromTimestamp(timestamp) {
  return moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss');
}

export function isoDate(date) {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
}

export function getPairKey(pair, separator) {
  if (!pair.includes(separator)) {
    return pair;
  }

  return pair.slice(0, pair.indexOf(separator));
}

export function getPairValue(pair, separator) {
  if (!pair.includes(separator)) {
    return '';
  }

  return pair.slice(pair.indexOf(separator) + 1);
}

export function ipAddress(ip) {
  return ip.slice(0, ip.indexOf('/'));
}

export function arrayToStr(arr, separator) {
  if (arr) {
    return _.join(arr, separator);
  }
  return '';
}

export function labelsToStr(arr, separator) {
  if (arr) {
    return _.join(
      arr.map((item) => item.key + ':' + item.value),
      separator
    );
  }
  return '';
}

export function endpointTypeName(type) {
  if (type === 1) {
    return 'Docker';
  } else if (type === 2 || type === 6) {
    return 'Agent';
  } else if (type === 3) {
    return 'Azure ACI';
  } else if (type === 5) {
    return 'Kubernetes';
  } else if (type === 4 || type === 7) {
    return 'Edge Agent';
  }
  return '';
}

export function environmentTypeIcon(type) {
  if (type === 3) {
    return 'fab fa-microsoft';
  } else if (type === 4) {
    return 'fa fa-cloud';
  } else if (type === 5 || type === 6 || type === 7) {
    return 'fas fa-dharmachakra';
  }
  return 'fab fa-docker';
}

export function ownershipIcon(ownership) {
  switch (ownership) {
    case RCO.PRIVATE:
      return 'fa fa-eye-slash';
    case RCO.ADMINISTRATORS:
      return 'fa fa-eye-slash';
    case RCO.RESTRICTED:
      return 'fa fa-users';
    default:
      return 'fa fa-eye';
  }
}

export function truncate(text, length, end) {
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
}
