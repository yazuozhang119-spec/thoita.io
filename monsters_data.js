// 怪物数据结构 - 基于game_engine.py中allMobs数组和mobs.py的真实数据
// 15种怪物的详细信息、掉落、属性等，支持1-25级
//
// 掉落系统说明 (基于game_engine.py最新修改):
// - Level >= 17: 掉落level-2级花瓣
//   * 40%几率掉落2个
//   * 12%几率掉落5个 (条件概率：60%剩余概率中再取20%)
//   * 48%几率掉落1个 (剩余概率)
// - Level >= 12: 掉落level-2级花瓣（99%）或level-1级花瓣（1%）
//   * 30%几率掉落2个
//   * 6.5%几率掉落10个
//   * 63.5%几率掉落1个
// - Level < 12: 掉落level-1级花瓣（1个）
// - 100%掉落概率，每个掉落物都会生成
// - 掉落物按group分配给房间内的所有玩家

// 花瓣名称映射 - 基于游戏数据
const PETAL_NAMES = {
    0: '导弹',
    1: '基础',
    2: '未使用',
    3: '叶子',
    4: '翅膀',
    5: '闪电',
    6: '鸢尾花',
    7: '贝壳',
    8: '炸弹',
    9: '磁铁',
    10: '第三只眼',
    11: '刺针',
    12: '橙子',
    13: '蛋',
    14: '方块',
    15: '珍珠',
    16: '花蕾',
    17: '蚂蚁蛋',
    18: 'Rita',
    19: '棍',
    20: '卡牌',
    21: '豌豆',
    22: '葡萄',
    23: '蒲公英',
    24: '仙人掌花瓣',
    25: '土壤花瓣',
    26: '海星',
};
// 花瓣相对值表格（与后端保持一致）
/*const PETAL_RELATIVE_VALUES = [
    1, 1.8, 3.22, 5.74, 10.15, 17.87, 31.27, 54.4, 94.12, 161.88, 
    276.81, 470.59, 795.29, 1336.09, 2231.26, 3703.9, 6111.43, 10022.75, 
    16337.07, 26466.06, 42610.36, 68176.57, 108400.75, 171273.19, 268898.9
];

// 怪物相对值表格（与后端保持一致）
const MOB_HP_RELATIVE_VALUES = [
    1, 1.8, 3.33, 6.33, 12.34, 24.68, 50.58, 106.23, 228.39, 502.45, 
    1130.52, 2600.2, 6110.47, 14665.14, 35929.59, 89823.98, 229051.15, 595532.98, 
    1578162.4, 4261038.47, 11717855.81, 32809996.26, 93508489.33, 271174619.1, 799965126.2
];

const MOB_ATTACK_RELATIVE_VALUES = [
    1, 1.35, 1.86, 2.63, 3.78, 5.56, 8.34, 12.76, 19.91, 31.65, 
    51.28, 84.61, 142.14, 243.06, 422.93, 748.59, 1347.46, 2465.85, 
    4586.48, 8668.45, 16643.42, 32454.67, 64260.26, 129163.11, 263492.75
];

const MOB_OTHER_RELATIVE_VALUES = [
    1, 1.35, 1.86, 2.63, 3.78, 5.56, 8.34, 12.76, 19.91, 31.65, 
    51.28, 84.61, 142.14, 243.06, 422.93, 748.59, 1347.46, 2465.85, 
    4586.48, 8668.45, 16643.42, 32454.67, 64260.26, 129163.11, 263492.75
];
// 新的数值生成函数 - 使用相对值表格
function generateRelativeValues(baseValue, relativeValues = PETAL_RELATIVE_VALUES) {
    const values = [0];
    values.push(baseValue);
    
    for (let i = 2; i <= 25; i++) {
        if (i <= relativeValues.length) {
            values.push(baseValue * (relativeValues[i-1] / relativeValues[0]));
        } else {
            // 如果超过表格长度，使用最后一个值
            values.push(baseValue * (relativeValues[relativeValues.length-1] / relativeValues[0]));
        }
    }
    return values;
}

// 怪物数值生成函数
function generateMobHpValues(baseHp) {
    return generateRelativeValues(baseHp, MOB_HP_RELATIVE_VALUES);
}

function generateMobAttackValues(baseAttack) {
    return generateRelativeValues(baseAttack, MOB_ATTACK_RELATIVE_VALUES);
}

function generateMobOtherValues(baseOther) {
    return generateRelativeValues(baseOther, MOB_OTHER_RELATIVE_VALUES);
}*/

