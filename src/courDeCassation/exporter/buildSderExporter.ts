import { buildExporter } from '@src/backend';
import { settingsType } from '@src/core';
import { exporterConfig } from './exporterConfig';

export { buildSderExporter };

function buildSderExporter(settings: settingsType) {
  return buildExporter(exporterConfig, settings);
}
