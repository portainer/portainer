package cli

import (
	"sync"

	"k8s.io/client-go/tools/remotecommand"
)

// TerminalSizeQueue implements remotecommand.TerminalSizeQueue for Kubernetes pod exec.
// Resize events are received via Push and forwarded to the Kubernetes API server.
type TerminalSizeQueue struct {
	resizeChan chan *remotecommand.TerminalSize
	done       chan struct{}
	closeOnce  sync.Once
}

func NewTerminalSizeQueue() *TerminalSizeQueue {
	return &TerminalSizeQueue{
		resizeChan: make(chan *remotecommand.TerminalSize),
		done:       make(chan struct{}),
	}
}

// Next blocks until the next terminal resize event or the queue is closed.
func (q *TerminalSizeQueue) Next() *remotecommand.TerminalSize {
	return <-q.resizeChan
}

// Push queues a terminal resize.
// Push is safe to call after Close.
func (q *TerminalSizeQueue) Push(cols, rows uint16) {
	select {
	case <-q.done:
	case q.resizeChan <- &remotecommand.TerminalSize{Width: cols, Height: rows}:
	}
}

// Close shuts down the queue. Safe to call multiple times.
func (q *TerminalSizeQueue) Close() {
	q.closeOnce.Do(func() {
		close(q.done)
		close(q.resizeChan)
	})
}
