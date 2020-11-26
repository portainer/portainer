package cli

import (
	"log"

	portainer "github.com/portainer/portainer/api"
	rbacv1 "k8s.io/api/rbac/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type (
	k8sRoleSet struct {
		k8sClusterRoles []portainer.K8sRole
		k8sRoles        []portainer.K8sRole
	}

	k8sRoleConfig struct {
		isSystem bool
		rules    []rbacv1.PolicyRule
	}
)

func getPortainerK8sRoleMapping() map[portainer.RoleID]k8sRoleSet {
	return map[portainer.RoleID]k8sRoleSet{
		portainer.RoleIDEndpointAdmin: k8sRoleSet{
			k8sClusterRoles: []portainer.K8sRole{
				portainer.K8sRoleClusterAdmin,
			},
		},
		portainer.RoleIDHelpdesk: k8sRoleSet{
			k8sClusterRoles: []portainer.K8sRole{
				portainer.K8sRolePortainerHelpdesk,
			},
			k8sRoles: []portainer.K8sRole{
				portainer.K8sRolePortainerView,
			},
		},
		portainer.RoleIDStandardUser: k8sRoleSet{
			k8sClusterRoles: []portainer.K8sRole{
				portainer.K8sRolePortainerBasic,
			},
			k8sRoles: []portainer.K8sRole{
				portainer.K8sRolePortainerEdit,
				portainer.K8sRolePortainerView,
			},
		},
		portainer.RoleIDReadonly: k8sRoleSet{
			k8sClusterRoles: []portainer.K8sRole{
				portainer.K8sRolePortainerBasic,
			},
			k8sRoles: []portainer.K8sRole{
				portainer.K8sRolePortainerView,
			},
		},
	}
}

