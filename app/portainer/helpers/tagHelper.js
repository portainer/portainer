import _ from 'lodash';

export default class PortainerEndpointTagHelper {
  static idsToTagNames(tags, ids) {
    const filteredTags = _.filter(tags, tag => _.includes(ids, tag.Id));
    const tagNames = _.map(filteredTags, 'Name');
    return tagNames;
  }
}
