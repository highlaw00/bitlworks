from flask import Flask, request
from werkzeug.utils import secure_filename
import torch
from PIL import Image

UPLOAD_FOLDER = "/app/assets"
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg'])

model = torch.hub.load("./yolov5", 'custom', path='./custom_yolo.pt', source='local')

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def hello():
    return 'Hello, World!'

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods = ['POST'])
def upload():
    if request.method == 'POST':
        if 'file' not in request.files:
            return "File not included."
        file = request.files['file']
        if file.filename == '':
            return "File is empty."

        if file and allowed_file(file.filename):
            #TODO: inference!
            filename = secure_filename(file.filename)
            img = Image.open(file)
            result = model(img)
            return filename


if __name__ == '__main__':
    app.run()