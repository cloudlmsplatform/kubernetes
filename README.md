# Kubernetes & Amazon EKS Practical Command Reference

This README is a practical command reference for the Kubernetes and Amazon EKS exercises we have been performing.

> Replace values such as `<pod-name>`, `<namespace>`, `<cluster-name>`, `<region>`, and `<image>` with your actual values.
>
> **Shell note:** PowerShell uses the backtick `` ` `` for multiline commands. Git Bash/Linux uses `\`. One-line commands work in both.
loadbalancer controller installation guide
https://docs.aws.amazon.com/eks/latest/userguide/lbc-manifest.html
---

## 1. Cluster and Context

```bash
kubectl version
kubectl get nodes
kubectl get nodes -o wide
kubectl describe node <node-name>
kubectl get namespaces
kubectl get ns
kubectl get all -n <namespace>

kubectl config current-context
kubectl config get-contexts
kubectl config use-context <context-name>
```

---

## 2. Pods

```bash
kubectl get pods
kubectl get pods -n <namespace>
kubectl get pods -A
kubectl get pods -o wide
kubectl get pods -n <namespace> -o wide

kubectl describe pod <pod-name> -n <namespace>

kubectl logs <pod-name> -n <namespace>
kubectl logs -f <pod-name> -n <namespace>
kubectl logs <pod-name> -c <container-name> -n <namespace>
kubectl logs <pod-name> -c <container-name> --previous -n <namespace>

kubectl exec -it <pod-name> -n <namespace> -- /bin/sh
kubectl exec -it <pod-name> -n <namespace> -- /bin/bash

kubectl run test-pod --image=nginx -n <namespace>
kubectl delete pod <pod-name> -n <namespace>
```

If a Pod belongs to a Deployment or StatefulSet, deleting it normally causes the controller to recreate it.

---

## 3. Deployments

```bash
kubectl create deployment nginx --image=nginx

kubectl get deployments
kubectl get deployment -n <namespace>
kubectl describe deployment <deployment-name>

kubectl scale deployment <deployment-name> --replicas=3

kubectl set image deployment/<deployment-name> <container-name>=<image>

kubectl rollout status deployment/<deployment-name>
kubectl rollout history deployment/<deployment-name>
kubectl rollout undo deployment/<deployment-name>
kubectl rollout restart deployment/<deployment-name>
```

---

## 4. Services

```bash
kubectl get svc
kubectl get svc -n <namespace>
kubectl describe svc <service-name>

kubectl get endpoints <service-name>
kubectl get endpointslice
kubectl get endpointslice -l kubernetes.io/service-name=<service-name>
```

Create a ClusterIP Service:

```bash
kubectl expose deployment <deployment-name> --port=80 --target-port=80
```

Create a NodePort:

```bash
kubectl expose deployment <deployment-name> --type=NodePort --port=80 --target-port=80
```

---

## 5. DNS and Service Discovery

Run a temporary DNS test Pod:

```bash
kubectl run dns-test --image=busybox:1.36 --restart=Never -it --rm -- sh
```

Inside the Pod:

```bash
nslookup kubernetes
nslookup <service-name>
nslookup <service-name>.<namespace>.svc.cluster.local
```

StatefulSet/headless-service example:

```bash
nslookup mongodb-0.mongodb.default.svc.cluster.local
nslookup mongodb-1.mongodb.default.svc.cluster.local
```

DNS pattern:

```text
<service-name>.<namespace>.svc.cluster.local
```

StatefulSet Pod DNS pattern:

```text
<pod-name>.<headless-service>.<namespace>.svc.cluster.local
```

---

## 6. ConfigMaps

```bash
kubectl create configmap app-config --from-literal=APP_ENV=dev
kubectl get configmaps
kubectl get cm
kubectl describe configmap app-config
kubectl create configmap app-config --from-file=config.properties
```

---

## 7. Secrets

```bash
kubectl create secret generic app-secret --from-literal=username=admin --from-literal=password=<password>
kubectl get secrets
kubectl describe secret app-secret
```

`kubectl describe secret` does not normally display secret values.

---

## 8. StatefulSets

```bash
kubectl get statefulsets
kubectl get sts
kubectl describe statefulset <statefulset-name>
kubectl get pods -l app=mongodb -o wide
kubectl delete pod mongodb-0
```

A StatefulSet recreates a deleted replica with its stable identity, for example:

```text
mongodb-0
mongodb-1
```

With `volumeClaimTemplates`, each replica gets its own PVC:

```text
mongodb-0 -> mongo-data-mongodb-0
mongodb-1 -> mongo-data-mongodb-1
```

---

## 9. Persistent Volumes, PVCs and StorageClasses

```bash
kubectl get pvc
kubectl get pvc -A
kubectl describe pvc <pvc-name>

