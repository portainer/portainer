import { Widget, WidgetBody } from '@/portainer/components/widget';

interface Props {
  value: number;
  icon: string;
  comment: string;
}

export function DashboardItem({ value, icon, comment }: Props) {
  return (
    <div className="col-sm-12 col-md-6">
      <Widget>
        <WidgetBody>
          <div className="widget-icon blue pull-left">
            <i className={icon} />
          </div>
          <div className="title">{value}</div>
          <div className="comment">{comment}</div>
        </WidgetBody>
      </Widget>
    </div>
  );
}
