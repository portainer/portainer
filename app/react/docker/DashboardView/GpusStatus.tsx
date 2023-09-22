import { Check, Slash } from 'lucide-react';

import { Icon } from '@/react/components/Icon';

interface Props {
  gpuFreeStr: string;
}

export function useGpusStatusComponent(gpuFreeStr: string) {
  return <GpusStatusComponent gpuFreeStr={gpuFreeStr} />;
}

export function GpusStatusComponent({ gpuFreeStr }: Props) {
  if (gpuFreeStr === 'none') {
    return (
      <div className="vertical-center">
        <Icon icon={Slash} className='space-right' />
        all occupied
      </div>
    );
  }
  else {
    return (
      <div className="vertical-center">
        <Icon icon={Check} className='space-right' />
        {gpuFreeStr} free
      </div>
    );
  }
}
