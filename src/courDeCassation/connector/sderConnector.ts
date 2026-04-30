import { buildConnector, connectorConfigType } from '@src/backend';
import { sderFetcher } from './fetcher';
import { sderUpdater } from './updater';

export { sderConnector };

const sderConnectorConfig: connectorConfigType = {
  name: 'SDER',
  ...sderFetcher,
  ...sderUpdater,
};

const sderConnector = buildConnector(sderConnectorConfig);
