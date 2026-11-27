# 刷新闪烁相关论文清单

整理日期：2026-10-29。MLVC 已有，未重复下载，也未修改已有论文。

## 已保存 PDF

1. **Kuszpet 等，2007 — Post-processing for Flicker Reduction in H.264/AVC**  
   文件：[2007_Post-processing for Flicker Reduction in H264-AVC.pdf](2007_Post-processing%20for%20Flicker%20Reduction%20in%20H264-AVC.pdf)  
   作者公开稿：https://yair.net.technion.ac.il/files/2013/07/2007-Post-Processing-for-Flicker-Reduction-in-H.264-AVC.pdf  
   阅读重点：运动补偿融合、GOP 开头多帧接续，以及平滑引起的细节损失。

2. **Mantiuk 等，2024 — ColorVideoVDP: A Visual Difference Predictor for Image, Video and Display Distortions**  
   文件：[2024_ColorVideoVDP.pdf](2024_ColorVideoVDP.pdf)  
   作者公开稿：https://www.cl.cam.ac.uk/~rkm38/pdfs/mantiuk2024_ColorVideoVDP.pdf  
   阅读重点：时空感知评价，作为现有指标和观看评价的补充。

## 未取得 PDF：供手动查找的入口

以下未取得可验证 PDF；链接是查找入口，不保证当前网络能直接下载。未以网页或占位文件冒充 PDF。

3. **Chun、Kim、Sull，2006 — Intra Prediction Mode Selection for Flicker Reduction in H.264/AVC**  
   DOI：https://doi.org/10.1109/TCE.2006.273149  
   作者 PDF：https://dml.korea.ac.kr/wp-content/uploads/2019/05/Intra-Prediction-Mode-Selection-for-Flicker-Reduction-in-H.264_AVC.pdf  
   本次状态：作者站连接失败/超时。阅读重点：编码端时间失真一致性。

4. **Jiménez-Moreno 等，2013 — Standard Compliant Flicker Reduction Method with PSNR Loss Control**  
   DOI：https://doi.org/10.1109/ICASSP.2013.6637948  
   作者团队论文列表：https://gpm.webs.tsc.uc3m.es/publications/conference-papers/  
   本次状态：未获取可验证的公开全文。阅读重点：限制空间画质损失的减闪。

5. **Jiménez-Moreno 等，2014 — Standard-Compliant Low-Pass Temporal Filter to Reduce the Perceived Flicker Artifact**  
   DOI：https://doi.org/10.1109/TMM.2014.2347257  
   高校文献库 PDF：https://e-archivo.uc3m.es/rest/api/core/bitstreams/5142a80c-57d6-4280-8a1c-f9305519f696/content  
   本次状态：高校站访问拒绝或连接失败。阅读重点：自适应低通时间滤波与模糊控制；与 2013 会议论文关联阅读。

6. **Gong 等，2016 — Reduction of Temporal Distortion in Video Coding Based on Detection of Just-Noticeable Temporal Pumping Artifact**  
   DOI：https://doi.org/10.1016/j.image.2016.01.006  
   出版页：https://www.sciencedirect.com/science/article/abs/pii/S0923596516000096  
   本次状态：未取得公开 PDF；可尝试学校图书馆权限。阅读重点：层级量化与时间 pumping。

## 建议阅读顺序

已有 MLVC → 2007 后处理 → 2006 编码端决策 → 2014 自适应滤波；2013 与 2014 配套阅读，2016 对照层级码控，ColorVideoVDP 用于评价方法补充。

已下载两份均通过 PDF 解析、全页文本提取和标题核验；未进行逐页视觉排版审查。校验记录见同目录 `刷新闪烁论文_下载校验_20261029.json`。
