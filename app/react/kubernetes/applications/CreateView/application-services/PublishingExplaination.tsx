import ingressDiagram from '@/assets/images/ingress-explanatory-diagram.png';

import { FormSection } from '@@/form-components/FormSection';

export function PublishingExplaination() {
  return (
    <FormSection title="Explanation" isFoldable titleSize="sm">
      <div className="w-full mb-4 flex flex-col items-start lg:flex-row">
        <img
          src={ingressDiagram}
          alt="ingress explaination"
          width={646}
          className="flex w-full max-w-2xl basis-1/2 flex-col rounded border border-solid border-gray-5 object-contain lg:w-1/2"
        />
        <div className="text-muted ml-8 basis-1/2 text-xs">
          Expose the application workload via{' '}
          <a
            href="https://kubernetes.io/docs/concepts/services-networking/service/"
            target="_blank"
            rel="noopener noreferrer"
          >
            services
          </a>{' '}
          and{' '}
          <a
            href="https://kubernetes.io/docs/concepts/services-networking/ingress/"
            target="_blank"
            rel="noopener noreferrer"
          >
            ingresses
          </a>
          :
          <ul className="ml-5 mt-3 [&>li>ul>li]:ml-5 [&>li]:mb-3">
            <li>
              <b>Inside</b> the cluster{' '}
              <b>
                <i>only</i>
              </b>{' '}
              - via <b>ClusterIP</b> service
              <ul>
                <li>
                  <i>The default service type.</i>
                </li>
              </ul>
            </li>
            <li>
              <b>Inside</b> the cluster via <b>ClusterIP</b> service and{' '}
              <b>outside</b> via <b>ingress</b>
              <ul>
                <li>
                  <i>
                    An ingress manages external access to (usually ClusterIP)
                    services within the cluster, and allows defining of routing
                    rules, SSL termination and other advanced features.
                  </i>
                </li>
              </ul>
            </li>
            <li>
              <b>Inside</b> and <b>outside</b> the cluster via <b>NodePort</b>{' '}
              service
              <ul>
                <li>
                  <i>
                    This publishes the workload on a static port on each node,
                    allowing external access via a nodes&apos; IP address and
                    port. Not generally recommended for Production use.
                  </i>
                </li>
              </ul>
            </li>
            <li>
              <b>Inside</b> and <b>outside</b> the cluster via{' '}
              <b>LoadBalancer</b> service
              <ul>
                <li>
                  <i>
                    If running on a cloud platform, this auto provisions a cloud
                    load balancer and assigns an external IP address or DNS to
                    route traffic to the workload.
                  </i>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </FormSection>
  );
}
