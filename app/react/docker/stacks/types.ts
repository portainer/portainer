export enum StackType {
  /**
   * Represents a stack managed via docker stack
   */
  DockerSwarm = 1,
  /**
   * Represents a stack managed via docker-compose
   */
  DockerCompose,
  /**
   * Represents a stack managed via kubectl
   */
  Kubernetes,
  /**
   * Represents a stack managed via Nomad
   */
  Nomad,
}

export enum StackStatus {
  Active = 1,
  Inactive,
}
