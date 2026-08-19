import { Alert } from '@@/Alert';

export function RBACAlert() {
  return (
    <Alert color="warn" className="mb-4">
      <div className="flex flex-col">
        <p>
          Your cluster does not have Kubernetes role-based access control (RBAC)
          enabled.
        </p>
        <p>
          This means you can&apos;t use Portainer RBAC functionality to regulate
          access to environment resources based on user roles.
        </p>
        <p className="mb-0">
          To enable RBAC, start the&nbsp;
          <a
            className="th-highcontrast:text-blue-4 th-dark:text-blue-7"
            href="https://kubernetes.io/docs/concepts/overview/components/#kube-apiserver"
            target="_blank"
            rel="noreferrer"
          >
            API server
          </a>
          &nbsp;with the&nbsp;
          <code className="bg-gray-4 box-decoration-clone th-highcontrast:bg-black th-dark:bg-black">
            --authorization-mode
          </code>
          &nbsp;flag set to a comma-separated list that includes&nbsp;
          <code className="bg-gray-4 th-highcontrast:bg-black th-dark:bg-black">
            RBAC
          </code>
          , for example:&nbsp;
          <code className="bg-gray-4 box-decoration-clone th-highcontrast:bg-black th-dark:bg-black">
            kube-apiserver --authorization-mode=Example1,RBAC,Example2
          </code>
          .
        </p>
      </div>
    </Alert>
  );
}
