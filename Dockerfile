FROM python:3.12-slim

COPY ./server /app

WORKDIR /app

RUN pip3 install -r requirements.txt
RUN pip3 install -r yolov5/requirements.txt

CMD ["python3", "-m", "flask", "run", "--host=0.0.0.0"]