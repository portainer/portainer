import {KubernetesCommonMetadataPayload} from '../common/payloads';

/**
 * Payload for GET
 */
const _KubernetesServiceAccountGetPayload = Object.freeze({
  id: ''
});
export class KubernetesServiceAccountGetPayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesServiceAccountGetPayload)));
  }
}

/**
 * Payload for CREATE
 */
const _KubernetesServiceAccountCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload()
});
export class KubernetesServiceAccountCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesServiceAccountCreatePayload)));
  }
}

/**
 * Payload for UPDATE
 */
// const _KubernetesServiceAccountUpdatePayload = Object.freeze({
//   metadata: new KubernetesCommonMetadataPayload(),
//   subjects: []
// });
// export class KubernetesServiceAccountUpdatePayload {
//   constructor() {
//     Object.assign(this, JSON.parse(JSON.stringify(_KubernetesServiceAccountUpdatePayload)));
//   }
// }