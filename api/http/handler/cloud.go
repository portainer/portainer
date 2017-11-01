package handler

import (
	"fmt"
	"errors"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/security"

	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ec2"
)

// CloudHandler represents an HTTP API handler for proxying requests to the cloud provider's API.
type CloudHandler struct {
	*mux.Router
	Logger                *log.Logger
	EndpointService       portainer.EndpointService
	TeamMembershipService portainer.TeamMembershipService
	ProxyManager          *proxy.CloudManager
}

// NewCloudHandler returns a new instance of CloudHandler.
func NewCloudHandler(bouncer *security.RequestBouncer) *CloudHandler {
	h := &CloudHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}

	h.PathPrefix("/{id}/cloud/{resource}/{resource_id}/{action}").Handler(
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.proxyRequestsToCloudAPI)))

	return h
}

func (handler *CloudHandler) checkEndpointAccessControl(endpoint *portainer.Endpoint, userID portainer.UserID) bool {
	for _, authorizedUserID := range endpoint.AuthorizedUsers {
		if authorizedUserID == userID {
			return true
		}
	}

	memberships, _ := handler.TeamMembershipService.TeamMembershipsByUserID(userID)
	for _, authorizedTeamID := range endpoint.AuthorizedTeams {
		for _, membership := range memberships {
			if membership.TeamID == authorizedTeamID {
				return true
			}
		}
	}
	return false
}

func (handler *CloudHandler) proxyRequestsToCloudAPI(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	resource := vars["resource"]
	resource_id := vars["resource_id"]
	action := vars["action"]

	if resource_id == "" {
	    httperror.WriteErrorResponse(w, errors.New("Invalid resource ID"), http.StatusInternalServerError, handler.Logger)
		return
	}
	if action == "" {
	    httperror.WriteErrorResponse(w, errors.New("Missing resource action"), http.StatusInternalServerError, handler.Logger)
		return
	}
	if resource == "" {
	    httperror.WriteErrorResponse(w, errors.New("Missing resource type"), http.StatusInternalServerError, handler.Logger)
		return
	}

	log.Println("Called proxyRequestsToCloudNodeAPI with id " + id + ", resource " + resource + ", resource_id " + resource_id + ", action " + action)

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	//&& !handler.checkEndpointAccessControl(endpoint, tokenData.ID)
	if tokenData.Role != portainer.AdministratorRole {
		httperror.WriteErrorResponse(w, portainer.ErrEndpointAccessDenied, http.StatusForbidden, handler.Logger)
		return
	}

	// TODO: define external gateway
	// TODO: hard-coded to AWS SDK
    sess := session.Must(session.NewSessionWithOptions(session.Options{
        SharedConfigState: session.SharedConfigEnable,
    }))

    if resource == "node" {
        // Create new EC2 client
        ec2Svc := ec2.New(sess)

        result, err := ec2Svc.DescribeInstances(nil)
        if err != nil {
            log.Fatal(err)
        } else {
            log.Println("Success", result)
        }

        var resource_instance *ec2.Instance
        for _, reservation := range result.Reservations {
            for _, instance := range reservation.Instances {
                for _, networkInterface := range instance.NetworkInterfaces {
                    if *networkInterface.PrivateIpAddress == resource_id {
                        resource_instance = instance
                    }
                }
                //fmt.Println(*instance.InstanceId)
                if resource_instance != nil {
                    break
                }
            }
            if resource_instance != nil {
                break
            }
        }

        if resource_instance == nil {
            httperror.WriteErrorResponse(w, errors.New("Node " + resource_id + " could not be found to " + action), http.StatusInternalServerError, handler.Logger)
            return
        }

        if action == "start" {
            input := &ec2.StartInstancesInput{
                InstanceIds: []*string{
                    aws.String(*resource_instance.InstanceId),
                },
                DryRun: aws.Bool(true),
            }
            result, err := ec2Svc.StartInstances(input)
            awsErr, ok := err.(awserr.Error)

            if ok && awsErr.Code() == "DryRunOperation" {
                input.DryRun = aws.Bool(false)
                result, err = ec2Svc.StartInstances(input)
                if err != nil {
                    httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
                    return
                } else {
                    fmt.Println("Success", result)
                }
            } else { // This could be due to a lack of permissions
                httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
                return
            }
        } else if action == "stop" {
            input := &ec2.StopInstancesInput{
                InstanceIds: []*string{
                    aws.String(*resource_instance.InstanceId),
                },
                DryRun: aws.Bool(true),
            }
            result, err := ec2Svc.StopInstances(input)
            awsErr, ok := err.(awserr.Error)

            if ok && awsErr.Code() == "DryRunOperation" {
                input.DryRun = aws.Bool(false)
                result, err = ec2Svc.StopInstances(input)
                if err != nil {
                    httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
                    return
                } else {
                    fmt.Println("Success", result)
                }
            } else { // This could be due to a lack of permissions
                httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
                return
            }
        } else {
            httperror.WriteErrorResponse(w, errors.New("Unknown node action: " + action), http.StatusInternalServerError, handler.Logger)
            return
        }
    } else {
        httperror.WriteErrorResponse(w, errors.New("Unknown resource type: " + resource), http.StatusInternalServerError, handler.Logger)
        return
    }
}
