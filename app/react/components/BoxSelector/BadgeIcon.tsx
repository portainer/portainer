import { Icon, IconProps } from '@@/Icon';

type Props = IconProps;

export function BadgeIcon({ icon, featherIcon }: Props) {
  return (
    <div
      className={`badge-icon
   text-3xl h-14 w-14
   bg-blue-3 text-blue-8
   th-dark:bg-gray-9 th-dark:text-blue-3
   rounded-full
   inline-flex items-center justify-center 
`}
    >
      <Icon icon={icon} feather={featherIcon} className="feather !flex" />
    </div>
  );
}
