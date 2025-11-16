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
        23: 'dandelion'     // 蒲公英 (新增类型)
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
        dandelion: 2.5        // 蒲公英冷却时间，和missile一样
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
        dandelion: '蒲公英'
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
        dandelion: '蒲公英花瓣，类似导弹的花瓣，具有飘逸的外观和稳定的伤害'
    },

    // 花瓣血量数据 (1-25级)
    HEALTH: {
        missile: generateDoublingHealth(10),
        basic: generateDoublingHealth(10),
        leaf: generateDoublingHealth(10),
        wing: generateDoublingHealth(12),
        thunder: generateDoublingHealth(14),
        venom: generateDoublingHealth(10),
        shield: generateDoublingHealth(20),
        bomb: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        hornet_missile: generateTriplingHealth(20),
        magnet: generateDoublingHealth(12),
        thirdeye: generateDoublingHealth(14),
        stinger: generateDoublingHealth(8),
        orange: generateDoublingHealth(8),
        egg: generateDoublingHealth(8),
        square: generate23xHealth(2000),
        pearl: generateDoublingHealth(10),
        bud: generateDoublingHealth(15),
        antegg: generateDoublingHealth(6),
        rita: generateDoublingHealth(10),
        stick: generateDoublingHealth(15),
        card: generateDoublingHealth(10),
        peas: generateDoublingHealth(12),
        grapes: generateDoublingHealth(10),
        dandelion: generateDoublingHealth(10)
    },

    // 花瓣体伤数据 (1-25级)
    BODY_DAMAGE: {
        missile: generateTriplingHealth(30),
        basic: generateTriplingHealth(10),
        leaf: [0, 7, 20, 60, 180, 540, 1620, 4860, 14580, 43740, 131220, 393660, 1180980, 3542940, 10628820, 31886460, 95659380, 286978140, 860934420, 2582803260, 7748409780, 23245229340, 69735688020, 209207064060, 627621192180, 1882863576540],  // 伤害削弱到原来的2/3
        wing: generateTriplingHealth(13),
        thunder: generateTriplingHealth(13),
        venom: generateTriplingHealth(8),
        shield: generateTriplingHealth(5),
        bomb: [0, 17, 50, 150, 450, 1350, 4050, 12150, 36450, 109350, 328050, 984150, 2952450, 8857350, 26572050, 79716150, 239148450, 717445350, 2152336050, 6457008150, 19371022025, 58113073350, 174339220050, 523017660150, 1569052980450, 4707158941350],  // 伤害削弱到原来的2/3
        hornet_missile: [0, 1, 2, 5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480, 40960, 81920, 163840, 327680, 655360, 1310720, 2621440, 5242880, 10485760, 20971520],
        magnet: generateTriplingHealth(8),
        thirdeye: generateTriplingHealth(12),
        stinger: generateTriplingHealth(81),
        orange: generateTriplingHealth(22),
        egg: generateTriplingHealth(10),
        square: generateTriplingHealth(1),
        pearl: generateTriplingHealth(24),
        bud: generateTriplingHealth(5),
        antegg: generateDoublingHealth(8),
        rita: generateDoublingHealth(5),
        stick: generateDoublingHealth(12),
        card: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125],
        peas: [0, 14, 40, 120, 360, 1080, 3240, 9720, 29160, 87480, 262440, 787320, 2361960, 7085880, 21257640, 63772920, 191318760, 573956280, 1721868840, 5165606520, 15496819560, 46490458680, 139471376040, 418414128120, 1255242384360, 3765727153080],  // 伤害增强到原来的2倍
        grapes: [0, 10, 32, 96, 288, 864, 2592, 7776, 23328, 69984, 209952, 629856, 1889568, 5668704, 17006112, 51018336, 153055008, 459165024, 1377495072, 4132485216, 12397455648, 37192366944, 111577100832, 334731302496, 1004193907488, 3012581722464],  // 伤害增强到原来的2倍
        dandelion: [0, 30, 90, 270, 810, 2430, 7290, 21870, 65610, 196830, 590490, 1771470, 5314410, 15943230, 47829690, 143489070, 430467210, 1291401630, 3874204890, 11622614670, 34867844010, 104603532030, 313810596090, 941431788270, 2824295364810, 8472886094430]
    },

    // 花瓣回血数据 (1-25级，大部分为0)
    HEAL: {
        missile: Array(26).fill(0),
        basic: Array(26).fill(0),
        leaf: generateDoublingHealth(25).map((v, i) => i === 0 ? 0 : v / 2),
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
        dandelion: Array(26).fill(0)
    },

    // 花瓣重量数据 (1-25级)
    WEIGHT: {
        missile: generateTriplingHealth(1),
        basic: generateTriplingHealth(1),
        leaf: generateTriplingHealth(1),
        wing: generateTriplingHealth(1),
        thunder: generateTriplingHealth(3),
        venom: generateTriplingHealth(2),
        shield: generateTriplingHealth(4),
        bomb: generateTriplingHealth(5),
        hornet_missile: [0, 10, 30, 90, 270, 810, 2430, 8290, 24870, 74610, 223830, 671490, 2014470, 6043410, 18130230, 54390690, 163172070, 489516210, 1468548630, 4405645890, 13216937670, 39650813010, 118952439030, 356857317090, 1070571951270, 3211715853810],
        magnet: generateTriplingHealth(2),
        thirdeye: generateTriplingHealth(3),
        stinger: generateTriplingHealth(2),
        orange: generateTriplingHealth(2),
        egg: generateTriplingHealth(3),
        square: generateTriplingHealth(1),
        pearl: generateTriplingHealth(2),
        bud: generateTriplingHealth(2),
        antegg: generateTriplingHealth(2),
        rita: generateTriplingHealth(3),
        stick: generateTriplingHealth(2),
        card: generateTriplingHealth(3),
        peas: generateTriplingHealth(4),
        grapes: generateTriplingHealth(3),
        dandelion: generateTriplingHealth(1)
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