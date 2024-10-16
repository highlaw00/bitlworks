import numpy as np

from PIL import Image
import onnxruntime as ort
import json
import cgi
import io

MODEL_PATH = "../v8-model.onnx"
model = ort.InferenceSession(MODEL_PATH)

ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg'])

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def inference(img):
    img_width, img_height = img.size 
    img = img.convert("RGB")
    img_resized = img.resize((640, 640))

    input_img = np.array(img_resized)
    input_img = input_img.transpose(2, 0, 1) 
    input_img = input_img.reshape(1, 3, 640, 640).astype("float32")
    input_img = input_img / 255.0 

    outputs = model.run(None, {"input": input_img})
    output0 = outputs[0]

    result = dict()

    for idx, row in enumerate(output0):
        x1, y1, x2, y2, conf, class_id = row[:6]

        if conf > 0.5:
            x1 = int(x1 / 640 * img_width)
            y1 = int(y1 / 640 * img_height)
            x2 = int(x2 / 640 * img_width)
            y2 = int(y2 / 640 * img_height)

            label = "human" if class_id == 0 else "head"
            obj = {
                "xMax": max(x1, x2), "xMin": min(x1, x2), "yMax": max(y1, y2), "yMin": min(y1, y2),
                "label": label, "conf": conf.item(), "class_id": int(class_id.item())
            }
            result[idx] = obj

    return result

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
                result = inference(image)
                status = '200 OK'
                response_body = json.dumps(result).encode('utf-8')
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
