# Qmlmreader 数据与下载中心整理清单

## 处理原则
- 既有 `data/articles.json` 元数据和既有增强文章页优先保留，不以原始资料覆盖。
- 原始资料只用于补齐网站缺失文章；内容写入生成的文章阅读页。
- 下载中心不再保存文章 PDF/TXT，点击下载时由文章页正文即时生成 TXT 或 DOCX。
- `data/rectify-*.txt` 属于正名专题正文，和经典著作数据分开，保留。

## 数量总览
- 原始资料 DOCX：1,357 个（排除 `_txt` 提取目录）
- 整理前 `articles.json`：28 条；整理后：1,286 条
- 新增经典条目：1,258 条（其中 `data` 既有 TXT/PDF 纳入 6 条，原始 DOCX 纳入 1,252 条）
- 与既有文章标题重复而跳过的原始 DOCX：105 个
- 新生成文章阅读页：1,258 个
- 原始资料读取异常/空文档：0 个

## `downloads/articles` PDF 清单（待删除，不再由页面引用）
- `dao-lunen.pdf`
- `gongchan-dan-yuan.pdf`
- `guo-jia-yu-ge-ming.pdf`
- `lun-chi-jiu-zhan.pdf`
- `lun-lunen-zhu-yi-ji-chu.pdf`
- `lun-lunen-zhu-yi-jige-wenti.pdf`
- `lun-lunen.pdf`
- `lun-zhongguo-ge-ming-de-qiantu.pdf`
- `makesi-zhuyi-minzu.pdf`
- `mao-dun-lun.pdf`
- `nong-min-yun-dong.pdf`
- `ren-min-nei-bu-mao-dun.pdf`
- `shi-jian-lun.pdf`
- `shiyue-geming-celue.pdf`
- `shiyue-geming-guoji.pdf`
- `shiyue-geming-minzu.pdf`
- `wei-wu-zhu-yi-he-jing-yan-pi-pan-zhu-yi.pdf`
- `wen-yi-zuo-tan.pdf`
- `xin-min-zhu.pdf`
- `xue-xi-shi-ju.pdf`
- `you-ji-zhan.pdf`
- `zen-me-ban.pdf`
- `zhan-lue-wen-ti.pdf`
- `zhan-zheng-zhan-lue.pdf`

## `downloads/rectify` PDF 清单（待删除，不再由页面引用）
- `rectify-finland-war.pdf`
- `rectify-gorky-lenin.pdf`
- `rectify-human-nature.pdf`
- `rectify-soviet-afghanistan.pdf`
- `rectify-soviet-agriculture.pdf`
- `rectify-stalin-era.pdf`
- `rectify-wisdom-of-elites.pdf`

