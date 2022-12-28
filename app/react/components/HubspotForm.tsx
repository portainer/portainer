import { useEffect, useState, ReactNode, useRef } from 'react';

let globalId = 0;

interface Props {
  portalId: HubSpotCreateFormOptions['portalId'];
  formId: HubSpotCreateFormOptions['formId'];
  region: HubSpotCreateFormOptions['region'];

  onSubmitted: () => void;

  onReady?: (form: HTMLIFrameElement) => void;
  loading?: ReactNode;
  noScript?: boolean;
}

export function HubspotForm({
  loading,
  portalId,
  region,
  formId,
  noScript,
  onReady,
  onSubmitted,
}: Props) {
  const id = useRef(globalId++);
  const el = useRef<HTMLDivElement>(null);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!window.hbspt && !noScript) {
      loadScript();
    } else {
      createForm();
      findFormElement();
    }
  });

  return (
    <div>
      <div
        ref={el}
        id={`reactHubspotForm${id.current}`}
        style={{ display: loaded ? 'block' : 'none' }}
      />
      {!loaded && loading}
    </div>
  );

  function createForm() {
    if (!window.hbspt) {
      setTimeout(createForm, 100);
      return;
    }

    // protect against component unmounting before window.hbspt is available
    if (el.current === null) {
      return;
    }

    const options: HubSpotCreateFormOptions = {
      portalId,
      formId,
      region,
      target: `#${el.current.getAttribute(`id`)}`,

      onFormSubmitted: onSubmitted,
    };
    window.hbspt.forms.create(options);
  }

  function loadScript() {
    const script = document.createElement(`script`);
    script.defer = true;
    script.onload = () => {
      createForm();
      findFormElement();
    };
    script.src = `//js.hsforms.net/forms/v2.js`;
    document.head.appendChild(script);
  }

  function findFormElement() {
    // protect against component unmounting before form is added
    if (el.current === null) {
      return;
    }

    const iframe = el.current.querySelector(`iframe`);
    if (!iframe) {
      setTimeout(() => findFormElement(), 1);
      return;
    }

    setLoaded(true);
    if (onReady) {
      onReady(iframe);
    }
  }
}
