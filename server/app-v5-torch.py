from PIL import Image
import torch
import json
import cgi
import io

MODEL_PATH = "../yolov5_pytorch/crowdhuman_yolov5m.pt"
model = torch.hub.load("../yolov5", 'custom', path=MODEL_PATH, source='local')

ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg'])

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def application(environ, start_response):
    if environ['REQUEST_METHOD'] == 'POST' and environ['PATH_INFO'] == '/upload':
        # 파일 업로드 및 추론 처리
        form = cgi.FieldStorage(fp=environ['wsgi.input'], environ=environ)
        
        if 'file' not in form:
            status = '400 Bad Request'
            response_body = b"File not included."
        else:
            fileitem = form['file']
            if not fileitem.filename:
                status = '400 Bad Request'
                response_body = b"File is empty."
            elif allowed_file(fileitem.filename):
                # 파일 처리 및 추론
                image = Image.open(io.BytesIO(fileitem.file.read()))
                result = model(image)
                response_result = result.pandas().xyxy[0].to_dict()
                status = '200 OK'
                response_body = json.dumps(response_result).encode('utf-8')
            else:
                status = '400 Bad Request'
                response_body = b"Invalid file type."
    elif environ['PATH_INFO'] == '/':
        # 루트 경로 처리
        status = '200 OK'
        response_body = b'Hello, world!'
    else:
        # 기타 경로에 대한 처리
        status = '404 Not Found'
        response_body = b'Not Found'

    headers = [('Content-type', 'application/json' if status == '200 OK' and environ['PATH_INFO'] == '/upload' else 'text/plain')]
    start_response(status, headers)
    return [response_body]

if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    httpd = make_server('', 8000, application)
    print("Serving on port 8000...")
    httpd.serve_forever()
