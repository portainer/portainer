import { humanize } from '@/portainer/filters/filters';

interface Props {
  imagesTotalSize: number;
}

export function useImagesTotalSizeComponent(imagesTotalSize: number) {
  return <ImagesTotalSize imagesTotalSize={imagesTotalSize} />;
}

export function ImagesTotalSize({ imagesTotalSize }: Props) {
  return (
    <div>
      <i className="fa fa-chart-pie space-right" />
      {humanize(imagesTotalSize)}
    </div>
  );
}
