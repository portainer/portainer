// Copyright 2013 M-Lab
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// The digest package provides an implementation of http.RoundTripper that takes
// care of HTTP Digest Authentication (http://www.ietf.org/rfc/rfc2617.txt).
// This only implements the MD5 and "auth" portions of the RFC, but that covers
// the majority of avalible server side implementations including apache web
// server.
//

package digest

import (
	"fmt"
	"testing"
)

var cred = &credentials{
	Username:   "Mufasa",
	Realm:      "testrealm@host.com",
	Nonce:      "dcd98b7102dd2f0e8b11d0f600bfb0c093",
	DigestURI:  "/dir/index.html",
	Algorithm:  "MD5",
	Opaque:     "5ccc069c403ebaf9f0171e9517f40e41",
	MessageQop: "auth",
	method:     "GET",
	password:   "Circle Of Life",
}

var cnonce = "0a4f113b"

func TestH(t *testing.T) {
	r1 := h("Mufasa:testrealm@host.com:Circle Of Life")
	if r1 != "939e7578ed9e3c518a452acee763bce9" {
		t.Fail()
	}

	r2 := h("GET:/dir/index.html")
	if r2 != "39aff3a2bab6126f332b942af96d3366" {
		t.Fail()
	}

	r3 := h(fmt.Sprintf("%s:dcd98b7102dd2f0e8b11d0f600bfb0c093:00000001:0a4f113b:auth:%s", r1, r2))
	if r3 != "6629fae49393a05397450978507c4ef1" {
		t.Fail()
	}
}

func TestKd(t *testing.T) {
	r1 := kd("939e7578ed9e3c518a452acee763bce9",
		"dcd98b7102dd2f0e8b11d0f600bfb0c093:00000001:0a4f113b:auth:39aff3a2bab6126f332b942af96d3366")
	if r1 != "6629fae49393a05397450978507c4ef1" {
		t.Fail()
	}
}

func TestHa1(t *testing.T) {
	r1 := cred.ha1()
	if r1 != "939e7578ed9e3c518a452acee763bce9" {
		t.Fail()
	}
}

func TestHa2(t *testing.T) {
	r1 := cred.ha2()
	if r1 != "39aff3a2bab6126f332b942af96d3366" {
		t.Fail()
	}
}

func TestResp(t *testing.T) {
	r1, err := cred.resp(cnonce)
	if err != nil {
		t.Fail()
	}
	if r1 != "6629fae49393a05397450978507c4ef1" {
		t.Fail()
	}
}