func getPortainerDefaultK8sRoles() map[portainer.K8sRole]k8sRoleConfig {
	return map[portainer.K8sRole]k8sRoleConfig{
		portainer.K8sRoleClusterAdmin: k8sRoleConfig{
			isSystem: true,
		},
		portainer.K8sRolePortainerBasic: k8sRoleConfig{
			isSystem: false,
			rules: []rbacv1.PolicyRule{
				{
					Verbs:     []string{"list"},
					Resources: []string{"namespaces", "nodes"},
					APIGroups: []string{""},
				},
				{
					Verbs:     []string{"list"},
					Resources: []string{"storageclasses"},
					APIGroups: []string{"storage.k8s.io"},
				},
				{
					Verbs:     []string{"list"},
					Resources: []string{"ingresses"},
					APIGroups: []string{"networking.k8s.io"},
				},
			},
		},
		portainer.K8sRolePortainerHelpdesk: k8sRoleConfig{
			isSystem: false,
			rules: []rbacv1.PolicyRule{
				{
					Verbs:     []string{"get", "list", "watch"},
					Resources: []string{"componentstatuses", "endpoints", "events", "namespaces", "nodes"},
					APIGroups: []string{""},
				},
				{
					Verbs:     []string{"get", "list", "watch"},
					Resources: []string{"storageclasses"},
					APIGroups: []string{"storage.k8s.io"},
				},
				{
					Verbs:     []string{"get", "list", "watch"},
					Resources: []string{"ingresses"},
					APIGroups: []string{"networking.k8s.io"},
				},
			},
		},
		portainer.K8sRolePortainerEdit: k8sRoleConfig{
			isSystem: false,
			rules: []rbacv1.PolicyRule{
				{
					Verbs:     []string{"create", "delete", "deletecollection", "patch", "update"},
					Resources: []string{"configmaps", "endpoints", "persistentvolumeclaims", "pods", "pods/attach", "pods/exec", "pods/portforward", "pods/proxy", "replicationcontrollers", "replicationcontrollers/scale", "secrets", "serviceaccounts", "services", "services/proxy"},
					APIGroups: []string{""},
				},
				{
					Verbs:     []string{"get", "list", "watch"},
					Resources: []string{"pods/attach", "pods/exec", "pods/portforward", "pods/proxy", "secrets", "services/proxy"},
					APIGroups: []string{""},
				},
				{
					Verbs:     []string{"create", "delete", "deletecollection", "patch", "update"},
					Resources: []string{"daemonsets", "deployments", "deployments/rollback", "deployments/scale", "replicasets", "replicasets/scale", "statefulsets", "statefulsets/scale"},
					APIGroups: []string{"apps"},
				},
				{
					Verbs:     []string{"create", "delete", "deletecollection", "patch", "update"},
					Resources: []string{"horizontalpodautoscalers"},
					APIGroups: []string{"autoscaling"},
				},
				{
					Verbs:     []string{"create", "delete", "deletecollection", "patch", "update"},
					Resources: []string{"cronjobs", "jobs"},
					APIGroups: []string{"batch"},
				},
				{
					Verbs:     []string{"create", "delete", "deletecollection", "patch", "update"},
					Resources: []string{"daemonsets", "deployments", "deployments/rollback", "deployments/scale", "ingresses", "networkpolicies", "replicasets", "replicasets/scale", "replicationcontrollers/scale"},
					APIGroups: []string{"extensions"},
				},
				{
					Verbs:     []string{"create", "delete", "deletecollection", "patch", "update"},
					Resources: []string{"ingresses", "networkpolicies"},
					APIGroups: []string{"networking.k8s.io"},
				},
				{
					Verbs:     []string{"create", "delete", "deletecollection", "patch", "update"},
					Resources: []string{"poddisruptionbudgets"},
					APIGroups: []string{"policy"},
				},
			},
		},
		portainer.K8sRolePortainerView: k8sRoleConfig{
			isSystem: false,
			rules: []rbacv1.PolicyRule{
				{
					Verbs:     []string{"get", "list", "watch"},
					Resources: []string{"bindings", "componentstatuses", "configmaps", "endpoints", "events", "limitranges", "namespaces", "namespaces/status", "persistentvolumeclaims", "persistentvolumeclaims/status", "pods", "pods/log", "pods/status", "replicationcontrollers", "replicationcontrollers/scale", "replicationcontrollers/status", "resourcequotas", "resourcequotas/status", "secrets", "serviceaccounts", "services", "services/status"},
					APIGroups: []string{""},
				},
				{
					Verbs:     []string{"get", "list", "watch"},
					Resources: []string{"controllerrevisions", "daemonsets", "daemonsets/status", "deployments", "deployments/scale", "deployments/status", "replicasets", "replicasets/scale", "replicasets/status", "statefulsets", "statefulsets/scale", "statefulsets/status"},
					APIGroups: []string{"apps"},
				},
				{
					Verbs:     []string{"get", "list", "watch"},
					Resources: []string{"horizontalpodautoscalers", "horizontalpodautoscalers/status"},
					APIGroups: []string{"autoscaling"},
				},
				{
					Verbs:     []string{"get", "list", "watch"},
					Resources: []string{"cronjobs", "cronjobs/status", "jobs", "jobs/status"},
					APIGroups: []string{"batch"},
				},
				{
					Verbs:     []string{"get", "list", "watch"},
					Resources: []string{"daemonsets", "daemonsets/status", "deployments", "deployments/scale", "deployments/status", "ingresses", "ingresses/status", "networkpolicies", "replicasets", "replicasets/scale", "replicasets/status", "replicationcontrollers/scale"},
					APIGroups: []string{"extensions"},
				},
				{
					Verbs:     []string{"get", "list", "watch"},
					Resources: []string{"ingresses", "ingresses/status", "networkpolicies"},
					APIGroups: []string{"networking.k8s.io"},
				},
				{
					Verbs:     []string{"get", "list", "watch"},
					Resources: []string{"poddisruptionbudgets", "poddisruptionbudgets/status"},
					APIGroups: []string{"policy"},
				},
			},
		},
	}
}

