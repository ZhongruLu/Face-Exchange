import * as THREE from 'three';
export const ENTRANCE_SCROLL_PER_PIXEL = 0.009 * 0.75;
export const ENTRANCE_SMOOTHING = 4.2;
export const smoothEntrancePosition = (position,target,delta) => THREE.MathUtils.damp(position,target,ENTRANCE_SMOOTHING,delta);
