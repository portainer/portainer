/**
 * Created by elgs on 7/2/14.
 */

import { splitargs } from './splitargs';

describe('splitargs Suite', () => {
  beforeEach(() => {});
  afterEach(() => {});

  it('should split double quoted string', () => {
    const i = " I  said 'I am sorry.', and he said \"it doesn't matter.\" ";
    const o = splitargs(i);
    expect(7).toBe(o.length);
    expect(o[0]).toBe('I');
    expect(o[1]).toBe('said');
    expect(o[2]).toBe('I am sorry.,');
    expect(o[3]).toBe('and');
    expect(o[4]).toBe('he');
    expect(o[5]).toBe('said');
    expect(o[6]).toBe("it doesn't matter.");
  });

  it('should split pure double quoted string', () => {
    const i = 'I said "I am sorry.", and he said "it doesn\'t matter."';
    const o = splitargs(i);
    expect(o).toHaveLength(7);
    expect(o[0]).toBe('I');
    expect(o[1]).toBe('said');
    expect(o[2]).toBe('I am sorry.,');
    expect(o[3]).toBe('and');
    expect(o[4]).toBe('he');
    expect(o[5]).toBe('said');
    expect(o[6]).toBe("it doesn't matter.");
  });

  it('should split single quoted string', () => {
    const i = 'I said "I am sorry.", and he said "it doesn\'t matter."';
    const o = splitargs(i);
    expect(o).toHaveLength(7);
    expect(o[0]).toBe('I');
    expect(o[1]).toBe('said');
    expect(o[2]).toBe('I am sorry.,');
    expect(o[3]).toBe('and');
    expect(o[4]).toBe('he');
    expect(o[5]).toBe('said');
    expect(o[6]).toBe("it doesn't matter.");
  });

  it('should split pure single quoted string', () => {
    const i = "I said 'I am sorry.', and he said \"it doesn't matter.\"";
    const o = splitargs(i);
    expect(o).toHaveLength(7);
    expect(o[0]).toBe('I');
    expect(o[1]).toBe('said');
    expect(o[2]).toBe('I am sorry.,');
    expect(o[3]).toBe('and');
    expect(o[4]).toBe('he');
    expect(o[5]).toBe('said');
    expect(o[6]).toBe("it doesn't matter.");
  });

  it('should split to 4 empty strings', () => {
    const i = ',,,';
    const o = splitargs(i, ',', true);
    expect(o).toHaveLength(4);
  });
});
