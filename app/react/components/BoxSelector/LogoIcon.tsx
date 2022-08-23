import { Icon, IconProps } from '@@/Icon';

type Props = IconProps;

export function LogoIcon({ icon, featherIcon }: Props) {
  return (
    <div
      className={`
   text-6xl h-14 w-14
   inline-flex items-center justify-center 
`}
    >
      <Icon icon={icon} feather={featherIcon} className="feather !flex" />
    </div>
  );
}