kubectl get pv
kubectl describe pv <pv-name>

kubectl get storageclass
kubectl get sc
kubectl describe storageclass <storageclass-name>
```

Storage relationship:

```text
Pod
 ↓
volumeMount
 ↓
PVC
 ↓
PV
 ↓
StorageClass / provisioner
 ↓
Physical or cloud storage
```

---

## 10. EKS EBS CSI StorageClass

The StorageClass we created for EKS:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-gp3
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer
parameters:
  type: gp3
  fsType: ext4
reclaimPolicy: Delete
allowVolumeExpansion: true
```

Apply and verify:

```bash
kubectl apply -f ebs-gp3-storageclass.yaml
kubectl get storageclass
kubectl describe storageclass ebs-gp3
```

Important settings:

```text
ebs.csi.aws.com       -> AWS EBS CSI driver
gp3                   -> EBS volume type
WaitForFirstConsumer  -> provision after Pod scheduling/topology is known
Delete                -> dynamically provisioned volume is deleted with the PV lifecycle
allowVolumeExpansion  -> PVC expansion is allowed
```

---

## 11. YAML Management

```bash
kubectl apply -f file.yaml
kubectl apply -f ./manifests/
kubectl delete -f file.yaml
kubectl get <resource> <name> -o yaml
kubectl edit <resource> <name>
```

---

## 12. Labels and Selectors

```bash
kubectl get pods --show-labels
kubectl get pods -l app=mongodb
kubectl label pod <pod-name> environment=dev
kubectl label pod <pod-name> environment-
kubectl annotate pod <pod-name> example.com/owner=devops
```

---

## 13. Resource Usage

If Metrics Server is installed:

```bash
kubectl top nodes
kubectl top pods
kubectl top pods -n <namespace>
kubectl top pods --sort-by=cpu
kubectl top pods --sort-by=memory
```

---

# 14. RBAC

Check permissions:

```bash
kubectl auth can-i get pods
kubectl auth can-i create pods
kubectl auth can-i delete pods
kubectl auth can-i get pods -n dev-team
kubectl auth can-i --list
```

### Role

Example namespace-level Role:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: developer-role
  namespace: dev-team

rules:
  - apiGroups: [""]
    resources:
      - pods
      - services
    verbs:
      - get
      - list
      - watch
      - create

  - apiGroups: ["apps"]
    resources:
      - deployments
    verbs:
      - get
      - list
      - watch
```

Commands:

```bash
kubectl apply -f developer-role.yaml
kubectl get role -n dev-team
kubectl describe role developer-role -n dev-team
```

### RoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-rolebinding
  namespace: dev-team

subjects:
  - kind: Group
    name: dev-team
    apiGroup: rbac.authorization.k8s.io

roleRef:
  kind: Role
  name: developer-role
  apiGroup: rbac.authorization.k8s.io
```

Commands:

```bash
kubectl apply -f developer-rolebinding.yaml
kubectl get rolebinding -n dev-team
kubectl describe rolebinding developer-rolebinding -n dev-team
```

RBAC model:

```text
IAM identity
 ↓
EKS Access Entry
 ↓
Kubernetes group
 ↓
RoleBinding
 ↓
Role
 ↓
Namespace permissions
```

### ClusterRole / ClusterRoleBinding

```bash
kubectl get clusterroles
kubectl get clusterrolebindings
kubectl describe clusterrole <clusterrole-name>
kubectl describe clusterrolebinding <binding-name>
```

Remember:

```text
Role                -> namespace-scoped
RoleBinding         -> binds permissions in a namespace
ClusterRole         -> cluster-level RBAC object
ClusterRoleBinding  -> cluster-wide binding
```

A ClusterRole can also be referenced by a RoleBinding to grant its permissions only within one namespace.

---

# 15. EKS IAM + Access Entries

List clusters:

```bash
aws eks list-clusters
```

Describe cluster:

```bash
aws eks describe-cluster --name lmsdev --region ap-south-1
```

Get VPC ID:

```bash
aws eks describe-cluster --name lmsdev --region ap-south-1 --query "cluster.resourcesVpcConfig.vpcId" --output text
```

List access entries:

```bash
aws eks list-access-entries --cluster-name lmsdev --region ap-south-1
```

Describe access entry:

```bash
aws eks describe-access-entry --cluster-name lmsdev --principal-arn <iam-principal-arn> --region ap-south-1
```

Create an access entry with a Kubernetes group:

```bash
aws eks create-access-entry   --cluster-name lmsdev   --principal-arn <iam-principal-arn>   --type STANDARD   --kubernetes-groups dev-team   --region ap-south-1
```

