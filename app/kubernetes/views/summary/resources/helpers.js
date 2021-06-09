import _ from 'lodash-es';
import * as JsonPatch from 'fast-json-patch';
import { KubernetesResourceActions } from 'Kubernetes/models/resource-types/models';

function findCreateResources(newResources, oldResources) {
  return _.differenceBy(newResources, oldResources, 'Name');
}

function findDeleteResources(newResources, oldResources) {
  return _.differenceBy(oldResources, newResources, 'Name');
}

function findUpdateResources(newResources, oldResources) {
  const updateResources = _.intersectionWith(newResources, oldResources, (newResource, oldResource) => {
    // find out resources with same name but content changed
    if (newResource.Name != oldResource.Name) {
      return false;
    }
    return !isEqual(newResource, oldResource);
  });

  return updateResources;
}

function isEqual(newResource, oldResource) {
  let patches = JsonPatch.compare(newResource, oldResource);
  patches = _.filter(patches, (change) => {
    return !_.includes(change.path, '$$hashKey') && !_.includes(change.path, 'Duplicate');
  });

  return !patches.length;
}

function doGetResourcesSummary(newResources, oldResources, kind, action, actionFilter) {
  const filteredResources = actionFilter(newResources, oldResources);
  const summary = filteredResources.map((resource) => ({ name: resource.Name, action, kind }));

  return summary;
}

export function getResourcesSummary(newResources, oldResources, kind) {
  if (!Array.isArray(newResources)) {
    newResources = newResources ? [newResources] : [];
    oldResources = oldResources ? [oldResources] : [];
  }

  const summary = [
    ...doGetResourcesSummary(newResources, oldResources, kind, KubernetesResourceActions.CREATE, findCreateResources),
    ...doGetResourcesSummary(newResources, oldResources, kind, KubernetesResourceActions.UPDATE, findUpdateResources),
    ...doGetResourcesSummary(newResources, oldResources, kind, KubernetesResourceActions.DELETE, findDeleteResources),
  ];

  return summary;
}
