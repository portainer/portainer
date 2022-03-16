#!/bin/bash

# very much just copied from https://lemariva.com/blog/2019/12/portainer-managing-docker-engine-remotely
# production use should involve a real external certificate management system

export HOST=portainer.p1.alho.st
export CERTDIR=~/.config/portainer/certs/

mkdir -p ${CERTDIR}
cd ${CERTDIR}
echo "Generating example mTLS certs into $(pwd)"

if [[ ! -f "ca.pem" ]]; then
    echo "Generate the CA Cert"
    openssl genrsa -aes256 -out ca-key.pem 4096
    # enter a pass phrase to protect the ca-key

    openssl req -new -x509 -days 365 -key ca-key.pem -sha256 -out ca.pem
else
    echo "ca.pem ca cert already exists"
fi

if [[ ! -f "server-cert.pem" ]]; then
    echo "Generate the Portainer server cert"
    openssl genrsa -out server-key.pem 4096

    openssl req -subj "/CN=$HOST" -sha256 -new -key server-key.pem -out server.csr
    echo subjectAltName = DNS:$HOST,IP:10.0.0.200,IP:127.0.0.1,IP:10.10.10.189 >> extfile.cnf
    echo extendedKeyUsage = serverAuth >> extfile.cnf

    openssl x509 -req -days 365 -sha256 -in server.csr -CA ca.pem -CAkey ca-key.pem \
    -CAcreateserial -out server-cert.pem -extfile extfile.cnf
else
    echo "server-cert.pem ca cert already exists"
fi

if [[ ! -f "agent-cert.pem" ]]; then
    echo "Generate an Agent cert"
    openssl genrsa -out agent-key.pem 4096

    openssl req -subj '/CN=client' -new -key agent-key.pem -out agent-client.csr
    echo extendedKeyUsage = clientAuth > agent-extfile.cnf

    openssl x509 -req -days 365 -sha256 -in agent-client.csr -CA ca.pem -CAkey ca-key.pem \
    -CAcreateserial -out agent-cert.pem -extfile agent-extfile.cnf
else
    echo "agent-cert.pem ca cert already exists"
fi

echo "done: Generated example mTLS certs into $(pwd)"
