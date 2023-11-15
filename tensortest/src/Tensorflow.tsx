// MyComponent.tsx
import React, { useEffect, useRef, useState } from 'react';
// import { Webcam, drawKeypoints, drawSkeleton } from '@teachablemachine/pose';
// import { Webcam } from '@teachablemachine/pose';
// import * as posenet from '@tensorflow-models/posenet';
import * as tmPose from '@teachablemachine/pose';

// import {
//   // CustomPoseNet,
// } from '@teachablemachine/pose/dist/custom-posenet';

const Tensorflow: React.FC = () => {
  const [서있는중, set서있는중] = useState(false);
  const [앉는중, set앉는중] = useState(false);
  // const [isWalk, setIsWalk] = useState(false);

  const modelRef = useRef<tmPose.CustomPoseNet | null>(null);
  const webcamRef = useRef<tmPose.Webcam | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelContainerRef = useRef<HTMLDivElement | null>(null);
  const maxPredictionsRef = useRef<number | null>(null);

  const init = async () => {
    const URL = `/my-pose-model/`;
    const modelURL = URL + 'model.json';
    const metadataURL = URL + 'metadata.json';

    modelRef.current = await tmPose.load(modelURL, metadataURL);
    maxPredictionsRef.current = modelRef.current.getTotalClasses();

    const size = 500;
    const flip = true;

    webcamRef.current = new tmPose.Webcam(size, size, flip);
    await webcamRef.current.setup();
    await webcamRef.current.play();
    window.requestAnimationFrame(loop);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = size;
      canvas.height = size;
    }

    labelContainerRef.current = document.getElementById(
      'label-container'
    ) as HTMLDivElement;
    if (labelContainerRef.current) {
      for (let i = 0; i < maxPredictionsRef.current; i++) {
        labelContainerRef.current.appendChild(document.createElement('div'));
      }
    }
  };

  const loop = () => {
    if (webcamRef.current) {
      webcamRef.current.update();
    }
    predict();
    // drawPose();
    window.requestAnimationFrame(loop);
    // console.log(timestamp);
  };

  const predict = async () => {
    if (webcamRef.current && modelRef.current) {
      // const net = await posenet.load().then((net) => {
      //   const pose = net.estimatePoses(webcamRef.current?.canvas)
      // })

      const { pose, posenetOutput } = await modelRef.current.estimatePose(
        webcamRef.current.canvas
      );

      console.log('pose : ', pose);
      console.log('posenetOutput : ', posenetOutput);

      const predictions = await modelRef.current.predict(posenetOutput);

      if (maxPredictionsRef.current) {
        for (let i = 0; i < maxPredictionsRef.current; i++) {
          if (predictions[i].className === 'standing') {
            set서있는중(predictions[i].probability > 0.85 ? true : false);
          }
          if (predictions[i].className === 'bending') {
            set앉는중(predictions[i].probability > 0.85 ? true : false);
          }
        }
      }
      // drawPose(pose);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (webcamRef.current && canvas && ctx) {
        ctx.drawImage(webcamRef.current.canvas, 0, 0);

        // 모션을 인식해 웹캠상에서 좌표를 그리는 코드
        if (pose) {
          const minPartConfidence = 0.5;
          tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
          tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
      }
    }
  };

  // const drawPose = (pose: tmPose.CustomPoseNet) => {
  //   const canvas = canvasRef.current;
  //   const ctx = canvas?.getContext('2d');

  //   if (webcamRef.current && canvas && ctx) {
  //     ctx.drawImage(webcamRef.current.canvas, 0, 0);

  //     // 모션을 인식해 웹캠상에서 좌표를 그리는 코드
  //     if (pose) {
  //       const minPartConfidence = 0.5;
  //       tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
  //       tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
  //     }
  //   }
  // };

  useEffect(() => {
    return () => {
      if (webcamRef.current) {
        webcamRef.current.stop();
      }
    };
  }, []);

  return (
    <>
      <button
        type='button'
        onClick={() => {
          init();
          set서있는중(false);
          set앉는중(false);
        }}
      >
        Start
      </button>
      <div className='border-4 border-red-600'>
        <canvas id='canvas' ref={canvasRef}></canvas>
      </div>
      {/* <div id='label-container' ref={labelContainerRef}></div> */}
      <div>
        <p>{`서있는 중 : ${서있는중 ? 'O' : 'X'}`}</p>
        <p>{`앉아있는 중 : ${앉는중 ? 'O' : 'X'}`}</p>
        {/* <p>{`걷는 중 : ${isWalk ? 'O' : 'X'}`}</p> */}
      </div>
    </>
  );
};

export default Tensorflow;