// 保留旧的生成函数（如果需要向后兼容）
function generateDoublingHealth(level1) {
    const health = [0];
    health.push(level1);
    let current = level1;
    for (let i = 2; i <= 25; i++) {
        current *= 2;
        health.push(current);
    }
    return health;
}

function generateTriplingHealth(level1) {
    const health = [0];
    health.push(level1);
    let current = level1;
    for (let i = 2; i <= 25; i++) {
        current *= 3;
        health.push(current);
    }
    return health;
}

// 怪物数据 - 基于game_engine.py中allMobs数组 (15种怪物，1-25级)
// allMobs数组格式: [name, health[0-25], bodyDamage[0-25], weight[0-25]]
//const MONSTER_DATA = {
// 怪物数据 - 使用新的相对值生成
const MONSTER_DATA = {
    hornet: {
        name: '黄蜂',
        description: '快速移动的飞行怪物，发射直线追踪的子弹',
        health: generateMobHpValues(120),
        bodyDamage: generateMobAttackValues(7),
        weight: generateMobOtherValues(30),
        drops: [0, 12],
        rarity: 'common',
        behaviors: ['追踪', '射击', '飞行'],
        icon: '🐝',
        maxLevel: 25
    },
    rock: {
        name: '岩石',
        description: '缓慢移动的防御型怪物，高生命值但速度很慢，静止不移动',
        health: generateMobHpValues(210),
        bodyDamage: generateMobAttackValues(2),
        weight: generateMobOtherValues(45),
        drops: [3, 7],
        rarity: 'common',
        behaviors: ['防御', '缓慢', '坦克', '静止'],
        icon: '🪨',
        maxLevel: 25
    },
    ladybug: {
        name: '瓢虫',
        description: '中等速度的地面怪物，会进行短距离冲刺',
        health: generateMobHpValues(108),
        bodyDamage: generateMobAttackValues(4),
        weight: generateMobOtherValues(36),
        drops: [4],
        rarity: 'common',
        behaviors: ['冲刺', '地面', '中等速度'],
        icon: '🐞',
        maxLevel: 25
    },
    centipede: {
        name: '蜈蚣',
        description: '长形分段怪物，移动时呈波浪状，由6-10个节段组成',
        health: generateMobHpValues(150),
        bodyDamage: generateMobAttackValues(1.5),
        weight: generateMobOtherValues(24),
        drops: [3, 21],
        rarity: 'uncommon',
        behaviors: ['分段', '波浪移动', '长形'],
        icon: '🐛',
        maxLevel: 25
    },
    thunderelement: {
        name: '雷电元素',
        description: '发射雷电弹的元素怪物，攻击带连锁效果',
        health: generateMobHpValues(180),
        bodyDamage: generateMobAttackValues(6),
        weight: generateMobOtherValues(45),
        drops: [5],
        rarity: 'rare',
        behaviors: ['连锁攻击', '元素', '远程'],
        icon: '⚡',
        maxLevel: 25
    },
    venomspider: {
        name: '毒蜘蛛',
        description: '发射毒液弹的怪物，造成持续伤害',
        health: generateMobHpValues(132),
        bodyDamage: generateMobAttackValues(3),
        weight: generateMobOtherValues(30),
        drops: [6, 10],
        rarity: 'rare',
        behaviors: ['毒伤', '持续伤害', '蜘蛛'],
        icon: '🕷️',
        maxLevel: 25
    },
    shieldguardian: {
        name: '盾卫',
        description: '高防御怪物，能抵挡一定数量的攻击，可跳跃移动',
        health: generateMobHpValues(180),
        bodyDamage: generateMobAttackValues(4),
        weight: generateMobOtherValues(60),
        drops: [7, 9],
        rarity: 'rare',
        behaviors: ['格挡', '防御', '重装', '跳跃'],
        icon: '🛡️',
        maxLevel: 25
    },
    bombbeetle: {
        name: '炸弹甲虫',
        description: '自爆型怪物，死亡时造成范围伤害',
        health: generateMobHpValues(120),
        bodyDamage: generateMobAttackValues(7),
        weight: generateMobOtherValues(24),
        drops: [13, 8],
        rarity: 'epic',
        behaviors: ['自爆', '范围伤害', '自杀攻击'],
        icon: '💣',
        maxLevel: 25
    },
    soldierant: {
        name: '兵蚁',
        description: '蚂蚁族群中的战士，攻击性强，快速移动',
        health: generateMobHpValues(144),
        bodyDamage: generateMobAttackValues(2),
        weight: generateMobOtherValues(42),
        drops: [3, 7],
        rarity: 'uncommon',
        behaviors: ['攻击性', '群体', '战士', '快速'],
        icon: '🐜',
        maxLevel: 25
    },
    workerant: {
        name: '工蚁',
        description: '蚂蚁族群中的工作者',
        health: generateMobHpValues(120),
        bodyDamage: generateMobAttackValues(2),
        weight: generateMobOtherValues(30),
        drops: [1, 3],
        rarity: 'common',
        behaviors: ['工作', '地面'],
        icon: '🐜',
        maxLevel: 25
    },
    babyant: {
        name: '幼蚁',
        description: '蚂蚁族群中的幼体，和平生物不攻击玩家',
        health: generateMobHpValues(60),
        bodyDamage: generateMobAttackValues(2),
        weight: generateMobOtherValues(20),
        drops: [1, 3],
        rarity: 'common',
        behaviors: ['幼体', '和平', '缓慢'],
        icon: '🐜',
        maxLevel: 25
    },
    antqueen: {
        name: '蚁后',
        description: '蚂蚁族群的首领，会召唤护卫，Boss级怪物',
        health: generateMobHpValues(900),
        bodyDamage: generateMobAttackValues(2),
        weight: generateMobHpValues(900), // 特殊：重量与血量相同
        drops: [15, 17],
        rarity: 'legendary',
        behaviors: ['召唤', '首领', 'Boss', '护卫'],
        icon: '👑',
        maxLevel: 25
    },
    bee: {
        name: '蜜蜂',
        description: '群居飞行怪物，与瓢虫有相似的掉落',
        health: generateMobHpValues(108),
        bodyDamage: generateMobAttackValues(10),
        weight: generateMobOtherValues(36),
        drops: [4, 11],
        rarity: 'common',
        behaviors: ['群体', '飞行', '数量优势'],
        icon: '🐝',
        maxLevel: 25
    },
    cactus: {
        name: '仙人掌',
        description: '沙漠中的防御型怪物，全身布满尖刺',
        health: generateMobHpValues(180),
        bodyDamage: generateMobAttackValues(3),
        weight: generateMobOtherValues(50),
        drops: [24],
        rarity: 'uncommon',
        behaviors: ['防御', '尖刺', '沙漠', '坦克'],
        icon: '🌵',
        maxLevel: 25
    },
    soil: {
        name: '土壤',
        description: '由泥土构成的怪物，无法移动但防御力强',
        health: generateMobHpValues(165),
        bodyDamage: generateMobAttackValues(2),
        weight: generateMobOtherValues(40),
        drops: [25],
        rarity: 'common',
        behaviors: ['防御', '地面', '缓慢', '土元素'],
        icon: '🟫',
        maxLevel: 25
    },
    evilcentipede: {
        name: '邪恶魔蜈蚣',
        description: '邪恶版本的蜈蚣，攻击性更强',
        health: generateMobHpValues(160),
        bodyDamage: generateMobAttackValues(2),
        weight: generateMobOtherValues(28),
        drops: [6, 22],
        rarity: 'rare',
        behaviors: ['邪恶', '分段', '快速', '波浪移动'],
        icon: '🐉',
        maxLevel: 25
    },
    darkladybug: {
        name: '黑暗瓢虫',
        description: '被黑暗力量侵蚀的瓢虫，攻击性极强',
        health: generateMobHpValues(126),
        bodyDamage: generateMobAttackValues(5),
        weight: generateMobOtherValues(40),
        drops: [26],
        rarity: 'rare',
        behaviors: ['黑暗', '冲刺', '腐蚀', '快速'],
        icon: '🐞',
        maxLevel: 25
    },
    dandeline: {
        name: '蒲公英',
        description: '能够随风传播种子的植物怪物，发射种子攻击',
        health: generateMobHpValues(144),
        bodyDamage: generateMobAttackValues(1),
        weight: generateMobOtherValues(55),
        drops: [23],
        rarity: 'uncommon',
        behaviors: ['植物', '飞行', '种子扩散', '随风'],
        icon: '🌼',
        maxLevel: 25
    },
    dandelinemissile: {
        name: '蒲公英种子',
        description: '蒲公英发射的追踪种子导弹',
        health: generateMobHpValues(10),
        bodyDamage: generateMobAttackValues(1),
        weight: generateMobOtherValues(10),
        drops: [],
        rarity: 'common',
        behaviors: ['追踪', '飞行', '种子', '导弹'],
        icon: '🌱',
        maxLevel: 25
    },
    hornetmissile: {
        name: '黄蜂导弹',
        description: '高速追踪导弹，具有强大的穿透力',
        health: generateMobHpValues(20),
        bodyDamage: generateMobAttackValues(1),
        weight: generateMobOtherValues(10),
        drops: [],
        rarity: 'rare',
        behaviors: ['追踪', '高速', '爆炸', '导弹'],
        icon: '🚀',
        maxLevel: 25
    }
};

