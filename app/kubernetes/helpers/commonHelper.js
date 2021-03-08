import _ from 'lodash-es';

class KubernetesCommonHelper {
  static assignOrDeleteIfEmpty(obj, path, value) {
    if (!value || (value instanceof Array && !value.length)) {
      _.unset(obj, path);
    } else {
      _.set(obj, path, value);
    }
  }

  static ownerToLabel(owner) {
    let label = _.replace(owner, /[^-A-Za-z0-9_.]/g, '.');
    label = _.truncate(label, { length: 63, omission: '' });
    label = _.replace(label, /^[-_.]*/g, '');
    label = _.replace(label, /[-_.]*$/g, '');
    return label;
  }

  static assignOrDeleteIfEmptyOrZero(obj, path, value) {
    if (!value || value === 0 || (value instanceof Array && !value.length)) {
      _.unset(obj, path);
    } else {
      _.set(obj, path, value);
    }
  }

  /**
   * Format a string to be compliant with RFC 1123 - DNS subdomain specs
   * https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names
   * contain no more than 253 characters
   * contain only lowercase alphanumeric characters, '-' or '.'
   * start with an alphanumeric character
   * end with an alphanumeric character
   * @param {String} str String to format
   */
  static formatToDnsSubdomainName(str) {
    let res = _.replace(str, /[^a-z0-9.-]/g, '.');
    res = _.replace(res, /(^[-.]*)|([-.]*$)/g, '');
    res = _.truncate(res, { length: 253, omission: '' });
    return res;
  }

  /**
   * Format a string to be compliant with RFC 1123 - DNS subdomain specs
   * https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-label-names
   * contain at most 63 characters
   * contain only lowercase alphanumeric characters or '-'
   * start with an alphanumeric character
   * end with an alphanumeric character
   * @param {String} str String to format
   */
  static formatToDnsLabelName(str) {
    let res = _.replace(str, /[^a-z0-9-]/g, '-');
    res = _.replace(str, /(^[-]*)|([-]*$)/g, ''); // ensure alph on string start and end
    res = _.truncate(res, { length: 63, omission: '' });
    return res;
  }
}
export default KubernetesCommonHelper;
