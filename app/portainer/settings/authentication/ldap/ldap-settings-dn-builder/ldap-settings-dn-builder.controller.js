export default class LdapSettingsBaseDnBuilderController {
  /* @ngInject */
  constructor() {
    this.entries = [];
  }

  addEntry() {
    this.entries.push({ type: 'ou', value: '' });
  }

  removeEntry($index) {
    this.entries.splice($index, 1);
    this.onEntriesChange();
  }

  moveUp($index) {
    if ($index <= 0) {
      return;
    }
    arrayMove(this.entries, $index, $index - 1);
    this.onEntriesChange();
  }

  moveDown($index) {
    if ($index >= this.entries.length - 1) {
      return;
    }
    arrayMove(this.entries, $index, $index + 1);
    this.onEntriesChange();
  }

  onEntriesChange() {
    const dn = this.entries
      .filter(({ value }) => value)
      .map(({ type, value }) => `${type}=${value}`)
      .concat(this.suffix)
      .filter((value) => value)
      .join(',');

    this.onChange(dn);
  }

  getOUValues(dn, domainSuffix = '') {
    const regex = /(\w+)=(\w*),?/;
    let ouValues = [];
    let left = dn;
    let match = left.match(regex);
    while (match && left !== domainSuffix) {
      const [, type, value] = match;
      ouValues.push({ type, value });
      left = left.replace(regex, '');
      match = left.match(/(\w+)=(\w+),?/);
    }
    return ouValues;
  }

  parseBaseDN() {
    this.entries = this.getOUValues(this.ngModel, this.suffix);
  }

  $onChanges({ suffix, ngModel }) {
    if ((!suffix && !ngModel) || (suffix && suffix.isFirstChange())) {
      return;
    }
    this.onEntriesChange();
  }

  $onInit() {
    this.parseBaseDN();
  }
}

function arrayMove(array, fromIndex, toIndex) {
  if (!checkValidIndex(array, fromIndex) || !checkValidIndex(array, toIndex)) {
    throw new Error('index is out of bounds');
  }
  const [item] = array.splice(fromIndex, 1);

  array.splice(toIndex, 0, item);

  function checkValidIndex(array, index) {
    return index >= 0 && index <= array.length;
  }
}
