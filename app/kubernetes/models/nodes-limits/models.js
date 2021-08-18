import _ from 'lodash-es';

/**
 * NodesLimits Model
 */
export class KubernetesNodesLimits {
  constructor(nodesLimits) {
    this.MaxCPU = 0;
    this.MaxMemory = 0;
    this.nodesLimits = this.convertCPU(nodesLimits);

    this.calculateMaxCPUMemory();
  }

  convertCPU(nodesLimits) {
    _.forEach(nodesLimits, (value) => {
      if (value.CPU) {
        value.CPU /= 1000.0;
      }
    });
    return nodesLimits;
  }

  calculateMaxCPUMemory() {
    const nodesLimitsArray = Object.values(this.nodesLimits);
    this.MaxCPU = _.maxBy(nodesLimitsArray, 'CPU').CPU;
    this.MaxMemory = _.maxBy(nodesLimitsArray, 'Memory').Memory;
  }

  // check if there is enough cpu and memory to allocate containers in replica mode
  overflowForReplica(cpu, memory, instances) {
    _.forEach(this.nodesLimits, (value) => {
      instances -= Math.min(Math.floor(value.CPU / cpu), Math.floor(value.Memory / memory));
    });

    return instances > 0;
  }

  // check if there is enough cpu and memory to allocate containers in global mode
  overflowForGlobal(cpu, memory) {
    let overflow = false;

    _.forEach(this.nodesLimits, (value) => {
      if (cpu > value.CPU || memory > value.Memory) {
        overflow = true;
      }
    });

    return overflow;
  }

  excludesPods(pods, cpuLimit, memoryLimit) {
    const nodesLimits = this.nodesLimits;

    _.forEach(pods, (value) => {
      const node = value.Node;
      if (node && nodesLimits[node]) {
        nodesLimits[node].CPU += cpuLimit;
        nodesLimits[node].Memory += memoryLimit;
      }
    });

    this.calculateMaxCPUMemory();
  }
}
