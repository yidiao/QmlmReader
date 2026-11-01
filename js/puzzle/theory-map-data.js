// 马哲理论拼图（theory-map）节点数据
// 自 html/puzzle/theory-map.html 内联数据原样迁出（2026-11）。
// 页面私有数据，不进 _tools/build_data.py 生成管线。
// link 为空串表示文章尚未施工，弹层按「施工中」态展示。
const PUZZLE_ARTICLES = {
            // 哲学基础
            shougao1844: {
                title: '1844年经济学哲学手稿', meta: '马克思 · 1844年4-8月', badge: '哲学基础', author: 'marx',
                desc: '异化劳动理论——"劳动所生产的对象作为一种异己的存在物，作为不依赖于生产者的力量，同劳动相对立"',
                position: '马克思哲学思想的第一个重要里程碑，提出了"异化劳动"概念', link: '../articles/Marx/1844-nian-jing-ji-xue-zhe-xue-shou-gao.html', stars: ''
            },
            heigeerpiping: {
                title: '黑格尔法哲学批判导言', meta: '马克思 · 1844年2月', badge: '哲学基础', author: 'marx',
                desc: '"宗教是人民的鸦片"——标志着马克思从唯心主义向唯物主义世界观的转变',
                position: '马克思世界观转变的关键文本', link: '../articles/Marx/hei-ge-er-fa-zhe-xue-pi-pan-dao-yan.html', stars: ''
            },
            feierbaha: {
                title: '关于费尔巴哈的提纲', meta: '马克思 · 1845年春', badge: '哲学基础', author: 'marx',
                desc: '"哲学家们只是用不同的方式解释世界，而问题在于改变世界"——首次系统提出"实践"概念',
                position: '确立了"实践"在马哲体系中的核心地位，被恩格斯称为"新世界观的天才萌芽"', link: '../articles/Marx/guan-yu-fei-er-ba-ha-de-ti-gang.html', stars: ''
            },
            deyizhixintai: {
                title: '德意志意识形态', meta: '马克思 · 1845-46年', badge: '哲学基础', author: 'marx',
                desc: '系统阐述历史唯物主义——"不是意识决定生活，而是生活决定意识"',
                position: '历史唯物主义的奠基之作，共产党宣言的直接理论前提', link: '../articles/Marx/de-yi-zhi-yi-xing-tai.html', stars: ''
            },
            fandulilun: {
                title: '反杜林论', meta: '恩格斯 · 1878年', badge: '哲学基础', author: 'marx',
                desc: '马克思主义的百科全书——系统阐述哲学政治经济学和科学社会主义三个组成部分',
                position: '马克思主义理论体系的第一次系统化阐述', link: '../articles/Engels/fan-du-lin-lun.html', stars: ''
            },
            jiatingqiyuan: {
                title: '家庭私有制和国家的起源', meta: '恩格斯 · 1884年', badge: '哲学基础', author: 'marx',
                desc: '运用唯物史观分析人类早期社会——"国家是阶级矛盾不可调和的产物"',
                position: '唯物史观方法论在社会历史研究上的具体应用', link: '../articles/Engels/jia-ting-si-you-zhi-he-guo-jia-de-qi-yuan.html', stars: ''
            },
            weiwuzhuyijingyan: {
                title: '唯物主义和经验批判主义', meta: '列宁 · 1909年5月', badge: '哲学基础', author: 'lenin',
                desc: '列宁最重要的哲学著作——系统批判马赫主义，发展辩证唯物主义认识论',
                position: '填补了怎么办(1902)与帝国主义论(1916)之间的哲学理论空窗', link: '../articles/Lenin/wei-wu-zhu-yi-he-jing-yan-pi-pan-zhu-yi.html', stars: ''
            },
            gongchandanyan: {
                title: '共产党宣言', meta: '马克思恩格斯 · 1848年', badge: '哲学基础', author: 'marx',
                desc: '科学社会主义的第一个纲领性文件"一个幽灵，共产主义的幽灵，在欧洲游荡"',
                position: '整个马克思主义理论体系的源头', link: '../articles/Marx/gongchan-dan-yuan.html', stars: ''
            },
            zibenlun: {
                title: '资本论（第一卷）', meta: '马克思 · 1867年', badge: '哲学基础', author: 'marx',
                desc: '马克思主义政治经济学的巅峰之作，揭示了剩余价值的秘密',
                position: '共产党宣言中阶级斗争理论的经济学证明', link: '', stars: ''
            },
            gedagangling: {
                title: '哥达纲领批判', meta: '马克思 · 1875年', badge: '哲学基础', author: 'marx',
                desc: '系统阐述共产主义社会两个阶段的理论', position: '提出了共产主义发展的"两阶段"框架',
                link: '../articles/Marx/ge-da-gang-ling.html', stars: ''
            },
            zenmeban: {
                title: '怎么办？', meta: '列宁 · 1902年', badge: '哲学基础', author: 'lenin',
                desc: '系统阐述新型无产阶级政党学说，提出"灌输论"',
                position: '奠定了布尔什维克党的思想基础', link: '../articles/Lenin/zen-me-ban.html', stars: ''
            },
            diguo: {
                title: '帝国主义是资本主义的最高阶段', meta: '列宁 · 1916年', badge: '哲学基础', author: 'lenin',
                desc: '系统分析帝国主义的五大特征，提出"帝国主义是资本主义的垄断阶段，也是垂死的阶段"',
                position: '为被压迫民族解放运动提供了理论依据', link: '../articles/Lenin/di-guo-zhu-yi-shi-zi-ben-zhu-yi-de-zui-gao-jie-duan.html', stars: ''
            },
            guojiayugeming: {
                title: '国家与革命', meta: '列宁 · 1917年', badge: '哲学基础', author: 'lenin',
                desc: '系统阐述马克思主义国家学说，论证国家的阶级本质',
                position: '为十月革命和一切无产阶级革命提供了理论准备', link: '../articles/Lenin/guo-jia-yu-ge-ming.html', stars: ''
            },
            shijian: {
                title: '实践论', meta: '毛泽东 · 1937年7月', badge: '哲学基础', author: 'mao',
                desc: '辩证唯物论的认识论著作，核心是"两个飞跃"理论',
                position: '建立了整个思想体系中"如何认识"的哲学根基', link: '../articles/Mao/shi-jian-lun.html', stars: ''
            },
            maodun: {
                title: '矛盾论', meta: '毛泽东 · 1937年8月', badge: '哲学基础', author: 'mao',
                desc: '唯物辩证法的系统阐发，提出矛盾普遍性与特殊性等核心概念',
                position: '与实践论并称为哲学的双峰', link: '../articles/Mao/mao-dun-lun.html', stars: ''
            },
            neibumao: {
                title: '关于正确处理人民内部矛盾的问题', meta: '毛泽东 · 1957年2月', badge: '哲学基础', author: 'mao',
                desc: '区分了"人民内部矛盾"与"敌我矛盾"，指出两类矛盾用不同方法解决',
                position: '矛盾论在社会主义建设时期的延伸应用', link: '../articles/Mao/ren-min-nei-bu-mao-dun.html', stars: ''
            },
            qingnian: {
                title: '青年运动的方向', meta: '毛泽东 · 1939年5月', badge: '哲学基础', author: 'mao',
                desc: '论述青年在中国革命中的地位和方向',
                position: '实践论认识论在青年工作上的应用', link: '', stars: ''
            },
            diaocha: {
                title: '没有调查，没有发言权', meta: '毛泽东 · 1930年5月', badge: '哲学基础', author: 'mao',
                desc: '强调调查研究是认识问题的根本方法', position: '"调查研究"就是感性认识积累的具体方式',
                link: '', stars: ''
            },
            xuexishiju: {
                title: '学习和时局', meta: '毛泽东 · 1944年12月', badge: '哲学基础', author: 'mao',
                desc: '论述党员干部如何通过学习提高认识', position: '"知行合一"在党的政治工作中的具体化',
                link: '../articles/Mao/xue-xi-shi-ju.html', stars: ''
            },

            // 政治经济学
            lunlun: {
                title: '论列宁主义基础', meta: '斯大林 · 1924年', badge: '政治经济学', author: 'stalin',
                desc: '系统阐述列宁主义的基础定义和主要内容', position: '将列宁主义系统化理论化的重要尝试',
                link: '../articles/Stalin/lun-lunen-zhu-yi-ji-chu.html', stars: ''
            },
            lunzhongguo: {
                title: '论中国革命的前途', meta: '斯大林 · 1926年', badge: '政治经济学', author: 'stalin',
                desc: '系统分析中国革命的性质任务和前途', position: '对中国革命具有重要指导意义',
                link: '../articles/Stalin/lun-zhongguo-ge-ming-de-qiantu.html', stars: ''
            },
            lunlian: {
                title: '论列宁', meta: '斯大林 · 1924年', badge: '政治经济学', author: 'stalin',
                desc: '对列宁个人品格和革命贡献的系统论述', position: '树立列宁权威的重要文献',
                link: '', stars: ''
            },
            lunlunji: {
                title: '论列宁主义的几个问题', meta: '斯大林 · 1938年', badge: '政治经济学', author: 'stalin',
                desc: '对列宁主义若干重要问题进行深入阐释', position: '进一步明确了列宁主义的核心观点',
                link: '', stars: ''
            },
            shiyuegeming: {
                title: '十月革命和俄国共产党人的策略', meta: '斯大林 · 1924年', badge: '政治经济学', author: 'stalin',
                desc: '深入分析十月革命的历史意义和俄国共产党的策略经验', position: '总结了俄国革命的经验教训',
                link: '', stars: ''
            },
            shiyueguoji: {
                title: '十月革命的国际性质', meta: '斯大林 · 1924年', badge: '政治经济学', author: 'stalin',
                desc: '分析十月革命的世界历史意义', position: '十月革命国际影响理论',
                link: '', stars: ''
            },
            minzu: {
                title: '民族问题和马克思主义', meta: '斯大林 · 1913年', badge: '政治经济学', author: 'stalin',
                desc: '系统阐述马克思主义民族理论', position: '奠定了布尔什维克民族政策的理论基础',
                link: '', stars: ''
            },
            gongchandang: {
                title: '马克思主义和民族问题', meta: '斯大林 · 1913年', badge: '政治经济学', author: 'stalin',
                desc: '对马克思主义民族理论的系统阐述', position: '列宁主义的重要组成部分',
                link: '', stars: ''
            },

            // 政治理论
            jieji: {
                title: '中国社会各阶级的分析', meta: '毛泽东 · 1926年3月', badge: '政治理论', author: 'mao',
                desc: '第一篇系统运用马克思主义阶级分析方法分析中国社会的著作',
                position: '奠定了统一战线理论的社会分析基础', link: '', stars: ''
            },
            hunan: {
                title: '湖南农民运动考察报告', meta: '毛泽东 · 1927年3月', badge: '政治理论', author: 'mao',
                desc: '亲身调查的经典文献，热情肯定了农民革命运动的伟大意义',
                position: '"实践出真知"的生动示范', link: '../articles/Mao/nong-min-yun-dong.html', stars: ''
            },
            jinggangshan: {
                title: '井冈山的斗争', meta: '毛泽东 · 1928年11月', badge: '政治理论', author: 'mao',
                desc: '总结井冈山斗争经验，阐述根据地建设的军事政治经济策略',
                position: '"农村包围城市"道路思想的萌芽', link: '', stars: ''
            },
            xinghuo: {
                title: '星星之火，可以燎原', meta: '毛泽东 · 1930年1月', badge: '政治理论', author: 'mao',
                desc: '用辩证法分析中国革命的形势，论证农村根据地的发展前途',
                position: '"弱小强大"矛盾转化逻辑的早期阐发', link: '', stars: ''
            },
            chijiuzhan: {
                title: '论持久战', meta: '毛泽东 · 1938年5月', badge: '政治理论', author: 'mao',
                desc: '批驳"亡国论"与"速胜论"，提出战略防御战略相持战略反攻的三阶段论',
                position: '矛盾论在军事上的完美应用', link: '../articles/Mao/lun-chi-jiu-zhan.html', stars: ''
            },
            youjizhan: {
                title: '抗日游击战争的战略问题', meta: '毛泽东 · 1938年5月', badge: '政治理论', author: 'mao',
                desc: '专门论述游击战的战略地位和具体战术', position: '论持久战的战术配套',
                link: '../articles/Mao/you-ji-zhan.html', stars: ''
            },
            xinminzz: {
                title: '新民主主义论', meta: '毛泽东 · 1940年1月', badge: '政治理论', author: 'mao',
                desc: '系统阐述了中国革命的性质任务和前途', position: '是政治理论体系的核心文献之一',
                link: '../articles/Mao/xin-min-zhu.html', stars: ''
            },
            zhanzhan: {
                title: '战争和战略问题', meta: '毛泽东 · 1938年11月', badge: '政治理论', author: 'mao',
                desc: '"枪杆子里面出政权"这一著名命题的系统论证', position: '军事战略思想的重要文献',
                link: '../articles/Mao/zhan-zheng-zhan-lue.html', stars: ''
            },
            renmzhuanzheng: {
                title: '论人民民主专政', meta: '毛泽东 · 1949年6月', badge: '政治理论', author: 'mao',
                desc: '建国前夕的政治宣言，系统阐述新中国的国家性质', position: '从革命到建设的政治理论桥梁',
                link: '', stars: ''
            },
            shidaguanxi: {
                title: '论十大关系', meta: '毛泽东 · 1956年4月', badge: '政治理论', author: 'mao',
                desc: '探索中国社会主义建设的道路', position: '矛盾论在社会主义建设时期的实践展开',
                link: '../articles/Mao/lun-shi-da-guan-xi.html', stars: ''
            },
            zhiminzhuyi: {
                title: '帝国主义和一切反动派都是纸老虎', meta: '毛泽东 · 1956年7月', badge: '政治理论', author: 'mao',
                desc: '从战略上藐视敌人战术上重视敌人的辩证思想', position: '矛盾论中"强弱转化"思想在国际斗争中的应用',
                link: '', stars: ''
            },
            diuxiaohuanxiang: {
                title: '丢掉幻想，准备斗争', meta: '毛泽东 · 1949年8月', badge: '政治理论', author: 'mao',
                desc: '批判对帝国主义的幻想，号召准备长期斗争', position: '建国前夕的政治清醒剂',
                link: '', stars: ''
            },

            // 党的建设
            jiuzheng: {
                title: '关于纠正党内的错误思想', meta: '毛泽东 · 1929年12月', badge: '党的建设', author: 'mao',
                desc: '针对红军中的各种非无产阶级思想，系统分析其表现来源和纠正方法',
                position: '奠定了党的思想建设方法论的基础', link: '', stars: ''
            },
            ziyouzhuyi: {
                title: '反对自由主义', meta: '毛泽东 · 1937年9月', badge: '党的建设', author: 'mao',
                desc: '列举了自由主义的十一种表现', position: '党的纪律和作风建设的重要文献',
                link: '', stars: ''
            },
            qianxuzhe: {
                title: '关心群众生活，注意工作方法', meta: '毛泽东 · 1934年1月', badge: '党的建设', author: 'mao',
                desc: '阐述群众路线的早期文献，强调关心群众切身利益', position: '群众路线思想的早期表达',
                link: '', stars: ''
            },
            gaizao: {
                title: '改造我们的学习', meta: '毛泽东 · 1941年5月', badge: '党的建设', author: 'mao',
                desc: '延安整风的开篇之作，批判主观主义的学风', position: '整风运动的理论起点',
                link: '', stars: ''
            },
            zhengdun: {
                title: '整顿党的作风', meta: '毛泽东 · 1942年2月', badge: '党的建设', author: 'mao',
                desc: '从学风党风文风三个方面系统批判主观主义宗派主义党八股',
                position: '延安整风三大文件的核心', link: '', stars: ''
            },
            dangbage: {
                title: '反对党八股', meta: '毛泽东 · 1942年2月', badge: '党的建设', author: 'mao',
                desc: '列出党八股的八大罪状', position: '批判主观主义的具体路径',
                link: '', stars: ''
            },
            bingli: {
                title: '集中优势兵力，各个歼灭敌人', meta: '毛泽东 · 1946年9月', badge: '党的建设', author: 'mao',
                desc: '解放战争时期的战术指导原则', position: '军事辩证法的精华提炼',
                link: '', stars: ''
            },
            wenyi: {
                title: '在延安文艺座谈会上的讲话', meta: '毛泽东 · 1942年5月', badge: '党的建设', author: 'mao',
                desc: '确立了"文艺为人民服务为工农兵服务"的文艺路线', position: '中国革命文艺的纲领性文件',
                link: '../articles/Mao/wen-yi-zuo-tan.html', stars: ''
            },

            // 军事战略
            zhanlue: {
                title: '中国革命战争的战略问题', meta: '毛泽东 · 1936年12月', badge: '军事战略', author: 'mao',
                desc: '系统总结十年土地革命战争经验，阐明中国革命战争的特点和规律',
                position: '奠定了军事战略体系的基础', link: '../articles/Mao/zhan-lue-wen-ti.html', stars: ''
            },
            chijiuzhan2: {
                title: '论持久战', meta: '毛泽东 · 1938年5月', badge: '军事战略', author: 'mao',
                desc: '批驳"亡国论"与"速胜论"，提出战略防御战略相持战略反攻的三阶段论',
                position: '矛盾论在军事上的完美应用', link: '../articles/Mao/lun-chi-jiu-zhan.html', stars: ''
            },
            youjizhan2: {
                title: '抗日游击战争的战略问题', meta: '毛泽东 · 1938年5月', badge: '军事战略', author: 'mao',
                desc: '专门论述游击战的战略地位和具体战术', position: '论持久战的战术配套',
                link: '../articles/Mao/you-ji-zhan.html', stars: ''
            },
            zhanzhan2: {
                title: '战争和战略问题', meta: '毛泽东 · 1938年11月', badge: '军事战略', author: 'mao',
                desc: '"枪杆子里面出政权"这一著名命题的系统论证', position: '军事战略思想的重要文献',
                link: '../articles/Mao/zhan-zheng-zhan-lue.html', stars: ''
            },
            bingli2: {
                title: '集中优势兵力，各个歼灭敌人', meta: '毛泽东 · 1946年9月', badge: '军事战略', author: 'mao',
                desc: '解放战争时期的战术指导原则', position: '军事辩证法的精华提炼',
                link: '', stars: ''
            },
            bingli3: {
                title: '战略决战', meta: '毛泽东 · 1948年', badge: '军事战略', author: 'mao',
                desc: '论述战略决战的指导思想和具体部署', position: '解放战争战略阶段的总结',
                link: '', stars: ''
            },

            // 思想文化
            wenyi2: {
                title: '在延安文艺座谈会上的讲话', meta: '毛泽东 · 1942年5月', badge: '思想文化', author: 'mao',
                desc: '确立了"文艺为人民服务为工农兵服务"的文艺路线', position: '中国革命文艺的纲领性文件',
                link: '../articles/Mao/wen-yi-zuo-tan.html', stars: ''
            },
            renmin: {
                title: '为人民服务', meta: '毛泽东 · 1944年9月', badge: '思想文化', author: 'mao',
                desc: '"为人民利益而死，比泰山还重"', position: '哲学原则的道德化表述',
                link: '', stars: ''
            },
            yugong: {
                title: '愚公移山', meta: '毛泽东 · 1945年6月', badge: '思想文化', author: 'mao',
                desc: '强调坚持不懈发动群众的革命精神', position: '"主观能动性"哲学概念的质朴表达',
                link: '', stars: ''
            },
            jinianbaiqiuen: {
                title: '纪念白求恩', meta: '毛泽东 · 1939年12月', badge: '思想文化', author: 'mao',
                desc: '赞扬毫不利己专门利人的精神', position: '共产主义道德教育的经典文本',
                link: '', stars: ''
            },
            diuxiaohuanxiang2: {
                title: '丢掉幻想，准备斗争', meta: '毛泽东 · 1949年8月', badge: '思想文化', author: 'mao',
                desc: '批判对帝国主义的幻想，号召准备长期斗争', position: '建国前夕的政治清醒剂',
                link: '', stars: ''
            },
            renminjiandan: {
                title: '人民英雄纪念碑碑文', meta: '毛泽东 · 1949年9月', badge: '思想文化', author: 'mao',
                desc: '纪念人民英雄的碑文', position: '革命历史教育的经典文本',
                link: '', stars: ''
            },
            zhenhan: {
                title: '为什么要整风', meta: '毛泽东 · 1947年', badge: '思想文化', author: 'mao',
                desc: '论述整风的必要性和意义', position: '整风运动的思想动员',
                link: '', stars: ''
            },
            guanyu: {
                title: '关于调查研究的决定', meta: '毛泽东 · 1941年', badge: '思想文化', author: 'mao',
                desc: '关于加强调查研究工作的决定', position: '理论与实践相结合的具体措施',
                link: '', stars: ''
            },
            zhongguo: {
                title: '中国革命和中国共产党', meta: '毛泽东 · 1939年12月', badge: '思想文化', author: 'mao',
                desc: '系统阐述中国革命和党的性质', position: '党的建设理论基础',
                link: '', stars: ''
            },
            zhongguo2: {
                title: '五四运动', meta: '毛泽东 · 1939年', badge: '思想文化', author: 'mao',
                desc: '论述五四运动的历史意义', position: '青年运动历史地位',
                link: '', stars: ''
            }
        };
