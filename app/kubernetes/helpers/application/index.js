import _ from 'lodash-es';
import { KubernetesPortMapping, KubernetesPortMappingPort } from 'Kubernetes/models/port/models';
import { KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import { KubernetesConfigurationTypes } from 'Kubernetes/models/configuration/models';
import {
  KubernetesApplicationConfigurationFormValueOverridenKeyTypes,
  KubernetesApplicationEnvironmentVariableFormValue,
  KubernetesApplicationConfigurationFormValue,
  KubernetesApplicationConfigurationFormValueOverridenKey,
  KubernetesApplicationPersistedFolderFormValue,
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
import KubernetesVolumeHelper from 'Kubernetes/helpers/volumeHelper';

class KubernetesApplicationHelper {
  static associatePodsAndApplication(pods, app) {
    return _.filter(pods, { Labels: app.spec.selector.matchLabels });
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

  /**
   * FORMVALUES TO APPLICATION FUNCTIONS
   */
  static generateEnvFromEnvVariables(envVariables) {
    _.remove(envVariables, (item) => item.NeedsDeletion);
    const env = _.map(envVariables, (item) => {
      const res = new KubernetesApplicationEnvPayload();
      res.name = item.Name;
      res.value = item.Value;
      return res;
    });
    return env;
  }

  static generateEnvOrVolumesFromConfigurations(app, configurations) {
    let finalEnv = [];
    let finalVolumes = [];
    let finalMounts = [];

    _.forEach(configurations, (config) => {
      const isBasic = config.SelectedConfiguration.Type === KubernetesConfigurationTypes.CONFIGMAP;

      if (!config.Overriden) {
        const envKeys = _.keys(config.SelectedConfiguration.Data);
        _.forEach(envKeys, (item) => {
          const res = isBasic ? new KubernetesApplicationEnvConfigMapPayload() : new KubernetesApplicationEnvSecretPayload();
          res.name = item;
          if (isBasic) {
            res.valueFrom.configMapKeyRef.name = config.SelectedConfiguration.Name;
            res.valueFrom.configMapKeyRef.key = item;
          } else {
            res.valueFrom.secretKeyRef.name = config.SelectedConfiguration.Name;
            res.valueFrom.secretKeyRef.key = item;
          }
          finalEnv.push(res);
        });
      } else {
        const envKeys = _.filter(config.OverridenKeys, (item) => item.Type === KubernetesApplicationConfigurationFormValueOverridenKeyTypes.ENVIRONMENT);
        _.forEach(envKeys, (item) => {
          const res = isBasic ? new KubernetesApplicationEnvConfigMapPayload() : new KubernetesApplicationEnvSecretPayload();
          res.name = item.Key;
          if (isBasic) {
            res.valueFrom.configMapKeyRef.name = config.SelectedConfiguration.Name;
            res.valueFrom.configMapKeyRef.key = item.Key;
          } else {
            res.valueFrom.secretKeyRef.name = config.SelectedConfiguration.Name;
            res.valueFrom.secretKeyRef.key = item.Key;
          }
          finalEnv.push(res);
        });

        const volKeys = _.filter(config.OverridenKeys, (item) => item.Type === KubernetesApplicationConfigurationFormValueOverridenKeyTypes.FILESYSTEM);
        const groupedVolKeys = _.groupBy(volKeys, 'Path');
        _.forEach(groupedVolKeys, (items, path) => {
          const volumeName = KubernetesVolumeHelper.generatedApplicationConfigVolumeName(app.Name);
          const configurationName = config.SelectedConfiguration.Name;
          const itemsMap = _.map(items, (item) => {
            const entry = new KubernetesApplicationVolumeEntryPayload();
            entry.key = item.Key;
            entry.path = item.Key;
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
  /**
   * !FORMVALUES TO APPLICATION FUNCTIONS
   */

  /**
   * APPLICATION TO FORMVALUES FUNCTIONS
   */
  static generateEnvVariablesFromEnv(env) {
    const envVariables = _.map(env, (item) => {
      if (!item.value) {
        return;
      }
      const res = new KubernetesApplicationEnvironmentVariableFormValue();
      res.Name = item.name;
      res.Value = item.value;
      res.IsNew = false;
      return res;
    });
    return _.without(envVariables, undefined);
  }

  static generateConfigurationFormValuesFromEnvAndVolumes(env, volumes, configurations) {
    const finalRes = _.flatMap(configurations, (cfg) => {
      const filterCondition = cfg.Type === KubernetesConfigurationTypes.CONFIGMAP ? 'valueFrom.configMapKeyRef.name' : 'valueFrom.secretKeyRef.name';

      const cfgEnv = _.filter(env, [filterCondition, cfg.Name]);
      const cfgVol = _.filter(volumes, { configurationName: cfg.Name });
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
        item.SelectedConfiguration = cfg;
        const overriden = index >= overrideThreshold;
        if (overriden) {
          item.Overriden = true;
          item.OverridenKeys = _.map(keys, (k) => {
            const fvKey = new KubernetesApplicationConfigurationFormValueOverridenKey();
            fvKey.Key = k.Key;
            if (index < k.EnvCount) {
              fvKey.Type = KubernetesApplicationConfigurationFormValueOverridenKeyTypes.ENVIRONMENT;
            } else {
              fvKey.Type = KubernetesApplicationConfigurationFormValueOverridenKeyTypes.FILESYSTEM;
              fvKey.Path = k.Sum[index].rootMountPath;
            }
            return fvKey;
          });
        }
      });
      return res;
    });
    return _.without(finalRes, undefined);
  }

  static generatePersistedFoldersFormValuesFromPersistedFolders(persistedFolders, persistentVolumeClaims) {
    const finalRes = _.map(persistedFolders, (folder) => {
      const pvc = _.find(persistentVolumeClaims, (item) => _.startsWith(item.Name, folder.PersistentVolumeClaimName));
      const res = new KubernetesApplicationPersistedFolderFormValue(pvc.StorageClass);
      res.PersistentVolumeClaimName = folder.PersistentVolumeClaimName;
      res.Size = parseInt(pvc.Storage.slice(0, -2));
      res.SizeUnit = pvc.Storage.slice(-2);
      res.ContainerPath = folder.MountPath;
      return res;
    });
    return finalRes;
  }

  static generatePublishedPortsFormValuesFromPublishedPorts(serviceType, publishedPorts) {
    const finalRes = _.map(publishedPorts, (port) => {
      const res = new KubernetesApplicationPublishedPortFormValue();
      res.Protocol = port.Protocol;
      res.ContainerPort = port.TargetPort;
      if (serviceType === KubernetesServiceTypes.LOAD_BALANCER) {
        res.LoadBalancerPort = port.Port;
        res.LoadBalancerNodePort = port.NodePort;
      } else if (serviceType === KubernetesServiceTypes.NODE_PORT) {
        res.NodePort = port.NodePort;
      }
      return res;
    });
    return finalRes;
  }

  /**
   * !APPLICATION TO FORMVALUES FUNCTIONS
   */

  static isExternalApplication(application) {
    return !application.ApplicationOwner;
  }
}
export default KubernetesApplicationHelper;
