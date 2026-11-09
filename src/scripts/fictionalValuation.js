export const VIRTUAL_SCORE_GROUPS = [
  {key:'features',label:'Facial features'},
  {key:'contour',label:'Face shape and proportions'},
  {key:'surface',label:'Hair and skin details'},
  {key:'camera',label:'Expression and camera presence'},
];

export const VIRTUAL_SCORE_METRICS = [
  {key:'eyebrows',group:'features',label:'Eyebrows',detail:'The outline and arrangement of the eyebrows.',min:58,max:88,saleSummary:true},
  {key:'eyes',group:'features',label:'Eye contour',detail:'The visible shape of the upper and lower eyelids.',min:55,max:87},
  {key:'nose',group:'features',label:'Nose',detail:'The outline of the nose tip and nostrils.',min:56,max:86,saleSummary:true},
  {key:'lips',group:'features',label:'Lip contour',detail:'The outline of the upper and lower lips.',min:54,max:87},
  {key:'browArch',group:'features',label:'Eyebrow arch',detail:'The curve from the brow head to the brow tail.',min:54,max:86},
  {key:'eyeSpacing',group:'features',label:'Eye spacing',detail:'The distance between the eyes in the portrait.',min:56,max:86},
  {key:'noseBridge',group:'features',label:'Nose bridge contour',detail:'The visible line from the bridge to the nose tip.',min:55,max:87},
  {key:'mouthCorners',group:'features',label:'Mouth corner curve',detail:'The upward or downward curve at the mouth corners.',min:52,max:86},
  {key:'forehead',group:'contour',label:'Forehead proportion',detail:'The space between the eyebrows and the hairline.',min:55,max:86},
  {key:'cheeks',group:'contour',label:'Cheek contour',detail:'The visible fullness and outline of the cheeks.',min:54,max:87},
  {key:'cheekbones',group:'contour',label:'Cheekbone contour',detail:'The outline below the outer corners of the eyes.',min:53,max:86},
  {key:'jawline',group:'contour',label:'Jawline definition',detail:'The visible edge from the ears towards the chin.',min:54,max:88},
  {key:'chin',group:'contour',label:'Chin contour',detail:'The shape and curve at the bottom of the face.',min:55,max:86},
  {key:'faceRatio',group:'contour',label:'Face length and width',detail:'The relationship between face height and width.',min:56,max:87},
  {key:'featureSpacing',group:'contour',label:'Feature spacing',detail:'The arrangement of the eyes, nose and mouth.',min:56,max:88},
  {key:'faceBalance',group:'contour',label:'Left-right balance',detail:'The visible balance between both sides of the face.',min:55,max:87},
  {key:'hair',group:'surface',label:'Hair',detail:'The hairstyle and outline around the face.',min:55,max:88,saleSummary:true},
  {key:'hairline',group:'surface',label:'Hairline contour',detail:'The visible edge between the forehead and hair.',min:53,max:86},
  {key:'hairVolume',group:'surface',label:'Hair volume',detail:'The visible fullness around the top and sides.',min:52,max:87},
  {key:'hairNeatness',group:'surface',label:'Hair neatness',detail:'The arrangement of strands around the face.',min:52,max:86},
  {key:'skinTexture',group:'surface',label:'Skin texture visibility',detail:'How clearly small skin details appear in the image.',min:54,max:87},
  {key:'skinEvenness',group:'surface',label:'Skin tone evenness',detail:'The visible colour variation within the face.',min:55,max:86},
  {key:'faceShine',group:'surface',label:'Facial highlights',detail:'The shine on the forehead, nose and cheeks.',min:48,max:84},
  {key:'underEyeShadows',group:'surface',label:'Under-eye shadows',detail:'The visible shadows directly below the eyes.',min:45,max:82},
  {key:'impression',group:'camera',label:'Overall impression',detail:'The first visual impression of this portrait.',min:58,max:86,saleSummary:true},
  {key:'wellBehaved',group:'camera',label:'Looks well-behaved',detail:'A playful impression of the expression in this frame.',min:48,max:84,saleSummary:true},
  {key:'busy',group:'camera',label:'Looks busy',detail:'A playful impression of looking occupied in this frame.',min:45,max:82,saleSummary:true},
  {key:'smile',group:'camera',label:'Smile amplitude',detail:'The visible movement of the lips and mouth corners.',min:48,max:85},
  {key:'gaze',group:'camera',label:'Gaze towards camera',detail:'How directly the eyes appear to face the lens.',min:55,max:88},
  {key:'expression',group:'camera',label:'Expression relaxation',detail:'The visible tension around the brow and mouth.',min:52,max:86},
  {key:'cameraAngle',group:'camera',label:'Face angle to camera',detail:'The degree of turning or tilting in the portrait.',min:55,max:87},
  {key:'lighting',group:'camera',label:'Lighting evenness',detail:'The difference in light between both sides of the face.',min:54,max:88},
];

// These are invented numbers, independent of pixels, landmarks or face shape.
// Two draws favour the middle of each range instead of frequent extremes.
export function createVirtualScores(random=Math.random) {
  const draw=()=>Math.max(0,Math.min(1,random()));
  return Object.fromEntries(VIRTUAL_SCORE_METRICS.map(metric=>[
    metric.key,Math.round(metric.min+(draw()+draw())/2*(metric.max-metric.min)),
  ]));
}

export function averageVirtualScore(values) {
  return Math.round(VIRTUAL_SCORE_METRICS.reduce((sum,metric)=>sum+values[metric.key],0)/VIRTUAL_SCORE_METRICS.length);
}

export function virtualAgentBids(values) {
  const {eyebrows,nose,hair,impression,wellBehaved,busy}=values;
  return {
    employer:Math.round(impression*.5+busy*.3+wellBehaved*.2),
    platform:Math.round(hair*.3+eyebrows*.2+impression*.5),
    verification:Math.round(impression*.6+nose*.4),
    collector:Math.round(eyebrows*.25+nose*.25+hair*.25+impression*.25),
    advertiser:Math.round(impression*.6+hair*.4),
  };
}

// Display-only house criteria. These invented bands never affect bids or the total.
export const HOUSE_STANDARD_KEYS = ['eyebrows', 'eyes', 'nose', 'lips', 'faceBalance', 'hair', 'expression', 'gaze'];
export const HOUSE_STANDARD_BAND = { min: 65, max: 85 };
