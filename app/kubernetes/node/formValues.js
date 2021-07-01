const _KubernetesNodeFormValues = Object.freeze({
  Taints: [],
  Labels: [],
  Availability: '',
});

export class KubernetesNodeFormValues {
  constructor() {
    Object.assign(JSON.parse(JSON.stringify(_KubernetesNodeFormValues)));
  }
}

const _KubernetesNodeTaintFormValues = Object.freeze({
  Key: '',
  Values: '',
  Effect: '',
  NeedsDeletion: false,
  IsNew: false,
  IsChanged: false,
});

export class KubernetesNodeTaintFormValues {
  constructor() {
    Object.assign(JSON.parse(JSON.stringify(_KubernetesNodeTaintFormValues)));
  }
}

const _KubernetesNodeLabelFormValues = Object.freeze({
  Key: '',
  Values: '',
  NeedsDeletion: false,
  IsNew: false,
  IsUsed: false,
  IsChanged: false,
});

export class KubernetesNodeLabelFormValues {
  constructor() {
    Object.assign(JSON.parse(JSON.stringify(_KubernetesNodeLabelFormValues)));
  }
}
