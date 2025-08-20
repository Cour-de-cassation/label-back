#!/bin/sh

DIRNAME=$(realpath "$(dirname "$0")")
CASSATION_DIRNAME=$(realpath "$DIRNAME/dist/courDeCassation")

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "Reset the DB except for users"
sh node $CASSATION_DIRNAME/scripts/clearDb.js -s $CASSATION_DIRNAME/settings/settings/json;

echo "Import the documents from SDER database"
sh node $CASSATION_DIRNAME/scripts/importAllDocumentsFromSderSinceOrBetween.js -s $CASSATION_DIRNAME/settings/settings/json --fromDaysAgo 2;

echo "Annotate all the documents with the NLP engine"
sh node $CASSATION_DIRNAME/scripts/annotateDocumentsWithoutAnnotationsWithNlp.js -s $CASSATION_DIRNAME/settings/settings/json:

echo "Insert mock values in DB"
sh node $CASSATION_DIRNAME/scripts/initializeTestDb.js -s $CASSATION_DIRNAME/settings/settings/json;

echo "Create initial cache"
sh node $CASSATION_DIRNAME/scripts/renewCache.js -s $CASSATION_DIRNAME/settings/settings/json --beforeMinutes=5;
