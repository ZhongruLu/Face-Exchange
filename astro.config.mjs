import { defineConfig } from 'astro/config';
import {faceArchivePlugin} from './scripts/faceArchiveServer.mjs';
import {localVideoExhibitPlugin} from './scripts/localVideoExhibit.mjs';
export default defineConfig({vite:{optimizeDeps:{include:['@mediapipe/tasks-vision']},plugins:[faceArchivePlugin(),localVideoExhibitPlugin()]}});