// 稀有度配置
const RARITY_CONFIG = {
    common: { color: '#87ceeb', name: '普通' },
    uncommon: { color: '#90ee90', name: '罕见' },
    rare: { color: '#da70d6', name: '稀有' },
    epic: { color: '#ffa500', name: '史诗' },
    legendary: { color: '#ff6b6b', name: '传说' }
};

// 获取怪物在指定等级的属性
function getMonsterStats(monsterType, level) {
    const monster = MONSTER_DATA[monsterType];
    if (!monster || level < 1 || level > monster.health.length) {
        return null;
    }

    const levelIndex = level - 1;
    return {
        name: monster.name,
        health: monster.health[levelIndex],
        bodyDamage: monster.bodyDamage[levelIndex],
        weight: monster.weight[levelIndex],
        description: monster.description,
        rarity: monster.rarity,
        behaviors: monster.behaviors,
        drops: monster.drops,
        icon: monster.icon,
        maxLevel: monster.maxLevel
    };
}

// 获取掉落物信息
function getDropInfo(dropArray) {
    if (!dropArray || dropArray.length === 0) {
        return [];
    }

    return dropArray.map(dropType => ({
        type: dropType,
        name: PETAL_NAMES[dropType] || `未知${dropType}`,
        rarity: getItemRarity(dropType)
    }));
}