## `data` TXT 清单
- `1844-nian-jing-ji-xue-zhe-xue-shou-gao.txt` — 264,432 bytes — 已迁移后删除：与网站文章正文重复
- `dao-lunen.txt` — 8,682 bytes — 已迁移后删除：与网站文章正文重复
- `ge-da-gang-ling.txt` — 52,514 bytes — 已迁移后删除：与网站文章正文重复
- `gongchan-dan-yuan.txt` — 59,372 bytes — 已迁移后删除：与网站文章正文重复
- `guo-jia-yu-ge-ming.txt` — 414,283 bytes — 已迁移后删除：与网站文章正文重复
- `hei-ge-er-fa-zhe-xue-pi-pan-dao-yan.txt` — 29,700 bytes — 已迁移后删除：与网站文章正文重复
- `jia-ting-si-you-zhi-he-guo-jia-de-qi-yuan.txt` — 380,452 bytes — 已迁移后删除：与网站文章正文重复
- `lun-chi-jiu-zhan.txt` — 143,239 bytes — 已迁移后删除：与网站文章正文重复
- `lun-lunen-zhu-yi-ji-chu.txt` — 189,644 bytes — 已迁移后删除：与网站文章正文重复
- `lun-lunen-zhu-yi-jige-wenti.txt` — 125,704 bytes — 已迁移后删除：此前仅 TXT/PDF，已纳入 articles.json
- `lun-lunen.txt` — 16,275 bytes — 已迁移后删除：此前仅 TXT/PDF，已纳入 articles.json
- `lun-shi-da-guan-xi.txt` — 0 bytes — 已迁移后删除：与网站文章正文重复
- `lun-zhongguo-ge-ming-de-qiantu.txt` — 22,229 bytes — 已迁移后删除：与网站文章正文重复
- `makesi-zhuyi-minzu.txt` — 120,898 bytes — 已迁移后删除：此前仅 TXT/PDF，已纳入 articles.json
- `mao-dun-lun.txt` — 69,898 bytes — 已迁移后删除：与网站文章正文重复
- `nong-min-yun-dong.txt` — 53,298 bytes — 已迁移后删除：与网站文章正文重复
- `rectify-finland-war.txt` — 10,860 bytes — 保留：正名专题正文（非经典著作数据）
- `rectify-gorky-lenin.txt` — 19,394 bytes — 保留：正名专题正文（非经典著作数据）
- `rectify-human-nature.txt` — 14,824 bytes — 保留：正名专题正文（非经典著作数据）
- `rectify-soviet-afghanistan.txt` — 10,402 bytes — 保留：正名专题正文（非经典著作数据）
- `rectify-soviet-agriculture.txt` — 13,678 bytes — 保留：正名专题正文（非经典著作数据）
- `rectify-stalin-era.txt` — 29,308 bytes — 保留：正名专题正文（非经典著作数据）
- `rectify-wisdom-of-elites.txt` — 26,108 bytes — 保留：正名专题正文（非经典著作数据）
- `ren-min-nei-bu-mao-dun.txt` — 72,499 bytes — 已迁移后删除：与网站文章正文重复
- `shi-jian-lun.txt` — 28,250 bytes — 已迁移后删除：与网站文章正文重复
- `shiyue-geming-celue.txt` — 70,849 bytes — 已迁移后删除：此前仅 TXT/PDF，已纳入 articles.json
- `shiyue-geming-guoji.txt` — 15,914 bytes — 已迁移后删除：此前仅 TXT/PDF，已纳入 articles.json
- `shiyue-geming-minzu.txt` — 15,466 bytes — 已迁移后删除：此前仅 TXT/PDF，已纳入 articles.json
- `wei-wu-zhu-yi.txt` — 1,004,705 bytes — 已迁移后删除：此前仅 TXT/PDF，已纳入 articles.json
- `wen-yi-zuo-tan.txt` — 56,731 bytes — 已迁移后删除：与网站文章正文重复
- `xin-min-zhu.txt` — 86,341 bytes — 已迁移后删除：与网站文章正文重复
- `xue-xi-shi-ju.txt` — 20,847 bytes — 已迁移后删除：与网站文章正文重复
- `you-ji-zhan.txt` — 58,459 bytes — 已迁移后删除：与网站文章正文重复
- `zen-me-ban.txt` — 450,546 bytes — 已迁移后删除：与网站文章正文重复
- `zhan-lue-wen-ti.txt` — 125,613 bytes — 已迁移后删除：与网站文章正文重复
- `zhan-zheng-zhan-lue.txt` — 23,706 bytes — 已迁移后删除：与网站文章正文重复
- `中国革命战争的战略问题_extracted.txt` — 125,613 bytes — 已迁移后删除：提取重复副本
- `关于正确处理人民内部矛盾的问题_extracted.txt` — 72,499 bytes — 已迁移后删除：提取重复副本
- `在延安文艺座谈会上的讲话_extracted.txt` — 56,731 bytes — 已迁移后删除：提取重复副本
- `学习和时局_extracted.txt` — 20,847 bytes — 已迁移后删除：提取重复副本
- `实践论_extracted.txt` — 28,250 bytes — 已迁移后删除：提取重复副本
- `战争和战略问题_extracted.txt` — 23,706 bytes — 已迁移后删除：提取重复副本
- `抗日游击战争的战略问题_extracted.txt` — 58,459 bytes — 已迁移后删除：提取重复副本
- `新民主主义论_extracted.txt` — 86,341 bytes — 已迁移后删除：提取重复副本
- `湖南农民运动考察报告_extracted.txt` — 53,298 bytes — 已迁移后删除：提取重复副本
- `矛盾论_extracted.txt` — 69,898 bytes — 已迁移后删除：提取重复副本
- `论持久战_extracted.txt` — 143,239 bytes — 已迁移后删除：提取重复副本

## 原始资料同标题多版本提示
没有检测到新增条目中的同标题多版本。
