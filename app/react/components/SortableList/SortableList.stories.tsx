import { useQuery } from '@tanstack/react-query';
import { Meta } from '@storybook/react-webpack5';

import { DropdownOption } from '../DropdownMenu/DropdownMenu';

import { SortableList, SortableGroup, SortableListState } from './SortableList';
import {
  useGroupOptions,
  useGroups,
  computePagedGroups,
} from './sortable-list.story-utils';
import { SortableListItem } from './SortableListItem';
import { useSortableListState } from './sortable-list.store';

export default {
  component: SortableList,
  title: 'Design System/SortableList',
} as Meta;

export function ClientSidePagination() {
  const data = getData();
  const storageKey = 'fruits-veggies';
  const tableState = useSortableListState(storageKey, 'color');

  const colorOptions = useGroupOptions(
    'color',
    data,
    getProduceGroupKeys,
    getProduceGroupKey,
    getProduceGroupLabel
  );
  const categoryOptions = useGroupOptions(
    'category',
    data,
    getProduceGroupKeys,
    getProduceGroupKey,
    getProduceGroupLabel
  );

  const { groups, totalCount } = useGroups(
    tableState,
    data,
    'color',
    getProduceGroupKeys,
    getProduceGroupKey,
    getProduceGroupLabel,
    (i) => `${i.name} ${i.color} ${i.category} ${i.description}`,
    getProduceGroupIcon
  );

  return (
    <ProduceList
      groupOptions={{ color: colorOptions, category: categoryOptions }}
      groups={groups}
      tableState={tableState}
      totalCount={totalCount}
    />
  );
}

export function ServerSidePagination() {
  const allData = getData();
  const storageKey = 'fruits-veggies-latency-demo';
  const tableState = useSortableListState(storageKey, 'color');
  const sortBy = tableState.groupBy ?? tableState.sortBy?.id ?? 'color';

  const colorOptions = useGroupOptions(
    'color',
    allData,
    getProduceGroupKeys,
    getProduceGroupKey,
    getProduceGroupLabel
  );
  const categoryOptions = useGroupOptions(
    'category',
    allData,
    getProduceGroupKeys,
    getProduceGroupKey,
    getProduceGroupLabel
  );

  const { data, isPreviousData } = useQuery(
    [
      storageKey,
      sortBy,
      tableState.page,
      tableState.pageSize,
      tableState.groupFilter,
      tableState.search,
    ],
    async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 800);
      });
      return computePagedGroups({
        items: allData,
        sortBy,
        page: tableState.page,
        pageSize: tableState.pageSize,
        groupFilter: tableState.groupFilter,
        search: tableState.search,
        getGroupKeys: getProduceGroupKeys,
        getGroupKey: getProduceGroupKey,
        getGroupLabel: getProduceGroupLabel,
        getSearchText: (i) =>
          `${i.name} ${i.color} ${i.category} ${i.description}`,
        getGroupIcon: getProduceGroupIcon,
      });
    },
    { keepPreviousData: true, staleTime: 0 }
  );

  return (
    <ProduceList
      groupOptions={{ color: colorOptions, category: categoryOptions }}
      groups={data?.groups ?? []}
      tableState={tableState}
      totalCount={data?.totalCount ?? 0}
      isLoading={isPreviousData || !data}
    />
  );
}

interface Produce {
  id: string;
  name: string;
  color: string;
  category: Category;
  description: string;
}

function getData(): Produce[] {
  return [
    {
      id: '1',
      name: 'Apple',
      color: 'Red',
      category: 'fruit',
      description: 'Crisp, sweet or tart; great for snacking and pies.',
    },
    {
      id: '2',
      name: 'Banana',
      color: 'Yellow',
      category: 'fruit',
      description: 'Soft, creamy, and high in potassium.',
    },
    {
      id: '3',
      name: 'Beet',
      color: 'Purple',
      category: 'veggie',
      description: 'Earthy root vegetable; excellent roasted or in salads.',
    },
    {
      id: '4',
      name: 'Blueberry',
      color: 'Blue',
      category: 'fruit',
      description: 'Small, antioxidant-rich berries for baking and smoothies.',
    },
    {
      id: '5',
      name: 'Broccoli',
      color: 'Green',
      category: 'veggie',
      description: 'Nutritious green florets; steam or roast.',
    },
    {
      id: '6',
      name: 'Carrot',
      color: 'Orange',
      category: 'veggie',
      description: 'Crunchy, sweet root; raw or cooked.',
    },
    {
      id: '7',
      name: 'Cherry',
      color: 'Red',
      category: 'fruit',
      description: 'Sweet or sour stone fruit; summer favorite.',
    },
    {
      id: '8',
      name: 'Cucumber',
      color: 'Green',
      category: 'veggie',
      description: 'Cool, crisp, and hydrating; perfect in salads.',
    },
    {
      id: '9',
      name: 'Grape',
      color: 'Purple',
      category: 'fruit',
      description: 'Juicy clusters; eaten fresh or turned into wine.',
    },
    {
      id: '10',
      name: 'Kale',
      color: 'Green',
      category: 'veggie',
      description: 'Leafy green superfood; hearty in salads and soups.',
    },
    {
      id: '11',
      name: 'Lemon',
      color: 'Yellow',
      category: 'fruit',
      description: 'Tangy citrus; juice, zest, or slice for drinks.',
    },
    {
      id: '12',
      name: 'Lettuce',
      color: 'Green',
      category: 'veggie',
      description: 'Mild leafy base for salads and wraps.',
    },
    {
      id: '13',
      name: 'Onion',
      color: 'Yellow',
      category: 'veggie',
      description: 'Pungent allium; foundational in savory cooking.',
    },
    {
      id: '14',
      name: 'Orange',
      color: 'Orange',
      category: 'fruit',
      description: 'Sweet citrus; juice or eat segments.',
    },
    {
      id: '15',
      name: 'Pear',
      color: 'Green',
      category: 'fruit',
      description: 'Sweet, grainy texture; good fresh or poached.',
    },
    {
      id: '16',
      name: 'Pepper',
      color: 'Red',
      category: 'veggie',
      description: 'Sweet or hot; bell or chili varieties.',
    },
    {
      id: '17',
      name: 'Plum',
      color: 'Purple',
      category: 'fruit',
      description: 'Stone fruit; sweet when ripe, great for jam.',
    },
    {
      id: '18',
      name: 'Radish',
      color: 'Red',
      category: 'veggie',
      description: 'Peppery crunch; slice into salads or eat whole.',
    },
    {
      id: '19',
      name: 'Raspberry',
      color: 'Red',
      category: 'fruit',
      description: 'Delicate, tart berries; fresh or in desserts.',
    },
    {
      id: '20',
      name: 'Spinach',
      color: 'Green',
      category: 'veggie',
      description: 'Tender leaves; salads, smoothies, or cooked.',
    },
    {
      id: '21',
      name: 'Strawberry',
      color: 'Red',
      category: 'fruit',
      description: 'Classic red berry; summer staple.',
    },
    {
      id: '22',
      name: 'Sweet potato',
      color: 'Orange',
      category: 'veggie',
      description: 'Naturally sweet tuber; bake, mash, or fry.',
    },
    {
      id: '23',
      name: 'Tomato',
      color: 'Red',
      category: 'veggie',
      description: 'Juicy and versatile; salads, sauce, or cooked.',
    },
    {
      id: '24',
      name: 'Watermelon',
      color: 'Green',
      category: 'fruit',
      description: 'Refreshing, watery summer melon.',
    },
    {
      id: '25',
      name: 'Zucchini',
      color: 'Green',
      category: 'veggie',
      description: 'Mild summer squash; grill, spiralize, or bake.',
    },
  ];
}

