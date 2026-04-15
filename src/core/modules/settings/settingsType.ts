import { stringComparisonSensitivityType } from '../../lib';

export { categoryIconNames, constantColors, shadeColors };

export type settingsType = {
  [category: string]: categorySettingType;
};

export type categorySettingType = {
  anonymization: string;
  color: { [displayMode in displayModeType]: colorType };
  iconName: categoryIconNameType;
  autoLinkSensitivity?: stringComparisonSensitivityType[];
  isAnonymized?: boolean;
  isSensitive?: boolean;
  order: number | undefined;
  status: 'hidden' | 'visible' | 'alwaysVisible' | 'annotable';
  text: string;
  canBeAnnotatedBy: 'both' | 'NLP' | 'human';
};

export type displayModeType = 'lightMode' | 'darkMode';

const categoryIconNames = [
  'bank',
  'assignment',
  'cake',
  'car',
  'child',
  'city',
  'cloud',
  'email',
  'forbidden',
  'judge',
  'heart',
  'location',
  'map',
  'pencil',
  'person',
  'phone',
  'store',
  'web',
  'work',
  'eyeoff',
] as const;

export type categoryIconNameType = (typeof categoryIconNames)[number];

const constantColors = ['black', 'white'] as const;

const shadeColors = [
  'blue',
  'blueGrey',
  'brown',
  'cyan',
  'deepOrange',
  'deepPurple',
  'green',
  'grey',
  'indigo',
  'lightBlue',
  'lightGreen',
  'lime',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'yellow',
] as const;

export type constantColorType = (typeof constantColors)[number];

export type shadeColorType = [(typeof shadeColors)[number], string];

export type colorType = constantColorType | shadeColorType;
