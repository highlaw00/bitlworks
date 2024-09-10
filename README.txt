== 테라폼 시작 ==

terraform init
terraform fmt
terraform validate
terraform plan
terraform apply

== 테라폼 종료 ==

terraform destroy

== 일부 리소스만 실행 및 종료 ==

terraform init -target="resource_name"
terraform destroy -target="resource_name"

== 도커 빌드 ==
docker build -t "image name" .
docker build -t flask-app .

== 도커 푸시
docker tag flask-app:latest <url>:latest
docker push <url>:latest