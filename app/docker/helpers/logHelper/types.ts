import { type TextColor } from './colors';

export type Token = string | number;

type FontWeight =
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'
  | 'bold'
  | 'bolder'
  | 'lighter'
  | 'normal';

export type Span = {
  fgColor?: TextColor;
  bgColor?: TextColor;
  text: string;
  fontWeight?: FontWeight;
};

export type FormattedLine = {
  spans: Span[];
  line: string;
};

export const TIMESTAMP_LENGTH = 31; // 30 for timestamp + 1 for trailing space