---

# 16. AWS IAM Profiles

Create Raja's separate local profile without replacing the admin/default profile:

```bash
aws configure --profile raja
```

Verify:

```bash
aws sts get-caller-identity --profile raja
```

List profiles:

```bash
aws configure list-profiles
```

Use the profile:

```bash
aws eks list-clusters --profile raja
```

Update kubeconfig for Raja:

```bash
aws eks update-kubeconfig   --name lmsdev   --region ap-south-1   --profile raja   --alias lmsdev-raja
```

Switch:

```bash
kubectl config use-context lmsdev-raja
kubectl config current-context
```

Important:

```text
AWS IAM
-> authenticates AWS identity

EKS Access Entry
-> connects IAM principal to EKS/Kubernetes access and groups

Kubernetes RBAC
-> decides what the identity can do
```

---

# 17. EKS AWS Load Balancer Controller

Check controller:

```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
```

PowerShell:

```powershell
kubectl get pods -n kube-system | findstr aws-load-balancer
```

Git Bash/Linux:

```bash
kubectl get pods -n kube-system | grep aws-load-balancer
```

Logs:

```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

Describe:

```bash
kubectl describe deployment aws-load-balancer-controller -n kube-system
```

ServiceAccount:

```bash
kubectl describe serviceaccount aws-load-balancer-controller -n kube-system
```

---

## 18. AWS Load Balancer Controller IAM ServiceAccount

We used:

```bash
eksctl utils associate-iam-oidc-provider --region=ap-south-1 --cluster=lmsdev
```

Then created the IAM service account:

```bash
eksctl create iamserviceaccount   --cluster=lmsdev   --namespace=kube-system   --name=aws-load-balancer-controller   --attach-policy-arn=arn:aws:iam::531728396484:policy/AWSLoadBalancerControllerIAMPolicy   --override-existing-serviceaccounts   --region=ap-south-1   --approve
```

Verify:

```bash
kubectl describe serviceaccount aws-load-balancer-controller -n kube-system
```

The ServiceAccount is connected to an IAM role.

Simple flow:

```text
AWS Load Balancer Controller Pod
 ↓
Kubernetes ServiceAccount
 ↓
IAM Role
 ↓
AWSLoadBalancerControllerIAMPolicy
 ↓
AWS APIs
 ↓
ALB
```

---

# 19. Ingress / ALB

Get Ingress:

```bash
kubectl get ingress
kubectl get ingress -n <namespace>
```

Describe:

```bash
kubectl describe ingress lms-ingress
```

Apply:

```bash
kubectl apply -f lms-ingress.yaml
```

Example:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: lms-ingress
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  ingressClassName: alb
  rules:
    - http:
        paths:
          - path: /login
            pathType: Prefix
            backend:
              service:
                name: login-service
                port:
                  number: 3000
          - path: /payment
            pathType: Prefix
            backend:
              service:
                name: payment-service
                port:
                  number: 3000
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 3000
```

Flow:

```text
Client
 ↓
AWS ALB
 ↓
Listener :80
 ↓
Ingress rules
 ↓
Target Group
 ↓
Pod IP
 ↓
Application Pod
```

With `target-type: ip`, the ALB target groups use Pod IPs.

---

# 20. EKS EBS CSI Driver

Check CSI drivers:

```bash
kubectl get csidrivers
```

Expected in our cluster:

```text
ebs.csi.aws.com
efs.csi.aws.com
```

Check EBS CSI Pods.

PowerShell:

```powershell
kubectl get pods -n kube-system | findstr ebs-csi
```

Git Bash/Linux:

```bash
kubectl get pods -n kube-system | grep ebs-csi
```

ServiceAccount:

```bash
kubectl get serviceaccount ebs-csi-controller-sa -n kube-system
kubectl describe serviceaccount ebs-csi-controller-sa -n kube-system
```

Controller logs:

```bash
kubectl logs -n kube-system <ebs-controller-pod> -c ebs-plugin
kubectl logs -n kube-system <ebs-controller-pod> -c ebs-plugin --previous
```

---

# 21. EKS Add-ons

List:

```bash
aws eks list-addons --cluster-name lmsdev --region ap-south-1
```

Describe EBS CSI add-on:

```bash
aws eks describe-addon   --cluster-name lmsdev   --addon-name aws-ebs-csi-driver   --region ap-south-1
```

Get status:

```bash
aws eks describe-addon   --cluster-name lmsdev   --addon-name aws-ebs-csi-driver   --region ap-south-1   --query "addon.status"
```

---

# 22. Helm

