#!/bin/sh

cd cypress/integration; mkdir rbac; cd rbac 

for platform in "Docker Swarm" "Docker Standalone" "Kubernetes" "Kubernetes"
    do
        for connectionType in 'Local' 'Agent' 'Edge Agent'
            do
                for resource in 'Endpoint' 'Endpoint Group'
                    do
                        for authType in 'Internal' 'Oauth'
                            do
                                for role in 'Endpoint administrator' 'Helpdesk' 'Standard user' 'Read-only user'
                                    do
                                        yarn plop rbacTest "Full" "$platform" "$connectionType" "$resource" "$authType" "$role"
                                    done
                            done
                    done
            done
    done
