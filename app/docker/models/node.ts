import {
  Node,
  EngineDescription,
  ManagerStatus,
  NodeDescription,
  NodeSpec,
  NodeStatus,
  ObjectVersion,
  Platform,
  ResourceObject,
} from 'docker-types/generated/1.41';

export class NodeViewModel {
  Model: Node;

  Id: Node['ID'];

  Version: ObjectVersion['Index'];

  Name: NodeSpec['Name'];

  Role: NodeSpec['Role'];

  CreatedAt: Node['CreatedAt'];

  UpdatedAt: Node['UpdatedAt'];

  Availability: NodeSpec['Availability'];

  Labels: Array<{
    key: string;
    value: string;
    originalKey: string;
    originalValue: string;
    added: boolean;
  }>;

  EngineLabels: Array<{ key: string; value: string }>;

  Hostname: NodeDescription['Hostname'];

  PlatformArchitecture: Platform['Architecture'];

  PlatformOS: Platform['OS'];

  CPUs: ResourceObject['NanoCPUs'];

  Memory: ResourceObject['MemoryBytes'];

  EngineVersion: EngineDescription['EngineVersion'];

  Plugins: EngineDescription['Plugins'];

  Status: NodeStatus['State'];

  Addr: Required<NodeStatus>['Addr'] = '';

  Leader: ManagerStatus['Leader'];

  Reachability: ManagerStatus['Reachability'];

  ManagerAddr: ManagerStatus['Addr'];

  constructor(data: Node) {
    this.Model = data;
    this.Id = data.ID;
    this.Version = data.Version?.Index;
    this.Name = data.Spec?.Name;
    this.Role = data.Spec?.Role;
    this.CreatedAt = data.CreatedAt;
    this.UpdatedAt = data.UpdatedAt;
    this.Availability = data.Spec?.Availability;

    const labels = data.Spec?.Labels;
    if (labels) {
      this.Labels = Object.keys(labels).map((key) => ({
        key,
        value: labels[key],
        originalKey: key,
        originalValue: labels[key],
        added: true,
      }));
    } else {
      this.Labels = [];
    }

    const engineLabels = data.Description?.Engine?.Labels;
    if (engineLabels) {
      this.EngineLabels = Object.keys(engineLabels).map((key) => ({
        key,
        value: engineLabels[key],
      }));
    } else {
      this.EngineLabels = [];
    }

    this.Hostname = data.Description?.Hostname;
    this.PlatformArchitecture = data.Description?.Platform?.Architecture;
    this.PlatformOS = data.Description?.Platform?.OS;
    this.CPUs = data.Description?.Resources?.NanoCPUs;
    this.Memory = data.Description?.Resources?.MemoryBytes;
    this.EngineVersion = data.Description?.Engine?.EngineVersion;
    this.Plugins = data.Description?.Engine?.Plugins;
    this.Status = data.Status?.State;

    if (data.Status?.Addr) {
      this.Addr = data.Status?.Addr;
    }

    if (data.ManagerStatus) {
      this.Leader = data.ManagerStatus.Leader;
      this.Reachability = data.ManagerStatus.Reachability;
      this.ManagerAddr = data.ManagerStatus.Addr;
    }
  }
}
