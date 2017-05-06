## 1.AutoResizeToCrop是什么?

AutoResizeToCrop是ps对图程序，脚本部分负责已对图数据的导出，web部分负责对图。

## 2.如何使用？

以Adobe Photoshop CC 2017和OSX为例

1. 拷贝AutoResizeToCrop_PS文件夹到/Applications/Adobe Photoshop CC 2017/Presets文件夹下

![01](README/01.jpg)

2. 拷贝AutoResizeToCrop_HTML文件夹到桌面

![02](README/02.jpg)

3. 下载[MAMP](https://www.mamp.info/en/)或类似程序，搭建基于AutoResizeToCrop_HTML的网站

![03](README/03.jpg)

4. 在ps里选择包含大图和切图的组,执行脚本

![04](README/04.jpg)

5. 在网站点击开始按钮或敲回车，等待计算结果

![05](README/05.jpg)

6. 将计算结果输入ps，检查对图效果

![06](README/06.jpg)

## 3.使用约定

1. 大图和切图在一个组里，执行脚本时选择这个组

2. 大图在上，切图在下

3. 大图必须是智能对象

3. 请尽量不要在大图和切图上应用样式，虽然程序考虑了使用图层蒙版、图形蒙版和剪切蒙版的情况。

![08](README/08.jpg)

## 4.让程序做的更多

AutoResizeToCrop基于已对图数据进行进一步对图（模板匹配）

如果想让程序计算更多，自己少对点图，可以根据实际情况调整配置参数

![07](README/07.jpg)





