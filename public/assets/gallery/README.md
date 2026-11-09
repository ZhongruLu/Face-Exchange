# 走廊相框内容

把图片放在这个文件夹，再修改 collection.json。图片建议使用 JPG 或 WebP，长边不超过 2000 像素。

保留的墙面相框共 11 个。检验室与换脸室之间左墙的 wall-left-02 已恢复。其余为 wall-left-03、wall-right-03，以及 05、06、07、08 这几组左右相框。01、04 和 wall-right-02 仍留空。相框内容目前为深色空白。

在 items 中填写对应相框。例如：

```json
{
  "default": {
    "title": "面容档案",
    "caption": "图像待入藏",
    "image": "/assets/gallery/placeholder.svg"
  },
  "items": {
    "wall-left-03": {
      "title": "你的作品名称",
      "caption": "你的图片说明",
      "image": "/assets/gallery/your-image.jpg"
    }
  }
}
```

刷新网页即可看到内容。墙上的预览会缩小后上传到显卡；点击放大时才在查看器中读取原图。

多页资料可将 image 改成 pages 数组，例如 "pages": ["/assets/gallery/page-01.jpg", "/assets/gallery/page-02.jpg"]。查看器会出现翻页按钮，每页都可以放大、拖动。暂未制作实体书翻页动画。
