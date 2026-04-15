import {
  additionalAnnotationCategoryHandler,
  buildSettings,
  computeFilteredSettings,
  parseFromJson,
  getAnnotationCategoryColor,
  getAnnotationCategoryIconName,
  getAnnotationCategoryStatus,
  getAnnotationCategoryText,
  getCategories,
  motivationCategoryHandler,
} from './lib';
import {
  colorType,
  constantColorType,
  displayModeType,
  settingsType,
  shadeColorType,
  categoryIconNameType,
} from './settingsType';

export { settingsModule };

export type { colorType, constantColorType, displayModeType, settingsType, shadeColorType, categoryIconNameType };

const settingsModule = {
  lib: {
    additionalAnnotationCategoryHandler,
    buildSettings,
    computeFilteredSettings,
    parseFromJson,
    getAnnotationCategoryColor,
    getAnnotationCategoryIconName,
    getAnnotationCategoryStatus,
    getAnnotationCategoryText,
    getCategories,
    motivationCategoryHandler,
  },
};
