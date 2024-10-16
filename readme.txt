가상환경 구축

python3 -m venv ./venv
source venv/bin/activate

가상환경 라이브러리 다운로드
pip install -r requirements.txt
pip install -r requirements-torch.txt

YOLOv5 설치

git clone https://github.com/ultralytics/yolov5
cd yolov5
pip install -r requirements.txt

파이토치 모델 위치
server 디렉토리와 같은 레벨에 `yolov5_pytorch` 위치시키면 됩니다

애플리케이션 시작
cd server
gunicorn -w <workers you want> app-v5-torch.py:application
