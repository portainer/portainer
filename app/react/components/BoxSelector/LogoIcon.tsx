import { Icon, IconProps } from '@@/Icon';

type Props = IconProps;

export function LogoIcon({ icon }: Props) {
  return (
    <div
      className={`
   inline-flex h-14 w-14
   items-center justify-center text-7xl
`}
    >
      <Icon icon={icon} className="!flex" />
    </div>
  );
}
