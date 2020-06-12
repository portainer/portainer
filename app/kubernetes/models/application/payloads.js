/////////////////////////// VOLUME MOUNT ///////////////////////////////
/**
 * KubernetesApplicationVolumeMount Model
 */
const _KubernetesApplicationVolumeMount = Object.freeze({
  name: '',
  mountPath: '',
  readOnly: false,
});

export class KubernetesApplicationVolumeMountPayload {
  constructor(readOnly) {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationVolumeMount)));
    if (readOnly) {
      this.readOnly = true;
    } else {
      delete this.readOnly;
    }
  }
}

///////////////////////////////// PVC /////////////////////////////////
/**
 * KubernetesApplicationVolumePersistentPayload Model
 */
const _KubernetesApplicationVolumePersistentPayload = Object.freeze({
  name: '',
  persistentVolumeClaim: {
    claimName: '',
  },
});

export class KubernetesApplicationVolumePersistentPayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationVolumePersistentPayload)));
  }
}

/////////////////////////////// CONFIG AS VOLUME ////////////////////////
/**
 * KubernetesApplicationVolumeConfigMapPayload Model
 */
const _KubernetesApplicationVolumeConfigMapPayload = Object.freeze({
  name: '',
  configMap: {
    name: '',
    items: [], // KubernetesApplicationVolumeEntryPayload
  },
});

export class KubernetesApplicationVolumeConfigMapPayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationVolumeConfigMapPayload)));
  }
}

//////////////////// SECRET AS VOLUME /////////////////////////////////////
/**
 * KubernetesApplicationVolumeSecretPayload Model
 */
const _KubernetesApplicationVolumeSecretPayload = Object.freeze({
  name: '',
  secret: {
    secretName: '',
    items: [], // KubernetesApplicationVolumeEntryPayload
  },
});

export class KubernetesApplicationVolumeSecretPayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationVolumeSecretPayload)));
  }
}

/**
 * KubernetesApplicationVolumeEntryPayload Model
 */
const _KubernetesApplicationVolumeEntryPayload = Object.freeze({
  key: '',
  path: '',
});

export class KubernetesApplicationVolumeEntryPayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationVolumeEntryPayload)));
  }
}

//////////////////////////// ENV ENTRY //////////////////////////////
/**
 * KubernetesApplicationEnvPayload Model
 */
const _KubernetesApplicationEnvPayload = Object.freeze({
  name: '',
  value: '',
});

export class KubernetesApplicationEnvPayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationEnvPayload)));
  }
}

///////////////////////// CONFIG AS ENV ////////////////////////////////
/**
 * KubernetesApplicationEnvConfigMapPayload Model
 */
const _KubernetesApplicationEnvConfigMapPayload = Object.freeze({
  name: '',
  valueFrom: {
    configMapKeyRef: {
      name: '',
      key: '',
    },
  },
});

export class KubernetesApplicationEnvConfigMapPayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationEnvConfigMapPayload)));
  }
}

//////////////////////// SECRET AS ENV //////////////////////////////////
/**
 * KubernetesApplicationEnvSecretPayload Model
 */
const _KubernetesApplicationEnvSecretPayload = Object.freeze({
  name: '',
  valueFrom: {
    secretKeyRef: {
      name: '',
      key: '',
    },
  },
});

export class KubernetesApplicationEnvSecretPayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationEnvSecretPayload)));
  }
}
