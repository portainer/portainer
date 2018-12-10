# defender

[![Godoc Reference](https://godoc.org/github.com/tsileo/defender?status.png)](https://godoc.org/github.com/tsileo/defender)
[![Travis CI status](https://api.travis-ci.org/G07cha/defender.svg?branch=master)](https://travis-ci.org/G07cha/defender)

Defender is a low-level package to help prevent brute force attacks, built on top of [golang.org/x/time/rate](https://golang.org/x/time/rate).

```go
package main

import (
	"time"

	"github.com/tsileo/defender"
)

func main() {
	// Ban client for 1 hour if moe than 50 events per seconds are performed
	d := defender.New(50, 1 * time.Second, 1 * time.Hour)
	// Check if the client is already banned
	if client, ok := d.Client(r.RemoteAddr); ok && !client.Banned() {
		// Check auth
		authorized := authFunc(r)

		// Call `Inc` if the client failed
		if !authorized {
			if d.Inc(r.RemoteAddr) {
				// the client just got banned
			}
			// returns a bad status
		}
	}
}
```
