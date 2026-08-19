export type StaggerConfig = {
  StaggerOption: StaggerOption;
  StaggerParallelOption?: StaggerParallelOption;
  DeviceNumber?: number;
  DeviceNumberStartFrom?: number;
  DeviceNumberIncrementBy?: number;
  Timeout?: string;
  UpdateDelay?: string;
  UpdateFailureAction?: UpdateFailureAction;
};

export enum StaggerOption {
  AllAtOnce = 1,
  Parallel,
}

export enum StaggerParallelOption {
  Fixed = 1,
  Incremental,
}

export enum UpdateFailureAction {
  Continue = 1,
  Pause,
  Rollback,
}

export function getDefaultStaggerConfig(): StaggerConfig {
  return {
    StaggerOption: StaggerOption.AllAtOnce,
    StaggerParallelOption: StaggerParallelOption.Fixed,
    DeviceNumber: 1,
    DeviceNumberStartFrom: 0,
    DeviceNumberIncrementBy: 2,
    Timeout: '',
    UpdateDelay: '',
    UpdateFailureAction: UpdateFailureAction.Continue,
  };
}
