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

interface HubSpotCreateFormOptions {
  /** User's portal ID */
  portalId: string;
  /** Unique ID of the form you wish to build */
  formId: string;

  region: string;
  /**
   * jQuery style selector specifying an existing element on the page into which the form will be placed once built.
   *
   * NOTE: If you're including multiple forms on the page, it is strongly recommended that you include a separate, specific target for each form.
   */
  target: string;
  /**
   * Callback that executes after form is validated, just before the data is actually sent.
   * This is for any logic that needs to execute during the submit.
   * Any changes will not be validated.
   * Takes the jQuery form object as the argument: onFormSubmit($form).
   *
   * Note: Performing a browser redirect in this callback is not recommended and could prevent the form submission
   */
  onFormSubmit?: (form: JQuery<HTMLFormElement>) => void;
  /**
   * Callback when the data is actually sent.
   * This allows you to perform an action when the submission is fully complete,
   * such as displaying a confirmation or thank you message.
   */
  onFormSubmitted?: (form: JQuery<HTMLFormElement>) => void;
  /**
   * Callback that executes after form is built, placed in the DOM, and validation has been initialized.
   * This is perfect for any logic that needs to execute when the form is on the page.
   *
   * Takes the jQuery form object as the argument: onFormReady($form)
   */
  onFormReady?: (form: JQuery<HTMLFormElement>) => void;
}

interface Window {
  /**
   * will be true if portainer is run as a Docker Desktop Extension
   */
  ddExtension?: boolean;
  hbspt?: {
    forms: {
      create: (options: HubSpotCreateFormOptions) => void;
    };
  };
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
