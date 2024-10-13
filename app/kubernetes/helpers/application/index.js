import _ from 'lodash-es';
import { KubernetesPortMapping, KubernetesPortMappingPort } from 'Kubernetes/models/port/models';
import { KubernetesService, KubernetesServicePort, KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import { KubernetesConfigurationKinds } from 'Kubernetes/models/configuration/models';
import {
  KubernetesApplicationAutoScalerFormValue,
  KubernetesApplicationConfigurationFormValue,
  KubernetesApplicationConfigurationFormValueOverridenKey,
  KubernetesApplicationEnvironmentVariableFormValue,
  KubernetesApplicationPersistedFolderFormValue,
  KubernetesApplicationPlacementFormValue,
  KubernetesApplicationPublishedPortFormValue,
} from 'Kubernetes/models/application/formValues';
import {
  KubernetesApplicationEnvConfigMapPayload,
  KubernetesApplicationEnvPayload,
  KubernetesApplicationEnvSecretPayload,
  KubernetesApplicationVolumeConfigMapPayload,
  KubernetesApplicationVolumeEntryPayload,
  KubernetesApplicationVolumeMountPayload,
  KubernetesApplicationVolumePersistentPayload,
  KubernetesApplicationVolumeSecretPayload,
} from 'Kubernetes/models/application/payloads';
import { generatedApplicationConfigVolumeName } from '@/react/kubernetes/volumes/utils';
import { HelmApplication } from 'Kubernetes/models/application/models';
import { KubernetesApplicationDeploymentTypes, KubernetesApplicationTypes } from 'Kubernetes/models/application/models/appConstants';
import { KubernetesPodAffinity, KubernetesPodNodeAffinityNodeSelectorRequirementOperators } from 'Kubernetes/pod/models';
import {
  KubernetesNodeSelectorRequirementPayload,
  KubernetesNodeSelectorTermPayload,
  KubernetesPodNodeAffinityPayload,
  KubernetesPreferredSchedulingTermPayload,
} from 'Kubernetes/pod/payloads/affinities';
import { PodKubernetesInstanceLabel, PodManagedByLabel } from '@/react/kubernetes/applications/constants';

class KubernetesApplicationHelper {
  /* #region  UTILITY FUNCTIONS */
  static isExternalApplication(application) {
    return !application.ApplicationOwner;
  }

  static associatePodsAndApplication(pods, selector) {
    return _.filter(pods, ['metadata.labels', selector.matchLabels]);
  }

  static associateContainerPersistedFoldersAndConfigurations(app, containers) {
    _.forEach(containers, (container) => {
      container.PersistedFolders = _.without(
        _.map(app.PersistedFolders, (pf) => {
          if (pf.MountPath && _.includes(_.map(container.VolumeMounts, 'mountPath'), pf.MountPath)) {
            return pf;
          }
        }),
        undefined
      );

      container.ConfigurationVolumes = _.without(
        _.map(app.ConfigurationVolumes, (cv) => {
          if (cv.rootMountPath && _.includes(_.map(container.VolumeMounts, 'mountPath'), cv.rootMountPath)) {
            return cv;
          }
        }),
        undefined
      );
    });
  }

  static associateContainersAndApplication(app) {
    if (!app.Pods || app.Pods.length === 0) {
      return [];
    }
    const containers = app.Pods[0].Containers;
    KubernetesApplicationHelper.associateContainerPersistedFoldersAndConfigurations(app, containers);
    return containers;
  }

  static portMappingsFromApplications(applications) {
    const res = _.reduce(
      applications,
      (acc, app) => {
        if (app.PublishedPorts.length > 0) {
          const mapping = new KubernetesPortMapping();
          mapping.Name = app.Name;
          mapping.ResourcePool = app.ResourcePool;
          mapping.ServiceType = app.ServiceType;
          mapping.LoadBalancerIPAddress = app.LoadBalancerIPAddress;
          mapping.ApplicationOwner = app.ApplicationOwner;

          mapping.Ports = _.map(app.PublishedPorts, (item) => {
            const port = new KubernetesPortMappingPort();
            port.Port = mapping.ServiceType === KubernetesServiceTypes.NODE_PORT ? item.NodePort : item.Port;
            port.TargetPort = item.TargetPort;
            port.Protocol = item.Protocol;
            port.IngressRules = item.IngressRules;
            return port;
          });
          acc.push(mapping);
        }
        return acc;
      },
      []
    );
    return res;
  }
  /* #endregion */

  /* #region  ENV VARIABLES FV <> ENV */
  static generateEnvFromEnvVariables(envVariables) {
    _.remove(envVariables, (item) => item.needsDeletion);
    const env = _.map(envVariables, (item) => {
      const res = new KubernetesApplicationEnvPayload();
      res.name = item.name;
      if (item.value === undefined) {
        delete res.value;
      } else {
        res.value = item.value;
      }
      return res;
    });
    return env;
  }

  static generateEnvVariablesFromEnv(env) {
    const envVariables = _.map(env, (item) => {
      if (item.valueFrom) {
        return;
      }
      const res = new KubernetesApplicationEnvironmentVariableFormValue();
      res.name = item.name;
      res.value = item.value;
      res.isNew = false;
      res.nameIndex = item.name;
      return res;
    });
    return _.without(envVariables, undefined);
  }
  /* #endregion */

  /* #region  CONFIGURATIONS FV <> ENV & VOLUMES */
  static generateConfigurationFormValuesFromEnvAndVolumes(env, volumes, configurations, configurationKind) {
    const filterCondition = configurationKind === KubernetesConfigurationKinds.CONFIGMAP ? 'valueFrom.configMapKeyRef.name' : 'valueFrom.secretKeyRef.name';
    const finalRes = _.flatMap(configurations, (cfg) => {
      const cfgEnv = _.filter(env, [filterCondition, cfg.Name]);
      const cfgVol = volumes.filter((volume) => volume.configurationName === cfg.Name && volume.configurationType === configurationKind);
      if (!cfgEnv.length && !cfgVol.length) {
        return;
      }
      const keys = _.reduce(
        _.keys(cfg.Data),
        (acc, k) => {
          const keyEnv = _.filter(cfgEnv, { name: k });
          const keyVol = _.filter(cfgVol, { configurationKey: k });
          const key = {
            Key: k,
            Count: keyEnv.length + keyVol.length,
            Sum: _.concat(keyEnv, keyVol),
            EnvCount: keyEnv.length,
            VolCount: keyVol.length,
          };
          acc.push(key);
          return acc;
        },
        []
      );

      const max = _.max(_.map(keys, 'Count'));
      const overrideThreshold = max - _.max(_.map(keys, 'VolCount'));
      const res = _.map(new Array(max), () => new KubernetesApplicationConfigurationFormValue());
      _.forEach(res, (item, index) => {
        item.selectedConfiguration = cfg;
        // workaround to load configurations in the app in the select inputs
        // this should be removed when the edit parent view is migrated to react
        item.selectedConfiguration.metadata = {};
        item.selectedConfiguration.metadata.name = cfg.Name;
        const overriden = index >= overrideThreshold;
        if (overriden) {
          item.overriden = true;
          item.overridenKeys = _.map(keys, (k) => {
            const fvKey = new KubernetesApplicationConfigurationFormValueOverridenKey();
            fvKey.key = k.Key;
            if (!k.Count) {
              // !k.Count indicates k.key is new added to the configuration and has not been loaded to the application yet
              fvKey.type = 'NONE';
            } else if (index < k.EnvCount) {
              fvKey.type = 'ENVIRONMENT';
            } else {
              fvKey.type = 'FILESYSTEM';
              fvKey.path = k.Sum[index].rootMountPath;
            }
            return fvKey;
          });
        }
      });
      return res;
    });
    return _.without(finalRes, undefined);
  }

  static generateEnvOrVolumesFromConfigurations(app, configMaps, secrets) {
    const configurations = [...configMaps, ...secrets];
    let finalEnv = [];
    let finalVolumes = [];
    let finalMounts = [];

    _.forEach(configurations, (config) => {
      const isBasic = config.selectedConfiguration.kind === 'ConfigMap';

      if (!config.overriden) {
        const envKeys = _.keys(config.selectedConfiguration.data);
        _.forEach(envKeys, (item) => {
          const res = isBasic ? new KubernetesApplicationEnvConfigMapPayload() : new KubernetesApplicationEnvSecretPayload();
          res.name = item;
          if (isBasic) {
            res.valueFrom.configMapKeyRef.name = config.selectedConfiguration.metadata.name;
            res.valueFrom.configMapKeyRef.key = item;
          } else {
            res.valueFrom.secretKeyRef.name = config.selectedConfiguration.metadata.name;
            res.valueFrom.secretKeyRef.key = item;
          }
          finalEnv.push(res);
        });
      } else {
        const envKeys = _.filter(config.overridenKeys, (item) => item.type === 'ENVIRONMENT');
        _.forEach(envKeys, (item) => {
          const res = isBasic ? new KubernetesApplicationEnvConfigMapPayload() : new KubernetesApplicationEnvSecretPayload();
          res.name = item.key;
          if (isBasic) {
            res.valueFrom.configMapKeyRef.name = config.selectedConfiguration.metadata.name;
            res.valueFrom.configMapKeyRef.key = item.key;
          } else {
            res.valueFrom.secretKeyRef.name = config.selectedConfiguration.metadata.name;
            res.valueFrom.secretKeyRef.key = item.key;
          }
          finalEnv.push(res);
        });

        const volKeys = _.filter(config.overridenKeys, (item) => item.type === 'FILESYSTEM');
        const groupedVolKeys = _.groupBy(volKeys, 'path');
        _.forEach(groupedVolKeys, (items, path) => {
          const volumeName = generatedApplicationConfigVolumeName(app.Name);
          const configurationName = config.selectedConfiguration.metadata.name;
          const itemsMap = _.map(items, (item) => {
            const entry = new KubernetesApplicationVolumeEntryPayload();
            entry.key = item.key;
            entry.path = item.key;
            return entry;
          });

          const mount = isBasic ? new KubernetesApplicationVolumeMountPayload() : new KubernetesApplicationVolumeMountPayload(true);
          const volume = isBasic ? new KubernetesApplicationVolumeConfigMapPayload() : new KubernetesApplicationVolumeSecretPayload();

          mount.name = volumeName;
          mount.mountPath = path;
          volume.name = volumeName;
          if (isBasic) {
            volume.configMap.name = configurationName;
            volume.configMap.items = itemsMap;
          } else {
            volume.secret.secretName = configurationName;
            volume.secret.items = itemsMap;
          }

          finalMounts.push(mount);
          finalVolumes.push(volume);
        });
      }
    });
    app.Env = _.concat(app.Env, finalEnv);
    app.Volumes = _.concat(app.Volumes, finalVolumes);
    app.VolumeMounts = _.concat(app.VolumeMounts, finalMounts);
    return app;
  }
  /* #endregion */

  /* #region  SERVICES -> SERVICES FORM VALUES */
  static generateServicesFormValuesFromServices(app, ingresses) {
    let services = [];
    if (app.Services) {
      app.Services.forEach(function (service) {
        //skip generate formValues if service = headless service ( clusterIp === "None" )
        if (service.spec.clusterIP !== 'None') {
          const svc = new KubernetesService();
          svc.Namespace = service.metadata.namespace;
          svc.Name = service.metadata.name;
          svc.StackName = service.StackName;
          svc.ApplicationOwner = app.ApplicationOwner;
          svc.ApplicationName = app.ApplicationName;
          svc.Type = service.spec.type;

          let ports = [];
          service.spec.ports.forEach(function (port) {
            const svcport = new KubernetesServicePort();
            svcport.name = port.name;
            svcport.port = port.port;
            svcport.nodePort = port.nodePort || 0;
            svcport.protocol = port.protocol;
            svcport.targetPort = port.targetPort;
            svcport.serviceName = service.metadata.name;
            svcport.ingressPaths = [];

            ingresses.forEach((ingress) => {
              const matchingIngressPaths = ingress.Paths.filter((ingPath) => ingPath.ServiceName === service.metadata.name && ingPath.Port === port.port);
              // only add ingress info to the port if the ingress serviceport and name matches
              const newPaths = matchingIngressPaths.map((ingPath) => ({
                IngressName: ingPath.IngressName,
                Host: ingPath.Host,
                Path: ingPath.Path,
              }));
              svcport.ingressPaths = [...svcport.ingressPaths, ...newPaths];
              svc.Ingress = matchingIngressPaths.length > 0;
            });

            ports.push(svcport);
          });
          svc.Ports = ports;
          // if the app is a pod (doesn't have a selector), then get the pod labels
          if (app.Raw.spec.selector) {
            svc.Selector = app.Raw.spec.selector.matchLabels;
          } else {
            svc.Selector = app.Raw.metadata.labels || { app: app.Name };
          }
          services.push(svc);
        }
      });

      return services;
    }
  }
  /* #endregion */
  static generateSelectorFromService(app) {
    if (app.Raw.kind !== 'Pod') {
      const selector = app.Raw.spec.selector.matchLabels;
      return selector;
    }
  }

  /* #region  PUBLISHED PORTS FV <> PUBLISHED PORTS */
  static generatePublishedPortsFormValuesFromPublishedPorts(serviceType, publishedPorts, ingress) {
    const generatePort = (port, rule) => {
      const res = new KubernetesApplicationPublishedPortFormValue();
      res.IsNew = false;
      if (rule) {
        res.IngressName = rule.IngressName;
        res.IngressRoute = rule.Path;
        res.IngressHost = rule.Host;
        res.IngressHosts = ingress && ingress.find((i) => i.Name === rule.IngressName).Hosts;
      }
      res.Protocol = port.Protocol;
      res.ContainerPort = port.TargetPort;
      if (serviceType === KubernetesServiceTypes.LOAD_BALANCER) {
        res.LoadBalancerPort = port.Port;
        res.LoadBalancerNodePort = port.NodePort;
      } else if (serviceType === KubernetesServiceTypes.NODE_PORT) {
        res.NodePort = port.NodePort;
      }
      return res;
    };

    const finalRes = _.flatMap(publishedPorts, (port) => {
      if (port.IngressRules.length) {
        return _.map(port.IngressRules, (rule) => generatePort(port, rule));
      }
      return generatePort(port);
    });
    return finalRes;
  }
  /* #endregion */

  /* #region  AUTOSCALER FV <> HORIZONTAL POD AUTOSCALER */
  static generateAutoScalerFormValueFromHorizontalPodAutoScaler(autoScaler, replicasCount) {
    const res = new KubernetesApplicationAutoScalerFormValue();
    if (autoScaler) {
      res.isUsed = true;
      res.minReplicas = autoScaler.MinReplicas;
      res.maxReplicas = autoScaler.MaxReplicas;
      res.targetCpuUtilizationPercentage = autoScaler.TargetCPUUtilization;
      res.apiVersion = autoScaler.ApiVersion;
    } else {
      res.apiVersion = 'apps/v1';
      res.minReplicas = replicasCount;
      res.maxReplicas = replicasCount;
    }
    return res;
  }

  /* #endregion */

  /* #region  PERSISTED FOLDERS FV <> VOLUMES */
  static generatePersistedFoldersFormValuesFromPersistedFolders(persistedFolders, persistentVolumeClaims) {
    const finalRes = _.map(persistedFolders, (folder) => {
      const pvc = _.find(persistentVolumeClaims, (item) => _.startsWith(item.Name, folder.persistentVolumeClaimName));
      const res = new KubernetesApplicationPersistedFolderFormValue(pvc.storageClass);
      res.persistentVolumeClaimName = folder.persistentVolumeClaimName;
      res.size = pvc.Storage.slice(0, -2); // remove trailing units
      res.sizeUnit = pvc.Storage.slice(-2);
      res.containerPath = folder.MountPath;
      return res;
    });
    return finalRes;
  }

  static generateVolumesFromPersistentVolumClaims(app, volumeClaims) {
    app.VolumeMounts = [];
    app.Volumes = [];
    _.forEach(volumeClaims, (item) => {
      const volumeMount = new KubernetesApplicationVolumeMountPayload();
      const name = item.Name;
      volumeMount.name = name;
      volumeMount.mountPath = item.MountPath;
      app.VolumeMounts.push(volumeMount);

      const volume = new KubernetesApplicationVolumePersistentPayload();
      volume.name = name;
      volume.persistentVolumeClaim.claimName = name;
      app.Volumes.push(volume);
    });
  }

  static hasRWOOnly(formValues) {
    return _.find(formValues.PersistedFolders, (item) => item.storageClass && _.isEqual(item.storageClass.AccessModes, ['RWO']));
  }

  static hasRWX(claims) {
    return _.find(claims, (item) => item.storageClass && _.includes(item.storageClass.AccessModes, 'RWX')) !== undefined;
  }
  /* #endregion */

  /* #region  PLACEMENTS FV <> AFFINITY */
  static generatePlacementsFormValuesFromAffinity(formValues, podAffinity) {
    let placements = formValues.Placements;
    let type = formValues.PlacementType;
    const affinity = podAffinity.nodeAffinity;
    if (affinity && affinity.requiredDuringSchedulingIgnoredDuringExecution) {
      type = 'mandatory';
      _.forEach(affinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms, (term) => {
        _.forEach(term.matchExpressions, (exp) => {
          const placement = new KubernetesApplicationPlacementFormValue();
          placement.label = exp.key;
          placement.value = exp.values[0];
          placement.isNew = false;
          placements.push(placement);
        });
      });
    } else if (affinity && affinity.preferredDuringSchedulingIgnoredDuringExecution) {
      type = 'preferred';
      _.forEach(affinity.preferredDuringSchedulingIgnoredDuringExecution, (term) => {
        _.forEach(term.preference.matchExpressions, (exp) => {
          const placement = new KubernetesApplicationPlacementFormValue();
          placement.label = exp.key;
          placement.value = exp.values[0];
          placement.isNew = false;
          placements.push(placement);
        });
      });
    }
    formValues.Placements = placements;
    formValues.PlacementType = type;
  }

  static generateAffinityFromPlacements(app, formValues) {
    if (formValues.DeploymentType === KubernetesApplicationDeploymentTypes.Replicated) {
      const placements = formValues.Placements;
      const res = new KubernetesPodNodeAffinityPayload();
      let expressions = _.map(placements, (p) => {
        if (!p.needsDeletion) {
          const exp = new KubernetesNodeSelectorRequirementPayload();
          exp.key = p.label;
          if (p.value) {
            exp.operator = KubernetesPodNodeAffinityNodeSelectorRequirementOperators.IN;
            exp.values = [p.value];
          } else {
            exp.operator = KubernetesPodNodeAffinityNodeSelectorRequirementOperators.EXISTS;
            delete exp.values;
          }
          return exp;
        }
      });
      expressions = _.without(expressions, undefined);
      if (expressions.length) {
        if (formValues.PlacementType === 'mandatory') {
          const term = new KubernetesNodeSelectorTermPayload();
          term.matchExpressions = expressions;
          res.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms.push(term);
          delete res.preferredDuringSchedulingIgnoredDuringExecution;
        } else if (formValues.PlacementType === 'preferred') {
          const term = new KubernetesPreferredSchedulingTermPayload();
          term.preference = new KubernetesNodeSelectorTermPayload();
          term.preference.matchExpressions = expressions;
          res.preferredDuringSchedulingIgnoredDuringExecution.push(term);
          delete res.requiredDuringSchedulingIgnoredDuringExecution;
        }
        app.Affinity = new KubernetesPodAffinity();
        app.Affinity.nodeAffinity = res;
      }
    }
  }
  /* #endregion */

  /**
   * Get Helm managed applications
   * @param {KubernetesApplication[]} applications Application list
   * @returns {Object} { [releaseName]: [app1, app2, ...], [releaseName2]: [app3, app4, ...] }
   */
  static getHelmApplications(applications) {
    // filter out all the applications that are managed by helm
    // to identify the helm managed applications, we need to check if the applications pod labels include
    // `app.kubernetes.io/instance` and `app.kubernetes.io/managed-by` = `helm`
    const helmManagedApps = applications.filter(
      (app) => app.Metadata.labels && app.Metadata.labels[PodKubernetesInstanceLabel] && app.Metadata.labels[PodManagedByLabel] === 'Helm'
    );

    // groups the helm managed applications by helm release name
    // the release name is retrieved from the `app.kubernetes.io/instance` label on the pods within the apps
    // `namespacedHelmReleases` object structure:
    // {
    //   [namespace1]: {
    //     [releaseName]: [app1, app2, ...],
    //   },
    //   [namespace2]: {
    //     [releaseName2]: [app1, app2, ...],
    //   }
    // }
    const namespacedHelmReleases = {};
    helmManagedApps.forEach((app) => {
      const namespace = app.ResourcePool;
      const instanceLabel = app.Metadata.labels[PodKubernetesInstanceLabel];
      if (namespacedHelmReleases[namespace]) {
        namespacedHelmReleases[namespace][instanceLabel] = [...(namespacedHelmReleases[namespace][instanceLabel] || []), app];
      } else {
        namespacedHelmReleases[namespace] = { [instanceLabel]: [app] };
      }
    });

    // `helmAppsEntriesList` object structure:
    // [
    //   ["airflow-test", Array(5)],
    //   ["traefik", Array(1)],
    //   ["airflow-test", Array(2)],
    //   ...,
    // ]
    const helmAppsEntriesList = Object.values(namespacedHelmReleases).flatMap((r) => Object.entries(r));
    const helmAppsList = helmAppsEntriesList.map(([helmInstance, applications]) => {
      const helmApp = new HelmApplication();
      helmApp.Name = helmInstance;
      helmApp.ApplicationType = KubernetesApplicationTypes.Helm;
      helmApp.ApplicationOwner = applications[0].ApplicationOwner;
      helmApp.KubernetesApplications = applications;

      // the status of helm app is `Ready` based on whether the underlying RunningPodsCount of the k8s app
      // reaches the TotalPodsCount of the app
      const appsNotReady = applications.some((app) => app.RunningPodsCount < app.TotalPodsCount);
      helmApp.Status = appsNotReady ? 'Not ready' : 'Ready';

      // use earliest date
      helmApp.CreationDate = applications.map((app) => app.CreationDate).sort((a, b) => new Date(a) - new Date(b))[0];

      // use first app namespace as helm app namespace
      helmApp.ResourcePool = applications[0].ResourcePool;

      // required for persisting table expansion state and differenting same named helm apps across different namespaces
      helmApp.Id = helmApp.ResourcePool + '-' + helmApp.Name.toLowerCase().replaceAll(' ', '-');

      return helmApp;
    });

    return helmAppsList;
  }

  /**
   * Get nested applications -
   * @param {KubernetesApplication[]} applications Application list
   * @returns {Object} { helmApplications: [app1, app2, ...], nonHelmApplications: [app3, app4, ...] }
   */
  static getNestedApplications(applications) {
    const helmApplications = KubernetesApplicationHelper.getHelmApplications(applications);

    // filter out helm managed applications
    const helmAppNames = [...new Set(helmApplications.map((hma) => hma.Name))]; // distinct helm app names
    const nonHelmApplications = applications.filter((app) => {
      if (app.Metadata.labels) {
        return !helmAppNames.includes(app.Metadata.labels[PodKubernetesInstanceLabel]);
      }
      return true;
    });

    return { helmApplications, nonHelmApplications };
  }
}
export default KubernetesApplicationHelper;