// create all portainer k8s roles (cluster and non-cluster)
func (kcl *KubeClient) createPortainerK8sClusterRoles() error {
	for roleName, roleConfig := range getPortainerDefaultK8sRoles() {
		// skip the system roles
		if roleConfig.isSystem {
			continue
		}
		log.Printf("[DEBUG][RBAC] creating cluster role %s", roleName)
		// creates roles as available across cluster.
		// NOTE: the roles API are namespaced, thus use the clusterRoles instead.
		clusterRole := &rbacv1.ClusterRole{
			ObjectMeta: metav1.ObjectMeta{
				Name: string(roleName),
			},
			Rules: roleConfig.rules,
		}
		_, err := kcl.cli.RbacV1().ClusterRoles().Create(clusterRole)
		// ignore error if role exists
		if err != nil && !k8serrors.IsAlreadyExists(err) {
			return err
		}
	}

	return nil
}

// remove all existing role bindings for a service account
func (kcl *KubeClient) removeRoleBindings(
	serviceAccountName string,
) error {
	namespaces, err := kcl.GetNamespaces()
	if err != nil {
		return err
	}
	for ns := range namespaces {
		err := kcl.removeRoleBinding(serviceAccountName, ns)
		if err != nil {
			return err
		}
	}
	return nil
}

// remove a namespace binding for a service account
func (kcl *KubeClient) removeRoleBinding(
	serviceAccountName,
	namespace string,
) error {
	log.Printf("[DEBUG][RBAC] removing role binding of sa %s in %s", serviceAccountName, namespace)
	rbList, err := kcl.cli.RbacV1().RoleBindings(namespace).List(metav1.ListOptions{})
	if k8serrors.IsNotFound(err) {
		return nil
	} else if err != nil {
		return err
	}
	for _, rb := range rbList.Items {
		for i, subject := range rb.Subjects {
			// match the role binding based on its subject and its name
			if subject.Kind == "ServiceAccount" &&
				subject.Name == serviceAccountName &&
				subject.Namespace == portainerNamespace &&
				matchRoleBindingName(rb.Name, namespace, kcl.instanceID) {
				log.Printf("[DEBUG][RBAC] found role binding %s for sa %s", rb.Name, serviceAccountName)
				// swap out the element for deletion
				rb.Subjects[i] = rb.Subjects[len(rb.Subjects)-1]
				rb.Subjects = rb.Subjects[:len(rb.Subjects)-1]
				kcl.cli.RbacV1().RoleBindings(namespace).Update(&rb)
				break
			}
		}
	}
	return nil
}

// create role binding for a service account
func (kcl *KubeClient) createRoleBinding(
	serviceAccountName,
	k8sRole string,
	namespace string,
	isClusterRole bool,
) error {
	roleBindingName := namespaceRoleBindingName(k8sRole, namespace, kcl.instanceID)
	log.Printf("[DEBUG][RBAC] creating role binding of sa %s to %s in %s", serviceAccountName, k8sRole, namespace)
	// try find the role binding
	roleBinding, err := kcl.cli.RbacV1().RoleBindings(namespace).Get(roleBindingName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		roleKind := "Role"
		if isClusterRole {
			roleKind = "ClusterRole"
		}
		// create the rolebinding if not exist
		roleBinding = &rbacv1.RoleBinding{
			ObjectMeta: metav1.ObjectMeta{
				Name: roleBindingName,
			},
			Subjects: []rbacv1.Subject{
				{
					Kind:      "ServiceAccount",
					Name:      serviceAccountName,
					Namespace: portainerNamespace,
				},
			},
			RoleRef: rbacv1.RoleRef{
				Kind: roleKind,
				Name: k8sRole,
			},
		}

		_, err = kcl.cli.RbacV1().RoleBindings(namespace).Create(roleBinding)
		return err
	} else if err != nil {
		return err
	}

	for _, subject := range roleBinding.Subjects {
		if subject.Kind == "ServiceAccount" &&
			subject.Name == serviceAccountName &&
			subject.Namespace == portainerNamespace {
			// stops if the service account is already bound
			return nil
		}
	}

	roleBinding.Subjects = append(roleBinding.Subjects, rbacv1.Subject{
		Kind:      "ServiceAccount",
		Name:      serviceAccountName,
		Namespace: portainerNamespace,
	})
	log.Printf("[DEBUG][RBAC] updating role binding of sa %s to %s in %s", serviceAccountName, k8sRole, namespace)

	// update the role binding to include the service account
	_, err = kcl.cli.RbacV1().RoleBindings(namespace).Update(roleBinding)
	return err
}

