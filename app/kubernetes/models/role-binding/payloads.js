import { KubernetesPortainerServiceAccountNamespace } from "../service-account/models";
import { KubernetesCommonMetadataPayload } from "../common/payloads";

/**
 * Payload for GET
 */
const _KubernetesRoleBindingGetPayload = Object.freeze({
  id: ''
});
export class KubernetesRoleBindingGetPayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesRoleBindingGetPayload)));
  }
}

/**
 * Payload for CREATE
 */
const _KubernetesRoleBindingCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  roleRef: {
    apiGroup: "rbac.authorization.k8s.io",
    kind: "ClusterRole",
    name: "edit"
  },
  subjects: []
});
export class KubernetesRoleBindingCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesRoleBindingCreatePayload)));
  }
}

/**
 * Payload for UPDATE
 */
const _KubernetesRoleBindingSubjectPayload = Object.freeze({
  kind: 'ServiceAccount',
  name: '',
  namespace: KubernetesPortainerServiceAccountNamespace
})
export class KubernetesRoleBindingSubjectPayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesRoleBindingSubjectPayload)));
  }
}

const _KubernetesRoleBindingUpdatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  roleRef: {
    apiGroup: "rbac.authorization.k8s.io",
    kind: "ClusterRole",
    name: "edit"
  },
  subjects: []
});
export class KubernetesRoleBindingUpdatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesRoleBindingUpdatePayload)));
  }
}