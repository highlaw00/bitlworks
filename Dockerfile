FROM python:3.12-slim

COPY ./server /app

WORKDIR /app

RUN pip3 install -r torch-requirements.txt
RUN pip3 install -r requirements.txt
RUN pip3 install -r yolov5/requirements.txt

# RUN pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN apt-get update
RUN apt-get install -y libgl1-mesa-glx
RUN apt-get install -y libglib2.0-0

CMD ["python3", "-m", "flask", "run", "--host=0.0.0.0"]