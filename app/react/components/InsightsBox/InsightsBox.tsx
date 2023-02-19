import { Lightbulb } from 'lucide-react';
import { ReactNode, useMemo } from 'react';
import sanitize from 'sanitize-html';

export type Props = {
  header: string;
  content: ReactNode;
  setHtmlContent?: boolean;
};

export function InsightsBox({ header, content, setHtmlContent }: Props) {
  // allow angular views to set html messages for the tooltip
  const htmlContent = useMemo(() => {
    if (setHtmlContent && typeof content === 'string') {
      // eslint-disable-next-line react/no-danger
      return <div dangerouslySetInnerHTML={{ __html: sanitize(content) }} />;
    }
    return null;
  }, [setHtmlContent, content]);

  return (
    <div className="flex w-full gap-1 rounded-lg bg-gray-modern-3 p-4 text-sm th-highcontrast:bg-legacy-grey-3 th-dark:bg-legacy-grey-3">
      <div className="shrink-0">
        <Lightbulb className="h-4 text-warning-7 th-highcontrast:text-warning-6 th-dark:text-warning-6" />
      </div>
      <div>
        <p className="mb-2 font-bold">{header}</p>
        <div>{htmlContent || content}</div>
      </div>
    </div>
  );
}
