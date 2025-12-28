/**
 * 花瓣数值和机制数据 (25级支持版本)
 * 包含所有花瓣类型的血量、体伤、重量、回血和特殊机制
 * 前端可以直接调用此文件显示花瓣信息
 * 支持1-25级完整数据
 */

// 数据生成函数
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

function generate23xHealth(level1) {
    const health = [0];
    health.push(level1);
    let current = level1;
    for (let i = 2; i <= 25; i++) {
        current *= 2.3;
        health.push(Math.round(current));
    }
    return health;
}

function generateICHealth(level1) {
    const health = [0];
    health.push(level1);
    let current = level1;
    for (let i = 2; i <= 10; i++) {
        current = Math.round(current * 1.5);
        health.push(current);
    }
    // IC以后每级0.5倍
    for (let i = 11; i <= 25; i++) {
        current = Math.round(current * 1.4);
        health.push(current);
    }
    return health;
}
// 花瓣相对值表格（与后端保持一致）
const PETAL_RELATIVE_VALUES = [
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
}

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

const PETALS_DATA = {
    // 花瓣类型映射 (根据服务器allPetals数组顺序)
    TYPE_MAP: {
        0: 'missile',
        1: 'basic',
        2: 'hornet_missile',  // 索引2是黄蜂导弹
        3: 'leaf',
        4: 'wing',
        5: 'thunder',
        6: 'venom',
        7: 'shield',
        8: 'bomb',
        9: 'magnet',
        10: 'thirdeye',
        11: 'stinger',
        12: 'orange',
        13: 'egg',
        14: 'square',
        15: 'pearl',
        16: 'bud',          // 花蕾
        17: 'antegg',       // 蚂蚁蛋
        18: 'rita',         // Rita
        19: 'stick',         // 棍子 (新增类型)
        20: 'card',         // 卡牌 (新增类型)
        21: 'peas',         // 豌豆 (新增类型)
        22: 'grapes',       // 葡萄 (新增类型)
        23: 'dandelion',    // 蒲公英 (新增类型)
        24: 'cactus_petal', // 仙人掌花瓣 (新增类型)
        25: 'soil_petal',   // 土壤花瓣 (新增类型)
        26: 'starfish_petal' // 海星花瓣 (新增类型)
    },

    // 花瓣基础属性 (冷却时间秒)
    COOLDOWNS: {
        missile: 2.5,
        basic: 1.8,
        hornet_missile: null,  // 特殊机制，无固定冷却
        leaf: 1.0,
        wing: 1.0,
        thunder: 3.0,
        venom: 2.8,
        shield: 4.0,
        bomb: 3.5,
        magnet: 2.0,
        thirdeye: 2.2,
        stinger: 5.0,
        orange: 2.0,
        egg: 2.0,
        square: 5.0,
        pearl: 2.0,
        bud: 3.0,             // 特殊机制，检测死亡队友
        antegg: 5.0,           // 蚂蚁蛋冷却时间
        rita: 2,              // 特殊机制，随mob死亡触发
        stick: 2.0,
        card: 2.5,
        peas: 3.0,            // 豌豆冷却时间
        grapes: 3.5,          // 葡萄冷却时间，比peas稍长
        dandelion: 2.5,       // 蒲公英冷却时间，和missile一样
        cactus_petal: 2.0,    // 仙人掌花瓣冷却时间
        soil_petal: 2.5,      // 土壤花瓣冷却时间
        starfish_petal: 1.5   // 海星花瓣冷却时间
    },

    // 等级名称映射 (1-25级)
    LEVEL_NAMES: {
        1: 'common',      // 普通
        2: 'uncommon',    // 少见
        3: 'rare',        // 稀有
        4: 'epic',        // 精良
        5: 'legendary',   // 传说的
        6: 'mythic',      // 神话
        7: 'ultra',       // 终极
        8: 'super',       // 超级
        9: 'mega',        // 兆级
        10: 'immortal',   // 不朽
        11: 'eternal',    // 永恒
        12: 'infinite',   // 无限
        13: 'transcendent', // 超绝
        14: 'cosmic',     // 宇宙
        15: 'divine_essence', // 神之精华
        16: 'celestial_force', // 天体之力
        17: 'ultimate',   // 终极极致
        18: 'omega',      // 欧米伽
        19: 'infinity',   // 无穷
        20: 'beyond',     // 超越
        21: 'ascendant',  // 飞升
        22: 'quantum',    // 量子
        23: 'void',       // 虚空
        24: 'genesis',    // 创世
        25: 'absolute'    // 绝对
    },

    // 等级显示名称 (中文)
    LEVEL_DISPLAY_NAMES: {
        1: '普通',
        2: '少见',
        3: '稀有',
        4: '精良',
        5: '传说',
        6: '神话',
        7: '终极',
        8: '超级',
        9: '兆级',
        10: '不朽',
        11: '永恒',
        12: '无限',
        13: '超绝',
        14: '宇宙',
        15: '神之精华',
        16: '天体之力',
        17: '终极极致',
        18: '欧米伽',
        19: '无穷',
        20: '超越',
        21: '飞升',
        22: '量子',
        23: '虚空',
        24: '创世',
        25: '绝对'
    },

    // 花瓣名称 (中文显示)
    NAMES: {
        missile: '导弹',
        basic: '基础',
        leaf: '叶子',
        wing: '翅膀',
        thunder: '雷电',
        venom: '鸢尾花',
        shield: '护盾',
        bomb: '炸弹',
        hornet_missile: '黄蜂导弹',
        magnet: '磁铁',
        thirdeye: '第三只眼',
        stinger: '刺针',
        orange: '橙子',
        egg: '蛋',
        square: '方形',
        pearl: '珍珠',
        bud: '花蕾',
        antegg: '蚂蚁蛋',
        rita: 'Rita',
        stick: '棍子',
        card: '卡牌',
        peas: '豌豆',
        grapes: '葡萄',
        dandelion: '蒲公英',
        cactus_petal: '仙人掌',
        soil_petal: '土壤',
        starfish_petal: '海星'
    },

    // 花瓣描述
    DESCRIPTIONS: {
        missile: '发射导弹，造成单体高额伤害，发射距离200像素',
        basic: '基础花瓣，提供稳定的伤害输出',
        leaf: '叶子花瓣，平衡的血量和伤害',
        wing: '翅膀花瓣，具有特殊的飞行轨迹攻击模式',
        thunder: '雷电花瓣，造成连锁闪电伤害，可攻击多个目标',
        venom: '鸢尾花瓣，施加持续中毒伤害效果',
        shield: '贝壳花瓣，每3秒自动发射三个低一级的珍珠弹丸',
        bomb: '炸弹花瓣，死亡时爆炸造成范围伤害',
        hornet_missile: '黄蜂导弹，高速追踪导弹',
        magnet: '磁铁花瓣，扩大物品拾取范围',
        thirdeye: '第三只眼花瓣，扩大花瓣公转半径',
        stinger: '刺针花瓣，多单体攻击，每个刺针独立血量和攻击',
        orange: '橙子花瓣，多单体攻击，类似刺针机制',
        egg: '蛋花瓣，孵化出爆炸甲虫协助战斗',
        square: '方形花瓣，基础花瓣的护盾变体',
        pearl: '珍珠花瓣，类似导弹但射程更远，可发射珍珠弹丸',
        bud: '花蕾花瓣，检测死亡队友，防守时可转化为地面形态复活队友',
        antegg: '蚂蚁蛋花瓣，5个独立单体，7秒孵化时间，孵化出兵蚁协助战斗',
        rita: 'Rita花瓣，友谊的力量',
        stick: '棍子花瓣，5个独立单体，7秒孵化时间，孵化出沙尘暴协助战斗',
        card: '卡牌花瓣，加快波次速度，等比例降低怪物生成间隔，每级3%加速，25级最多75%加速',
        peas: '豌豆花瓣，4个独立单体，每个豌豆独立攻击，高伤害输出',
        grapes: '葡萄花瓣，4个独立单体，每个葡萄造成伤害并添加毒伤效果',
        dandelion: '蒲公英花瓣，类似导弹的花瓣，具有飘逸的外观和稳定的伤害',
        cactus_petal: '仙人掌花瓣，给玩家增加永久血量',
        soil_petal: '土壤花瓣，给玩家增加永久血量',
        starfish_petal: '海星花瓣，在玩家血量低于50%时自动回血，回血量是leaf花瓣的两倍'
    },

   // 花瓣血量数据 (1-25级) - 使用新的相对值生成
    HEALTH: {
        missile: generateRelativeValues(10),
        basic: generateRelativeValues(10),
        leaf: generateRelativeValues(10),
        wing: generateRelativeValues(12),
        thunder: generateRelativeValues(14),
        venom: generateRelativeValues(10),
        shield: generateRelativeValues(20),
        bomb: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        hornet_missile: generateRelativeValues(20),
        magnet: generateRelativeValues(12),
        thirdeye: generateRelativeValues(14),
        stinger: generateRelativeValues(8),
        orange: generateRelativeValues(8),
        egg: generateRelativeValues(8),
        square: generateRelativeValues(2000),
        pearl: generateRelativeValues(10),
        bud: generateRelativeValues(15),
        antegg: generateRelativeValues(6),
        rita: generateRelativeValues(10),
        stick: generateRelativeValues(15),
        card: generateRelativeValues(10),
        peas: generateRelativeValues(12),
        grapes: generateRelativeValues(10),
        dandelion: generateRelativeValues(10),
        cactus_petal: generateRelativeValues(15),
        soil_petal: generateRelativeValues(18),
        starfish_petal: generateRelativeValues(8)
    },

    // 花瓣体伤数据 (1-25级) - 使用新的相对值生成
    BODY_DAMAGE: {
        missile: generateRelativeValues(30),
        basic: generateRelativeValues(10),
        leaf: generateRelativeValues(7),
        wing: generateRelativeValues(13),
        thunder: generateRelativeValues(13),
        venom: generateRelativeValues(8),
        shield: generateRelativeValues(5),
        bomb: generateRelativeValues(17),
        hornet_missile: generateRelativeValues(1),
        magnet: generateRelativeValues(8),
        thirdeye: generateRelativeValues(12),
        stinger: generateRelativeValues(81),
        orange: generateRelativeValues(22),
        egg: generateRelativeValues(10),
        square: generateRelativeValues(1),
        pearl: generateRelativeValues(24),
        bud: generateRelativeValues(5),
        antegg: generateRelativeValues(40),
        rita: generateRelativeValues(5),
        stick: generateRelativeValues(40),
        card: generateRelativeValues(5),
        peas: generateRelativeValues(14),
        grapes: generateRelativeValues(10),
        dandelion: generateRelativeValues(30),
        cactus_petal: generateRelativeValues(12),
        soil_petal: generateRelativeValues(8),
        starfish_petal: generateRelativeValues(5)
    },

    // 花瓣回血数据 (1-25级) - 使用新的相对值生成
    HEAL: {
        missile: Array(26).fill(0),
        basic: Array(26).fill(0),
        leaf: generateRelativeValues(25),
        wing: Array(26).fill(0),
        thunder: Array(26).fill(0),
        venom: Array(26).fill(0),
        shield: Array(26).fill(0),
        bomb: Array(26).fill(0),
        hornet_missile: Array(26).fill(0),
        magnet: Array(26).fill(0),
        thirdeye: Array(26).fill(0),
        stinger: Array(26).fill(0),
        orange: Array(26).fill(0),
        egg: Array(26).fill(0),
        square: Array(26).fill(0),
        pearl: Array(26).fill(0),
        bud: Array(26).fill(0),
        antegg: Array(26).fill(0),
        rita: Array(26).fill(0),
        stick: Array(26).fill(0),
        card: Array(26).fill(0),
        peas: Array(26).fill(0),
        grapes: Array(26).fill(0),
        dandelion: Array(26).fill(0),
        cactus_petal: Array(26).fill(0),
        soil_petal: Array(26).fill(0),
        starfish_petal: generateRelativeValues(50)
    },

    // 花瓣重量数据 (1-25级) - 使用新的相对值生成
    WEIGHT: {
        missile: generateRelativeValues(1),
        basic: generateRelativeValues(1),
        leaf: generateRelativeValues(1),
        wing: generateRelativeValues(1),
        thunder: generateRelativeValues(3),
        venom: generateRelativeValues(2),
        shield: generateRelativeValues(4),
        bomb: generateRelativeValues(5),
        hornet_missile: generateRelativeValues(10),
        magnet: generateRelativeValues(2),
        thirdeye: generateRelativeValues(3),
        stinger: generateRelativeValues(2),
        orange: generateRelativeValues(2),
        egg: generateRelativeValues(3),
        square: generateRelativeValues(1),
        pearl: generateRelativeValues(2),
        bud: generateRelativeValues(3),
        antegg: generateRelativeValues(2),
        rita: generateRelativeValues(3),
        stick: generateRelativeValues(2),
        card: generateRelativeValues(3),
        peas: generateRelativeValues(4),
        grapes: generateRelativeValues(3),
        dandelion: generateRelativeValues(1),
        cactus_petal: generateRelativeValues(3),
        soil_petal: generateRelativeValues(3),
        starfish_petal: generateRelativeValues(2)
    },
    // 特殊机制数据
    SPECIAL_MECHANICS: {
        missile: {
            range: 200,  // 发射距离
            speed: 10,    // 飞行速度
            type: 'projectile'  // 投射物类型
        },
        basic: {
            type: 'melee'  // 近战类型
        },
        leaf: {
            heal_type: 'passive',  // 被动回血
            type: 'melee'
        },
        wing: {
            range: 300,     // 最大飞行距离
            type: 'special', // 特殊飞行轨迹
            sine_pattern: true  // 正弦波飞行模式
        },
        thunder: {
            chain_range: 150,      // 连锁范围基数
            chain_by_level: {
                1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5,      // 1-6级：5个连锁
                7: 6, 8: 6, 9: 6, 10: 6, 11: 6, 12: 6,  // 7-12级：6个连锁
                13: 7, 14: 7, 15: 7, 16: 7, 17: 7, 18: 7, 19: 7, 20: 7, 21: 7, 22: 8, 23: 8, 24: 8, 25: 8  // 13-21级：7个连锁，22-25级：8个连锁
            },
            chain_damage_factor: 0.5, // 连锁伤害衰减系数
            type: 'chain'          // 连锁闪电
        },
        venom: {
            poison_duration: 3.0,   // 中毒持续时间(秒)
            poison_damage_factor: 1.0, // 中毒伤害系数：体伤的100%
            type: 'poison'         // 毒液效果
        },
        shield: {
            fire_interval: 3.0,     // 发射间隔(秒)
            pearls_per_fire: 3,     // 每次发射的珍珠数量
            pearl_level_penalty: 1, // 珍珠等级降低数
            fire_angle_spread: 30,  // 发射角度扩散范围(度)
            type: 'auto_turret'     // 自动炮塔类型
        },
        bomb: {
            explosion_radius: 100,  // 基础爆炸半径
            radius_per_level: 50,   // 每级增加半径
            explosion_damage_factor: 2, // 爆炸伤害倍数
            type: 'explosion'       // 爆炸类型
        },
        hornet_missile: {
            speed_factor: 2,        // 速度倍数
            range: 200,             // 飞行距离
            type: 'homing'          // 追踪导弹
        },
        magnet: {
            pickup_range_bonus: 100, // 基础拾取范围加成
            pickup_range_per_level: 50, // 每级增加范围
            base_pickup_range: 50,   // 基础拾取范围
            type: 'utility'          // 功能型
        },
        thirdeye: {
            orbit_radius_bonus: 20,  // 基础公转半径加成
            orbit_radius_per_level: 18, // 每级增加半径
            base_orbit_radius: 80,   // 基础公转半径
            type: 'utility'          // 功能型
        },
        stinger: {
            multi_entity: true,      // 多单体
            independent_cooldown: true, // 独立冷却
            type: 'multi_projectile' // 多投射物
        },
        orange: {
            multi_entity: true,      // 多单体
            independent_cooldown: true, // 独立冷却
            type: 'multi_projectile' // 多投射物
        },
        egg: {
            hatch_time: 5.0,         // 孵化时间(秒)
            cooldown_time: 2.0,      // 冷却时间(秒)
            max_beetles: 3,          // 最大甲虫数量
            type: 'spawner'          // 召唤类型
        },
        square: {
            shield_duration: 20,     // 护盾持续时间(秒)
            shield_cooldown: 1.0,    // 护盾冷却时间(秒)
            shield_health_factor: 2,  // 护盾血量倍数
            size_multiplier: 7,      // 激活时大小倍数
            radius_multiplier: 8,    // 激活时半径倍数
            weight_multiplier: 999999999, // 激活时重量
            type: 'shield'           // 护盾类型
        },
        pearl: {
            range: 250,              // 发射距离
            speed: 10,               // 飞行速度
            type: 'projectile'       // 投射物类型
        },
        bud: {
            revive_detection: true,  // 死亡队友检测
            transform_condition: 'defend',  // 防守状态触发
            ground_duration: 3.0,   // 地面形态存活时间(秒)
            ground_health: 100,     // 地面形态基础血量
            ground_health_per_level: 30,  // 每级增加血量
            type: 'reviver'         // 复活类型
        },
        antegg: {
            multi_entity: true,     // 多单体
            entity_count: 5,        // 单体数量
            hatch_time: 5.0,        // 孵化时间(秒)
            spawn_type: 'soldier_ant',  // 孵化类型
            type: 'spawner'         // 召唤类型
        },
        rita: {
            mob_death_trigger: true, // 怪物死亡触发
            spawn_location: 'death_position',  // 在死亡位置生成
            spawn_type: 'rita_mob', // 生成生物类型
            type: 'necromancer'     // 死灵法师类型
        },
        stick: {
            type: 'melee'  // 近战类型
        },
        card: {
            wave_speed_bonus_per_level: 0.03,  // 每级3%加速
            max_wave_speed_bonus: 0.75,         // 最大75%加速
            type: 'wave_accelerator'            // 波次加速器类型
        },
        peas: {
            multi_entity: true,              // 多单体
            entity_count: 4,                 // 单体数量
            independent_cooldown: true,      // 独立冷却
            type: 'multi_projectile'         // 多投射物
        },
        grapes: {
            multi_entity: true,              // 多单体
            entity_count: 4,                 // 单体数量
            independent_cooldown: true,      // 独立冷却
            poison_damage: true,             // 造成毒伤
            poison_duration: 3.0,            // 中毒持续时间(秒)
            poison_damage_factor: 0.5,       // 中毒伤害系数：体伤的50%
            type: 'multi_projectile'         // 多投射物
        },
        dandelion: {
            range: 200,                      // 发射距离
            speed: 8,                        // 飞行速度
            type: 'projectile'               // 投射物类型
        }
    },

    /**
     * 获取花瓣数据
     * @param {string|number} petalType 花瓣类型(名称或索引)
     * @param {number} level 花瓣等级 (1-19)
     * @returns {object} 花瓣完整数据
     */
    getPetalData(petalType, level = 1) {
        // 处理索引到名称的转换
        if (typeof petalType === 'number') {
            petalType = this.TYPE_MAP[petalType];
        }

        if (!petalType || !this.NAMES[petalType]) {
            return null;
        }

        // 确保等级在有效范围内
        level = Math.max(1, Math.min(25, level));

        return {
            type: petalType,
            name: this.NAMES[petalType],
            description: this.DESCRIPTIONS[petalType],
            cooldown: this.COOLDOWNS[petalType],
            health: this.HEALTH[petalType][level],
            bodyDamage: this.BODY_DAMAGE[petalType][level],
            heal: this.HEAL[petalType][level],
            weight: this.WEIGHT[petalType][level],
            level: level,
            mechanics: this.SPECIAL_MECHANICS[petalType] || {},
            hasHeal: this.HEAL[petalType][level] > 0
        };
    },

    /**
     * 获取所有花瓣类型的列表
     * @returns {array} 花瓣类型数组
     */
    getAllPetalTypes() {
        return Object.keys(this.NAMES);
    },

    /**
     * 获取花瓣等级列表
     * @returns {array} 等级数组 (1-19)
     */
    getPetalLevels() {
        return Array.from({length: 25}, (_, i) => i + 1);
    },

    /**
     * 根据索引获取花瓣名称
     * @param {number} index 花瓣索引
     * @returns {string} 花瓣名称
     */
    getPetalNameByIndex(index) {
        const type = this.TYPE_MAP[index];
        return type ? this.NAMES[type] : 'Unknown';
    },

    /**
     * 格式化数字显示
     * @param {number} num 要格式化的数字
     * @returns {string} 格式化后的字符串
     */
    formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        } else if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    /**
     * 获取花瓣属性文本描述
     * @param {string|number} petalType 花瓣类型
     * @param {number} level 花瓣等级
     * @returns {object} 格式化的属性文本
     */
    getPetalStatsText(petalType, level = 1) {
        const data = this.getPetalData(petalType, level);
        if (!data) return null;

        const stats = [];

        // 血量
        stats.push(`❤️ 血量: ${this.formatNumber(data.health)}`);

        // 体伤
        stats.push(`⚔️ 伤害: ${this.formatNumber(data.bodyDamage)}`);

        // 重量
        stats.push(`⚖️ 重量: ${this.formatNumber(data.weight)}`);

        // 回血 (如果大于0)
        if (data.hasHeal) {
            stats.push(`💚 回血: ${this.formatNumber(data.heal)}`);
        }

        // 冷却时间
        if (data.cooldown !== null) {
            stats.push(`⏱️ 冷却: ${data.cooldown}秒`);
        } else {
            stats.push(`⏱️ 冷却: 特殊机制`);
        }

        // 添加特殊机制详细信息
        const mechanics = data.mechanics;
        if (mechanics) {
            switch (data.type) {
                case 'missile':
                    stats.push(`🎯 射程: ${mechanics.range}px`);
                    stats.push(`💨 速度: ${mechanics.speed}`);
                    break;

                case 'pearl':
                    stats.push(`🎯 射程: ${mechanics.range}px`);
                    stats.push(`💨 速度: ${mechanics.speed}`);
                    break;

                case 'wing':
                    stats.push(`🌀 最大距离: ${mechanics.range}px`);
                    break;

                case 'thunder':
                    const chainRange = 100 + level * 25;
                    const maxChains = mechanics.chain_by_level[level] || 5;
                    stats.push(`⚡ 连锁范围: ${chainRange}px`);
                    stats.push(`🔗 最大连锁: ${maxChains}个`);
                    stats.push(`📉 伤害衰减: ${mechanics.chain_damage_factor * 100}%`);
                    break;

                case 'venom':
                    stats.push(`☠️ 中毒持续: ${mechanics.poison_duration}秒`);
                    stats.push(`🩸 每秒伤害: 伤害${(mechanics.poison_damage_factor * 100)}%`);
                    break;

                case 'shield':
                    stats.push(`🔫 发射间隔: ${mechanics.fire_interval}秒`);
                    stats.push(`⚪ 每次发射: ${mechanics.pearls_per_fire}个珍珠`);
                    stats.push(`📉 珍珠等级: ${Math.max(1, level - mechanics.pearl_level_penalty)}级`);
                    stats.push(`🎯 发射角度: ±${mechanics.fire_angle_spread}°`);
                    break;

                case 'square':
                    stats.push(`🛡️ 护盾持续: ${mechanics.shield_duration}秒`);
                    stats.push(`🔄 护盾冷却: ${mechanics.shield_cooldown}秒`);
                    stats.push(`💪 护盾血量: ${mechanics.shield_health_factor}x`);
                    break;

                case 'bomb':
                    const explosionRadius = mechanics.explosion_radius + mechanics.radius_per_level * level;
                    stats.push(`💥 爆炸半径: ${explosionRadius}px`);
                    stats.push(`🔥 爆炸伤害: ${mechanics.explosion_damage_factor}x`);
                    break;

                case 'hornet_missile':
                    stats.push(`🎯 追踪导弹`);
                    stats.push(`💨 速度倍数: ${mechanics.speed_factor}x`);
                    stats.push(`📏 射程: ${mechanics.range}px`);
                    break;

                case 'magnet':
                    const pickupRange = mechanics.pickup_range_bonus + mechanics.pickup_range_per_level * level;
                    const totalRange = pickupRange + mechanics.base_pickup_range;
                    stats.push(`🧲 拾取范围: +${totalRange}px`);
                    break;

                case 'thirdeye':
                    const orbitRadius = mechanics.orbit_radius_bonus + mechanics.orbit_radius_per_level * level;
                    const totalOrbitRadius = orbitRadius + mechanics.base_orbit_radius;
                    stats.push(`👁️ 公转半径: +${totalOrbitRadius}px`);
                    break;

                case 'stinger':
                case 'orange':
                    break;

                case 'egg':
                    stats.push(`🥚 孵化时间: ${mechanics.hatch_time}秒`);
                    stats.push(`⏱️ 冷却时间: ${mechanics.cooldown_time}秒`);
                    stats.push(`🪰 最大甲虫: ${mechanics.max_beetles}只`);
                    break;

                case 'leaf':
                    break;

                case 'basic':
                    break;

                case 'bud':
                    stats.push(`🌸 检测死亡队友`);
                    stats.push(`🛡️ 防守状态触发复活`);
                    stats.push(`⏱️ 地面形态存活: ${mechanics.ground_duration}秒`);
                    const groundHealth = mechanics.ground_health + mechanics.ground_health_per_level * level;
                    stats.push(`❤️ 地面血量: ${groundHealth}`);
                    break;

                case 'antegg':
                    stats.push(`🥚 孵化时间: ${mechanics.hatch_time}秒`);
                    stats.push(`🐜 孵化类型: 兵蚁`);
                    stats.push(`🔢 单体数量: ${mechanics.entity_count}个`);
                    stats.push(`⏱️ 冷却: 5.0秒`);
                    break;

                case 'rita':
                    stats.push(`💀 死亡触发机制`);
                    stats.push(`👻 在死亡位置生成友方生物`);
                    stats.push(`🔄 无冷却时间`);
                    break;

                case 'card':
                    const speedBonus = Math.min(mechanics.max_wave_speed_bonus, mechanics.wave_speed_bonus_per_level * level);
                    const speedPercent = Math.round(speedBonus * 100);
                    stats.push(`⚡ 波次加速: +${speedPercent}%`);
                    break;
            }
        }

        return {
            stats: stats,
            mechanics: data.mechanics
        };
    }
};

// 导出到全局作用域，方便前端调用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PETALS_DATA;
} else {
    window.PETALS_DATA = PETALS_DATA;
}