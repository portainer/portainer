// Package natsort implements natural strings sorting

// An extension of the following package found here:
// https://github.com/facette/natsort
// Our extension adds ReverseSort
//
// Original 3-Clause BSD License below:
// Copyright (c) 2015, Vincent Batoufflet and Marc Falzon
// All rights reserved.

// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions
// are met:

//  * Redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.

//  * Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.

//  * Neither the name of the authors nor the names of its contributors
//    may be used to endorse or promote products derived from this software
//    without specific prior written permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

package natsort

import (
	"regexp"
	"sort"
	"strconv"
)

type natsort []string

func (s natsort) Len() int {
	return len(s)
}

func (s natsort) Less(a, b int) bool {
	return Compare(s[a], s[b])
}

func (s natsort) Swap(a, b int) {
	s[a], s[b] = s[b], s[a]
}

var chunkifyRegexp = regexp.MustCompile(`(\d+|\D+)`)

func chunkify(s string) []string {
	return chunkifyRegexp.FindAllString(s, -1)
}

// Sort sorts a list of strings in a natural order
func Sort(l []string) {
	sort.Sort(natsort(l))
}

// ReverseSort sorts a list of strings in a natural decending order
func ReverseSort(l []string) {
	sort.Sort(sort.Reverse(natsort(l)))
}

// compare returns true if the first string < second (natsort order) e.g. 1.1.1 < 1.11
func Compare(a, b string) bool {
	chunksA := chunkify(a)
	chunksB := chunkify(b)

	nChunksA := len(chunksA)
	nChunksB := len(chunksB)

	for i := range chunksA {
		if i >= nChunksB {
			return false
		}

		aInt, aErr := strconv.Atoi(chunksA[i])
		bInt, bErr := strconv.Atoi(chunksB[i])

		// If both chunks are numeric, compare them as integers
		if aErr == nil && bErr == nil {
			if aInt == bInt {
				if i == nChunksA-1 {
					// We reached the last chunk of A, thus B is greater than A
					return true
				} else if i == nChunksB-1 {
					// We reached the last chunk of B, thus A is greater than B
					return false
				}

				continue
			}

			return aInt < bInt
		}

		// So far both strings are equal, continue to next chunk
		if chunksA[i] == chunksB[i] {
			if i == nChunksA-1 {
				// We reached the last chunk of A, thus B is greater than A
				return true
			} else if i == nChunksB-1 {
				// We reached the last chunk of B, thus A is greater than B
				return false
			}

			continue
		}

		return chunksA[i] < chunksB[i]
	}

	return false
}
