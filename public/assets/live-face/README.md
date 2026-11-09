# Local expression tracking assets

Room 03 uses the FaceCap expression rig from the official Three.js webcam morph-target example:
https://threejs.org/examples/webgl_morphtargets_webcam.html
The example credits FaceCap by Bannaflak: https://www.bannaflak.com/face-cap/
Keep this attribution when distributing these example assets; review the original asset terms before commercial distribution.

`facecap.glb` is the original example model, with its expression targets preserved.
`basis/` contains the Three.js KTX2 transcoder (see the Three.js MIT license).
`wasm/` contains MediaPipe Tasks Vision 0.10.35 runtime files (Apache-2.0).
`face_landmarker.task` is Google's official Face Landmarker float16 model.
https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js

All inference and camera frames stay in the browser. The camera is requested only
after START CAMERA, and its video tracks are stopped on STOP CAMERA, room exit,
page hiding or scene disposal. No camera images are uploaded or stored.
