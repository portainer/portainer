import { TableOptions } from '@tanstack/react-table';

export type OptionsExtension<D> = (options: TableOptions<D>) => TableOptions<D>;
