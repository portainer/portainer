import _ from 'lodash-es';
import * as JsonPatch from 'fast-json-patch';

import { KubernetesStorageClass } from 'Kubernetes/models/storage-class/models';
import { KubernetesStorageClassCreatePayload } from 'Kubernetes/models/storage-class/payload';
import { KubernetesResourcePoolStorageClassFormValue } from 'Kubernetes/models/resource-pool/formValues';

class KubernetesStorageClassConverter {
  /**
   * API StorageClass to front StorageClass
   */
  static apiToStorageClass(data) {
    const res = new KubernetesStorageClass();
    res.Name = data.metadata.name;
    res.Provisioner = data.provisioner;
    res.AllowVolumeExpansion = data.allowVolumeExpansion;
    return res;
  }

  static storageClassesToResourcePoolFormValues(scs) {
    const res = _.map(scs, (sc) => {
      const fv = new KubernetesResourcePoolStorageClassFormValue();
      fv.Name = sc.Name;
      return fv;
    });
    return res;
  }

  static createPayload(storageClass) {
    const res = new KubernetesStorageClassCreatePayload();
    res.metadata.name = storageClass.Name;
    res.provisioner = storageClass.Provisioner;
    res.allowVolumeExpansion = storageClass.AllowVolumeExpansion;
    return res;
  }

  static patchPayload(oldStorageClass, newStorageClass) {
    const oldPayload = KubernetesStorageClassConverter.createPayload(oldStorageClass);
    const newPayload = KubernetesStorageClassConverter.createPayload(newStorageClass);
    const payload = JsonPatch.compare(oldPayload, newPayload);
    return payload;
  }
}

export default KubernetesStorageClassConverter;
