#!/bin/bash
# M346 Setup-Skript – in der Debian VM ausfuehren
set -e

echo "=== 1. Docker pruefen ==="
docker --version || { echo "Docker nicht gefunden! Installiere Docker zuerst."; exit 1; }

echo "=== 2. Minikube installieren (falls nicht vorhanden) ==="
if ! command -v minikube &> /dev/null; then
  curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
  sudo install minikube-linux-amd64 /usr/local/bin/minikube
  rm minikube-linux-amd64
fi
minikube version

echo "=== 3. kubectl installieren (falls nicht vorhanden) ==="
if ! command -v kubectl &> /dev/null; then
  curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
  sudo install kubectl /usr/local/bin/kubectl
  rm kubectl
fi
kubectl version --client

echo "=== 4. Minikube starten ==="
minikube start --driver=docker

echo "=== 5. Docker-Images bauen (direkt in Minikube) ==="
eval $(minikube docker-env)
docker build -t m346-frontend:latest ./frontend
docker build -t m346-backend:latest ./backend

echo "=== 6. Kubernetes deployen ==="
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

echo "=== 7. Warten bis alles laeuft ==="
kubectl wait --for=condition=ready pod -l app=postgres -n m346 --timeout=120s
kubectl wait --for=condition=ready pod -l app=backend  -n m346 --timeout=120s
kubectl wait --for=condition=ready pod -l app=frontend -n m346 --timeout=120s

echo ""
echo "=== Fertig! ==="
echo "URL: $(minikube service frontend-service -n m346 --url)"
