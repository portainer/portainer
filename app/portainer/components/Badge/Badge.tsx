export interface Props {
  value: string;
  icon?: string;
}

export function Badge({ icon, value }: Props) {
  return (
    <span className="badge">
      {icon && <i className={icon} />}
      {value}
    </span>
  );
}
