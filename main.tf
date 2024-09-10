terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "ap-northeast-2"
}

# IAM 역할
resource "aws_iam_role" "ec2_role" {
  name               = "ec2_ecr_role"
  assume_role_policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
        "Action": "sts:AssumeRole",
        "Principal": {
            "Service": "ec2.amazonaws.com"
        },
        "Effect": "Allow"
        }
    ]
}
EOF
}

# ECR 접근 권한 정책
resource "aws_iam_role_policy" "ecr_access_policy" {
  name = "ecr_access_policy"
  role = aws_iam_role.ec2_role.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability"
      ],
      "Effect": "Allow",
      "Resource": "*"
    },
    {
      "Action": "ecr:GetAuthorizationToken",
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

# IAM 인스턴스 프로파일 생성
resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = "ec2_instance_profile"
  role = aws_iam_role.ec2_role.name
}


resource "aws_ecr_repository" "flask_app" {
  name = "flask-app-repo"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_instance" "app_server" {
  ami                  = "ami-0023481579962abd4"
  instance_type        = "t2.micro"
  iam_instance_profile = aws_iam_instance_profile.ec2_instance_profile.name

  user_data = <<EOT
#!/bin/bash
# Docker 설치
yum update -y
yum install -y docker
service docker start
usermod -aG docker ec2-user

aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin ${aws_ecr_repository.flask_app.repository_url}

# ECR에서 Docker 이미지 Pull
docker pull ${aws_ecr_repository.flask_app.repository_url}:latest

# Docker 컨테이너 실행
docker run -d -p 80:5000 ${aws_ecr_repository.flask_app.repository_url}:latest
EOT


  tags = {
    Name = "ExampleAppServerInstance"
  }
}
