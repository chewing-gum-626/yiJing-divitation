export interface ServerGuaText {
  name: string;
  judgment: string;
  plain: string;
}

interface TrigramDefinition {
  bits: string;
  symbol: string;
}

interface HexagramTextSeed {
  name: string;
  judgment: string;
  plain: string;
}

const TRIGRAM_ORDER: TrigramDefinition[] = [
  { bits: '111', symbol: '天' },
  { bits: '110', symbol: '泽' },
  { bits: '101', symbol: '火' },
  { bits: '100', symbol: '雷' },
  { bits: '011', symbol: '风' },
  { bits: '010', symbol: '水' },
  { bits: '001', symbol: '山' },
  { bits: '000', symbol: '地' },
];

const HEXAGRAM_TEXT_MATRIX: HexagramTextSeed[][] = [
  [
    { name: '乾为天', judgment: '乾：元，亨，利，贞。', plain: '阳气充足，象征开创、主动与上升，宜正道进取。' },
    { name: '天泽履', judgment: '履：履虎尾，不咥人，亨。', plain: '行事如履薄冰，守礼谨慎则可化险为夷。' },
    { name: '天火同人', judgment: '同人：同人于野，亨。利涉大川，利君子贞。', plain: '适合与人协作，开放坦诚能凝聚力量。' },
    { name: '天雷无妄', judgment: '无妄：元，亨，利，贞。其匪正有眚，不利有攸往。', plain: '顺其自然、勿起妄念，动机端正才有好结果。' },
    { name: '天风姤', judgment: '姤：女壮，勿用取女。', plain: '突发相遇暗藏变数，需谨慎辨别诱因与风险。' },
    { name: '天水讼', judgment: '讼：有孚窒惕，中吉，终凶。利见大人，不利涉大川。', plain: '争执已现，宜止争求和，不宜逞强到底。' },
    { name: '天山遁', judgment: '遁：亨，小利贞。', plain: '退避不是失败，保存实力等待时机更明智。' },
    { name: '天地否', judgment: '否：否之匪人，不利君子贞，大往小来。', plain: '上下不通，局势闭塞，宜守正等待转机。' },
  ],
  [
    { name: '泽天夬', judgment: '夬：扬于王庭，孚号有厉，告自邑，不利即戎，利有攸往。', plain: '到了决断时刻，宜公开坦荡处理，不宜鲁莽冲突。' },
    { name: '兑为泽', judgment: '兑：亨，利贞。', plain: '沟通和悦带来机会，但快乐也要守住原则。' },
    { name: '泽火革', judgment: '革：巳日乃孚，元亨利贞，悔亡。', plain: '变革需要时机与信任，准备充分后可去旧立新。' },
    { name: '泽雷随', judgment: '随：元亨利贞，无咎。', plain: '顺势跟随、调整节奏，有助于融入变化。' },
    { name: '泽风大过', judgment: '大过：栋桡，利有攸往，亨。', plain: '压力过重但仍可突破，关键是调整结构与支撑。' },
    { name: '泽水困', judgment: '困：亨，贞，大人吉，无咎。有言不信。', plain: '处境受限，少说空话，多靠定力和行动脱困。' },
    { name: '泽山咸', judgment: '咸：亨，利贞，取女吉。', plain: '相互感应、关系流动，真诚回应更容易促成好事。' },
    { name: '泽地萃', judgment: '萃：亨，王假有庙。利见大人，亨，利贞。', plain: '人心聚合，适合整合资源、寻求支持。' },
  ],
  [
    { name: '火天大有', judgment: '大有：元亨。', plain: '资源充足、势头明朗，宜以谦逊承载成果。' },
    { name: '火泽睽', judgment: '睽：小事吉。', plain: '意见相左，大事暂缓，小处求同可减轻冲突。' },
    { name: '离为火', judgment: '离：利贞，亨。畜牝牛吉。', plain: '依附光明与秩序，保持清醒和柔顺可得吉。' },
    { name: '火雷噬嗑', judgment: '噬嗑：亨。利用狱。', plain: '问题需要被咬合解决，规则和决断是关键。' },
    { name: '火风鼎', judgment: '鼎：元吉，亨。', plain: '更新格局、成就新器，适合升级方法与资源。' },
    { name: '火水未济', judgment: '未济：亨，小狐汔济，濡其尾，无攸利。', plain: '事情尚未完成，临门一脚更需谨慎收尾。' },
    { name: '火山旅', judgment: '旅：小亨，旅贞吉。', plain: '身处过渡环境，低调守礼、适应变化为宜。' },
    { name: '火地晋', judgment: '晋：康侯用锡马蕃庶，昼日三接。', plain: '光明上进，容易获得认可，宜把握展示机会。' },
  ],
  [
    { name: '雷天大壮', judgment: '大壮：利贞。', plain: '力量强盛，越有能力越要守正克制。' },
    { name: '雷泽归妹', judgment: '归妹：征凶，无攸利。', plain: '关系或安排不够稳定，贸然推进容易失衡。' },
    { name: '雷火丰', judgment: '丰：亨，王假之，勿忧，宜日中。', plain: '盛大明朗但难久持，趁势而为也要防过满。' },
    { name: '震为雷', judgment: '震：亨。震来虩虩，笑言哑哑。', plain: '突发震动带来警醒，稳住心神后反能转安。' },
    { name: '雷风恒', judgment: '恒：亨，无咎，利贞，利有攸往。', plain: '贵在长期坚持，稳定节奏比短期爆发更重要。' },
    { name: '雷水解', judgment: '解：利西南，无所往，其来复吉。有攸往，夙吉。', plain: '困局开始松动，宜尽快处理遗留问题。' },
    { name: '雷山小过', judgment: '小过：亨，利贞。可小事，不可大事。', plain: '小事可成，大事宜缓，谨慎细致更安全。' },
    { name: '雷地豫', judgment: '豫：利建侯行师。', plain: '心气舒展、众人响应，适合预备和发动。' },
  ],
  [
    { name: '风天小畜', judgment: '小畜：亨。密云不雨，自我西郊。', plain: '力量正在积蓄，暂未释放，宜耐心准备。' },
    { name: '风泽中孚', judgment: '中孚：豚鱼吉，利涉大川，利贞。', plain: '诚信能穿透阻隔，真心沟通可渡难关。' },
    { name: '风火家人', judgment: '家人：利女贞。', plain: '重在内外有序，经营关系和分工可带来稳定。' },
    { name: '风雷益', judgment: '益：利有攸往，利涉大川。', plain: '增益之象，付出与合作会带来成长。' },
    { name: '巽为风', judgment: '巽：小亨，利有攸往，利见大人。', plain: '柔顺渗透、循序渐进，借助贵人与规则更顺。' },
    { name: '风水涣', judgment: '涣：亨，王假有庙。利涉大川，利贞。', plain: '涣散可被重新凝聚，适合化解隔阂、重建共识。' },
    { name: '风山渐', judgment: '渐：女归吉，利贞。', plain: '循序渐进，不求速成，按阶段推进更稳。' },
    { name: '风地观', judgment: '观：盥而不荐，有孚颙若。', plain: '先观察全局，再决定行动，诚意和格局很重要。' },
  ],
  [
    { name: '水天需', judgment: '需：有孚，光亨，贞吉。利涉大川。', plain: '需要等待时机，信念坚定则可顺利前进。' },
    { name: '水泽节', judgment: '节：亨。苦节不可贞。', plain: '节制有利，但过度压抑反而不长久。' },
    { name: '水火既济', judgment: '既济：亨小，利贞。初吉终乱。', plain: '阶段已成但不可松懈，收尾和维护同样关键。' },
    { name: '水雷屯', judgment: '屯：元亨利贞，勿用有攸往，利建侯。', plain: '初创艰难，先稳住根基，再逐步打开局面。' },
    { name: '水风井', judgment: '井：改邑不改井，无丧无得。往来井井。', plain: '根本资源稳定，适合修复系统、长期经营。' },
    { name: '坎为水', judgment: '坎：习坎，有孚，维心亨，行有尚。', plain: '险中有险，凭诚信与内心稳定逐步通过。' },
    { name: '水山蹇', judgment: '蹇：利西南，不利东北。利见大人，贞吉。', plain: '行路受阻，宜调整方向并寻求可靠帮助。' },
    { name: '水地比', judgment: '比：吉。原筮，元永贞，无咎。', plain: '亲比合作有利，选择可信的人一起前行。' },
  ],
  [
    { name: '山天大畜', judgment: '大畜：利贞，不家食吉，利涉大川。', plain: '蓄积深厚，适合提升能力并等待更大舞台。' },
    { name: '山泽损', judgment: '损：有孚，元吉，无咎，可贞，利有攸往。', plain: '适度减少反成其益，舍弃低效才能换来成长。' },
    { name: '山火贲', judgment: '贲：亨。小利有攸往。', plain: '外在修饰有助表达，但本质内容仍是根基。' },
    { name: '山雷颐', judgment: '颐：贞吉。观颐，自求口实。', plain: '关注滋养与言行，先照顾根本需求。' },
    { name: '山风蛊', judgment: '蛊：元亨，利涉大川。先甲三日，后甲三日。', plain: '旧问题需要整治，清理积弊后可重新启动。' },
    { name: '山水蒙', judgment: '蒙：亨。匪我求童蒙，童蒙求我。', plain: '迷蒙未明，宜学习请教，先建立正确认知。' },
    { name: '艮为山', judgment: '艮：艮其背，不获其身。行其庭，不见其人，无咎。', plain: '止于当止，静下来边界清楚就能无咎。' },
    { name: '山地剥', judgment: '剥：不利有攸往。', plain: '根基被削弱，不宜贸然行动，先防守止损。' },
  ],
  [
    { name: '地天泰', judgment: '泰：小往大来，吉亨。', plain: '天地交通、局势顺畅，适合推进重要事项。' },
    { name: '地泽临', judgment: '临：元亨利贞。至于八月有凶。', plain: '机会临近，宜积极作为，也要防盛极转弱。' },
    { name: '地火明夷', judgment: '明夷：利艰贞。', plain: '光明受伤，低调守正、韬光养晦更安全。' },
    { name: '地雷复', judgment: '复：亨。出入无疾，朋来无咎。', plain: '转机回归，适合重启计划、恢复节奏。' },
    { name: '地风升', judgment: '升：元亨，用见大人，勿恤，南征吉。', plain: '循序上升，借助平台和贵人可持续发展。' },
    { name: '地水师', judgment: '师：贞，丈人吉，无咎。', plain: '行动需纪律与统筹，听从可靠领导可避风险。' },
    { name: '地山谦', judgment: '谦：亨，君子有终。', plain: '谦逊能成事，越低调踏实越能走到最后。' },
    { name: '坤为地', judgment: '坤：元，亨，利牝马之贞。', plain: '柔顺承载，适合稳扎稳打、顺势配合。' },
  ],
];

export const SERVER_GUA_DATA: Record<string, ServerGuaText> = Object.fromEntries(
  HEXAGRAM_TEXT_MATRIX.flatMap((row, upperIndex) =>
    row.map((seed, lowerIndex) => {
      const upper = TRIGRAM_ORDER[upperIndex];
      const lower = TRIGRAM_ORDER[lowerIndex];
      return [`${lower.bits}${upper.bits}`, seed];
    }),
  ),
) as Record<string, ServerGuaText>;

export function getServerGuaText(guaId: string): ServerGuaText | null {
  return SERVER_GUA_DATA[guaId] ?? null;
}
