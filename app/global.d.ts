declare module '*.jpg' {
  export default '' as string;
}
declare module '*.png' {
  export default '' as string;
}

declare module '*.css';

declare module '@open-amt-cloud-toolkit/ui-toolkit-react/reactjs/src/kvm.bundle';

declare module 'axios-progress-bar' {
  import { AxiosInstance } from 'axios';
  import { NProgressOptions } from 'nprogress';

  export function loadProgressBar(
    config?: Partial<NProgressOptions>,
    instance?: AxiosInstance
  ): void;
}

interface Window {
  ddExtension: boolean;
}