// 根据掉落物类型判断稀有度
function getItemRarity(dropType) {
    // 根据花瓣类型判断稀有度
    if ([0, 1, 3, 4].includes(dropType)) return 'common';      // 导弹、基础、叶子、翅膀
    if ([5, 9, 11, 16, 17].includes(dropType)) return 'uncommon'; // 雷电、磁铁、黄蜂导弹
    if ([6, 7, 10, 18].includes(dropType)) return 'rare';         // 毒液、盾牌、第三眼
    if ([8, 13].includes(dropType)) return 'epic';                // 炸弹、爆炸
    if ([12, 15, 19].includes(dropType)) return 'legendary';      // 珍珠、蚂蚁蛋
    return 'common';
}

// 获取玩家能查看的最高怪物等级（基于玩家最高花瓣等级+3）
function getMaxMonsterLevel() {
    // 计算玩家的最高花瓣等级
    let maxPetalLevel = 0;
    if (gameState && gameState.availablePetals) {
        gameState.availablePetals.forEach(petal => {
            if (petal.level && petal.level > maxPetalLevel) {
                maxPetalLevel = petal.level;
            }
        });
    }

    // 如果没有花瓣数据，默认显示到10级
    if (maxPetalLevel === 0) {
        maxPetalLevel = 7; // 默认显示到10级
    }

    return Math.min(maxPetalLevel + 3, 25); // 最高显示到25级
}

// 格式化数字显示
function formatNumber(num) {
    if (num === undefined || num === null) {
        return '0';
    }
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// 导出数据供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MONSTER_DATA,
        PETAL_NAMES,
        RARITY_CONFIG,
        getMonsterStats,
        getDropInfo,
        getItemRarity,
        getMaxMonsterLevel,
        formatNumber
    };
}