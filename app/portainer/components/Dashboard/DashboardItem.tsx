import { Link } from '@/portainer/components/Link';
import { Widget, WidgetBody } from '@/portainer/components/widget';

interface Props {
  value: number;
  icon: string;
  comment: string;
  accessibilityLabel: string;
  link?: string;
}

export function DashboardItem({
  value,
  icon,
  comment,
  accessibilityLabel,
  link,
}: Props) {
  const element = (
    <div className="col-sm-12 col-md-6" aria-label={accessibilityLabel}>
      <Widget>
        <WidgetBody>
          <div className="widget-icon blue pull-left">
            <i className={icon} aria-hidden="true" aria-label="icon" />
          </div>
          <div className="title" aria-label="value">
            {value}
          </div>
          <div className="comment" aria-label="resourceType">
            {comment}
          </div>
        </WidgetBody>
      </Widget>
    </div>
  );

  return <>{link ? <Link to={link}>{element}</Link> : element}</>;
}
