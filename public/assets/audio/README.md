# Face Exchange 音乐文件

替换这里的两个文件即可，不用改代码。

- `corridor-ambience.wav`：走廊循环背景音乐，也覆盖入口与房间。
- `door-open.wav`：开门时播放的短音效。

请使用真实的 WAV 文件，不要只把 MP3 改名为 WAV。替换完成后刷新网页。背景音乐最好首尾无缝衔接。

如果希望使用 MP3，请修改 `src/scripts/sceneAudio.js` 开头的两个音频路径。

默认音量 35%，首次点击或按键后播放。声音开关与音量会保存在本机浏览器。切到别的标签时暂停。

目前两个音频为项目内原创合成音频，无第三方音乐素材。运行 `node scripts/generateSceneAudio.mjs` 可重新生成，但会覆盖这两个 WAV。
