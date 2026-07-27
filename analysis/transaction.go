//go:build ignore

package gorules

import "github.com/quasilyte/go-ruleguard/dsl"

// nestedDBTransaction flags a DataStore transaction started from inside another
// transaction closure. bbolt only allows one open write transaction at a time,
// so starting a second one while the first is still open deadlocks. This fires
// regardless of whether the inner transaction is opened through the same store
// variable or a different one, since there is only one underlying database.
func nestedDBTransaction(m dsl.Matcher) {
	m.Match(
		`$store.UpdateTx($fn)`,
		`$store.UpdateTxLowPriority($fn)`,
		`$store.ViewTx($fn)`,
	).
		Where(
			m["fn"].Contains(`$_.UpdateTx($_)`) ||
				m["fn"].Contains(`$_.UpdateTxLowPriority($_)`) ||
				m["fn"].Contains(`$_.ViewTx($_)`)).
		Report(`$fn starts another transaction while already running inside $store's transaction; only one write transaction can be open at a time, so this can deadlock`)
}

// dataStoreCallInsideTx flags a service accessed through the DataStore instead
// of the tx handle inside a transaction closure. The non-tx CRUD methods open
// their own transaction internally (see BaseDataService), so calling them from
// inside an already-open transaction is a nested transaction in disguise.
func dataStoreCallInsideTx(m dsl.Matcher) {
	m.Match(
		`$store.UpdateTx($fn)`,
		`$store.UpdateTxLowPriority($fn)`,
		`$store.ViewTx($fn)`,
	).
		Where(m["fn"].Contains(`$store.$service().$method($*_)`)).
		Report(`$service() is accessed through $store instead of the tx parameter inside this closure; the non-tx call starts its own transaction internally and can deadlock`)
}