```bash
helm version
helm repo add <repo-name> <repo-url>
helm repo update
helm repo list
helm list -A
helm install <release-name> <chart>
helm upgrade <release-name> <chart>
helm uninstall <release-name>
```

---

# 23. Troubleshooting

Start with:

```bash
kubectl get pods
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl get events --sort-by=.lastTimestamp
```

For a namespace:

```bash
kubectl get all -n <namespace>
kubectl get events -n <namespace> --sort-by=.lastTimestamp
```

Watch:

```bash
kubectl get pods -w
kubectl get pvc -w
kubectl get ingress -w
```

Useful describe commands:

```bash
kubectl describe pod <pod-name>
kubectl describe deployment <deployment-name>
kubectl describe service <service-name>
kubectl describe pvc <pvc-name>
kubectl describe ingress <ingress-name>
```

---

# 24. JSONPath / Node and Pod Information

```bash
kubectl get pods -o wide
kubectl get pods -o jsonpath="{.items[*].status.podIP}"
kubectl get pods -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName
kubectl get pods -o custom-columns=NAME:.metadata.name,IP:.status.podIP,NODE:.spec.nodeName
```

---

# 25. Network Testing

Run a curl test Pod:

```bash
kubectl run curl-test --image=curlimages/curl --restart=Never -it --rm -- sh
```

Inside:

```bash
curl http://frontend-service:3000
curl http://payment-service:3000/payment
curl http://login-service:3000/login
```

DNS:

```bash
nslookup frontend-service
nslookup payment-service
nslookup frontend-service.default.svc.cluster.local
```

---

# 26. Namespaces

```bash
kubectl create namespace dev-team
kubectl get namespace dev-team
kubectl delete namespace dev-team
kubectl config set-context --current --namespace=dev-team
```

---

# 27. MongoDB StatefulSet – Practical Verification

```bash
kubectl get sts
kubectl get pods -l app=mongodb -o wide
kubectl get pvc
kubectl get pv
kubectl get storageclass
```

Expected relationship:

```text
StatefulSet
 ├── mongodb-0
 │     └── PVC mongo-data-mongodb-0
 │            └── PV
 │                 └── EBS Volume
 │
 └── mongodb-1
       └── PVC mongo-data-mongodb-1
              └── PV
                   └── EBS Volume
```

Deleting a StatefulSet Pod:

```bash
kubectl delete pod mongodb-0
```

The StatefulSet recreates `mongodb-0`, and its PVC remains, so the persistent data can remain available.

---

# 28. PowerShell vs Git Bash

### PowerShell

```powershell
aws eks describe-cluster `
  --name lmsdev `
  --region ap-south-1
```

### Git Bash

```bash
aws eks describe-cluster   --name lmsdev   --region ap-south-1
```

Do not use the PowerShell backtick as the multiline character in Git Bash.

---

# 29. Quick Interview Memory

```text
Deployment
→ stateless application

StatefulSet
→ stable identity + stateful workload + per-replica storage

Service
→ stable network endpoint

Headless Service
→ ClusterIP: None + DNS-based Pod identity

PVC
→ request for storage

PV
→ Kubernetes persistent-volume resource

StorageClass
→ how storage is dynamically provisioned

CSI Driver
→ connects Kubernetes storage to an external storage system

Ingress
→ HTTP/HTTPS routing

AWS Load Balancer Controller
→ implements AWS ALB resources from Kubernetes configuration

Role
→ namespace-level permissions

RoleBinding
→ connects user/group to Role

ClusterRole
→ cluster RBAC object

ClusterRoleBinding
→ cluster-wide binding

IAM
→ AWS identity and AWS API permissions

EKS Access Entry
→ maps an AWS principal to EKS/Kubernetes access and groups
```

---

# 30. Golden Troubleshooting Method

When something fails:

```text
1. kubectl get
2. kubectl describe
3. kubectl logs
4. kubectl get events
5. Check Service / Endpoints
6. Check DNS
7. Check RBAC
8. Check AWS IAM
9. Check Security Groups / Networking
10. Fix the root cause
11. Verify again
```

Do not immediately delete and recreate resources. First identify the root cause.

---

# 31. Practical Learning Path

Recommended order:

```text
1. Pods
2. Deployments
3. Services
4. ConfigMaps
5. Secrets
6. Probes
7. Requests / Limits
8. StatefulSets
9. PV / PVC / StorageClass
10. EBS CSI on EKS
11. Ingress
12. AWS Load Balancer Controller
13. RBAC
14. HPA
15. Cluster Autoscaler / Karpenter
16. EKS Networking / VPC CNI
17. Monitoring
18. CI/CD to EKS
```

This README is intended as a reusable command sheet for the practical Kubernetes administration and EKS exercises.
