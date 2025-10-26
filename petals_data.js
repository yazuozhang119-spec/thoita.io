/**
 * 花瓣数值和机制数据
 * 包含所有花瓣类型的血量、体伤、重量、回血和特殊机制
 * 前端可以直接调用此文件显示花瓣信息
 */

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
        15: 'pearl'
    },

    // 花瓣基础属性 (冷却时间秒)
    COOLDOWNS: {
        missile: 2.5,
        basic: 2.5,
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
        pearl: 2.0
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
        pearl: '珍珠'
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
        pearl: '珍珠花瓣，类似导弹但射程更远，可发射珍珠弹丸'
    },

    // 花瓣血量数据 (1-19级)
    HEALTH: {
        missile: [0, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480, 40960, 81920, 163840, 327680, 655360, 1310720, 2621440],
        basic: [0, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480, 40960, 81920, 163840, 327680, 655360, 1310720, 2621440],
        leaf: [0, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480, 40960, 81920, 163840, 327680, 655360, 1310720, 2621440],
        wing: [0, 12, 24, 48, 96, 192, 384, 768, 1536, 3072, 6144, 12288, 24576, 49152, 98304, 196608, 393216, 786432, 1572864, 3145728],
        thunder: [0, 14, 28, 56, 112, 224, 448, 896, 1792, 3584, 7168, 14336, 28672, 57344, 114688, 229376, 458752, 917504, 1835008, 3670016],
        venom: [0, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480, 40960, 81920, 163840, 327680, 655360, 1310720, 2621440],
        shield: [0, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480, 40960, 81920, 163840, 327680, 655360, 1310720, 2621440, 5242880],
        bomb: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        hornet_missile: [0, 5, 15, 45, 135, 405, 1215, 3645, 10935, 32805, 98415, 295245, 885735, 2657205, 7971615, 23914845, 71744535, 215233605, 645700815, 1937102445],
        magnet: [0, 12, 24, 48, 96, 192, 384, 768, 1536, 3072, 6144, 12288, 24576, 49152, 98304, 196608, 393216, 786432, 1572864, 3145728],
        thirdeye: [0, 14, 28, 56, 112, 224, 448, 896, 1792, 3584, 7168, 14336, 28672, 57344, 114688, 229376, 458752, 917504, 1835008, 3670016],
        stinger: [0, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152],
        orange: [0, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152],
        egg: [0, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152],
        square: [0, 2000, 4600, 10580, 24334, 55968, 128726, 296069, 680958, 1566203, 3602266, 8285209, 19055979, 43828750, 100806124, 231854084, 533264392, 1226508100, 2820968628, 6488227843],
        pearl: [0, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480, 40960, 81920, 163840, 327680, 655360, 1310720, 2621440]
    },

    // 花瓣体伤数据 (1-19级)
    BODY_DAMAGE: {
        missile: [0, 30, 90, 270, 810, 2430, 7290, 21870, 65610, 196830, 590490, 1771470, 5314410, 15943230, 47829690, 143489070, 430467210, 1291401630, 3874204890, 11622614670],
        basic: [0, 10, 30, 90, 270, 810, 2430, 7290, 21870, 65610, 196830, 590490, 1771470, 5314410, 15943230, 47829690, 143489070, 430467210, 1291401630, 3874204890],
        leaf: [0, 10, 30, 90, 270, 810, 2430, 7290, 21870, 65610, 196830, 590490, 1771470, 5314410, 15943230, 47829690, 143489070, 430467210, 1291401630, 3874204890],
        wing: [0, 13, 39, 117, 351, 1053, 3159, 9477, 28431, 85293, 255879, 767637, 2302911, 6908733, 20726199, 62178597, 186535791, 559607373, 1678822119, 5036466357],
        thunder: [0, 13, 40, 120, 360, 1080, 3240, 9720, 29160, 87480, 262440, 787320, 2361960, 7085880, 21257640, 63772920, 191318760, 573956280, 1721868840, 5165606520],
        venom: [0, 8, 24, 72, 216, 648, 1944, 5832, 17496, 52488, 157464, 472392, 1417176, 4251528, 12754584, 38263752, 114791256, 344373768, 1033121304, 3099363912],
        shield: [0, 5, 15, 45, 135, 405, 1215, 3645, 10935, 32805, 98415, 295245, 885735, 2657205, 7971615, 23914845, 71744535, 215233605, 645700815, 1937102445],
        bomb: [0, 25, 75, 225, 675, 2025, 6075, 18225, 54675, 164025, 492075, 1476225, 4428675, 13286025, 39858075, 119574225, 358722675, 1076168025, 3228504075, 9685512225],
        hornet_missile: [0, 10, 30, 90, 270, 810, 2430, 8290, 24870, 74610, 223830, 671490, 2014470, 6043410, 18130230, 54390690, 163172070, 489516210, 1468548630, 4405645890],
        magnet: [0, 8, 24, 72, 216, 648, 1944, 5832, 17496, 52488, 157464, 472392, 1417176, 4251528, 12754584, 38263752, 114791256, 344373768, 1033121304, 3099363912],
        thirdeye: [0, 12, 36, 108, 324, 972, 2916, 8748, 26244, 78732, 236196, 708588, 2125764, 6377292, 19131876, 57395628, 172186884, 516560652, 1549681956, 4649045868],
        stinger: [0, 81, 243, 729, 2187, 6561, 19683, 59049, 177147, 531441, 1594323, 4782969, 14348907, 43046721, 129140163, 387420489, 1162261467, 3486784401, 10460353203, 31381059609],
        orange: [0, 22, 65, 194, 583, 1750, 5249, 15746, 47239, 141718, 425153, 1275458, 3826375, 11479126, 34437370, 103312131, 309936391, 929809174, 2789427521, 8368282562],
        egg: [0, 10, 30, 90, 270, 810, 2430, 7290, 21870, 65610, 196830, 590490, 1771470, 5314410, 15943230, 47829690, 143489070, 430467210, 1291401630, 3874204890],
        square: [0, 1, 3, 9, 27, 81, 243, 729, 2187, 6561, 19683, 59049, 177147, 531441, 1594323, 4782969, 14348907, 43046721, 129140163, 387420489],
        pearl: [0, 24, 72, 216, 648, 1944, 5832, 17496, 52488, 157464, 472392, 1417176, 4251528, 12754584, 38263752, 114791256, 344373768, 1033121304, 3099363912, 9298091736]
    },

    // 花瓣回血数据 (1-19级，大部分为0)
    HEAL: {
        missile: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        basic: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        leaf: [0, 25, 50, 100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200, 102400, 204800, 409600, 819200, 1638400, 3276800, 6553600],
        wing: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        thunder: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        venom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        shield: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        bomb: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        hornet_missile: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        magnet: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        thirdeye: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        stinger: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        orange: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        egg: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        square: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        pearl: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },

    // 花瓣重量数据 (1-19级)
    WEIGHT: {
        missile: [0, 1, 3, 9, 27, 81, 243, 829, 2487, 7461, 22383, 67149, 201447, 604341, 1813023, 5439069, 16317207, 48951621, 146854863, 440564589],
        basic: [0, 1, 3, 9, 27, 81, 243, 829, 2487, 7461, 22383, 67149, 201447, 604341, 1813023, 5439069, 16317207, 48951621, 146854863, 440564589],
        leaf: [0, 1, 3, 9, 27, 81, 243, 829, 2487, 7461, 22383, 67149, 201447, 604341, 1813023, 5439069, 16317207, 48951621, 146854863, 440564589],
        wing: [0, 1, 3, 9, 27, 81, 243, 829, 2487, 7461, 22383, 67149, 201447, 604341, 1813023, 5439069, 16317207, 48951621, 146854863, 440564589],
        thunder: [0, 3, 9, 27, 81, 243, 729, 2187, 6561, 19683, 59049, 177147, 531441, 1594323, 4782969, 14348907, 43046721, 129140163, 387420489, 1162261467],
        venom: [0, 2, 6, 18, 54, 162, 486, 1458, 4374, 13122, 39366, 118098, 354294, 1062882, 3188646, 9565938, 28697814, 86093442, 258280326, 774840978],
        shield: [0, 4, 12, 36, 108, 324, 972, 2916, 8748, 26244, 78732, 236196, 708588, 2125764, 6377292, 19131876, 57395628, 172186884, 516560652, 1549681956],
        bomb: [0, 5, 15, 45, 135, 405, 1215, 3645, 10935, 32805, 98415, 295245, 885735, 2657205, 7971615, 23914845, 71744535, 215233605, 645700815, 1937102445],
        hornet_missile: [0, 10, 30, 90, 270, 810, 2430, 8290, 24870, 74610, 223830, 671490, 2014470, 6043410, 18130230, 54390690, 163172070, 489516210, 1468548630, 4405645890],
        magnet: [0, 2, 6, 18, 54, 162, 486, 1458, 4374, 13122, 39366, 118098, 354294, 1062882, 3188646, 9565938, 28697814, 86093442, 258280326, 774840978],
        thirdeye: [0, 3, 9, 27, 81, 243, 729, 2187, 6561, 19683, 59049, 177147, 531441, 1594323, 4782969, 14348907, 43046721, 129140163, 387420489, 1162261467],
        stinger: [0, 2, 6, 18, 54, 162, 486, 1458, 4374, 13122, 39366, 118098, 354294, 1062882, 3188646, 9565938, 28697814, 86093442, 258280326, 774840978],
        orange: [0, 2, 6, 18, 54, 162, 486, 1458, 4374, 13122, 39366, 118098, 354294, 1062882, 3188646, 9565938, 28697814, 86093442, 258280326, 774840978],
        egg: [0, 3, 9, 27, 81, 243, 729, 2187, 6561, 19683, 59049, 177147, 531441, 1594323, 4782969, 14348907, 43046721, 129140163, 387420489, 1162261467],
        square: [0, 1, 3, 9, 27, 81, 243, 829, 2487, 7461, 22383, 67149, 201447, 604341, 1813023, 5439069, 16317207, 48951621, 146854863, 440564589],
        pearl: [0, 2, 6, 18, 54, 162, 486, 1458, 4374, 13122, 39366, 118098, 354294, 1062882, 3188646, 9565938, 28697814, 86093442, 258280326, 774840978]
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
                13: 7, 14: 7, 15: 7, 16: 7, 17: 7, 18: 7, 19: 7  // 13-19级：7个连锁
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
        level = Math.max(1, Math.min(19, level));

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
        return Array.from({length: 19}, (_, i) => i + 1);
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