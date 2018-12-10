package defender

import (
	"sync"
	"time"

	"golang.org/x/time/rate"
)

const factor = 10

// Client is a record specific to each user accessing resource
type Client struct {
	limiter *rate.Limiter
	expire  time.Time
	banned  bool
	key     interface{}
}

// Key returns unique identifier with which client was initially created
func (c *Client) Key() interface{} { return c.key }

// Banned returns client's status
func (c *Client) Banned() bool { return c.banned }

// Expire returns timestamp when client's record is going to expire
func (c *Client) Expire() time.Time { return c.expire }

// Defender keep tracks if the `Client`s and maintains the banlist
type Defender struct {
	clients map[interface{}]*Client

	Duration    time.Duration
	BanDuration time.Duration
	Max         int

	sync.Mutex
}

// New initializes a Defender instance that will limit `max` event maximum per `duration` before banning the client for `banDuration`
func New(max int, duration, banDuration time.Duration) *Defender {
	return &Defender{
		clients:     map[interface{}]*Client{},
		Duration:    duration,
		BanDuration: banDuration,
		Max:         max,
	}
}

// BanList returns the list of banned clients
func (d *Defender) BanList() []*Client {
	l := []*Client{}
	for _, client := range d.clients {
		if client.banned {
			l = append(l, client)
		}
	}
	return l
}

// Client creates or returns existing client
func (d *Defender) Client(key interface{}) (*Client, bool) {
	d.Lock()
	defer d.Unlock()
	client, ok := d.clients[key]

	return client, ok
}

// Inc is increments the number of event for the given client key, returns true if the client just got banned
func (d *Defender) Inc(key interface{}) bool {
	d.Lock()
	defer d.Unlock()
	now := time.Now()

	if _, found := d.clients[key]; !found {
		d.clients[key] = &Client{
			key:     key,
			limiter: rate.NewLimiter(rate.Every(d.Duration), d.Max),
			expire:  now.Add(d.Duration * factor),
		}
	}

	client := d.clients[key]

	// Check if the client is not banned anymore and the cleanup hasn't been run yet
	if client.banned && now.After(client.expire) {
		client.banned = false
	}

	// Check if client is banned
	if client.banned {
		return true
	}

	// Update the client expiration
	client.expire = now.Add(d.Duration * factor)

	// Check the rate limiter
	banned := !client.limiter.AllowN(time.Now(), 1)

	if banned {
		// Set the client as banned
		client.banned = true

		// Set the ban duration
		client.expire = now.Add(d.BanDuration)
	}

	return banned
}

// Cleanup should be used if you want to manage the cleanup yourself, looks for CleanupTask for an automatic way
func (d *Defender) Cleanup() {
	d.Lock()
	defer d.Unlock()
	now := time.Now()
	for key, client := range d.clients {
		if now.After(client.expire) {
			delete(d.clients, key)
		}
	}
}

// CleanupTask should be run in a go routine
func (d *Defender) CleanupTask(quit <-chan struct{}) {
	c := time.Tick(d.Duration * factor)
	for {
		select {
		case <-quit:
			break
		case <-c:
			d.Cleanup()
		}
	}
}
