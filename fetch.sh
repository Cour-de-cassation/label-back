#!/bin/bash

# ROOT_DIR=$(realpath "$(dirname "$0")")
BACKEND=src/backend
CORE=src/core
COUR_DE_CASSATION=src/courDeCassation

OLD_PATH=packages/generic/$1/src
NEW_PATH=src/$1

git show finalize-sso:$OLD_PATH/$2 > $NEW_PATH/$2