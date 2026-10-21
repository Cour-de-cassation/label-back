import { findAvailableStatisticFilters } from '../../../connectors/db/documents';

export { fetchAvailableStatisticFilters };

async function fetchAvailableStatisticFilters() {
  return (
    (await findAvailableStatisticFilters()) ?? {
      publicationCategories: [],
      maxDate: undefined,
      minDate: undefined,
      routes: [],
      importers: [],
      sources: [],
      jurisdictions: [],
    }
  );
}
