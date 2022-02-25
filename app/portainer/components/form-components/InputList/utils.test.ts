import { arrayMove } from './utils';

it('moves items in an array', () => {
  expect(arrayMove(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  expect(
    arrayMove(
      [
        { name: 'Fred' },
        { name: 'Barney' },
        { name: 'Wilma' },
        { name: 'Betty' },
      ],
      2,
      1
    )
  ).toEqual([
    { name: 'Fred' },
    { name: 'Wilma' },
    { name: 'Barney' },
    { name: 'Betty' },
  ]);
  expect(arrayMove([1, 2, 3], 2, 1)).toEqual([1, 3, 2]);
});
