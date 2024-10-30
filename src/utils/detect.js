import * as tf from '@tensorflow/tfjs';
import { renderBoxes } from './renderBox';

/**
 * Preprocess image / frame before forwarded into the model
 * @param {HTMLVideoElement|HTMLImageElement} source
 * @param {Number} modelWidth
 * @param {Number} modelHeight
 * @returns input tensor, xRatio and yRatio
 */
const preprocess = (source, modelWidth, modelHeight) => {
  let xRatio, yRatio; // ratios for boxes

  const input = tf.tidy(() => {
    const img = tf.browser.fromPixels(source);

    // padding image to square => [n, m] to [n, n], n > m
    const [h, w] = img.shape.slice(0, 2); // get source width and height
    const maxSize = Math.max(w, h); // get max size
    const imgPadded = img.pad([
      [0, maxSize - h], // padding y [bottom only]
      [0, maxSize - w], // padding x [right only]
      [0, 0],
    ]);

    xRatio = maxSize / w; // update xRatio
    yRatio = maxSize / h; // update yRatio

    return tf.image
      .resizeBilinear(imgPadded, [modelWidth, modelHeight]) // resize frame
      .div(255.0) // normalize
      .expandDims(0); // add batch
  });

  return [input, xRatio, yRatio];
};

// 추론 결과에서 학생 추출 여부 확인
// TODO
// 1. 박스 크기 기준으로 제약 조건 걸기
// 2. 여러명 있을 때 필터링
// 3. 움직임 감지 기능 - 부모 컴포넌트에서 제어?
const filterResult = (results) => {
  let returnValue = 'PERSON_NOT_FOUND';
  const CONSTRAINT_HEAD_SIZE = 13_000; // 전체 사진의 0.03 % 이상
  const CONSTRAINT_RATIO = 0.5; // 가로 세로 비율

  for (const key in results) {
    const result = results[key];
    const { klass, score, box } = result;
    const { x1, y1, width, height } = box;

    if (klass === 'head') {
      const headSize = width * height;
      if (headSize >= CONSTRAINT_HEAD_SIZE) {
        returnValue = 'FOUND';
      }
    } else if (klass === 'person') {
      const widthHeightRatio = width / height;

      if (widthHeightRatio > CONSTRAINT_RATIO) {
        returnValue = 'FOUND';
      }
    }
  }
  return returnValue;
};

/**
 * Function to detect image.
 * @param {HTMLImageElement} imgSource image source
 * @param {tf.GraphModel} model loaded YOLOv5 tensorflow.js model
 * @param {Number} classThreshold class threshold
 * @param {HTMLCanvasElement} canvasRef canvas reference
 */
export const detectImage = async (
  imgSource,
  model,
  classThreshold,
  canvasRef
) => {
  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3); // get model width and height

  tf.engine().startScope(); // start scoping tf engine
  const [input, xRatio, yRatio] = preprocess(
    imgSource,
    modelWidth,
    modelHeight
  );

  await model.net.executeAsync(input).then((res) => {
    const [boxes, scores, classes] = res.slice(0, 3);
    const boxes_data = boxes.dataSync();
    const scores_data = scores.dataSync();
    const classes_data = classes.dataSync();
    renderBoxes(
      canvasRef,
      classThreshold,
      boxes_data,
      scores_data,
      classes_data,
      [xRatio, yRatio]
    ); // render boxes
    tf.dispose(res); // clear memory
  });

  tf.engine().endScope(); // end of scoping
};

/**
 * Function to detect video from every source.
 * @param {HTMLVideoElement} vidSource video source
 * @param {tf.GraphModel} model loaded YOLOv5 tensorflow.js model
 * @param {Number} classThreshold class threshold
 * @param {HTMLCanvasElement} canvasRef canvas reference
 */
export const detectVideo = (
  vidSource,
  model,
  classThreshold,
  canvasRef,
  callback
) => {
  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3); // get model width and height

  /**
   * Function to detect every frame from video
   */
  const detectFrame = async () => {
    if (vidSource.videoWidth === 0 && vidSource.srcObject === null) {
      const ctx = canvasRef.getContext('2d');
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // clean canvas
      return; // handle if source is closed
    }

    tf.engine().startScope(); // start scoping tf engine
    const [input, xRatio, yRatio] = preprocess(
      vidSource,
      modelWidth,
      modelHeight
    );
    // const input = imgSource;
    // const [xRatio, yRatio] = [1, 1];

    await model.net.executeAsync(input).then((res) => {
      const [boxes, scores, classes] = res.slice(0, 3);
      const boxes_data = boxes.dataSync();
      const scores_data = scores.dataSync();
      const classes_data = classes.dataSync();
      const result = renderBoxes(
        canvasRef,
        classThreshold,
        boxes_data,
        scores_data,
        classes_data,
        [xRatio, yRatio]
      ); // render boxes

      const resultString = filterResult(result);
      callback(resultString);

      tf.dispose(res); // clear memory
    });

    requestAnimationFrame(detectFrame); // get another frame
    tf.engine().endScope(); // end of scoping
  };

  detectFrame(); // initialize to detect every frame
};
