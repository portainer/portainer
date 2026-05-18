import {
  ComponentPropsWithoutRef,
  forwardRef,
  ElementRef,
  PropsWithChildren,
} from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';
import { RefreshCw, X } from 'lucide-react';

import { Button } from './buttons';

// modified from shadcn sheet component
const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetDescription = SheetPrimitive.Description;

type SheetTitleProps = {
  title: string;
  onReload?(): Promise<void> | void;
};

// similar to the PageHeader component with simplified props and no breadcrumbs
function SheetHeader({
  onReload,
  title,
  children,
}: PropsWithChildren<SheetTitleProps>) {
  return (
    <div className="row">
      <div className="col-sm-12 flex justify-between gap-2 pt-3">
        <div className="flex items-center gap-2">
          <SheetPrimitive.DialogTitle className="m-0 text-2xl font-medium text-gray-11 th-highcontrast:text-white th-dark:text-white">
            {title}
          </SheetPrimitive.DialogTitle>
          {onReload ? (
            <Button
              color="none"
              size="large"
              onClick={onReload}
              className="m-0 p-0 focus:text-inherit"
              title="Refresh drawer content"
              data-cy="sheet-refreshButton"
            >
              <RefreshCw className="icon" />
            </Button>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}

const SheetOverlay = forwardRef<
  ElementRef<typeof SheetPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={clsx(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  'fixed z-50 bg-widget-color p-5 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-[70vw] lg:w-[50vw] border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left max-w-2xl',
        right:
          'inset-y-0 right-0 h-full w-[70vw] lg:w-[50vw] border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right max-w-2xl',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
);

interface SheetContentProps
  extends
    ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  showCloseButton?: boolean;
}

const SheetContent = forwardRef<
  ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(
  (
    {
      side = 'right',
      className,
      children,
      title,
      showCloseButton = true,
      ...props
    },
    ref
  ) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={clsx(sheetVariants({ side }), className)}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      >
        {title ? <SheetHeader title={title} /> : null}
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            asChild
            className="close-button absolute right-9 top-8 disabled:pointer-events-none"
          >
            <Button
              icon={X}
              color="none"
              className="btn-only-icon"
              size="medium"
              data-cy="sheet-closeButton"
            >
              <span className="sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
};
