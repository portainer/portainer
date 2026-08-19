import { Eye } from 'lucide-react';

import { Icon } from '@@/Icon';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from '@@/Sheet';

import { HelmRelease } from '../types';

import { HelmRevisionList } from './HelmRevisionList';

export function HelmRevisionListSheet({
  currentRevision,
  history,
}: {
  currentRevision: number | undefined;
  history: HelmRelease[] | undefined;
}) {
  return (
    <Sheet>
      <SheetTrigger className="btn btn-link">
        <Icon icon={Eye} />
        View revisions
      </SheetTrigger>
      <SheetContent className="!w-80 overflow-auto !p-0 !pt-1">
        <div className="sr-only">
          <SheetHeader title="Revisions" />
          <SheetDescription>
            View the history of this Helm application.
          </SheetDescription>
        </div>
        <HelmRevisionList currentRevision={currentRevision} history={history} />
      </SheetContent>
    </Sheet>
  );
}
