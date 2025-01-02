import _ from 'lodash';

import { ManifestV1, ManifestV2 } from '../../queries/manifest.service';
import { ImageConfigs } from '../../queries/getRegistryBlobs';

import { RepositoryTagViewModel } from './view-model';

function parseV1History(history: { v1Compatibility: string }[]) {
  return _.map(history, (item) => JSON.parse(item.v1Compatibility));
}

// convert image configs blob history to manifest v1 history
function parseImageConfigsHistory(imageConfigs: ImageConfigs, v2: ManifestV2) {
  return _.map(imageConfigs.history.reverse(), (item) => ({
    ...item,
    CreatedBy: item.created_by,
    // below fields exist in manifest v1 history but not image configs blob
    id: v2.config.digest,
    created: imageConfigs.created,
    docker_version: imageConfigs.docker_version,
    os: imageConfigs.os,
    architecture: imageConfigs.architecture,
    config: imageConfigs.config,
    container_config: imageConfigs.container_config,
  }));
}

export function manifestsToTag({
  v1,
  v2,
  imageConfigs,
}: {
  v1?: ManifestV1;
  v2: ManifestV2 & { digest: string };
  imageConfigs?: ImageConfigs;
}) {
  let history = [];
  let name = '';
  let os = '';
  let arch = '';

  if (imageConfigs) {
    // use info from image configs blob when manifest v1 is not provided by registry
    os = imageConfigs.os || '';
    arch = imageConfigs.architecture || '';
    history = parseImageConfigsHistory(imageConfigs, v2);
  } else if (v1) {
    // use info from manifest v1
    history = parseV1History(v1.history);
    name = v1.tag;
    os = _.get(history, '[0].os', '');
    arch = v1.architecture;
  }

  const size = v2.layers.reduce((size, b) => size + b.size, 0);

  const imageId = v2.config.digest;

  // v2.digest comes from
  //  1. Docker-Content-Digest header from the v2 response, or
  //  2. Calculated locally by sha256(v2-response-body)
  const imageDigest = v2.digest;

  return new RepositoryTagViewModel(
    name,
    os,
    arch,
    size,
    imageDigest,
    imageId,
    v2,
    history
  );
}
