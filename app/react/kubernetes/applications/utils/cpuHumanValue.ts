import _ from 'lodash';

export function cpuHumanValue(value: number) {
  return _.round(value, 2);
}