// remove all existing cluster role bindings for a service account
func (kcl *KubeClient) removeClusterRoleBindings(
	serviceAccountName string,
) error {
	log.Printf("[DEBUG][RBAC] removing all cluster binding for sa %s", serviceAccountName)
	crbList, err := kcl.cli.RbacV1().ClusterRoleBindings().List(metav1.ListOptions{})
	if err != nil {
		return err
	}
	for _, crb := range crbList.Items {
		for i, subject := range crb.Subjects {
			// match the cluster role binding based on its subject and its name
			if subject.Kind == "ServiceAccount" &&
				subject.Name == serviceAccountName &&
				subject.Namespace == portainerNamespace &&
				matchClusterRoleBindingName(crb.Name, kcl.instanceID) {
				log.Printf("[DEBUG][RBAC] found cluster binding %s for sa %s", crb.Name, serviceAccountName)
				// swap out the element for deletion
				crb.Subjects[i] = crb.Subjects[len(crb.Subjects)-1]
				crb.Subjects = crb.Subjects[:len(crb.Subjects)-1]
				kcl.cli.RbacV1().ClusterRoleBindings().Update(&crb)
				break
			}
		}
	}
	return nil
}

// create or update the cluster role bindings related to a service account
func (kcl *KubeClient) createClusterRoleBindings(serviceAccountName string,
	k8sRole string) error {
	log.Printf("[DEBUG][RBAC] creating cluster binding for sa %s to %s", serviceAccountName, k8sRole)
	crbName := clusterRoleBindingName(k8sRole, kcl.instanceID)
	clusterRoleBinding, err := kcl.cli.RbacV1().ClusterRoleBindings().
		Get(crbName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		clusterRoleBinding = &rbacv1.ClusterRoleBinding{
			ObjectMeta: metav1.ObjectMeta{
				Name: crbName,
			},
			Subjects: []rbacv1.Subject{
				{
					Kind:      "ServiceAccount",
					Name:      serviceAccountName,
					Namespace: portainerNamespace,
				},
			},
			RoleRef: rbacv1.RoleRef{
				Kind: "ClusterRole",
				Name: k8sRole,
			},
		}

		_, err := kcl.cli.RbacV1().ClusterRoleBindings().Create(clusterRoleBinding)
		return err
	} else if err != nil {
		return err
	}

	// if the current cluster role binding already has the desired subject, skip it
	for _, subject := range clusterRoleBinding.Subjects {
		if subject.Kind == "ServiceAccount" &&
			subject.Name == serviceAccountName &&
			subject.Namespace == portainerNamespace {
			return nil
		}
	}

	// otherwise append the subject to the cluster role binding
	clusterRoleBinding.Subjects = append(clusterRoleBinding.Subjects, rbacv1.Subject{
		Kind:      "ServiceAccount",
		Name:      serviceAccountName,
		Namespace: portainerNamespace,
	})
	log.Printf("[DEBUG][RBAC] updating cluster binding for sa %s to %s", serviceAccountName, k8sRole)

	_, err = kcl.cli.RbacV1().ClusterRoleBindings().Update(clusterRoleBinding)
	return err
}
