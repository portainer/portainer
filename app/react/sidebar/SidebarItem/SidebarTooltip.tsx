import Tippy, { TippyProps } from '@tippyjs/react';

type Props = {
  content: React.ReactNode;
  children?: TippyProps['children'];
};

export function SidebarTooltip({ children, content }: Props) {
  return (
    <Tippy
      className="sidebar !rounded-md bg-blue-9 p-3 !opacity-100 be:bg-gray-9 th-dark:bg-gray-true-9 th-highcontrast:bg-black th-highcontrast:border th-highcontrast:border-solid th-highcontrast:border-white"
      content={content}
      delay={[0, 0]}
      duration={[0, 0]}
      zIndex={1000}
      placement="right"
      arrow
      allowHTML
      interactive
    >
      {children}
    </Tippy>
  );
}
