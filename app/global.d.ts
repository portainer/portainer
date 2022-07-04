declare module '*.jpg' {
  export default '' as string;
}
declare module '*.png' {
  export default '' as string;
}

declare module '*.svg' {
  export default '' as string;
}

type SvgrComponent = React.StatelessComponent<React.SVGAttributes<SVGElement>>;

declare module '*.svg?c' {
  const value: SvgrComponent;
  export default value;
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
  /**
   * will be true if portainer is run as a Docker Desktop Extension
   */
  ddExtension?: boolean;
}

declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        PORTAINER_EDITION: 'BE' | 'CE';
      }
    }
  }
}
