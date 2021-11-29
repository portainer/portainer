import { react2angular } from '@/react-tools/react2angular';

export interface KVMControlProps {
  /**
   * Example text to displayed in the component.
   */
  text: string;
}

export function KVMControl({ text }: KVMControlProps) {
  return (
    <div>
        KVM control
      {text}
    </div>
  );
}

export const KVMControlAngular = react2angular(KVMControl, ['text']);
