#!/bin/sh
die () {
    echo >&2 "$@"
    exit 1
}

[ "$#" -eq 2 ] || die "Usage - version \"space separated context\""

TIMESTAMP=$(date +%s)
VERSION=$1
CONTEXT=$2

CONTEXT_SLUG="${CONTEXT// /_}"

cat << EOF >${TIMESTAMP}_${CONTEXT_SLUG}.go
package migrations

import (
	"github.com/portainer/portainer/api/datastore/migrations/types"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   ${VERSION},
		Timestamp: ${TIMESTAMP},
		Up:        v${VERSION}_up_${CONTEXT_SLUG},
		Down:      v${VERSION}_down_${CONTEXT_SLUG},
		Name:      "${CONTEXT}",
	})
}

func v${VERSION}_up_${CONTEXT_SLUG}() error {
	return nil
}

func v${VERSION}_down_${CONTEXT_SLUG}() error {
	return nil
}
EOF
