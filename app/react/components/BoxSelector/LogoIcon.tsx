import { Icon, IconProps } from '@@/Icon';

type Props = IconProps;

export function LogoIcon({ icon }: Props) {
  return (
    <div
      className={`
   text-6xl h-14 w-14
   inline-flex items-center justify-center
`}
    >
      <Icon icon={icon} className="feather !flex" />
    </div>
  );
}
