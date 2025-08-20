#!/bin/sh

DIRNAME=$(realpath "$(dirname "$0")")
CASSATION_DIRNAME=$(realpath "$DIRNAME/dist/courDeCassation")

SCRIPT_NAME="$1"
shift

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

sh node $CASSATION_DIRNAME/scripts/$SCRIPT_NAME -s $CASSATION_DIRNAME/settings/settings/json