const COLOR_ORDER = [
  'Red',
  'Orange',
  'Yellow',
  'Green',
  'Blue',
  'Purple',
] as const;
const CATEGORY_ORDER: Category[] = ['fruit', 'veggie'] as const;

const COLOR_DOT_CLASSES: Record<string, string> = {
  Red: 'bg-error-7',
  Orange: 'bg-warning-7',
  Yellow: 'bg-yellow-7',
  Green: 'bg-success-7',
  Blue: 'bg-blue-7',
  Purple: 'bg-purple-7',
};

type Category = 'fruit' | 'veggie';

const PRODUCE_SORT_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color', grouped: true },
  { key: 'category', label: 'Category', grouped: true },
] as const;

const GRID_COLS =
  '44px minmax(80px, 1fr) minmax(60px, 0.6fr) minmax(120px, 2fr)';

function ProduceList({
  tableState,
  groupOptions,
  groups,
  totalCount,
  isLoading,
}: {
  tableState: SortableListState;
  groupOptions?: Record<string, DropdownOption[]>;
  groups: Array<SortableGroup<Produce>>;
  totalCount: number;
  isLoading?: boolean;
}) {
  return (
    <SortableList
      tableState={tableState}
      sortOptions={[...PRODUCE_SORT_OPTIONS]}
      groupOptions={groupOptions}
      groups={groups}
      totalCount={totalCount}
      isLoading={isLoading}
      getItemKey={(item) => item.id}
      showGroupHeaders
      emptyMessage="No items found"
      searchPlaceholder="Filter fruits & veggies..."
      renderColumnHeaders={() => (
        <div
          className="grid items-center border-b border-solid border-gray-3 px-5 py-2 text-xs uppercase tracking-wide text-gray-6 th-dark:border-gray-8"
          style={{ gridTemplateColumns: GRID_COLS, gap: 12 }}
        >
          <span className="text-center">Color</span>
          <span>Name</span>
          <span>Category</span>
          <span>Description</span>
        </div>
      )}
      data-cy="produce"
      renderItem={(item) => (
        <SortableListItem>
          <div
            className="grid items-center"
            style={{ gridTemplateColumns: GRID_COLS, gap: 12 }}
          >
            <div className="flex items-center justify-center">
              <span
                className={`inline-block h-3 w-3 rounded-full ${
                  COLOR_DOT_CLASSES[item.color] ?? 'bg-gray-5'
                }`}
                title={item.color}
              />
            </div>
            <span className="text-sm font-semibold text-gray-9 th-dark:text-white">
              {item.name}
            </span>
            <span className="text-sm text-gray-7 th-dark:text-gray-4">
              {item.category}
            </span>
            <span className="text-xs leading-relaxed text-gray-6">
              {item.description}
            </span>
          </div>
        </SortableListItem>
      )}
    />
  );
}

function getProduceGroupLabel(sortBy: string, key: string): string {
  if (sortBy === 'category') {
    return key === 'fruit' ? 'Fruit' : 'Veggies';
  }
  return key;
}

function getProduceGroupKey(item: Produce, sortBy: string): string {
  return sortBy === 'color' ? item.color : item.category;
}

function getProduceGroupKeys(sortBy: string): string[] {
  if (sortBy === 'color') return [...COLOR_ORDER];
  if (sortBy === 'category') return [...CATEGORY_ORDER];
  return [];
}

function getProduceGroupIcon(key: string): JSX.Element {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        COLOR_DOT_CLASSES[key] ?? 'bg-gray-5'
      }`}
    />
  );
}
