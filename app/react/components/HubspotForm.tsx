import { ReactNode, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

let globalId = 0;

interface Props {
  portalId: HubSpotCreateFormOptions['portalId'];
  formId: HubSpotCreateFormOptions['formId'];
  region: HubSpotCreateFormOptions['region'];

  onSubmitted: () => void;

  loading?: ReactNode;
}

export function HubspotForm({
  loading,
  portalId,
  region,
  formId,
  onSubmitted,
}: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const id = useRef(`reactHubspotForm${globalId++}`);
  const { isLoading } = useHubspotForm({
    elId: id.current,
    formId,
    portalId,
    region,
    onSubmitted,
  });

  return (
    <>
      <div
        ref={elRef}
        id={id.current}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
      {isLoading && loading}
    </>
  );
}

function useHubspotForm({
  elId,
  formId,
  portalId,
  region,
  onSubmitted,
}: {
  elId: string;
  portalId: HubSpotCreateFormOptions['portalId'];
  formId: HubSpotCreateFormOptions['formId'];
  region: HubSpotCreateFormOptions['region'];

  onSubmitted: () => void;
}) {
  return useQuery(
    ['hubspot', { elId, formId, portalId, region }],
    async () => {
      await loadHubspot();
      await createForm(`#${elId}`, {
        formId,
        portalId,
        region,
        onFormSubmitted: onSubmitted,
      });
    },
    {
      refetchOnWindowFocus: false,
    }
  );
}

async function loadHubspot() {
  return new Promise<void>((resolve) => {
    if (window.hbspt) {
      resolve();
      return;
    }

    const script = document.createElement(`script`);

    script.defer = true;
    script.onload = () => {
      resolve();
    };
    script.src = `//js.hsforms.net/forms/v2.js`;
    document.head.appendChild(script);
  });
}

async function createForm(
  target: string,
  options: Omit<HubSpotCreateFormOptions, 'target'>
) {
  return new Promise<void>((resolve) => {
    if (!window.hbspt) {
      throw new Error('hbspt object is missing');
    }

    window.hbspt.forms.create({
      ...options,
      target,
      onFormReady(...rest) {
        options.onFormReady?.(...rest);
        resolve();
      },
    });
  });
}
