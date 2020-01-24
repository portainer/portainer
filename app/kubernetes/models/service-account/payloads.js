import { KubernetesCommonMetadataPayload } from "../common/payloads";

/**
 * Payload for GET
 */
const _KubernetesServiceAccountGetPayload = Object.freeze({
  id: ''
});
export class KubernetesServiceAccountGetPayload {
  constructor() {
    Object.assign(this, _KubernetesServiceAccountGetPayload);
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
    Object.assign(this, _KubernetesServiceAccountCreatePayload);
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
//     Object.assign(this, _KubernetesServiceAccountUpdatePayload);
//   }
// }