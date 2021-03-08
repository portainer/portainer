import angular from 'angular';
import _ from 'lodash-es';
import PortainerError from 'Portainer/error';

import { KubernetesApplicationTypes } from 'Kubernetes/models/application/models';
import { KubernetesSystem_DefaultDeploymentUniqueLabelKey, KubernetesSystem_AnnotationsToSkip } from 'Kubernetes/models/history/models';

class KubernetesApplicationRollbackHelper {
  static getPatchPayload(application, targetRevision) {
    let result;

    switch (application.ApplicationType) {
      case KubernetesApplicationTypes.DEPLOYMENT:
        result = KubernetesApplicationRollbackHelper._getDeploymentPayload(application, targetRevision);
        break;
      case KubernetesApplicationTypes.DAEMONSET:
        result = KubernetesApplicationRollbackHelper._getDaemonSetPayload(application, targetRevision);
        break;
      case KubernetesApplicationTypes.STATEFULSET:
        result = KubernetesApplicationRollbackHelper._getStatefulSetPayload(application, targetRevision);
        break;
      default:
        throw new PortainerError('Unable to determine which association to use to convert patch');
    }
    return result;
  }

  static _getDeploymentPayload(deploymentApp, targetRevision) {
    const target = angular.copy(targetRevision);
    const deployment = deploymentApp.Raw;

    // remove hash label before patching back into the deployment
    delete target.spec.template.metadata.labels[KubernetesSystem_DefaultDeploymentUniqueLabelKey];

    // compute deployment annotations
    const annotations = {};
    _.forEach(KubernetesSystem_AnnotationsToSkip, (_, k) => {
      const v = deployment.metadata.annotations[k];
      if (v) {
        annotations[k] = v;
      }
    });
    _.forEach(target.metadata.annotations, (v, k) => {
      if (!KubernetesSystem_AnnotationsToSkip[k]) {
        annotations[k] = v;
      }
    });
    // Create a patch of the Deployment that replaces spec.template
    const patch = [
      {
        op: 'replace',
        path: '/spec/template',
        value: target.spec.template,
      },
      {
        op: 'replace',
        path: '/metadata/annotations',
        value: annotations,
      },
    ];

    return patch;
  }

  static _getDaemonSetPayload(daemonSet, targetRevision) {
    void daemonSet;
    return targetRevision.data;
  }

  static _getStatefulSetPayload(statefulSet, targetRevision) {
    void statefulSet;
    return targetRevision.data;
  }
}

export default KubernetesApplicationRollbackHelper;
