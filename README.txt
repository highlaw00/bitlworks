== 테라폼 시작 ==

terraform init
terraform fmt
terraform validate
terraform plan
terraform apply

== 테라폼 종료 ==

terraform destroy

== 일부 리소스만 실행 및 종료 ==

terraform apply -target="resource_name"
terraform destroy -target="resource_name"

== 도커 빌드 ==
docker build -t "image name" .
docker build -t flask-app .

== 도커 푸시 ==
docker tag flask-app:latest <url>:latest
docker push <url>:latest

== ECR 자격증명 획득 및 도커 로그인 ==
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin $(url)

