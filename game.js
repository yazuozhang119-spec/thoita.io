// 蜈蚣绘制辅助函数
const memoizedColors = {};
const damageFlash = false;

function blendColor(color1, color2, t) {
    const memoizedIndex = color1 + '_' + color2 + '_' + t;
    if (memoizedColors[memoizedIndex] !== undefined) {
        return memoizedColors[memoizedIndex];
    }
    const rgb1 = {
        r: parseInt(color1.slice(1, 3), 16),
        g: parseInt(color1.slice(3, 5), 16),
        b: parseInt(color1.slice(5, 7), 16)
    };
    const rgb2 = {
        r: parseInt(color2.slice(1, 3), 16),
        g: parseInt(color2.slice(3, 5), 16),
        b: parseInt(color2.slice(5, 7), 16)
    };
    const result = rgbToHex(Math.floor(rgb1.r * (1 - t) + rgb2.r * t), Math.floor(rgb1.g * (1 - t) + rgb2.g * t), Math.floor(rgb1.b * (1 - t) + rgb2.b * t));
    memoizedColors[memoizedIndex] = result;
    return result;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function blendAmount(e) {
    return Math.max(0, 1 - (e.ticksSinceLastDamaged || 1000) / 166.5);
}

function checkForFirstFrame(e) {
    return (e.lastTicksSinceLastDamaged < 13 && !damageFlash);
}

function drawCentipede(x, y, size, angle, isHead) {
    let bodyColor = blendColor("#8ac255", "#FF0000", Math.max(0, 0));
    let sideColor = blendColor("#333333", "#FF0000", Math.max(0, 0));

    const isFirstFrame = false;
    if (isFirstFrame) {
        bodyColor = "#FFFFFF";
        sideColor = "#FFFFFF";
    }

    // 创建模拟的enemy对象，完全按照原版结构
    const e = {
        render: {
            angle: angle,
            radius: size / 2  // size是直径，转换为半径
        },
        ticksSinceLastDamaged: 1000,
        lastTicksSinceLastDamaged: 1000,
        isHead: isHead
    };

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(e.render.angle);

    const isOpaq = ctx.globalAlpha !== 1;

    if (isOpaq === true) {
        // draw head and clip so that legs dont appear insider body
        ctx.save();
        let p = new Path2D();
        p.rect(-10000, -10000, 20000, 20000);
        p.arc(0, 0, e.render.radius, 0, Math.PI * 2);
        ctx.clip(p, "evenodd");
    }

    // side
    ctx.fillStyle = sideColor;
    ctx.beginPath();
    ctx.arc(0, e.render.radius * 0.85, e.render.radius * 0.44, 0, 2 * Math.PI);
    ctx.fill();
    // ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(0, -e.render.radius * 0.85, e.render.radius * 0.44, 0, 2 * Math.PI);
    ctx.fill();
    // ctx.stroke();
    ctx.closePath();

    if (isOpaq === true) {
        ctx.restore();
    }

    ctx.lineWidth = e.render.radius * .2;
    // main body
    ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, e.render.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    if (e.isHead === true) {
        ctx.strokeStyle = sideColor;
        ctx.lineWidth = e.render.radius * .075;

        // antennae
        ctx.beginPath();
        ctx.moveTo(e.render.radius * .71, -e.render.radius * .29);
        ctx.quadraticCurveTo(e.render.radius * 1.35, -e.render.radius * .33, e.render.radius * 1.57, -e.render.radius * .87);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(e.render.radius * .71, e.render.radius * .29);
        ctx.quadraticCurveTo(e.render.radius * 1.35, e.render.radius * .33, e.render.radius * 1.57, e.render.radius * .87);
        ctx.stroke();
        ctx.closePath();

        // little bulbs at the ends
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(e.render.radius * 1.57, -e.render.radius * .87, e.render.radius * .132, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(e.render.radius * 1.57, e.render.radius * .87, e.render.radius * .132, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    ctx.restore();
}

// 对象类型索引映射（与服务器保持一致）
const objectTypeMap = {
    // 花瓣类型
    0: 'missile',
    1: 'basic',
    2: 'leaf',
    3: 'wing',
    4: 'lighting', // thunder -> lighting
    5: 'iris',     // venom -> iris
    6: 'shell',    // shield -> shell
    7: 'bomb',     // bomb保持同名，但使用新绘制
    8: 'hornet_missile',
    9: 'magnet',
    10: 'thirdeye',
    // 怪物类型
    11: 'hornet',
    12: 'rock',
    13: 'ladybug',
    14: 'centipede0',
    15: 'thunderelement',
    16: 'venomspider',
    17: 'shieldguardian',
    18: 'bombbeetle',
    // 花朵类型
    19: 'flower',
    // 掉落物类型
    20: 'drop',
    21: 'centipede1'  // 蜈蚣身体
};

// 游戏配置
const config = {
    serverAddress: 'wss://thoita-prod-1g7djd2id1fdb4d2-1381831241.ap-shanghai.run.wxcloudrun.com/ws', // 服务器地址
    baseCanvasWidth: 1200,  // 基准画布宽度（将被动态调整）
    baseCanvasHeight: 800,  // 基准画布高度（将被动态调整）
    canvasWidth: 1200,
    canvasHeight: 800,
    minCanvasWidth: 800,   // 最小画布宽度
    minCanvasHeight: 600,  // 最小画布高度
    maxScaleFactor: 2.0,   // 最大缩放因子，避免过度放大
    playerSize: 50,    // 适中的玩家渲染尺寸
    petalSize: 35,     // 适中的花瓣渲染尺寸
    mobSize: 70,       // 适中的怪物渲染尺寸
    fps: 30,
    maxFps: 60,  // 最大帧率限制
    backgroundColor: '#1ea761'
};

// 游戏状态
const gameState = {
    playerId: null,
    connected: false,
    playerName: 'Player',
    playerHealth: 100,
    playerMaxHealth: 100,
    playerPosition: { x: 0, y: 0 },
    boundaryRadius: 0,
    playerAngle: 0,
    playerSize: null, // 服务器传输的玩家大小
    playerState: 0, // 0: 正常, 1: 攻击, -1: 防御
    petals: [],
    mobs: [],
    flowers: [],
    collectDrops: [],
    fps: 0,
    socket: null,
    // 缩放相关状态
    offsetX: 0,  // X轴偏移
    offsetY: 0,  // Y轴偏移
    scale: 1,    // 缩放比例（兼容旧代码）
    scaleX: 1,   // X轴缩放比例
    scaleY: 1,   // Y轴缩放比例
    devicePixelRatio: window.devicePixelRatio || 1,  // 设备像素比
    renderQuality: 'high',  // 动态渲染质量：high, medium, low
    // 性能优化相关
    frameCount: 0,
    imageCache: new Map(),  // 图片缓存
    lastRenderTime: 0,  // 用于帧率控制
    useVectorRendering: true,  // 矢量渲染开关（可动态切换）
    // 新添加的状态
    loadedResources: 0,
    totalResources: 0,
    isLobby: true,
    equipmentSlots: 10,
    equippedPetals: Array(10).fill(null),
    availablePetals: [],
    petalImages: {},
        roomPlayers: {},
    petal_num : 5,
    heartbeatInterval: null,
    serverBuild: null,
    absorbSlots: Array(5).fill(null),
    isAbsorbing: false,
    // 音频状态
    backgroundMusic: null,
    deathSound: null,
    volume: 0.5,
    isMuted: false,
    musicEnabled: true,
    absorbTotalCount: 0, // 记录总花瓣数量
    currentAbsorbType: null,
    currentAbsorbLevel: null,
    cachedAbsorbResult: null, // 缓存的合成结果（等待动画结束）
    savedBuild: null, // 保存的构筑数据
    effects: [],
    isAutoEquipping: false, // 防止重复装备的标志
    wave: {
        current: 1,
        start_time: 0,  // wave开始时间戳
        duration: 120,
        spawn_phase_duration: 60,
        is_spawn_phase: true
    },
    // 聊天相关状态
    chatType: 'room', // room, global, private
    privateTarget: '', // 私聊目标
    chatHistory: {
        room: [],
        global: [],
        private: []
    },
    isChatClosed: true // 聊天窗口默认关闭
};

// DOM 元素
const absorbSlotsContainer = document.getElementById('absorbSlotsContainer');
const absorbResult = document.getElementById('absorbResult');
const resultContent = document.getElementById('resultContent');
const closeResult = document.getElementById('closeResult');
const absorbPetalSelection = document.getElementById('absorbPetalSelection');
const absorbActionButton = document.getElementById('absorbActionButton'); // 合成界面的按钮
const absorbLobbyButton = document.getElementById('absorbLobbyButton');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const healthFill = document.getElementById('healthFill');
const fpsDisplay = document.getElementById('fps');
const startScreen = document.getElementById('startScreen');
const playerNameInput = document.getElementById('playerName');
const startButton = document.getElementById('startButton');
const gameOverScreen = document.getElementById('gameOver');
const restartButton = document.getElementById('restartButton');
const lobbyUI = document.getElementById('lobbyUI');
const equipmentSlots = document.getElementById('equipmentSlots');
const bagWindow = document.getElementById('bagWindow');
const absorbWindow = document.getElementById('absorbWindow');
const galleryWindow = document.getElementById('galleryWindow');
const closeBag = document.getElementById('closeBag');
const closeAbsorb = document.getElementById('closeAbsorb');
const closeGallery = document.getElementById('closeGallery');
const bagButton = document.getElementById('bagButton');
const absorbButton = document.getElementById('absorbButton');
const galleryButton = document.getElementById('galleryButton');
const readyButton = document.getElementById('readyButton');
const loadingScreen = document.getElementById('loadingScreen');
const progressFill = document.getElementById('progressFill');
const loadingText = document.getElementById('loadingText');
const roomPlayers = document.getElementById('roomPlayers');
const roomInfo = document.getElementById('roomInfo');

const waveBar = document.getElementById('waveBar');
const waveText = document.getElementById('waveText');
const waveProgressFill = document.getElementById('waveProgressFill');
const waveProgressContainer = document.getElementById('waveProgressContainer');

// 聊天界面元素
const chatContainer = document.getElementById('chatContainer');
const chatHeader = document.getElementById('chatHeader');
const chatTitle = document.getElementById('chatTitle');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendButton = document.getElementById('chatSendButton');
const chatClose = document.getElementById('chatClose');
const chatOpenButton = document.getElementById('chatOpenButton');
const chatTypeSelector = document.getElementById('chatTypeSelector');
const chatTypeButtons = chatTypeSelector.querySelectorAll('.chat-type-button');

// 资源列表 - 需要加载的图片（根据实际文件名修改）
const resources = [
    // 花瓣图片（使用实际文件名）
    '01.png', '02.png', '03.png', '04.png', '05.png', '06.png', '07.png',
    '11.png', '12.png', '13.png', '14.png', '15.png', '16.png', '17.png',
    '31.png', '32.png', '33.png', '34.png', '35.png', '36.png', '37.png',
    '41.png', '42.png', '43.png', '44.png', '45.png', '46.png', '47.png',
    '51.png', '52.png', '53.png', '54.png', '55.png', '56.png', '57.png', // thunder (类型5)
    '61.png', '62.png', '63.png', '64.png', '65.png', '66.png', '67.png', // venom (类型6)
    '71.png', '72.png', '73.png', '74.png', '75.png', '76.png', '77.png', // shield (类型7)
    '81.png', '82.png', '83.png', '84.png', '85.png', '86.png', '87.png', // bomb (类型8)
    '91.png', '92.png', '93.png', '94.png', '95.png', '96.png', '97.png', // magnet (类型9)
    '101.png', '102.png', '103.png', '104.png', '105.png', '106.png', '107.png', // thirdeye (类型10)
    // 怪物图片
    'hornet.png', 'centipede0.png', 'centipede1.png', 'rock.png', 'ladybug.png',
    'thunderelement.png', 'venomspider.png', 'shieldguardian.png', 'bombbeetle.png',
    // 其他图片
    'flower.png', 'backgroundmini.png', 'background.png', 'logo.png',
    // UI元素
    'bag.png', 'absorb.png', 'gallery.png', 'ready.png', 'none.png',
    // 游戏内花瓣图片
    'wing.png', 'missile.png', 'basic.png', 'leaf.png', 'hornetMissile.png',
    'thunder.png', 'venom.png', 'shield.png', 'bomb.png', 'magnet.png', 'thirdeye.png'
];

// 音频系统初始化
function initAudioSystem() {
    try {
        console.log('开始初始化音频系统...');
        console.log('当前页面协议:', window.location.protocol);
        console.log('当前页面主机:', window.location.host);

        // 检查是否通过HTTP服务器访问
        if (window.location.protocol === 'file:') {
            console.warn('警告：你正在通过file://协议访问页面，这可能导致音频加载失败。');
            console.warn('请通过HTTP服务器访问页面，例如：http://localhost:8888');
        }

        // 尝试多种音频格式
        const backgroundFormats = ['background.mp3'];
        const deathFormats = ['death.mp3'];

        // 创建背景音乐对象
        gameState.backgroundMusic = createAudioWithFallback('背景音乐', backgroundFormats);

        // 创建死亡音效对象
        gameState.deathSound = createAudioWithFallback('死亡音效', deathFormats);

        // 如果音频加载成功，设置属性
        if (gameState.backgroundMusic) {
            gameState.backgroundMusic.loop = true;
            gameState.backgroundMusic.volume = gameState.volume;
            console.log('背景音乐加载成功');
        } else {
            console.log('所有背景音乐格式都加载失败');
            gameState.musicEnabled = false;
        }

        if (gameState.deathSound) {
            gameState.deathSound.volume = gameState.volume;
            console.log('死亡音效加载成功');
        } else {
            console.log('所有死亡音效格式都加载失败');
        }

        // 初始化音量控制UI
        initVolumeControls();

        // 用户交互后播放背景音乐（浏览器政策要求）
        document.addEventListener('click', function playBackgroundMusic() {
            if (gameState.musicEnabled && gameState.backgroundMusic && gameState.backgroundMusic.paused) {
                gameState.backgroundMusic.play().catch(e => {
                    console.log('背景音乐自动播放失败:', e);
                });
            }
            document.removeEventListener('click', playBackgroundMusic);
        }, { once: true });

        console.log('音频系统初始化完成');
    } catch (error) {
        console.log('音频系统初始化失败:', error);
        gameState.musicEnabled = false;
    }
}

// 创建带格式的音频对象
function createAudioWithFallback(name, formats) {
    for (let format of formats) {
        try {
            const audio = new Audio();

            // 设置事件监听器
            audio.addEventListener('canplaythrough', function() {
                console.log(`${name} (${format}) 加载完成`);
            }, { once: true });

            audio.addEventListener('error', function(e) {
                console.log(`${name} (${format}) 加载失败:`, e);
            }, { once: true });

            // 尝试加载
            audio.src = format;
            audio.load();

            // 检查是否能够加载
            return audio;

        } catch (error) {
            console.log(`创建 ${name} (${format}) 失败:`, error);
            continue;
        }
    }
    return null;
}

// 初始化音量控制
function initVolumeControls() {
    const volumeToggle = document.getElementById('volumeToggle');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeRange = document.getElementById('volumeRange');
    const volumeValue = document.getElementById('volumeValue');
    const testAudioBtn = document.getElementById('testAudioBtn');

    // 音量按钮点击事件
    volumeToggle.addEventListener('click', function() {
        const sliderContainer = document.getElementById('volumeSlider');
        const isVisible = sliderContainer.style.display !== 'none';

        if (isVisible) {
            sliderContainer.style.display = 'none';
        } else {
            sliderContainer.style.display = 'block';
        }
    });

    // 音量滑块变化事件
    volumeRange.addEventListener('input', function() {
        const volume = this.value / 100;
        gameState.volume = volume;
        gameState.isMuted = volume === 0;

        // 更新音频音量
        if (gameState.backgroundMusic) {
            gameState.backgroundMusic.volume = volume;
        }
        if (gameState.deathSound) {
            gameState.deathSound.volume = volume;
        }

        // 更新显示
        volumeValue.textContent = this.value + '%';

        // 更新按钮图标
        updateVolumeButton(volume);
    });

    // 测试音频按钮
    testAudioBtn.addEventListener('click', function() {
        testAudio();
    });

    // 点击其他地方关闭音量滑块
    document.addEventListener('click', function(event) {
        const volumeControl = document.getElementById('volumeControl');
        if (!volumeControl.contains(event.target)) {
            document.getElementById('volumeSlider').style.display = 'none';
        }
    });
}

// 测试音频功能
function testAudio() {
    console.log('=== 音频测试开始 ===');
    console.log('音乐启用状态:', gameState.musicEnabled);
    console.log('当前音量:', gameState.volume);
    console.log('静音状态:', gameState.isMuted);

    if (gameState.backgroundMusic) {
        console.log('背景音乐对象存在');
        console.log('背景音乐当前状态:', {
            paused: gameState.backgroundMusic.paused,
            currentTime: gameState.backgroundMusic.currentTime,
            duration: gameState.backgroundMusic.duration,
            readyState: gameState.backgroundMusic.readyState
        });

        // 尝试播放背景音乐
        gameState.backgroundMusic.play().then(() => {
            console.log('背景音乐播放成功！');
            setTimeout(() => {
                gameState.backgroundMusic.pause();
                console.log('背景音乐测试停止');
            }, 3000); // 播放3秒后停止
        }).catch(error => {
            console.error('背景音乐播放失败:', error);
        });
    } else {
        console.error('背景音乐对象不存在！');
    }

    if (gameState.deathSound) {
        console.log('死亡音效对象存在');
        // 测试死亡音效
        gameState.deathSound.play().then(() => {
            console.log('死亡音效播放成功！');
        }).catch(error => {
            console.error('死亡音效播放失败:', error);
        });
    } else {
        console.error('死亡音效对象不存在！');
    }

    console.log('=== 音频测试结束 ===');
}

// 更新音量按钮图标
function updateVolumeButton(volume) {
    const volumeToggle = document.getElementById('volumeToggle');
    if (volume === 0) {
        volumeToggle.textContent = '🔇';
    } else if (volume < 0.5) {
        volumeToggle.textContent = '🔉';
    } else {
        volumeToggle.textContent = '🔊';
    }
}

// 播放死亡音效
function playDeathSound() {
    if (gameState.deathSound && !gameState.isMuted && gameState.volume > 0) {
        gameState.deathSound.currentTime = 0; // 重置到开始位置
        gameState.deathSound.play().catch(e => {
            console.log('死亡音效播放失败:', e);
        });
    }
}

// 开始播放背景音乐
function startBackgroundMusic() {
    if (gameState.backgroundMusic && gameState.musicEnabled && !gameState.isMuted && gameState.volume > 0) {
        gameState.backgroundMusic.play().catch(e => {
            console.log('背景音乐播放失败:', e);
        });
    }
}

// 停止背景音乐
function stopBackgroundMusic() {
    if (gameState.backgroundMusic) {
        gameState.backgroundMusic.pause();
        gameState.backgroundMusic.currentTime = 0;
    }
}

// 初始化游戏
function initGame() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化音频系统
    initAudioSystem();

    connectToServer()

    // 事件监听
    startButton.addEventListener('click', showLobby);
    restartButton.addEventListener('click', restartGame);

    // 大厅按钮事件
    bagButton.addEventListener('click', () => showWindow('bag'));
    absorbLobbyButton.addEventListener('click', () => showWindow('absorb'));
    galleryButton.addEventListener('click', () => showWindow('gallery'));
    readyButton.addEventListener('click', () => {
    if (readyButton.textContent === 'Ready') {
        readyToPlay();
    } else if (readyButton.textContent === '取消准备') {
        cancelReady();
    }
});

    // 关闭窗口按钮
    closeBag.addEventListener('click', () => hideWindow('bag'));
    closeAbsorb.addEventListener('click', () => hideWindow('absorb'));
    closeGallery.addEventListener('click', () => hideWindow('gallery'));



    // 新房间功能按钮
    const newRoomButton = document.getElementById('newRoomButton');
    const findRoomButton = document.getElementById('findRoomButton');
    const privateRoomButton = document.getElementById('privateRoomButton');

    // 创建新的公共房间
    newRoomButton.addEventListener('click', () => {
        if (gameState.connected) {
            sendToServer({
                COMMAND: 'CREATE_ROOM',
                room_type: 'public',
                build: gameState.equippedPetals.map(petal => {
                    return petal ? [petal.type, petal.level] : [-1, 0];
                }),
                id: gameState.playerId
            });
        }
    });

    // 寻找公共房间
    findRoomButton.addEventListener('click', () => {
        if (gameState.connected) {
            sendToServer({
                COMMAND: 'FIND_ROOMS',
                build: gameState.equippedPetals.map(petal => {
                    return petal ? [petal.type, petal.level] : [-1, 0];
                }),
                id: gameState.playerId
            });
        }
    });

    // 创建私人房间
    privateRoomButton.addEventListener('click', () => {
        if (gameState.connected) {
            const roomName = prompt('请输入私人房间名称:', `${gameState.playerName}的私人房间`);
            if (roomName && roomName.trim()) {
                sendToServer({
                    COMMAND: 'CREATE_ROOM',
                    room_name: roomName.trim(),
                    room_type: 'private',
                    build: gameState.equippedPetals.map(petal => {
                        return petal ? [petal.type, petal.level] : [-1, 0];
                    }),
                    id: gameState.playerId
                });
            }
        }
    });

    // 鼠标事件
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // 加载资源
    loadResources();
    initializeAbsorbWindow();

    // 初始化聊天功能
    initializeChat();

    // 开始游戏循环
    requestAnimationFrame(gameLoop);
}


function initializeAbsorbWindow() {
    initializeAbsorbSlots();
    initializeAbsorbPetalSelection();

    // 事件监听
    absorbActionButton.addEventListener('click', startAbsorb);
    closeResult.addEventListener('click', () => {
        absorbResult.style.display = 'none';
    });

}

function initializeAbsorbSlots() {
    const slots = absorbSlotsContainer.querySelectorAll('.absorb-slot');

    slots.forEach(slot => {
        // 清除现有内容
        slot.innerHTML = '';
        slot.classList.remove('filled', 'drag-over');

        // 添加拖拽事件
        slot.addEventListener('dragover', handleAbsorbDragOver);
        slot.addEventListener('dragenter', handleAbsorbDragEnter);
        slot.addEventListener('dragleave', handleAbsorbDragLeave);
        slot.addEventListener('drop', handleAbsorbDrop);

        // 添加点击移除事件
        slot.addEventListener('click', (e) => {
            if (slot.classList.contains('filled') && !e.target.classList.contains('remove-petal')) {
                removePetalFromAbsorbSlot(parseInt(slot.dataset.index));
            }
        });
    });

    updateAbsorbButton();
}

// 初始化可用的花瓣选择
function initializeAbsorbPetalSelection() {
    updateAbsorbPetalSelection();
}

// 更新可用的花瓣选择
function updateAbsorbPetalSelection() {
    absorbPetalSelection.innerHTML = '';

    // 按种类分组花瓣，跳过索引2
    const petalsByType = {};
    gameState.availablePetals.forEach((petal, index) => {
        if (parseInt(petal.type) !== 2) { // 跳过索引2的花瓣
            if (!petalsByType[petal.type]) {
                petalsByType[petal.type] = [];
            }
            petalsByType[petal.type].push({...petal, originalIndex: index});
        }
    });

    // 获取所有种类并排序，跳过2
    const types = Object.keys(petalsByType)
        .filter(type => parseInt(type) !== 2)
        .sort((a, b) => parseInt(a) - parseInt(b));

    types.forEach(type => {
        // 为每个种类创建一行
        const row = document.createElement('div');
        row.className = 'absorb-petal-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '8px';
        row.style.gap = '8px';

        // 查找该种类的所有花瓣（按等级分组）
        const petalsByLevel = {};
        petalsByType[type].forEach(petal => {
            if (petal.count > 0) {
                petalsByLevel[petal.level] = petal;
            }
        });

        // 显示1-7级，空缺的显示空白
        for (let level = 1; level <= 7; level++) {
            const petalContainer = document.createElement('div');
            petalContainer.className = 'absorb-petal-container';
            petalContainer.style.position = 'relative';
            petalContainer.style.width = '60px';
            petalContainer.style.height = '60px';

            if (petalsByLevel[level]) {
                const petal = petalsByLevel[level];
                const item = document.createElement('div');
                item.className = 'absorb-petal-item';
                // 为第七级花瓣添加特殊的CSS类
                  item.draggable = true;
                item.dataset.index = petal.originalIndex;
                item.title = `类型: ${petal.type}, 等级: ${petal.level}, 数量: ${petal.count}`;

                // 使用canvas绘制花瓣
                const canvas = document.createElement('canvas');
                drawPetalItem(petal, canvas, {displaySize:58});
                item.appendChild(canvas);

                // 添加数量标签
                const countBadge = document.createElement('div');
                countBadge.className = 'absorb-petal-count';
                countBadge.textContent = petal.count;
                item.appendChild(countBadge);

                item.addEventListener('dragstart', handleAbsorbPetalDragStart);
                item.addEventListener('dragend', handleAbsorbPetalDragEnd);

                // 添加点击事件（作为拖拽的替代）
                item.addEventListener('click', () => {
                    addPetalToFirstEmptySlot(petal, petal.originalIndex);
                });

                petalContainer.appendChild(item);
            } else {
                // 空缺位置显示空白占位符
                const placeholder = document.createElement('div');
                placeholder.className = 'absorb-petal-placeholder';
                placeholder.style.width = '60px';
                placeholder.style.height = '60px';
                placeholder.style.border = '1px dashed rgba(255, 255, 255, 0.2)';
                placeholder.style.borderRadius = '3px';
                placeholder.style.display = 'flex';
                placeholder.style.alignItems = 'center';
                placeholder.style.justifyContent = 'center';
                placeholder.style.color = 'rgba(255, 255, 255, 0.3)';
                placeholder.style.fontSize = '10px';
                placeholder.textContent = `Lv.${level}`;
                petalContainer.appendChild(placeholder);
            }

            row.appendChild(petalContainer);
        }

        absorbPetalSelection.appendChild(row);
    });
}

// 拖拽开始处理
function handleAbsorbPetalDragStart(e) {
    const petalItem = e.target.closest('.absorb-petal-item');
    if (!petalItem) return;

    const index = petalItem.dataset.index;
    e.dataTransfer.setData('text/plain', index);
    petalItem.style.opacity = '0.5';
}

// 拖拽结束处理
function handleAbsorbPetalDragEnd(e) {
    e.target.style.opacity = '1';
}

// 拖拽经过处理
function handleAbsorbDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function updateWaveBar(waveData) {
    if (!waveData) return;

    // 更新wave状态（新格式使用时间戳）
    gameState.wave = {
        current: waveData.current,
        start_time: waveData.start_time,
        duration: waveData.duration,
        spawn_phase_duration: waveData.spawn_phase_duration,
        is_spawn_phase: waveData.is_spawn_phase
    };

    console.log('收到新的wave信息:', gameState.wave);
}

// 客户端计算wave进度的函数
function updateWaveProgress() {
    if (gameState.isLobby || !gameState.wave.start_time) return;

    const currentTime = Date.now() / 1000; // 转换为秒
    const elapsed = currentTime - gameState.wave.start_time;

    // 计算进度百分比
    const progressPercent = Math.min((elapsed / gameState.wave.duration) * 100, 100);

    // 判断当前阶段
    const isSpawnPhase = elapsed < gameState.wave.spawn_phase_duration;

    // 更新wave文本
    waveText.textContent = `Wave: ${gameState.wave.current}`;

    // 更新进度条
    waveProgressFill.style.width = `${progressPercent}%`;

    // 根据阶段切换颜色
    if (isSpawnPhase) {
        waveProgressFill.className = 'green';
    } else {
        waveProgressFill.className = 'red';
    }

    // 显示进度条
    waveBar.style.display = 'block';
}

function handleAbsorbDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('absorb-slot') && !e.target.classList.contains('filled')) {
        e.target.classList.add('drag-over');
    }
}

function handleAbsorbDragLeave(e) {
    e.preventDefault();
    if (e.target.classList.contains('absorb-slot')) {
        e.target.classList.remove('drag-over');
    }
}

// 拖拽放下处理
function handleAbsorbDrop(e) {
    e.preventDefault();

    const slot = e.target.closest('.absorb-slot');
    if (!slot || slot.classList.contains('filled')) return;

    slot.classList.remove('drag-over');

    const petalIndex = e.dataTransfer.getData('text/plain');
    const slotIndex = parseInt(slot.dataset.index);

    if (petalIndex !== '') {
        addPetalToAbsorbSlot(parseInt(petalIndex), slotIndex);
    }
}

// 添加花瓣到合成槽位
function addPetalToAbsorbSlot(petalIndex, slotIndex) {
    if (petalIndex >= 0 && petalIndex < gameState.availablePetals.length) {
        const petal = gameState.availablePetals[petalIndex];

        // 检查花瓣数量是否足够（需要5个给5个槽位）
        if (petal.count < 5) {
            alert('该花瓣数量不足5个!');
            return;
        }

        // 如果是第一次添加，设置当前合成类型
        if (gameState.absorbTotalCount === 0) {
            gameState.currentAbsorbType = petal.type;
            gameState.currentAbsorbLevel = petal.level;
        } else {
            // 检查是否与当前合成类型相同
            if (petal.type !== gameState.currentAbsorbType || petal.level !== gameState.currentAbsorbLevel) {
                alert('只能合成相同类型和等级的花瓣!');
                return;
            }
        }

        // 给每个槽位添加1个花瓣，不管槽位是否已有花瓣
        for (let i = 0; i < 5; i++) {
            // 如果槽位为空，初始化
            if (gameState.absorbSlots[i] === null) {
                gameState.absorbSlots[i] = {
                    type: petal.type,
                    level: petal.level,
                    originalIndex: petalIndex,
                    count: 0
                };
            }

            // 检查是否是相同类型的花瓣（现在允许累加）
            if (gameState.absorbSlots[i].type === petal.type &&
                gameState.absorbSlots[i].level === petal.level) {
                gameState.absorbSlots[i].count += 1;
                petal.count -= 1;
                gameState.absorbTotalCount += 1;
                updateAbsorbSlotDisplay(i);
            }
        }

        updateAbsorbPetalSelection();
        updateAbsorbButton();
    }
}

// 添加花瓣（无论槽位是否为空）
function addPetalToFirstEmptySlot(petal, originalIndex) {
    // 直接调用添加函数，让它自己处理槽位逻辑
    addPetalToAbsorbSlot(originalIndex, 0); // 使用槽位0作为目标
}

// 更新槽位显示
function updateAbsorbSlotDisplay(slotIndex) {
    const slot = absorbSlotsContainer.querySelector(`.absorb-slot[data-index="${slotIndex}"]`);
    const petal = gameState.absorbSlots[slotIndex];

    slot.innerHTML = '';

    if (petal) {
        slot.classList.add('filled');
        // 为第七级花瓣添加特殊的CSS类
        if (petal.level === 7) {
            slot.classList.add('level-7');
        }

        // 使用canvas绘制花瓣
        const canvas = document.createElement('canvas');
        drawPetalItem(petal, canvas, { displaySize: 58 });
        slot.appendChild(canvas);

        // 显示数量标签
        const countBadge = document.createElement('div');
        countBadge.className = 'slot-petal-count';
        countBadge.textContent = petal.count || 5;
        slot.appendChild(countBadge);

        // 添加移除按钮
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-petal';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removePetalFromAbsorbSlot(slotIndex);
        });
        slot.appendChild(removeBtn);
    } else {
        slot.classList.remove('filled');
    }
}

// 从合成槽位移除花瓣
function removePetalFromAbsorbSlot(slotIndex) {
    const petal = gameState.absorbSlots[slotIndex];
    if (petal) {
        // 恢复花瓣数量（移除该槽位所有花瓣）
        const originalPetal = gameState.availablePetals[petal.originalIndex];
        if (originalPetal) {
            originalPetal.count += petal.count;
        }

        gameState.absorbTotalCount -= petal.count;
        gameState.absorbSlots[slotIndex] = null;

        // 如果所有槽位都空了，重置合成类型
        if (gameState.absorbTotalCount === 0) {
            gameState.currentAbsorbType = null;
            gameState.currentAbsorbLevel = null;
        }

        updateAbsorbSlotDisplay(slotIndex);
        updateAbsorbPetalSelection();
        updateAbsorbButton();
    }
}

// 更新合成按钮状态
function updateAbsorbButton() {
    const filledSlots = gameState.absorbSlots.filter(slot => slot !== null).length;
    absorbActionButton.disabled = gameState.absorbTotalCount < 5 || gameState.isAbsorbing;

    if (gameState.absorbTotalCount >= 5) {
        absorbActionButton.textContent = gameState.isAbsorbing ? '合成中...' : '合成';
    } else {
        absorbActionButton.textContent = '合成';
    }
}

// 开始合成
function startAbsorb() {
    if (gameState.isAbsorbing) return;

    if (gameState.absorbTotalCount < 5) {
        alert('需要至少5个花瓣才能合成!');
        return;
    }

    // 检查是否尝试合成最高等级花瓣
    if (gameState.currentAbsorbLevel >= 7) {
        alert('7级花瓣已达到最高等级，无法继续合成!');
        return;
    }

    gameState.isAbsorbing = true;
    updateAbsorbButton();

    // 添加合成中的视觉效果
    const slots = absorbSlotsContainer.querySelectorAll('.absorb-slot');
    slots.forEach(slot => {
        slot.classList.add('absorbing');
    });

    // 开始公转动画
    const pentagonSlots = absorbSlotsContainer.querySelector('.pentagon-slots');
    pentagonSlots.classList.add('rotating');

    // 发送合成请求到服务器 - 发送所有花瓣
    sendToServer({
        COMMAND: 'ABSORB',
        client_name: gameState.playerName,
        absorb_data: {
            type: gameState.currentAbsorbType,
            level: gameState.currentAbsorbLevel,
            total: gameState.absorbTotalCount
        },
        id: gameState.playerId
    });

    // 2秒后显示结果（无论服务器是否响应）
    setTimeout(() => {
        showAbsorbResultAfterAnimation(gameState.absorbTotalCount);
    }, 2000);
}

// 动画结束后显示合成结果
function showAbsorbResultAfterAnimation(totalPetalCount) {
    // 移除动画效果
    const slots = absorbSlotsContainer.querySelectorAll('.absorb-slot');
    slots.forEach(slot => {
        slot.classList.remove('absorbing');
    });

    const pentagonSlots = absorbSlotsContainer.querySelector('.pentagon-slots');
    pentagonSlots.classList.remove('rotating');

    // 检查是否有缓存的服务器结果
    if (gameState.cachedAbsorbResult) {
        displayActualResult(gameState.cachedAbsorbResult, totalPetalCount);
        gameState.cachedAbsorbResult = null;
    } else {
        // 如果没有服务器结果，显示默认成功信息
        displayDefaultResult(totalPetalCount);
    }
}

// 显示默认合成结果（用于本地演示）
function displayDefaultResult(totalPetalCount) {
    resultContent.innerHTML = '';

    const successMsg = document.createElement('p');
    successMsg.textContent = `合成完成！使用了 ${totalPetalCount} 个花瓣`;
    successMsg.style.color = '#FFD700';
    resultContent.appendChild(successMsg);

    absorbResult.style.display = 'block';

    // 清空所有槽位
    resetAbsorbSlots();

    // 重置状态
    gameState.isAbsorbing = false;
    updateAbsorbButton();
}

// 清空已合成的花瓣（修复双倍扣除问题）
function clearSynthesizedPetals(totalPetalCount) {
    // 直接重置槽位，不需要逐个移除，因为花瓣数量已经在服务器端处理
    // 客户端只需要清空槽位显示即可
    resetAbsorbSlots();

    // 不需要更新可用花瓣显示，因为REFRESH_BUILD会从服务器获取最新数据
    updateAbsorbButton();
}

// 显示实际的服务器结果
function displayActualResult(result, totalPetalCount) {
    gameState.isAbsorbing = false;

    // 显示结果
    resultContent.innerHTML = '';

    if (result.success) {
        const usedCount = result.total_used || totalPetalCount;
        const successMsg = document.createElement('p');
        successMsg.textContent = `合成成功! 使用了 ${usedCount} 个花瓣，成功合成 ${result.success_count} 个`;
        successMsg.style.color = '#4CAF50';
        resultContent.appendChild(successMsg);

        if (result.result_petal) {
            const resultPetal = document.createElement('div');
            resultPetal.className = 'result-petal';

            // 使用canvas绘制花瓣
            const canvas = document.createElement('canvas');
            const petalData = {
                type: result.result_petal[0],
                level: result.result_petal[1]
            };
            drawPetalItem(petalData, canvas, { displaySize: 45 });
            resultPetal.appendChild(canvas);

            const levelText = document.createElement('div');
            levelText.textContent = `Lv.${result.result_petal[1]}`;
            levelText.style.fontSize = '12px';
            resultPetal.appendChild(levelText);

            resultContent.appendChild(resultPetal);
        }
    } else {
        const usedCount = result.total_used || totalPetalCount;
        const failMsg = document.createElement('p');
        failMsg.textContent = `合成失败! 使用了 ${usedCount} 个花瓣`;
        failMsg.style.color = '#ff4757';
        resultContent.appendChild(failMsg);

        if (result.remaining_count > 0) {
            const remainingText = document.createElement('p');
            remainingText.textContent = `剩余花瓣: ${result.remaining_count} 个`;
            remainingText.style.marginTop = '10px';
            resultContent.appendChild(remainingText);
        }
    }

    absorbResult.style.display = 'block';

    // 清空合成的花瓣 - 直接重置槽位，因为服务器已经处理了花瓣消耗
    resetAbsorbSlots();

    // 更新背包内容
    setTimeout(() => {
        if (gameState.connected) {
            sendToServer({
                COMMAND: 'REFRESH_BUILD',
                client_name: gameState.playerName,
                id: gameState.playerId
            });
        }
    }, 2000);
}

// 修改处理合成结果的函数（现在用于处理服务器响应）
function handleAbsorbResult(result) {
    // 如果动画还在进行，缓存结果等待动画结束
    if (gameState.isAbsorbing) {
        gameState.cachedAbsorbResult = result;
        return;
    }

    // 动画已结束，直接显示结果
    displayActualResult(result, result.total_used || 0);
}


// 重置合成槽位
function resetAbsorbSlots() {
    gameState.absorbSlots = Array(5).fill(null);
    gameState.absorbTotalCount = 0;
    gameState.currentAbsorbType = null;
    gameState.currentAbsorbLevel = null;
    initializeAbsorbSlots();
    updateAbsorbPetalSelection();
}


// 获取上一个房间
function getPreviousRoom() {
    // 返回上一个房间ID，如果有的话
    return gameState.previousRoom || 0;
}

// 更新房间信息显示
function updateRoomInfo() {
    roomInfo.querySelector('h3').textContent = '房间信息';
    updateRoomPlayers();

    // 如果当前在房间频道，更新聊天标题
    if (gameState.chatType === 'room') {
        updateChatTitle();
    }
}

// 更新房间内玩家显示
function updateRoomPlayers() {
    roomPlayers.innerHTML = '';
    console.log(gameState.roomInfo)

    // 首先添加当前玩家（总是显示在第一个）
    const currentPlayerBuild = gameState.equippedPetals.map(petal => {
        return petal ? [petal.type, petal.level] : [-1, 0];
    });
    addPlayerCard(gameState.playerName, currentPlayerBuild, true);

    // 添加其他玩家（从服务器数据中获取）
    // 使用新的房间数据结构，从gameState.roomInfo中获取
    if (gameState.roomInfo) {
        Object.keys(gameState.roomInfo).forEach(playerId => {
            if (playerId !== gameState.playerId) {
                const player = gameState.roomInfo[playerId];
                addPlayerCard(player.name, player.build, false);
            }
        });
    }
}

// 添加玩家卡片
function addPlayerCard(name, build, isCurrentPlayer) {
    const playerCard = document.createElement('div');
    playerCard.className = 'player-card';
    if (isCurrentPlayer) {
        playerCard.classList.add('current-player');
    }

    const playerName = document.createElement('div');
    playerName.className = 'player-name';
    playerName.textContent = isCurrentPlayer ? `${name} (你)` : name;
    playerCard.appendChild(playerName);

    const playerBuild = document.createElement('div');
    playerBuild.className = 'player-build';

    // 显示玩家的花瓣装备
    if (build && build.length > 0) {
        build.forEach((petal, index) => {
            // 检查花瓣是否有效（类型不为-1）
            if (petal && Array.isArray(petal) && petal.length >= 2 && petal[0] !== -1) {
                const petalType = petal[0];
                const petalLevel = petal[1];

                const petalIcon = document.createElement('div');
                petalIcon.className = 'petal-icon';

                // 使用canvas绘制花瓣
                const canvas = document.createElement('canvas');
                const petalData = {
                    type: petalType,
                    level: petalLevel
                };

                // 调试信息
                if (petalType === undefined || petalLevel === undefined) {
                    console.warn('房间界面花瓣数据异常:', { petal, petalType, petalLevel, index });
                }

                drawPetalItem(petalData, canvas, { displaySize: 25});
                petalIcon.appendChild(canvas);

                // 添加等级徽章

                petalIcon.title = `类型: ${petalType}, 等级: ${petalLevel}`;
                playerBuild.appendChild(petalIcon);
            }
        });

        // 如果没有有效的花瓣，显示提示
        if (playerBuild.children.length === 0) {
            const noPetalMsg = document.createElement('div');
            noPetalMsg.textContent = '无装备';
            noPetalMsg.style.fontSize = '10px';
            noPetalMsg.style.color = 'rgba(255, 255, 255, 0.5)';
            playerBuild.appendChild(noPetalMsg);
        }
    } else {
        // 如果没有装备花瓣，显示提示
        const noPetalMsg = document.createElement('div');
        noPetalMsg.textContent = '无装备';
        noPetalMsg.style.fontSize = '10px';
        noPetalMsg.style.color = 'rgba(255, 255, 255, 0.5)';
        playerBuild.appendChild(noPetalMsg);
    }

    playerCard.appendChild(playerBuild);
    roomPlayers.appendChild(playerCard);
}



// 加载资源
function loadResources() {
    gameState.totalResources = resources.length;
    gameState.loadedResources = 0;

    resources.forEach(resource => {
        const img = new Image();
        img.onload = () => {
            gameState.loadedResources++;
            const progress = (gameState.loadedResources / gameState.totalResources) * 100;
            progressFill.style.width = `${progress}%`;
            loadingText.textContent = `${Math.round(progress)}%`;

            if (gameState.loadedResources === gameState.totalResources) {
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        };
        img.onerror = () => {
            console.error(`Failed to load resource: ${resource}`);
            gameState.loadedResources++;
        };
        img.src = resource;
        gameState.petalImages[resource] = img;
    });
}

// 使用Canvas绘制花瓣项
function drawPetalItem(petal, canvas, options = {}) {
    const ctx = canvas.getContext('2d');

    // 设置默认参数（以55px为基准）
    const defaults = {
        displaySize: 55,      // 显示尺寸（像素）
        resolution: 4,        // 分辨率倍数
    };

    // 合并用户提供的选项
    const config = { ...defaults, ...options };
    const displaySize = config.displaySize;
    const resolution = config.resolution;

    // 计算实际分辨率
    const width = displaySize * resolution;
    const height = displaySize * resolution;

    // 根据displaySize动态计算所有参数（以55px为基准）
    const scale = displaySize / 55;
    const borderWidth = 7 * scale;
    const petalScale = 33 * scale;
    const petalY = 8 * scale;
    const fontSize = 10 * scale;
    const textY = 49 * scale;

    // 设置canvas实际分辨率
    canvas.width = width;
    canvas.height = height;

    // 设置显示尺寸
    canvas.style.width = displaySize + 'px';
    canvas.style.height = displaySize + 'px';

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 启用抗锯齿和图像平滑
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 完全按照原始petalRenderMap复制到drawPetalItem函数内部
    const localPetalRenderMap = {
        basic: (p) => {
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.fillStyle = blendColor('#ffffff', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#cfcfcf', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
        },
        missile: (p) => {
            p.radius = p.radius * 0.7;
            let bodyColor = blendColor("#333333", "#FF0000", blendAmount(p));
            if (checkForFirstFrame(p)) {
                bodyColor = "#FFFFFF";
            }
            ctx.lineJoin = 'round';
            ctx.rotate(Math.PI * 3 / 4);
            ctx.beginPath();
            ctx.fillStyle = bodyColor;
            ctx.strokeStyle = bodyColor;
            ctx.lineWidth = p.radius / 1.5;
            ctx.moveTo(0, -p.radius * Math.sqrt(3));
            ctx.lineTo(p.radius * Math.sqrt(3) * .48, p.radius / 2 * Math.sqrt(3));
            ctx.lineTo(-p.radius * Math.sqrt(3) * .48, p.radius / 2 * Math.sqrt(3));
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.rotate(-Math.PI *3 / 4);
        },
        leaf: (p) => {
            p.radius = p.radius * 0.7;
            const divCoef = 1.35;
            ctx.lineWidth = p.radius/divCoef/2.5;
            ctx.fillStyle = blendColor('#39b54a', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#2e933c', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            ctx.rotate(Math.PI / 4 - 0.2);
            ctx.beginPath();
            ctx.moveTo(0, 1.854*p.radius/divCoef);
            // bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
            ctx.quadraticCurveTo(-2.88*p.radius/divCoef*.87, 0.31*p.radius/divCoef, 0, -2.325*p.radius/divCoef);
            ctx.moveTo(0, 1.854*p.radius/divCoef);
            ctx.quadraticCurveTo(2.88*p.radius/divCoef*.87, 0.31*p.radius/divCoef, 0, -2.325*p.radius/divCoef);
            // tail
            ctx.moveTo(0, 1.948*p.radius/divCoef);
            ctx.lineTo(0, 2.536*p.radius/divCoef);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            // curve in the middle
            ctx.moveTo(0, (1.948-1)*p.radius/divCoef);
            ctx.quadraticCurveTo(-0.18*p.radius/divCoef, -0.1885*p.radius/divCoef, 0, (-2.325+1.05)*p.radius/divCoef);
            ctx.stroke();
            ctx.closePath();
            ctx.rotate(-Math.PI / 4 + 0.2);
        },
        wing: (p) => {
            const divCoef = 1.35;
            ctx.lineWidth = p.radius/divCoef/1.9;
            ctx.fillStyle = blendColor('#ffffff', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#cdcdcd', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            ctx.beginPath();
            ctx.arc(0, 0, p.radius*1.01, -Math.PI * 0.18, Math.PI * 0.818);
            ctx.arcTo(p.radius * 0.42, p.radius * 0.6, p.radius*0.85, -p.radius * 0.53, p.radius * 1.7);
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
        },
        lighting: (p) => { // thunder -> lighting
            ctx.strokeStyle = blendColor('#21c4b9', '#FF0000', blendAmount(p));
            ctx.fillStyle = blendColor('#29f2e5', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#ffffff";
                ctx.strokeStyle = "#ffffff";
            }
            ctx.lineWidth = p.radius * 0.2;
            ctx.beginPath();
            for(let i = 0; i<10; i++){
                let ang = i * Math.PI/5;
                ctx.lineTo(Math.cos(ang) * p.radius * 0.7, Math.sin(ang) * p.radius * 0.7)
                ctx.lineTo(Math.cos(ang + Math.PI/10) * p.radius * 1.4, Math.sin(ang + Math.PI/10) * p.radius * 1.4)
            }
            ctx.lineTo(p.radius * 0.7, 0)
            ctx.fill();
            ctx.stroke();
        },
        iris: (p) => { // venom -> iris
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.fillStyle = blendColor('#ce76db', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#a760b1', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
        },
        shell: (p) => { // shield -> shell
            ctx.strokeStyle = blendColor('#ccb36d', '#FF0000', blendAmount(p));
            ctx.fillStyle = blendColor('#fcdd86', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#ffffff";
                ctx.strokeStyle = "#ffffff";
            }
            ctx.lineWidth = p.radius * 0.2;
            ctx.beginPath();
            ctx.lineTo(p.radius * -0.73, p.radius * -0.375);
            ctx.lineTo(p.radius * 0.39, p.radius * -1.15)
            ctx.arcTo(p.radius * 3.3, p.radius * 0.21, p.radius * 0.14, p.radius * 1.19, p.radius * 1.24)
            ctx.lineTo(p.radius * 0.14, p.radius * 1.19);
            ctx.lineTo(p.radius * 0.14, p.radius * 1.19);
            ctx.lineTo(p.radius * -0.78, p.radius * 0.24);
            ctx.quadraticCurveTo(p.radius * -0.94, p.radius * -0.06, p.radius * -0.73, p.radius * -0.375)
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.lineWidth = p.radius * 0.16
            ctx.beginPath();
            ctx.lineTo(p.radius * -0.45, p.radius * -0.24);
            ctx.lineTo(p.radius * 0.44, p.radius * -0.585);
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.lineTo(p.radius * -0.37, p.radius * -0.115);
            ctx.lineTo(p.radius * 0.62, p.radius * -0.19);
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.lineTo(p.radius * -0.39, p.radius * 0.05);
            ctx.lineTo(p.radius * 0.57, p.radius * 0.31);
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.lineTo(p.radius * -0.47, p.radius * 0.16);
            ctx.lineTo(p.radius * 0.31, p.radius * 0.656);
            ctx.stroke();
            ctx.closePath();
        },
        bomb: (p) => { // 新设计的bomb花瓣
            ctx.lineWidth = 3;
            ctx.fillStyle = blendColor('#2c2c2c', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#1a1a1a', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            // 绘制圆形主体
            ctx.beginPath();
            ctx.arc(0, 0, p.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            // 绘制引线
            ctx.beginPath();
            ctx.moveTo(p.radius * 0.6, -p.radius * 0.6);
            ctx.quadraticCurveTo(p.radius * 0.8, -p.radius * 0.9, p.radius * 1.1, -p.radius * 0.8);
            ctx.stroke();
            ctx.closePath();
            // 绘制火花
            ctx.fillStyle = blendColor('#ff6b35', '#FF0000', blendAmount(p));
            ctx.beginPath();
            ctx.arc(p.radius * 1.1, -p.radius * 0.8, p.radius * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        },
        hornet_missile: (p) => {
            ctx.lineWidth = 3;
            ctx.fillStyle = blendColor('#ffd700', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#ffb347', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            ctx.beginPath();
            ctx.moveTo(0, -p.radius);
            ctx.lineTo(p.radius * 0.7, 0);
            ctx.lineTo(p.radius * 0.5, p.radius);
            ctx.lineTo(-p.radius * 0.5, p.radius);
            ctx.lineTo(-p.radius * 0.7, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        },
        magnet: (p) => {
            ctx.fillStyle = blendColor('#a44343', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#853636', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            ctx.lineWidth = p.radius / 6;
            ctx.lineCap = "butt";
            ctx.beginPath();
            ctx.moveTo(p.radius * -0.25, p.radius * 0.38);
            ctx.quadraticCurveTo(p.radius * -0.47, p.radius * 0.22, p.radius * -0.42, p.radius * 0.08)
            ctx.quadraticCurveTo(p.radius * -0.28, p.radius * -0.25, p.radius * 0.05, p.radius * -0.48);
            ctx.quadraticCurveTo(p.radius * 0.32, p.radius * -1.12, p.radius * -0.39, p.radius * -1.05)
            ctx.quadraticCurveTo(p.radius * -1.78, p.radius * 0.1, p.radius * -0.66, p.radius * 0.96)
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.fillStyle = blendColor('#4343a4', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#363685', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            ctx.beginPath();
            ctx.moveTo(p.radius * -0.68, p.radius * 0.95);
            ctx.quadraticCurveTo(p.radius * 0.65, p.radius * 1.65, p.radius * 1.1, p.radius * -0.06);
            ctx.quadraticCurveTo(p.radius * 0.9, p.radius * -0.75, p.radius * 0.4, p.radius * -0.24);
            ctx.quadraticCurveTo(p.radius * 0.18, p.radius * 0.7, p.radius * -0.25, p.radius * 0.38);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.lineCap = "round";
        },
        thirdeye: (p) => {
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.fillStyle = blendColor("#000000", '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor("#000000", '#FF0000', blendAmount(p));
            if (checkForFirstFrame(p)) {
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF"
            }
            ctx.beginPath();
            ctx.lineTo(0, -p.radius * 0.9);
            ctx.quadraticCurveTo(p.radius * 0.9, 0, 0, p.radius * 0.9);
            ctx.quadraticCurveTo(-p.radius * 0.9, 0, 0, -p.radius * 0.9);
            ctx.fill();
            ctx.stroke()
            ctx.fillStyle = blendColor("#ffffff", '#FF0000', blendAmount(p));
            ctx.beginPath();
            ctx.arc(0, 0, p.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    };

    // 根据等级设置边框和背景颜色
    const levelColors = {
        1: { border: '#66c258', bg: '#7eef6d' },  // 绿色
        2: { border: '#cfba4b', bg: '#ffe65d' },  // 黄色
        3: { border: '#3b41c5', bg: '#4d54e1' },  // 蓝色
        4: { border: '#6d19b4', bg: '#861fde' },  // 紫色
        5: { border: '#b41919', bg: '#de1f1f' },  // 红色
        6: { border: '#19b1b4', bg: '#1fdbde' },  // 天蓝
        7: { border: '#414547', bg: '#535351' }        // 棕黑
    };

    const levelColor = levelColors[petal.level] || levelColors[1];

    // 绘制背景
    ctx.fillStyle = levelColor.bg;
    ctx.fillRect(0, 0, width, height);

    // 绘制粗边框
    ctx.strokeStyle = levelColor.border;
    ctx.lineWidth = borderWidth * resolution;  // 动态边框宽度
    const borderOffset = 2 * scale  * resolution;
    ctx.strokeRect(borderOffset, borderOffset, width - borderOffset * 2, height - borderOffset * 2);

    // 绘制花瓣图案
    const petalSize = petalScale * resolution;  // 动态花瓣大小
    const petalX = (width - petalSize) / 2;
    const finalPetalY = petalY * resolution;  // 动态Y位置

    // 创建专用的花瓣渲染函数
    function renderPetalForItem(type, x, y, size, level) {
        ctx.save();
        ctx.translate(x + petalSize/2, y + petalSize/2);


        // 临时设置全局ctx为当前canvas上下文
        window.ctx = ctx;

        // 创建花瓣对象以兼容petalRenderMap
        const petalData = {
            type: type,
            radius: 9 / 55 * displaySize * resolution,  // 基础半径
            level: level,
            ticksSinceLastDamaged: 1000,
            lastTicksSinceLastDamaged: 1000
        };

        // 根据类型获取对应的渲染函数（小写）
        const typeMap = {
            0: 'missile',
            1: 'basic',
            3: 'leaf',
            4: 'wing',
            5: 'lighting',
            6: 'iris',
            7: 'shell',
            8: 'bomb',
            9: 'magnet',
            10: 'thirdeye'
        };

        const renderType = typeMap[type] || 'basic';
        const renderFunc = localPetalRenderMap[renderType];

        if (renderFunc) {
            renderFunc(petalData);
        }


        ctx.restore();
    }

    // 渲染花瓣
    renderPetalForItem(petal.type, petalX, finalPetalY, petalSize, petal.level);

    // 绘制花瓣名称
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${fontSize * resolution}px Arial`;  // 动态字体大小
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // 根据花瓣类型获取对应的中文名称
    const petalNames = {
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
        10: '第三只眼'
    };

    // 获取花瓣名称，处理各种异常情况
    let displayName;
    if (petal.type === undefined || petal.type === null) {
        displayName = '未知';
    } else {
        displayName = petalNames[petal.type] || `类型${petal.type}`;
    }

    ctx.fillText(displayName, width / 2, textY * resolution);  // 动态文字Y位置
}

// 在现有上下文中绘制掉落物花瓣（简化版本，不影响全局状态）
function drawPetalInContext(petal, ctx, displaySize) {
    // 保存原始canvas状态
    ctx.save()

    //设置默认参数（以55px为基准）
    const defaults = {
        displaySize: 55,      // 显示尺寸（像素）
        resolution: 4,        // 分辨率倍数
    };

    // 合并用户提供的选项
    const config = { ...defaults, displaySize: displaySize };
    const actualDisplaySize = config.displaySize;
    const resolution = config.resolution;

    // 计算实际分辨率
    const width = displaySize * resolution;
    const height = displaySize * resolution;

    // 根据displaySize动态计算所有参数（以55px为基准）
    const scale = displaySize / 55;
    const borderWidth = 7 * scale;
    const petalScale = 33 * scale;
    const petalY = 8 * scale;
    const fontSize = 10 * scale;
    const textY = 49 * scale;



    // 完全按照原始petalRenderMap复制到drawPetalItem函数内部
    const localPetalRenderMap = {
        basic: (p) => {
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.fillStyle = blendColor('#ffffff', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#cfcfcf', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
        },
        missile: (p) => {
            p.radius = p.radius * 0.7;
            let bodyColor = blendColor("#333333", "#FF0000", blendAmount(p));
            if (checkForFirstFrame(p)) {
                bodyColor = "#FFFFFF";
            }
            ctx.lineJoin = 'round';
            ctx.rotate(Math.PI * 3 / 4);
            ctx.beginPath();
            ctx.fillStyle = bodyColor;
            ctx.strokeStyle = bodyColor;
            ctx.lineWidth = p.radius / 1.5;
            ctx.moveTo(0, -p.radius * Math.sqrt(3));
            ctx.lineTo(p.radius * Math.sqrt(3) * .48, p.radius / 2 * Math.sqrt(3));
            ctx.lineTo(-p.radius * Math.sqrt(3) * .48, p.radius / 2 * Math.sqrt(3));
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.rotate(-Math.PI *3 / 4);
        },
        leaf: (p) => {
            p.radius = p.radius * 0.7;
            const divCoef = 1.305;
            ctx.lineWidth = p.radius/divCoef/2.5;
            ctx.fillStyle = blendColor('#39b54a', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#2e933c', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            ctx.rotate(Math.PI / 4 - 0.2);
            ctx.beginPath();
            ctx.moveTo(0, 1.854*p.radius/divCoef);
            // bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
            ctx.quadraticCurveTo(-2.88*p.radius/divCoef*.87, 0.31*p.radius/divCoef, 0, -2.325*p.radius/divCoef);
            ctx.moveTo(0, 1.854*p.radius/divCoef);
            ctx.quadraticCurveTo(2.88*p.radius/divCoef*.87, 0.31*p.radius/divCoef, 0, -2.325*p.radius/divCoef);
            // tail
            ctx.moveTo(0, 1.948*p.radius/divCoef);
            ctx.lineTo(0, 2.536*p.radius/divCoef);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            // curve in the middle
            ctx.moveTo(0, (1.948-1)*p.radius/divCoef);
            ctx.quadraticCurveTo(-0.18*p.radius/divCoef, -0.1885*p.radius/divCoef, 0, (-2.325+1.05)*p.radius/divCoef);
            ctx.stroke();
            ctx.closePath();
            ctx.rotate(-Math.PI / 4 + 0.2);
        },
        wing: (p) => {
            const divCoef = 1.35;
            ctx.lineWidth = p.radius/divCoef/1.9;
            ctx.fillStyle = blendColor('#ffffff', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#cdcdcd', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            ctx.beginPath();
            ctx.arc(0, 0, p.radius*1.01, -Math.PI * 0.18, Math.PI * 0.818);
            ctx.arcTo(p.radius * 0.42, p.radius * 0.6, p.radius*0.85, -p.radius * 0.53, p.radius * 1.7);
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
        },
        lighting: (p) => { // thunder -> lighting
            ctx.strokeStyle = blendColor('#21c4b9', '#FF0000', blendAmount(p));
            ctx.fillStyle = blendColor('#29f2e5', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#ffffff";
                ctx.strokeStyle = "#ffffff";
            }
            ctx.lineWidth = p.radius * 0.2;
            ctx.beginPath();
            for(let i = 0; i<10; i++){
                let ang = i * Math.PI/5;
                ctx.lineTo(Math.cos(ang) * p.radius * 0.7, Math.sin(ang) * p.radius * 0.7)
                ctx.lineTo(Math.cos(ang + Math.PI/10) * p.radius * 1.4, Math.sin(ang + Math.PI/10) * p.radius * 1.4)
            }
            ctx.lineTo(p.radius * 0.7, 0)
            ctx.fill();
            ctx.stroke();
        },
        iris: (p) => { // venom -> iris
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.fillStyle = blendColor('#ce76db', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#a760b1', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
        },
        shell: (p) => { // shield -> shell
            ctx.strokeStyle = blendColor('#ccb36d', '#FF0000', blendAmount(p));
            ctx.fillStyle = blendColor('#fcdd86', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#ffffff";
                ctx.strokeStyle = "#ffffff";
            }
            ctx.lineWidth = p.radius * 0.2;
            ctx.beginPath();
            ctx.lineTo(p.radius * -0.73, p.radius * -0.375);
            ctx.lineTo(p.radius * 0.39, p.radius * -1.15)
            ctx.arcTo(p.radius * 3.3, p.radius * 0.21, p.radius * 0.14, p.radius * 1.19, p.radius * 1.24)
            ctx.lineTo(p.radius * 0.14, p.radius * 1.19);
            ctx.lineTo(p.radius * 0.14, p.radius * 1.19);
            ctx.lineTo(p.radius * -0.78, p.radius * 0.24);
            ctx.quadraticCurveTo(p.radius * -0.94, p.radius * -0.06, p.radius * -0.73, p.radius * -0.375)
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.lineWidth = p.radius * 0.16
            ctx.beginPath();
            ctx.lineTo(p.radius * -0.45, p.radius * -0.24);
            ctx.lineTo(p.radius * 0.44, p.radius * -0.585);
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.lineTo(p.radius * -0.37, p.radius * -0.115);
            ctx.lineTo(p.radius * 0.62, p.radius * -0.19);
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.lineTo(p.radius * -0.39, p.radius * 0.05);
            ctx.lineTo(p.radius * 0.57, p.radius * 0.31);
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.lineTo(p.radius * -0.47, p.radius * 0.16);
            ctx.lineTo(p.radius * 0.31, p.radius * 0.656);
            ctx.stroke();
            ctx.closePath();
        },
        bomb: (p) => { // 新设计的bomb花瓣
            ctx.lineWidth = 3;
            ctx.fillStyle = blendColor('#2c2c2c', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#1a1a1a', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            // 绘制圆形主体
            ctx.beginPath();
            ctx.arc(0, 0, p.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            // 绘制引线
            ctx.beginPath();
            ctx.moveTo(p.radius * 0.6, -p.radius * 0.6);
            ctx.quadraticCurveTo(p.radius * 0.8, -p.radius * 0.9, p.radius * 1.1, -p.radius * 0.8);
            ctx.stroke();
            ctx.closePath();
            // 绘制火花
            ctx.fillStyle = blendColor('#ff6b35', '#FF0000', blendAmount(p));
            ctx.beginPath();
            ctx.arc(p.radius * 1.1, -p.radius * 0.8, p.radius * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        },
        hornet_missile: (p) => {
            ctx.lineWidth = 3;
            ctx.fillStyle = blendColor('#ffd700', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#ffb347', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            ctx.beginPath();
            ctx.moveTo(0, -p.radius);
            ctx.lineTo(p.radius * 0.7, 0);
            ctx.lineTo(p.radius * 0.5, p.radius);
            ctx.lineTo(-p.radius * 0.5, p.radius);
            ctx.lineTo(-p.radius * 0.7, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        },
        magnet: (p) => {
            ctx.fillStyle = blendColor('#a44343', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#853636', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            ctx.lineWidth = p.radius / 6;
            ctx.lineCap = "butt";
            ctx.beginPath();
            ctx.moveTo(p.radius * -0.25, p.radius * 0.38);
            ctx.quadraticCurveTo(p.radius * -0.47, p.radius * 0.22, p.radius * -0.42, p.radius * 0.08)
            ctx.quadraticCurveTo(p.radius * -0.28, p.radius * -0.25, p.radius * 0.05, p.radius * -0.48);
            ctx.quadraticCurveTo(p.radius * 0.32, p.radius * -1.12, p.radius * -0.39, p.radius * -1.05)
            ctx.quadraticCurveTo(p.radius * -1.78, p.radius * 0.1, p.radius * -0.66, p.radius * 0.96)
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.fillStyle = blendColor('#4343a4', '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor('#363685', '#FF0000', blendAmount(p));
            if(checkForFirstFrame(p)){
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF";
            }
            ctx.beginPath();
            ctx.moveTo(p.radius * -0.68, p.radius * 0.95);
            ctx.quadraticCurveTo(p.radius * 0.65, p.radius * 1.65, p.radius * 1.1, p.radius * -0.06);
            ctx.quadraticCurveTo(p.radius * 0.9, p.radius * -0.75, p.radius * 0.4, p.radius * -0.24);
            ctx.quadraticCurveTo(p.radius * 0.18, p.radius * 0.7, p.radius * -0.25, p.radius * 0.38);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.lineCap = "round";
        },
        thirdeye: (p) => {
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.fillStyle = blendColor("#000000", '#FF0000', blendAmount(p));
            ctx.strokeStyle = blendColor("#000000", '#FF0000', blendAmount(p));
            if (checkForFirstFrame(p)) {
                ctx.fillStyle = "#FFFFFF";
                ctx.strokeStyle = "#FFFFFF"
            }
            ctx.beginPath();
            ctx.lineTo(0, -p.radius * 0.9);
            ctx.quadraticCurveTo(p.radius * 0.9, 0, 0, p.radius * 0.9);
            ctx.quadraticCurveTo(-p.radius * 0.9, 0, 0, -p.radius * 0.9);
            ctx.fill();
            ctx.stroke()
            ctx.fillStyle = blendColor("#ffffff", '#FF0000', blendAmount(p));
            ctx.beginPath();
            ctx.arc(0, 0, p.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    };

    // 根据等级设置边框和背景颜色
    const levelColors = {
        1: { border: '#66c258', bg: '#7eef6d' },  // 绿色
        2: { border: '#cfba4b', bg: '#ffe65d' },  // 黄色
        3: { border: '#3b41c5', bg: '#4d54e1' },  // 蓝色
        4: { border: '#6d19b4', bg: '#861fde' },  // 紫色
        5: { border: '#b41919', bg: '#de1f1f' },  // 红色
        6: { border: '#19b1b4', bg: '#1fdbde' },  // 天蓝
        7: { border: '#414547', bg: '#535351' }        // 棕黑
    };

    const levelColor = levelColors[petal.level] || levelColors[1];

    // 绘制背景
    ctx.fillStyle = levelColor.bg;
    ctx.fillRect(-width/2, -height/2, width, height);

    // 绘制粗边框
    ctx.strokeStyle = levelColor.border;
    ctx.lineWidth = borderWidth * resolution;  // 动态边框宽度
    const borderOffset = 2 * scale  * resolution;
    ctx.strokeRect(-width/2 + borderOffset, -height/2 + borderOffset, width - borderOffset * 2, height - borderOffset * 2);

    // 绘制花瓣图案
    const petalSize = petalScale * resolution;  // 动态花瓣大小
    const petalX = (width - petalSize) / 2 - width/2;
    const finalPetalY = petalY * resolution - height/2;  // 动态Y位置

    // 创建专用的花瓣渲染函数
    function renderPetalForItem(type, x, y, size, level) {
        ctx.save();
        ctx.translate(x + petalSize/2, y + petalSize/2);

        // 创建花瓣对象以兼容petalRenderMap
        const petalData = {
            type: type,
            radius: 9 / 55 * actualDisplaySize * resolution,  // 基础半径
            level: level,
            ticksSinceLastDamaged: 1000,
            lastTicksSinceLastDamaged: 1000
        };

        // 根据类型获取对应的渲染函数（小写）
        const typeMap = {
            0: 'missile',
            1: 'basic',
            3: 'leaf',
            4: 'wing',
            5: 'lighting',
            6: 'iris',
            7: 'shell',
            8: 'bomb',
            9: 'magnet',
            10: 'thirdeye'
        };

        if(typeof type === 'integer' || typeof type === 'number'){
            type = typeMap[type] || 'basic';
        }
        const renderFunc = localPetalRenderMap[type];

        if (renderFunc) {
            renderFunc(petalData);
        }

        ctx.restore();
    }

    // 渲染花瓣
    renderPetalForItem(petal.type, petalX, finalPetalY, petalSize, petal.level);

    // 绘制花瓣名称
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${fontSize * resolution}px Arial`;  // 动态字体大小
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // 根据花瓣类型获取对应的中文名称
    const petalNames = {
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
        10: '第三只眼'
    };

    // 获取花瓣名称，处理各种异常情况
    let displayName;
    if (petal.type === undefined || petal.type === null) {
        displayName = '未知';
    } else {
        displayName = petalNames[petal.type];
    }

    ctx.fillText(displayName, 0, textY * resolution - height/2);  // 动态文字Y位置

    ctx.restore();
}

// 根据花瓣类型和等级获取正确的图片文件名
function getPetalImageName(type, level) {
    // 如果类型为-1（未装备），返回默认图片
    if (type === -1) {
        return 'none.png';
    }

    try {
        // 将类型和等级转换为两位数字符串
        const typeStr = type.toString();
        const levelStr = level.toString();

        // 查找匹配的图片
        for (const resource of resources) {
            if (resource.startsWith(typeStr) && resource.endsWith('.png')) {
                // 检查是否是完全匹配（类型+等级的长度可能是4位或5位）
                const expectedName = typeStr + levelStr;
                if (resource.replace('.png', '') === expectedName) {
                    return resource;
                }
            }
        }

        // 如果没有找到完全匹配的，尝试找到类型匹配的
        for (const resource of resources) {
            if (resource.startsWith(typeStr) && resource.endsWith('.png')) {
                return resource;
            }
        }
    } catch (error) {
        console.error('获取花瓣图片名称时出错:', error, '类型:', type, '等级:', level);
    }

    // 如果还是没有找到，返回默认图片
    return 'none.png';
}


// 根据对象名称获取正确的图片
function getObjectImage(obj) {
    if (obj.name.includes('petal')) {
        // 对于花瓣，使用类型和等级获取图片
        const matches = obj.name.match(/\d+/g);
        if (matches && matches.length >= 2) {
            const type = parseInt(matches[0]);
            const level = parseInt(matches[1]);
            return getPetalImageName(type, level);
        }
        return 'none.png';
    }
    else return obj.name + '.png';
}

// 显示大厅界面
function showLobby() {
    gameState.playerName = playerNameInput.value || 'Player';
    startButton.style.display = 'none';
    playerNameInput.style.display = 'none';
    lobbyUI.style.display = 'flex';
    gameState.isLobby = true;

    // 初始化装备槽
    initializeEquipmentSlots();

    // 初始化可用花瓣
    initializeAvailablePetals();

    // 如果有保存的构筑，自动装备
    if (gameState.savedBuild) {
        console.log('进入大厅，自动装备保存的构筑');
        autoEquipSavedBuild();
    }

    // 更新房间信息
    updateRoomInfo();
}

// 初始化装备槽
function initializeEquipmentSlots() {
    equipmentSlots.innerHTML = '';

    // 创建两行，每行5个槽位
    for (let row = 0; row < 2; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'equipment-row';

        for (let col = 0; col < 5; col++) {
            const slotIndex = row * 5 + col;
            const slot = document.createElement('div');
            slot.className = 'equipment-slot';
            slot.dataset.index = slotIndex;

            // 添加拖拽事件监听
            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('dragenter', handleDragEnter);
            slot.addEventListener('dragleave', handleDragLeave);
            slot.addEventListener('drop', handleDrop);

            // 添加基础的拖拽事件监听（用于装备了花瓣的情况）
            slot.addEventListener('mousedown', (e) => {
                const petal = gameState.equippedPetals[slotIndex];
                if (petal && petal.type !== undefined && petal.level !== undefined) {
                    slot.draggable = true;
                } else {
                    slot.draggable = false;
                }
            });

            slot.addEventListener('dragstart', (e) => {
                const petal = gameState.equippedPetals[slotIndex];
                if (petal && petal.type !== undefined && petal.level !== undefined) {
                    const dragData = {
                        type: 'equipment',
                        slotIndex: slotIndex,
                        petal: petal
                    };
                    const dragString = JSON.stringify(dragData);

                    // 设置拖拽数据
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', dragString);
                    e.dataTransfer.setData('sourceIndex', slotIndex.toString());

                    // 设置拖拽图像（使用槽位本身）
                    try {
                        e.dataTransfer.setDragImage(slot, 25, 25);
                    } catch (error) {
                        console.log('设置拖拽图像失败，使用默认图像');
                    }

                    slot.classList.add('dragging');
                    console.log('拖拽数据已设置，拖拽数据长度:', dragString.length);
                } else {
                    console.log(`槽位 ${slotIndex} 为空，阻止拖拽`);
                    e.preventDefault();
                }
            });

            slot.addEventListener('dragend', (e) => {
                slot.classList.remove('dragging');
            });

            // 添加提示文本
            const hint = document.createElement('div');
            hint.textContent = slotIndex + 1;
            hint.style.color = 'rgba(255, 255, 255, 0.5)';
            hint.style.fontSize = '12px';
            slot.appendChild(hint);

            rowDiv.appendChild(slot);
        }

        equipmentSlots.appendChild(rowDiv);
    }
}

// 自动装备保存的构筑
function autoEquipSavedBuild() {
    if (!gameState.savedBuild || !Array.isArray(gameState.savedBuild)) {
        console.log('没有保存的构筑数据');
        return;
    }

    // 防止重复装备
    if (gameState.isAutoEquipping) {
        console.log('正在装备中，跳过重复调用');
        return;
    }

    gameState.isAutoEquipping = true;

    // 检查装备槽是否已初始化
    if (!equipmentSlots || equipmentSlots.children.length === 0) {
        setTimeout(() => {
            gameState.isAutoEquipping = false; // 清除标志，允许重试
            autoEquipSavedBuild();
        }, 100);
        return;
    }

    // 清空当前装备槽
    gameState.equippedPetals = new Array(10).fill(null);

    // 基于服务器完整数据计算可用花瓣数量
    const totalAvailablePetals = calculateTotalAvailablePetals();
    console.log('基于服务器数据计算的可用花瓣:', totalAvailablePetals);

    // 装备的花瓣列表，用于后续扣除
    const equippedPetals = [];

    // 自动装备保存的构筑
    for (let i = 0; i < Math.min(gameState.savedBuild.length, 10); i++) {
        const savedPetal = gameState.savedBuild[i];
        if (savedPetal && Array.isArray(savedPetal) && savedPetal.length >= 2) {
            const petalType = savedPetal[0];
            const petalLevel = savedPetal[1];

            // 检查是否为有效花瓣（非空槽位）
            if (petalType !== -1 && petalLevel > 0) {
                // 检查基于完整数据的可用数量
                if (hasEnoughPetals(totalAvailablePetals, petalType, petalLevel)) {
                    // 设置装备数据
                    gameState.equippedPetals[i] = {
                        type: petalType,
                        level: petalLevel,
                        count: 1
                    };

                    // 记录装备的花瓣，用于后续扣除
                    equippedPetals.push({ type: petalType, level: petalLevel });

                    console.log(`自动装备槽位 ${i}: ${petalType}-${petalLevel}`);
                } else {
                    console.log(`玩家没有足够的 ${petalType}-${petalLevel}，跳过装备`);
                }
            }
        }
    }

    // 从背包中扣除装备的花瓣数量
    deductEquippedPetalsFromBag(equippedPetals);

    // 更新UI
    updateEquipmentSlots();
    updateBagContent();
    updateRoomPlayers();
    saveCurrentBuild();

    console.log('自动装备完成');

    // 清除装备标志
    gameState.isAutoEquipping = false;
}

// 从背包中扣除装备的花瓣
function deductEquippedPetalsFromBag(equippedPetals) {
    // 统计每种花瓣需要扣除的数量
    const deductCounts = {};
    equippedPetals.forEach(petal => {
        const key = `${petal.type}-${petal.level}`;
        deductCounts[key] = (deductCounts[key] || 0) + 1;
    });

    // 从availablePetals中扣除
    for (const [key, count] of Object.entries(deductCounts)) {
        const [type, level] = key.split('-').map(Number);

        for (let petal of gameState.availablePetals) {
            if (petal.type === type && petal.level === level && petal.count > 0) {
                const deductAmount = Math.min(petal.count, count);
                petal.count -= deductAmount;
                break;
            }
        }
    }

    console.log('从背包扣除的花瓣:', deductCounts);
    console.log('扣除后的背包:', gameState.availablePetals);
}

// 基于服务器数据计算真实的可用花瓣数量
function calculateTotalAvailablePetals() {
    if (!gameState.serverBuild) return [];

    const totalPetals = [];

    // 解析服务器完整数据
    for (let i = 0; i < 11; i++) {
        const petalKey = `petal${i}`;
        const petalString = gameState.serverBuild[petalKey];

        if (petalString && petalString.length === 28) {
            const petalType = i;

            // 每4个数字表示一个等级的花瓣数量
            for (let level = 1; level <= 7; level++) {
                const startIndex = (level - 1) * 4;
                const countStr = petalString.substring(startIndex, startIndex + 4);
                const count = parseInt(countStr, 10);

                if (count > 0) {
                    totalPetals.push({
                        type: petalType,
                        level: level,
                        count: count
                    });
                }
            }
        }
    }

    // 减去合成槽中占用的数量
    const absorbSlotCounts = {};
    gameState.absorbSlots.forEach(slot => {
        if (slot && slot.count > 0) {
            const key = `${slot.type}-${slot.level}`;
            absorbSlotCounts[key] = (absorbSlotCounts[key] || 0) + slot.count;
        }
    });

    // 减去已装备的花瓣数量
    const equippedCounts = {};
    gameState.equippedPetals.forEach(petal => {
        if (petal && petal.type !== undefined) {
            const key = `${petal.type}-${petal.level}`;
            equippedCounts[key] = (equippedCounts[key] || 0) + 1;
        }
    });

    // 计算最终可用数量
    const finalPetals = [];
    totalPetals.forEach(petal => {
        const key = `${petal.type}-${petal.level}`;
        const absorbCount = absorbSlotCounts[key] || 0;
        const equippedCount = equippedCounts[key] || 0;
        const availableCount = Math.max(0, petal.count - absorbCount - equippedCount);

        if (availableCount > 0) {
            finalPetals.push({
                type: petal.type,
                level: petal.level,
                count: availableCount
            });
        }
    });

    return finalPetals;
}

// 检查是否有足够的花瓣
function hasEnoughPetals(totalPetals, petalType, petalLevel) {
    const petal = totalPetals.find(p => p.type === petalType && p.level === petalLevel);
    return petal && petal.count > 0;
}


// 设置装备槽的拖拽事件
function setupSlotDragEvents(slot, slotIndex, petal) {
    // 清除可能存在的旧事件监听器
    slot.replaceWith(slot.cloneNode(true));
    const newSlot = equipmentSlots.querySelector(`.equipment-slot[data-index="${slotIndex}"]`);

    // 重新设置拖拽开始事件
    newSlot.addEventListener('dragstart', (e) => {
        console.log(`开始拖拽槽位 ${slotIndex} 的花瓣: ${petal.type}-${petal.level}`);
        const dragData = {
            type: 'equipment',
            slotIndex: slotIndex,
            petal: petal
        };
        const dragString = JSON.stringify(dragData);
        console.log('拖拽数据:', dragString);

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragString);
        e.dataTransfer.setData('sourceIndex', slotIndex);
        newSlot.classList.add('dragging');
    });

    // 添加拖拽结束事件
    newSlot.addEventListener('dragend', (e) => {
        newSlot.classList.remove('dragging');
    });
}

// 在availablePetals中找到指定类型和等级的花瓣索引
function findPetalIndex(petalType, petalLevel) {
    if (!gameState.availablePetals || !Array.isArray(gameState.availablePetals)) {
        return -1;
    }

    for (let i = 0; i < gameState.availablePetals.length; i++) {
        const petal = gameState.availablePetals[i];
        if (petal && petal.type === petalType && petal.level === petalLevel && petal.count > 0) {
            return i;
        }
    }

    return -1; // 没找到
}

// 检查玩家是否有指定类型和等级的花瓣
function hasPetalInInventory(petalType, petalLevel) {
    if (!gameState.availablePetals || !Array.isArray(gameState.availablePetals)) {
        return false;
    }

    return gameState.availablePetals.some(petal =>
        petal.type === petalType && petal.level === petalLevel && petal.count > 0
    );
}

// 更新装备槽显示
function updateEquipmentSlots() {
    if (!equipmentSlots) {
        console.error('equipmentSlots 元素未找到');
        return;
    }

    gameState.equippedPetals.forEach((petal, index) => {
        const slot = equipmentSlots.querySelector(`.equipment-slot[data-index="${index}"]`);

        if (slot) {
            // 清空槽位内容
            slot.innerHTML = '';

            if (petal && petal.type !== undefined && petal.level !== undefined) {
                // 装备了花瓣
                slot.classList.add('equipped');
                slot.draggable = true; // 使装备的花瓣可拖拽

                // 为第七级花瓣添加特殊的CSS类
                if (petal.level === 7) {
                    slot.classList.add('level-7');
                }

                // 使用canvas绘制花瓣
                const canvas = document.createElement('canvas');
                drawPetalItem(petal, canvas, {displaySize:58});
                slot.appendChild(canvas);

                // 拖拽事件已在初始化时设置，无需重复设置
            } else {
                // 空槽位，显示编号
                slot.classList.remove('equipped');
                const hint = document.createElement('div');
                hint.textContent = index + 1;
                hint.style.color = 'rgba(255, 255, 255, 0.5)';
                hint.style.fontSize = '12px';
                slot.appendChild(hint);
            }
        }
    });
}

// 保存当前构筑到服务器
function saveCurrentBuild() {
    if (!gameState.connected || !gameState.playerId) {
        return;
    }

    // 将当前装备转换为服务器格式
    const currentBuild = gameState.equippedPetals.map(petal => {
        if (petal && petal.type !== undefined && petal.level !== undefined) {
            return [petal.type, petal.level];
        }
        return [-1, 0]; // 空槽位
    });

    console.log('保存当前构筑到服务器:', currentBuild);

    // 发送构筑更新到服务器
    sendToServer({
        COMMAND: 'CHANGEBUILD',
        client_name: gameState.playerName,
        build: currentBuild,
        room_id: gameState.currentRoom || 0,
        id: gameState.playerId
    });
}

// 初始化可用花瓣
function initializeAvailablePetals() {
    // 保存当前合成槽状态
    const currentSlots = [...gameState.absorbSlots];
    const currentTotal = gameState.absorbTotalCount;

    // 模拟一些花瓣数据
    if (gameState.serverBuild) {
        gameState.availablePetals = parseServerBuild(gameState.serverBuild);

        // 减去合成槽中已占用的花瓣数量
        adjustAvailablePetalsForAbsorbSlots();
    }

    // 恢复合成槽状态（防止被覆盖）
    gameState.absorbSlots = currentSlots;
    gameState.absorbTotalCount = currentTotal;

    // 初始化背包内容
    initializeBagContent();
}

// 调整可用花瓣数量，考虑合成槽中的花瓣
function adjustAvailablePetalsForAbsorbSlots() {
    // 统计合成槽中每种花瓣占用的数量
    const absorbSlotCounts = {};

    gameState.absorbSlots.forEach(slot => {
        if (slot && slot.count > 0) {
            const key = `${slot.type}-${slot.level}`;
            absorbSlotCounts[key] = (absorbSlotCounts[key] || 0) + slot.count;
        }
    });

    // 从可用花瓣中减去占用的数量
    gameState.availablePetals.forEach(petal => {
        const key = `${petal.type}-${petal.level}`;
        if (absorbSlotCounts[key]) {
            petal.count = Math.max(0, petal.count - absorbSlotCounts[key]);
        }
    });

    console.log('调整后的可用花瓣（已减去合成槽占用）:', gameState.availablePetals);
}

// 拖拽开始处理
function handleDragStart(e) {
    const petalItem = e.target.closest('.petal-item');
    if (!petalItem) return;

    const index = petalItem.dataset.index;
    e.dataTransfer.setData('text/plain', index);
    petalItem.classList.add('dragging');
}

// 拖拽结束处理
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

// 拖拽经过处理
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('equipment-slot')) {
        e.target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    e.preventDefault();
    if (e.target.classList.contains('equipment-slot')) {
        e.target.classList.remove('drag-over');
    }
}

// 拖拽放下处理
function handleDrop(e) {
    e.preventDefault();

    // 移除所有拖拽样式
    document.querySelectorAll('.equipment-slot.drag-over').forEach(slot => {
        slot.classList.remove('drag-over');
    });

    const dragData = e.dataTransfer.getData('text/plain');
    const slotElement = e.target.closest('.equipment-slot');

    if (!slotElement) return;

    const slotIndex = parseInt(slotElement.dataset.index);

    if (dragData !== '') {
        try {
            const data = JSON.parse(dragData);

            if (data.type === 'equipment') {
                // 从装备槽拖到装备槽 - 直接返回背包
                if (data.slotIndex !== undefined) {
                    returnPetalToBag(data.slotIndex);
                }
            } else {
                // 从背包拖到装备槽
                equipPetal(parseInt(dragData), slotIndex);
            }
        } catch (error) {
            // 兼容旧格式（直接是petalIndex）
            equipPetal(parseInt(dragData), slotIndex);
        }
    }

    // 移除拖拽样式
    const draggingElement = document.querySelector('.petal-item.dragging');
    if (draggingElement) {
        draggingElement.classList.remove('dragging');
    }


    sendToServer({
        COMMAND: 'CHANGEBUILD',
        client_name: gameState.playerName,
        build: gameState.equippedPetals.map(petal => {
            return petal ? [petal.type, petal.level] : [-1, 0];
        }),
        room_id: gameState.currentRoom,
        id: gameState.playerId
    });
}

function parseServerBuild(buildData) {
    const availablePetals = [];

    // 遍历petal0到petal10（共11种花瓣类型）
    for (let i = 0; i < 11; i++) {
        const petalKey = `petal${i}`;
        const petalString = buildData[petalKey];

        if (petalString && petalString.length === 28) {
            const petalType = i; // petal0对应类型0（missile），以此类推

            // 每4个数字表示一个等级的花瓣数量，共7个等级
            for (let level = 1; level <= 7; level++) {
                const startIndex = (level - 1) * 4;
                const countStr = petalString.substring(startIndex, startIndex + 4);
                const count = parseInt(countStr, 10);

                // 只有当数量大于0时才添加到可用花瓣中
                if (count > 0) {
                    availablePetals.push({
                        type: petalType,
                        level: level,
                        count: count
                    });
                }
            }
        }
    }

    console.log('从服务器解析的花瓣数据:', availablePetals);
    return availablePetals;
}


function updateInventoryDisplay() {
    const inventory = document.getElementById('inventory');
    inventory.innerHTML = '';

    // 显示装备的花瓣
    gameState.equippedPetals.forEach((petal, index) => {
        const slot = document.createElement('div');
        slot.className = 'inventorySlot';

        if (petal) {
            // 使用canvas绘制花瓣
            const canvas = document.createElement('canvas');
            drawPetalItem(petal, canvas, { displaySize: 50 });
            slot.appendChild(canvas);
            slot.title = `类型: ${petal.type}, 等级: ${petal.level}`;
        } else {
            // 如果没有装备花瓣，显示空槽位
            slot.textContent = index + 1;
            slot.style.color = 'rgba(255, 255, 255, 0.5)';
        }

        inventory.appendChild(slot);
    });
}

// 装备花瓣
function equipPetal(petalIndex, slotIndex) {
    if (petalIndex >= 0 && petalIndex < gameState.availablePetals.length &&
        slotIndex >= 0 && slotIndex < gameState.equipmentSlots) {

        const petal = gameState.availablePetals[petalIndex];

        // 检查花瓣数量是否足够
        if (petal.count <= 0) {
            alert('该花瓣数量不足!');
            return;
        }

        // 检查槽位是否已有花瓣，如有则先归还到背包
        if (gameState.equippedPetals[slotIndex]) {
            returnPetalToBag(slotIndex);
        }

        gameState.equippedPetals[slotIndex] = {...petal};

        // 更新UI
        const slot = equipmentSlots.querySelector(`.equipment-slot[data-index="${slotIndex}"]`);
        if (!slot) {
            console.error(`槽位 ${slotIndex} 未找到，无法装备花瓣`);
            return;
        }
        slot.innerHTML = '';
        slot.classList.add('equipped');
        // 为第七级花瓣添加特殊的CSS类
        if (petal.level === 7) {
            slot.classList.add('level-7');
        }

        // 使用canvas绘制花瓣
        const canvas = document.createElement('canvas');
        drawPetalItem(petal, canvas);
        slot.appendChild(canvas);

        // 减少可用花瓣数量
        petal.count--;

        // 更新背包UI
        updateBagContent();
        updateRoomPlayers();

        // 自动保存构筑到服务器
        saveCurrentBuild();
    }
}

// 将装备槽中的花瓣归还到背包
function returnPetalToBag(slotIndex) {
    console.log(`尝试归还槽位 ${slotIndex} 的花瓣`);

    const equippedPetal = gameState.equippedPetals[slotIndex];
    if (!equippedPetal) {
        console.log(`槽位 ${slotIndex} 没有花瓣`);
        return;
    }

    console.log(`将槽位 ${slotIndex} 的花瓣归还到背包: ${equippedPetal.type}-${equippedPetal.level}`);

    // 在背包中找到对应类型和等级的花瓣并增加数量
    let found = false;
    for (let petal of gameState.availablePetals) {
        if (petal.type === equippedPetal.type && petal.level === equippedPetal.level) {
            petal.count++;
            console.log(`增加背包中花瓣数量: ${petal.type}-${petal.level}, 新数量: ${petal.count}`);
            found = true;
            break;
        }
    }

    if (!found) {
        console.log(`背包中没有找到对应花瓣 ${equippedPetal.type}-${equippedPetal.level}，创建新记录`);
        // 如果背包中没有对应花瓣，创建一个新记录
        gameState.availablePetals.push({
            type: equippedPetal.type,
            level: equippedPetal.level,
            count: 1,
            originalIndex: gameState.availablePetals.length
        });
    }

    // 清空装备槽
    gameState.equippedPetals[slotIndex] = null;

    // 更新UI
    const slot = equipmentSlots.querySelector(`.equipment-slot[data-index="${slotIndex}"]`);
    if (slot) {
        slot.innerHTML = '';
        slot.classList.remove('equipped');
        slot.draggable = false; // 禁用拖拽

        // 显示槽位编号
        const hint = document.createElement('div');
        hint.textContent = slotIndex + 1;
        hint.style.color = 'rgba(255, 255, 255, 0.5)';
        hint.style.fontSize = '12px';
        slot.appendChild(hint);
    }

    // 更新背包UI
    updateBagContent();
    updateRoomPlayers();

    // 保存构筑到服务器
    saveCurrentBuild();

    console.log(`槽位 ${slotIndex} 花瓣归还完成`);
}

// 显示窗口
function showWindow(type) {
    if (type === 'bag') {
        bagWindow.style.display = 'block';
    } else if (type === 'absorb') {
        absorbWindow.style.display = 'block';
    } else if (type === 'gallery') {
        galleryWindow.style.display = 'block';
    }
}

// 隐藏窗口
function hideWindow(type) {
    if (type === 'bag') {
        bagWindow.style.display = 'none';
    } else if (type === 'absorb') {
        absorbWindow.style.display = 'none';
    } else if (type === 'gallery') {
        galleryWindow.style.display = 'none';
    }
}

// 初始化背包内容
function initializeBagContent() {
    updateBagContent();
}

// 更新背包内容
function updateBagContent() {
    const bagContent = document.getElementById('bagContent');
    bagContent.innerHTML = '';

    // 为背包添加拖拽接收功能
    bagContent.addEventListener('dragover', (e) => {
        e.preventDefault();
        bagContent.classList.add('drag-over-bag');
    });

    bagContent.addEventListener('dragleave', (e) => {
        if (e.target === bagContent) {
            bagContent.classList.remove('drag-over-bag');
        }
    });

    bagContent.addEventListener('drop', (e) => {
        e.preventDefault();
        bagContent.classList.remove('drag-over-bag');
        console.log('背包接收到拖拽事件');

        const dragData = e.dataTransfer.getData('text/plain');
        console.log('背包接收到的拖拽数据:', dragData);

        if (dragData !== '') {
            try {
                const data = JSON.parse(dragData);
                console.log('解析的拖拽数据:', data);

                if (data.type === 'equipment' && data.slotIndex !== undefined) {
                    // 从装备槽拖到背包 - 归还花瓣
                    console.log('调用归还花瓣函数，槽位:', data.slotIndex);
                    returnPetalToBag(data.slotIndex);
                } else {
                    console.log('不是装备槽拖拽数据或缺少槽位索引');
                }
            } catch (error) {
                console.error('解析拖拽数据失败:', error);
            }
        } else {
            console.log('拖拽数据为空');
        }
    });

    // 按花瓣类型分组，跳过索引2
    const petalsByType = {};

    gameState.availablePetals.forEach((petal, index) => {
        if (parseInt(petal.type) !== 2) { // 跳过索引2的花瓣
            if (!petalsByType[petal.type]) {
                petalsByType[petal.type] = [];
            }
            petalsByType[petal.type].push({...petal, originalIndex: index});
        }
    });

    // 获取所有类型并排序，跳过2
    const types = Object.keys(petalsByType)
        .filter(type => parseInt(type) !== 2)
        .sort((a, b) => parseInt(a) - parseInt(b));

    types.forEach(type => {
        // 为每个种类创建一行
        const row = document.createElement('div');
        row.className = 'petal-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '10px';
        row.style.gap = '5px';

        // 查找该种类的所有花瓣（按等级分组）
        const petalsByLevel = {};
        petalsByType[type].forEach(petal => {
            if (petal.count > 0) {
                petalsByLevel[petal.level] = petal;
            }
        });

        // 显示1-7级，空缺的显示空白
        for (let level = 1; level <= 7; level++) {
            const petalContainer = document.createElement('div');
            petalContainer.className = 'bag-petal-container';
            petalContainer.style.position = 'relative';
            petalContainer.style.width = '55px';
            petalContainer.style.height = '55px';

            if (petalsByLevel[level]) {
                const petal = petalsByLevel[level];
                const item = document.createElement('div');
                item.className = 'petal-item';
                item.draggable = true;
                item.dataset.index = petal.originalIndex;
                item.title = `类型: ${petal.type}, 等级: ${petal.level}, 数量: ${petal.count}`;

                // 创建canvas元素
                const canvas = document.createElement('canvas');
                item.appendChild(canvas);

                // 使用canvas绘制花瓣
                drawPetalItem(petal, canvas, {displaySize:54});

                // 添加数量标签
                const countBadge = document.createElement('div');
                countBadge.className = 'bag-petal-count';
                countBadge.textContent = petal.count;
                item.appendChild(countBadge);

                item.addEventListener('dragstart', handleDragStart);
                item.addEventListener('dragend', handleDragEnd);

                petalContainer.appendChild(item);
            } else {
                // 空缺位置显示空白占位符
                const placeholder = document.createElement('div');
                placeholder.className = 'bag-petal-placeholder';
                placeholder.style.width = '55px';
                placeholder.style.height = '55px';
                placeholder.style.border = '1px dashed rgba(255, 255, 255, 0.2)';
                placeholder.style.borderRadius = '3px';
                placeholder.style.display = 'flex';
                placeholder.style.alignItems = 'center';
                placeholder.style.justifyContent = 'center';
                placeholder.style.color = 'rgba(255, 255, 255, 0.3)';
                placeholder.style.fontSize = '9px';
                placeholder.textContent = `Lv.${level}`;
                petalContainer.appendChild(placeholder);
            }

            row.appendChild(petalContainer);
        }

        bagContent.appendChild(row);
    });
}


// 准备游戏
function readyToPlay() {
    if (!gameState.connected) {
        connectToServer();
    } else {
        // 发送准备消息
        sendToServer({
            COMMAND: 'PLAY',
            client_name: gameState.playerName,
            build: gameState.equippedPetals.map(petal => {
                return petal ? [petal.type, petal.level] : [-1, 0];
            }),
            id: gameState.playerId
        });

        readyButton.textContent = '取消准备';
        readyButton.style.backgroundColor = '#f44336'; // 红色背景
    }
}

// 取消准备
function cancelReady() {
    if (gameState.connected) {
        // 发送取消准备消息
        sendToServer({
            COMMAND: 'CANCEL_READY',
            client_name: gameState.playerName,
            id: gameState.playerId,
            room_id: gameState.currentRoom
        });

        readyButton.textContent = 'Ready';
        readyButton.style.backgroundColor = '#4CAF50'; // 绿色背景
    }
}

// 开始游戏
function startGame() {
    lobbyUI.style.display = 'none';
    startScreen.style.display = 'none';
    gameState.isLobby = false;
    updateInventoryDisplay();
    waveBar.style.display = 'block';

    // 开始播放背景音乐
    startBackgroundMusic();
}

// 重新开始游戏
function restartGame() {
    gameOverScreen.style.display = 'none';
    gameState.playerHealth = gameState.playerMaxHealth;
    gameState.isLobby = true;
    lobbyUI.style.display = 'flex';
    startScreen.style.display = 'flex';
    readyButton.disabled = false;
    readyButton.textContent = 'Ready';
    readyButton.style.backgroundColor = '#4CAF50'; // 重置为绿色
    waveBar.style.display = 'none';

    // 停止背景音乐
    stopBackgroundMusic();

    // 重新连接服务器以启动心跳
    if (!gameState.connected) {
        connectToServer();
    }
}

// 连接到服务器
function connectToServer() {
    const storedPlayerId = localStorage.getItem('playerId');
    if (storedPlayerId) {
        gameState.playerId = parseInt(storedPlayerId);
        console.log('使用本地存储的玩家ID:', gameState.playerId);
    }
    try {
        gameState.socket = new WebSocket(config.serverAddress);

        gameState.socket.onopen = () => {
            console.log('连接到服务器成功');
            gameState.connected = true;

            // 发送连接消息
            sendToServer({
                COMMAND: 'CONNECT',
                client_name: gameState.playerName,
                id: gameState.playerId
            });

            // 启动心跳机制 - 每10秒发送一次心跳包
            startHeartbeat();


        };

        gameState.socket.onmessage = (event) => {
            handleServerMessage(event.data);
        };

        gameState.socket.onerror = (error) => {
            console.error('WebSocket错误:', error);
            gameState.connected = false;
            // 停止心跳
            stopHeartbeat();
        };

        gameState.socket.onclose = () => {
            console.log('与服务器断开连接');
            gameState.connected = false;
            // 停止心跳
            stopHeartbeat();
        };
    } catch (error) {
        console.error('连接服务器失败:', error);
    }
}

function startHeartbeat() {
    // 清除可能存在的旧心跳定时器
    if (gameState.heartbeatInterval) {
        clearInterval(gameState.heartbeatInterval);
    }

    // 设置新的心跳定时器，每10秒发送一次心跳包
    gameState.heartbeatInterval = setInterval(() => {
        if (gameState.connected && gameState.socket.readyState === WebSocket.OPEN) {
            sendToServer({
                COMMAND: 'HEARTBEAT',
                client_name: gameState.playerName,
                id: gameState.playerId,
                timestamp: Date.now()
            });
            console.log('发送心跳包');
        }
    }, 10000); // 10秒 = 10000毫秒
}

// 停止心跳包
function stopHeartbeat() {
    if (gameState.heartbeatInterval) {
        clearInterval(gameState.heartbeatInterval);
        gameState.heartbeatInterval = null;
        console.log('停止心跳包');
    }
}

// 处理服务器消息
function handleServerMessage(data) {
    try {
        const message = JSON.parse(data);

        switch(message.cmd) {
            case 'ABSORB_RESULT':
                handleAbsorbResult(message);
                break;
            case 'build': // 新用户，服务端分配了新ID
                if (message.id !== undefined) {
                    // 存储ID到localStorage
                    gameState.playerId = message.id;
                    localStorage.setItem('playerId', gameState.playerId);
                    console.log('新用户，分配ID:', gameState.playerId);

                    // 处理初始数据（如果有）
                    if (message.level !== undefined) {
                        // 处理等级等初始数据
                    }

                    // 处理花瓣数据
                    if (message.petal0 !== undefined) {
                        gameState.serverBuild = message;
                        console.log('收到服务器bag信息:', message);

                    // 如果在大厅界面，更新可用花瓣
                    if (gameState.isLobby) {
                        initializeAvailablePetals();
                        updateAbsorbPetalSelection();
                    }}
                }
                break;

            case 'BUILD': // 已有用户，服务端返回了用户数据
                if (message.id !== undefined) {
                    gameState.playerId = message.id;
                    // 确保localStorage中的ID是最新的
                    localStorage.setItem('playerId', gameState.playerId);
                    console.log('已有用户，ID:', gameState.playerId);

                    // 处理用户数据
                    if (message.level !== undefined) {
                        // 处理等级数据
                    }

                    // 处理花瓣数据
                    if (message.petal0 !== undefined) {
                        gameState.serverBuild = message;
                        console.log('收到服务器bag信息:', message);

                    // 如果在大厅界面，更新可用花瓣
                        if (gameState.isLobby) {
                            initializeAvailablePetals();
                            updateAbsorbPetalSelection();
                        }
                    }

                    // 处理保存的构筑数据
                    if (message.current_build !== undefined && Array.isArray(message.current_build)) {
                        console.log('收到保存的构筑:', message.current_build);
                        gameState.savedBuild = message.current_build;

                        // 如果在大厅界面，自动装备保存的构筑
                        if (gameState.isLobby) {
                            autoEquipSavedBuild();
                        }
                    }
                }
                break;
            case 'BOUNDARY_INFO':
                gameState.boundaryRadius = message.radius;
                console.log('Received boundary radius:', message.radius);
                break;

            case 'ROOM_INFO':
                // 处理房间信息
                gameState.roomInfo = message.room_info || message.data || message.players || {};
                console.log('收到房间信息更新:', gameState.roomInfo);
                updateRoomPlayers();
                break;

            case 'ROOM_CREATED':
                // 处理房间创建成功
                console.log('房间创建成功:', message.room_info);
                alert(`房间创建成功！\n房间名称: ${message.room_info.name}\n房间类型: ${message.room_info.type}\n房间key: ${message.room_key}`);
                break;

            case 'ROOM_JOINED':
                // 处理成功加入房间
                console.log('成功加入房间:', message.room_key);
                break;

            case 'ROOM_LIST':
                // 处理房间列表（如果需要的话）
                console.log('可用房间列表:', message.rooms);
                break;

            case 'START_GAME':
                // 开始游戏
                startGame();
                break;



            case 'GAME_DATA':
                // 处理游戏数据
                if (message.health !== undefined) {
                    const previousHealth = gameState.playerHealth;
                    gameState.playerHealth = message.health;
                    gameState.playerMaxHealth = message.maxhealth;
                    updateHealthBar();

                    // 检查玩家是否死亡
                    if (previousHealth > 0 && message.health <= 0) {
                        playDeathSound();
                        stopBackgroundMusic();
                    }
                }

                if (message.Myflower) {
                    gameState.playerPosition = {
                        x: message.Myflower[1][0],
                        y: message.Myflower[1][1]
                    };
                    // 检查是否包含大小信息
                    if (message.Myflower[2]) {
                        gameState.playerSize = message.Myflower[2];
                    }
                }

                // 处理统一的对象列表（新格式）
                if (message.objects) {
                    // 清空现有对象
                    gameState.petals = [];
                    gameState.mobs = [];
                    gameState.flowers = [];
                    gameState.collectDrops = [];

                    // 解析统一的对象列表
                    message.objects.forEach(obj => {
                        // 动态处理两种不同的传输格式
                        let typeIdx, position, size, angle, speed_x, speed_y, is_attack, health, max_health;

                        if (obj.length === 9) {
                            // # 花朵使用扩展传输格式: [idx, position, max_size, angle, speed_x, speed_y, is_attack, health, max_health]
                            [typeIdx, position, size, angle, speed_x, speed_y, is_attack, health, max_health] = obj;
                        } else {
                            // 其他对象普通格式: [typeIdx, position, size, angle]
                            [typeIdx, position, size, angle] = obj;
                            speed_x = 0;
                            speed_y = 0;
                            is_attack = 0;
                            health = null;
                            max_health = null;
                        }

                        const typeName = objectTypeMap[typeIdx] || 'unknown';

                        const baseObject = {
                            name: typeName,
                            typeIdx: typeIdx,  // 保留索引用于调试
                            position: { x: position[0], y: position[1] },
                            size: [size, size],  // 将单个尺寸转换为 [width, height] 格式
                            angle: angle || 0,  // 使用传输的角度，如果没有则为0
                            level: 1,
                            // 速度和攻击状态信息（只有花朵对象才有非默认值）
                            speed: { x: speed_x || 0, y: speed_y || 0 },
                            is_attack: is_attack || 0,
                            // 血量信息（只有花朵对象才有）
                            health: health,
                            max_health: max_health
                        };

                        
                        // 根据类型分类到不同数组
                        if (typeIdx >= 0 && typeIdx <= 10) {
                            // 花瓣类型 (0-10) - 添加类型信息
                            baseObject.type = typeIdx;
                            gameState.petals.push(baseObject);
                        } else if (typeIdx >= 11 && typeIdx <= 18) {
                            // 怪物类型 (11-18)
                            gameState.mobs.push(baseObject);
                        } else if (typeIdx === 21) {
                            // 蜈蚣身体类型 (21)
                            gameState.mobs.push(baseObject);
                        }
                        else if (typeIdx === 19) {
                            // 花朵类型 (19)
                            gameState.flowers.push(baseObject);
                            console.log(baseObject)
                        } else if (typeIdx === 20) {
                            // 掉落物类型 (20)
                            gameState.collectDrops.push(baseObject);
                        }
                    });
                }

                // 处理旧格式的兼容性（如果服务器还发送旧格式）
                if (message.petals) {
                    gameState.petals = message.petals.map(petal => ({
                        name: petal[0],
                        position: { x: petal[1][0], y: petal[1][1] },
                        angle: petal[2],
                        level: petal[3],
                        size: petal[4]
                    }));
                }
                if (message.mobs) {
                        gameState.mobs = message.mobs.map(mob => {
                            const mobObject = {
                                name: mob[0],
                                position: { x: mob[1][0], y: mob[1][1] },
                                angle: mob[2],
                                level: mob[3],
                                size: mob[4]
                            };
                            return mobObject;
                        });
                }
                if (message.flowers) {
                    gameState.flowers = message.flowers.map(flower => ({
                        name: flower[0],
                        position: { x: flower[1][0], y: flower[1][1] },
                        angle: flower[2],
                        level: flower[3],
                        size: flower[4]
                    }));
                }
                if (message.collectDrop) {
                    gameState.collectDrops = message.collectDrop.map(drop => ({
                        name: drop[0],
                        position: { x: drop[1][0], y: drop[1][1] },
                        angle: drop[2],
                        level: drop[3],
                        size: [drop[4][0], drop[4][1]]
                    }));
                }

                if (message.wave) {
                    updateWaveBar(message.wave);
                }

                if (message.effects) {
                    // 为每个特效添加开始时间
                    message.effects.forEach(effect => {
                        effect.startTime = Date.now() / 1000;
                    });
                    // 将新特效添加到现有特效列表
                    gameState.effects = gameState.effects.concat(message.effects);
                }


                // 检查游戏结束
                if (gameState.playerHealth <= 0) {
                    gameOverScreen.style.display = 'flex';
                }
                break;

            case 'CHAT_HISTORY':
                handleChatHistory(message.messages);
                break;

            case 'CHAT_MESSAGE':
                handleChatMessage(message.message);
                break;

            case 'CHAT_ERROR':
                addChatMessage('错误', message.error, 'error');
                break;

            case 'CHAT_CLEAR':
                clearChatMessages();
                break;

            default:
                console.log('Unknown message:', message);
                break;
        }
    } catch (error) {
        console.error('解析服务器消息失败:', error);
    }
}

// 发送消息到服务器
function sendToServer(data) {
    if (gameState.connected && gameState.socket.readyState === WebSocket.OPEN) {
        gameState.socket.send(JSON.stringify(data));
    }
}

// 更新血条
function updateHealthBar() {
    const healthPercent = Math.max(0, gameState.playerHealth / gameState.playerMaxHealth);
    healthFill.style.width = `${healthPercent * 100}%`;
}

// 处理鼠标移动
function handleMouseMove(event) {
    if (!gameState.connected || gameState.isLobby) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 将鼠标坐标转换到基准画布坐标系（移除缩放）
    const adjustedMouseX = mouseX - gameState.offsetX;
    const adjustedMouseY = mouseY - gameState.offsetY;

    // 计算相对于玩家中心的位置（使用基准画布尺寸）
    const playerCenterX = config.baseCanvasWidth / 2;
    const playerCenterY = config.baseCanvasHeight / 2;

    const relativeX = adjustedMouseX - playerCenterX;
    const relativeY = adjustedMouseY - playerCenterY;

    // 计算角度
    gameState.playerAngle = Math.atan2(relativeY, relativeX);

    // 发送鼠标位置到服务器
    sendToServer({
        COMMAND: 'SEND_DATA',
        client_name: gameState.playerName,
        data: [relativeX, relativeY, gameState.playerState],
        id: gameState.playerId
    });
}

// 处理鼠标按下
function handleMouseDown(event) {
    if (!gameState.connected || gameState.isLobby) return;

    if (event.button === 0) { // 左键
        gameState.playerState = 1; // 攻击
    } else if (event.button === 2) { // 右键
        gameState.playerState = -1; // 防御
    }

    // 发送状态到服务器
    sendToServer({
        COMMAND: 'SEND_DATA',
        client_name: gameState.playerName,
        data: [0, 0, gameState.playerState],
        id: gameState.playerId
    });
}

// 处理鼠标释放
function handleMouseUp(event) {
    if (!gameState.connected || gameState.isLobby) return;

    gameState.playerState = 0; // 正常状态

    // 发送状态到服务器
    sendToServer({
        COMMAND: 'SEND_DATA',
        client_name: gameState.playerName,
        data: [0, 0, gameState.playerState],
        id: gameState.playerId
    });
}

// 游戏主循环（性能优化：添加帧率限制）
function gameLoop(timestamp) {
    // 帧率限制：如果距离上一帧时间不足，则跳过渲染
    const targetFrameTime = 1000 / config.maxFps;
    if (gameState.lastRenderTime && timestamp - gameState.lastRenderTime < targetFrameTime) {
        requestAnimationFrame(gameLoop);
        return;
    }
    gameState.lastRenderTime = timestamp;

    // 计算FPS（优化：每10帧更新一次显示）
    if (gameState.lastFrameTime) {
        const delta = timestamp - gameState.lastFrameTime;
        const currentFps = Math.round(1000 / delta);
        gameState.fps = currentFps;

        // 每10帧更新一次FPS显示，减少DOM操作
        if (!gameState.frameCount) gameState.frameCount = 0;
        gameState.frameCount++;
        if (gameState.frameCount % 10 === 0) {
            fpsDisplay.textContent = `FPS: ${gameState.fps}`;

            // 动态性能调整 - 每60帧检查一次FPS
            if (gameState.frameCount % 60 === 0) {
                adjustRenderQuality();
            }
        }
    }
    gameState.lastFrameTime = timestamp;

    // 清除画布（使用实际像素尺寸）
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 应用游戏逻辑变换（等比例缩放，居中显示）
    ctx.save();
    ctx.translate(gameState.offsetX, gameState.offsetY);  // 居中偏移
    ctx.scale(gameState.scale, gameState.scale);  // 应用等比例缩放

    // 如果不是大厅模式，绘制游戏内容
    if (!gameState.isLobby) {
        // 更新wave进度（客户端计时）
        updateWaveProgress();

        // 绘制背景元素
        drawBackground();

        // 绘制游戏对象
        drawGameObjects();

        // 绘制玩家
        drawPlayer();

        // 绘制特效
        drawEffects();
    }

    // 恢复变换
    ctx.restore();

    // 绘制血条和小花朵（不受游戏变换影响）
    // 注释掉原来的血条，现在所有花朵血条都在左上角显示
    drawHealthBarWithFlower();


    // 继续游戏循环
    requestAnimationFrame(gameLoop);
}

// 绘制血条和小花朵
function drawHealthBarWithFlower() {
    // 血条参数 - 放大尺寸
    const barWidth = 120;
    const barHeight = 14;
    // 血条位置：进一步向右移动
    const barX = 60;
    const barY = 15;
    const borderWidth = 2;
    const borderRadius = 7;

    // 获取血量百分比
    const healthPercent = Math.max(0, Math.min(1, gameState.playerHealth / gameState.playerMaxHealth));
    const healthWidth = barWidth * healthPercent;

    // 绘制血条背景（深色）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = borderWidth;

    // 绘制带圆角的背景
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, borderRadius);
    ctx.fill();
    ctx.stroke();

    // 绘制血条填充
    if (healthWidth > 0) {
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.roundRect(barX, barY, healthWidth, barHeight, borderRadius - borderWidth/2);
        ctx.fill();
    }

    // 在血条上方绘制花朵，与血条有明显重叠
    const flowerSize = 36; // 花朵放大一倍（18*2）
    const flowerX = barX - 5; // 花朵与血条左侧重叠13px（花朵右边缘：barX-5+18=barX+13）
    const flowerY = barY + barHeight / 2; // 垂直居中对齐血条

    drawMiniFlower(flowerX, flowerY, flowerSize);
}





// 绘制其他玩家的迷你花朵
function drawOtherPlayerMiniFlower(x, y, size, player) {
    if (typeof Flower !== 'undefined') {
        const miniFlower = new Flower('mini');
        miniFlower.x = x;
        miniFlower.y = y;
        miniFlower.radius = size / 2;
        miniFlower.angle = 0;
        miniFlower.hp = player.hp || player.health || 100;
        miniFlower.maxHp = player.maxHp || player.maxHealth || 100;
        miniFlower.character = 'flower';
        miniFlower.ticksSinceLastDamaged = 1000;

        // 使用中立的表情和花瓣距离
        const fastPetalDistance = 25;
        miniFlower.state = 0;

        // 设置渲染状态
        miniFlower.render = {
            headX: miniFlower.x,
            headY: miniFlower.y,
            radius: miniFlower.radius,
            angle: miniFlower.angle,
            hp: miniFlower.hp,
            shield: 0,
            isPoisoned: 0,
            healingReduction: 1,
            fastPetalDistance: fastPetalDistance,
            beforeStreakHp: miniFlower.hp,
            petalDistance: fastPetalDistance
        };

        // 绘制迷你花朵
        miniFlower.drawFlower(miniFlower.x, miniFlower.y, miniFlower.radius, miniFlower.character);
    } else {
        // 简单的圆形作为备选
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// 绘制其他玩家花朵的血条（完全参照玩家自己的血条样式）
function drawOtherPlayerHealthBar(flowerX, flowerY, flowerRadius, currentHealth, maxHealth) {
    // 只有当血量数据有效时才绘制
    if (currentHealth === null || maxHealth === null || maxHealth <= 0) {
        return;
    }

    // 血条参数 - 完全参照玩家自己的血条样式
    const barWidth = 120;
    const barHeight = 14;
    const borderWidth = 2;
    const borderRadius = 7;

    // 血条位置：在花朵上方，居中对齐
    const barX = flowerX - barWidth / 2;
    const barY = flowerY - flowerRadius - 25;  // 在花朵上方留出空间

    // 获取血量百分比
    const healthPercent = Math.max(0, Math.min(1, currentHealth / maxHealth));
    const healthWidth = barWidth * healthPercent;

    // 绘制血条背景（深色）- 完全参照玩家血条
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = borderWidth;

    // 绘制带圆角的背景
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, borderRadius);
    ctx.fill();
    ctx.stroke();

    // 绘制血条填充
    if (healthWidth > 0) {
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.roundRect(barX, barY, healthWidth, barHeight, borderRadius - borderWidth/2);
        ctx.fill();
    }

    // 在血条左侧绘制小花朵（参照玩家自己的样式）
    const flowerSize = 18;
    const miniFlowerX = barX - flowerSize - 10; // 在血条左侧
    const miniFlowerY = barY + barHeight / 2; // 垂直居中

    // 绘制其他玩家的迷你花朵
    drawMiniFlowerForOtherPlayer(miniFlowerX, miniFlowerY, flowerSize, flowerRadius, currentHealth, maxHealth);
}

// 绘制其他玩家的迷你花朵（基于实际花朵状态）
function drawMiniFlowerForOtherPlayer(posX, posY, size, originalRadius, currentHealth, maxHealth) {
    if (typeof Flower !== 'undefined') {
        const miniFlower = new Flower('mini');
        miniFlower.x = posX;
        miniFlower.y = posY;
        miniFlower.radius = size / 2;
        miniFlower.angle = 0; // 简化角度
        miniFlower.hp = currentHealth || 100;
        miniFlower.maxHp = maxHealth || 100;
        miniFlower.character = 'flower';
        miniFlower.ticksSinceLastDamaged = 1000;

        // 设置中立的表情和花瓣距离
        const fastPetalDistance = 30; // 中立距离
        miniFlower.state = 0; // 中立状态

        // 设置渲染状态
        miniFlower.render = {
            headX: miniFlower.x,
            headY: miniFlower.y,
            radius: miniFlower.radius,
            angle: miniFlower.angle,
            hp: miniFlower.hp,
            shield: 0,
            isPoisoned: 0,
            healingReduction: 1,
            fastPetalDistance: fastPetalDistance,
            beforeStreakHp: miniFlower.hp,
            petalDistance: fastPetalDistance
        };

        // 绘制迷你花朵
        miniFlower.drawFlower(miniFlower.x, miniFlower.y, miniFlower.radius, miniFlower.character);
    } else {
        // 简单的圆形作为备选
        ctx.beginPath();
        ctx.arc(posX, posY, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFB6C1';
        ctx.fill();
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// 绘制小花朵（类似drawPlayer的简化版）
function drawMiniFlower(x, y, size) {
    if (typeof Flower !== 'undefined') {
        const miniFlower = new Flower('mini');
        miniFlower.x = x;
        miniFlower.y = y;
        miniFlower.radius = size / 2;
        miniFlower.angle = gameState.playerAngle || 0;
        miniFlower.hp = gameState.playerHp || 100;
        miniFlower.maxHp = gameState.playerMaxHp || 100;
        miniFlower.character = 'flower';
        miniFlower.ticksSinceLastDamaged = gameState.ticksSinceLastDamaged || 1000;

        // 根据玩家状态设置表情和花瓣距离
        let fastPetalDistance = 30; // 中立距离（比正常小）
        if (gameState.playerState === 1) {
            // 攻击状态
            fastPetalDistance = 30 * 1.91;
        } else if (gameState.playerState === -1) {
            // 防御状态
            fastPetalDistance = 30 * 0.6;
        }

        // 设置渲染状态
        miniFlower.render = {
            headX: miniFlower.x,
            headY: miniFlower.y,
            radius: miniFlower.radius,
            angle: miniFlower.angle,
            hp: miniFlower.hp,
            shield: gameState.playerShield || 0,
            isPoisoned: gameState.isPoisoned || 0,
            healingReduction: gameState.healingReduction || 1,
            fastPetalDistance: fastPetalDistance,
            beforeStreakHp: miniFlower.hp,
            petalDistance: fastPetalDistance
        };

        // 绘制小花朵主体
        miniFlower.drawFlower(miniFlower.x, miniFlower.y, miniFlower.radius, miniFlower.character);
    } else {
        // 备用绘制：简单的圆形花朵
        ctx.save();
        ctx.translate(x, y);

        // 花朵中心
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();

        // 花朵边框
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 简单的花瓣
        const petalCount = 6;
        const petalSize = size / 3;
        for (let i = 0; i < petalCount; i++) {
            const angle = (Math.PI * 2 / petalCount) * i;
            const petalX = Math.cos(angle) * size * 0.8;
            const petalY = Math.sin(angle) * size * 0.8;

            ctx.fillStyle = '#FFC0CB';
            ctx.beginPath();
            ctx.arc(petalX, petalY, petalSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFB6C1';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    }
}

// 绘制背景
function drawBackground() {
    // 绘制简单的背景网格
    ctx.strokeStyle = '#1d9a5b';
    ctx.lineWidth = 1;

    const gridSize = 50;
    const offsetX = gameState.playerPosition.x % gridSize;
    const offsetY = gameState.playerPosition.y % gridSize;

    // 使用基准画布尺寸而不是当前画布尺寸
    const baseWidth = config.baseCanvasWidth;
    const baseHeight = config.baseCanvasHeight;

    for (let x = -offsetX; x < baseWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, baseHeight);
        ctx.stroke();
    }

    for (let y = -offsetY; y < baseHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(baseWidth, y);
        ctx.stroke();
    }
    // 绘制游戏边界
    if (gameState.boundaryRadius > 0) {
        // 使用基准画布尺寸计算边界位置
        const playerCenterX = config.baseCanvasWidth / 2;
        const playerCenterY = config.baseCanvasHeight / 2;

        // 计算边界在屏幕上的位置
        const boundaryX = playerCenterX - gameState.playerPosition.x;
        const boundaryY = playerCenterY - gameState.playerPosition.y;

        ctx.beginPath();
        ctx.arc(boundaryX, boundaryY, gameState.boundaryRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 绘制边界中心点标记
        ctx.beginPath();
        ctx.arc(boundaryX, boundaryY, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fill();
    }
}

// 绘制游戏对象
function drawGameObjects() {
    // 绘制收集物
    gameState.collectDrops.forEach(drop => {
        drawObject(drop);
    });

    // 绘制花瓣
    gameState.petals.forEach(petal => {
        drawObject(petal);
    });

    // 绘制怪物
    gameState.mobs.forEach(mob => {
        drawObject(mob);
    });

    // 绘制其他花朵
    gameState.flowers.forEach(flower => {
        flower.angle = 0
        drawObject(flower);
    });
}

// 绘制单个对象
function drawObject(obj) {
    // 使用基准画布尺寸计算屏幕坐标
    const playerCenterX = config.baseCanvasWidth / 2;
    const playerCenterY = config.baseCanvasHeight / 2;

    // 计算对象在屏幕上的位置
    const screenX = playerCenterX + (obj.position.x - gameState.playerPosition.x);
    const screenY = playerCenterY + (obj.position.y - gameState.playerPosition.y);

    // 检查是否启用矢量渲染
    if (gameState.useVectorRendering) {
        // 使用高性能矢量渲染
        ctx.save();

        // 处理size可能是单个数值（旧格式）或数组（新格式）的情况
        let width, height;
        if (obj.size) {
            if (Array.isArray(obj.size)) {
                // 新格式：[width, height]
                width = obj.size[0];
                height = obj.size[1];
            } else {
                // 旧格式：单个数值
                width = obj.size;
                height = obj.size;
            }
        } else {
            // 默认尺寸
            width = 30;
            height = 30;
        }
        
        if (obj.name && (obj.name.includes('petal') || obj.type !== undefined)) {
            // 使用服务器传输的原始大小，不应用最小尺寸限制
            const petalSize = Math.max(width, height);
            // 提取花瓣类型和等级
            let petalType = 'basic';

            if (obj.type !== undefined) {
                // 直接使用type属性
                petalType = objectTypeMap[obj.type] || 'basic';
            } else {
                // 从name中解析
                const petalInfo = obj.name.match(/petal.*?(\d+)-(\d+)/);
                if (petalInfo) {
                    const type = parseInt(petalInfo[1]);
                    const level = parseInt(petalInfo[2]);
                    petalType = objectTypeMap[type] || 'basic';
                }
            }

            drawVectorPetal(screenX, screenY, petalSize, -obj.angle * Math.PI / 180, petalType);
        } else if (obj.name && (obj.name.includes('hornet') || obj.name.includes('centipede') ||
                   obj.name.includes('rock') || obj.name.includes('ladybug') || obj.name.includes('mob') ||
                   obj.name.includes('bombbeetle') || obj.name.includes('shield') ||
                   obj.name.includes('venomspider') || obj.name.includes('thunderelement'))) {
            // 使用服务器传输的原始大小，不应用最小尺寸限制
            const mobSize = Math.max(width, height);
            let monsterType = 'hornet'; // 默认类型
            if (obj.name === 'centipede0') monsterType = 'centipede0';
            else if (obj.name === 'centipede1') monsterType = 'centipede1';
            else if (obj.name.includes('centipede')) monsterType = 'centipede'; // 兼容旧版
            else if (obj.name.includes('rock')) monsterType = 'rock';
            else if (obj.name.includes('ladybug')) monsterType = 'ladybug';
            else if (obj.name.includes('bombbeetle')) monsterType = 'bombbeetle';
            else if (obj.name === 'shieldguardian') monsterType = 'shieldguardian';
            else if (obj.name === 'venomspider') monsterType = 'venomspider';
            else if (obj.name === 'thunderelement') monsterType = 'thunderelement';
            else if (obj.name.includes('shield')) monsterType = 'shield';


            drawVectorMonster(screenX, screenY, mobSize, monsterType, -obj.angle * Math.PI / 180);
        } else if (obj.name && obj.name.includes('drop')) {
            // 收集物 - 使用服务器传输的原始大小，但size应该是直径
            const dropSize = Math.max(width, height) / 2;  // 这是半径
            // 解析drop.name中的type和等级：格式为 "type/level"
            let petalType = 'basic';
            let petalLevel = 1;

            // 解析 "type/level" 格式 掉落物用angle传输具体等级和花瓣类型
            console.log(`掉落物调试: name="${obj.angle}", type=${typeof obj.angle}`);

            // 检查angle的类型并处理
            let parts = [];
            if (typeof obj.angle === 'string') {
                parts = obj.angle.split('/');
            } else if (typeof obj.angle === 'number') {
                // 如果angle是数字，可能是旧格式，直接使用数字作为type，level设为1
                parts = [obj.angle.toString(), '1'];
            } else {
                console.warn(`未知的angle类型: ${typeof obj.angle}, 值: ${obj.angle}`);
                // 使用默认值
                parts = ['0', '1'];
            }

            console.log(`掉落物解析: parts=`, parts);
            if (parts.length >= 2) {
                const type = parseInt(parts[0]);
                const level = parseInt(parts[1]);
                petalType = type;
                petalLevel = level;
                console.log(`掉落物解析成功: type=${type}, level=${level}, petalType="${petalType}"`);
            } else {
                console.log(`掉落物解析失败: 格式不正确`);
                // 使用默认值
                petalType = 0;
                petalLevel = 1;
            }
            

            // 绘制掉落物花瓣 - 使用矢量渲染
            ctx.save();
            ctx.translate(screenX, screenY);

            // 直接使用ctx绘制花瓣 - 简化版本
            const tempPetal = {
                radius: dropSize,
                level: petalLevel,
                type: petalType
            };

            // 调用drawPetalInContext函数绘制
            drawPetalInContext(tempPetal, ctx, dropSize);
            ctx.restore()

        } else if (obj.name && obj.name.includes('flower')) {
            console.log('绘制花朵')
            // 花朵对象 - 完全使用flower.js绘制，参考drawPlayer函数
            const flowerSize = Math.max(width, height) / 2;  // 这是半径

            // 使用flower.js绘制花朵
            if (typeof Flower !== 'undefined') {
                const flower = new Flower('other');
                flower.x = screenX;
                flower.y = screenY;
                flower.radius = flowerSize;
                flower.angle = Math.atan2(obj.speed.y, obj.speed.x);
                // 使用服务器传输的实际血量数据
                flower.hp = obj.health !== null ? obj.health : 100;
                flower.maxHp = obj.max_health !== null ? obj.max_health : 100;
                flower.character = 'flower';
                flower.ticksSinceLastDamaged = 1000;

                // 根据攻击状态设置表情和花瓣距离，完全参考drawPlayer的逻辑
                let fastPetalDistance = 70; // 中立距离
                let flowerState = 0; // 默认中立状态

                // 处理Is_Attack的值：2=攻击，-2=防御，0=中立
                if (obj.is_attack === 2) {
                    // 攻击状态
                    fastPetalDistance = 70 * 1.91;
                    flowerState = 1; // 攻击状态
                } else if (obj.is_attack === -2) {
                    // 防御状态
                    fastPetalDistance = 70 * 0.6;
                    flowerState = -1; // 防御状态
                }

                // 设置花朵状态，参考drawPlayer中的playerState设置
                flower.state = flowerState;

                // 设置渲染状态，完全参考drawPlayer的render设置
                flower.render = {
                    headX: flower.x,
                    headY: flower.y,
                    radius: flower.radius,
                    angle: flower.angle,
                    hp: flower.hp,
                    shield: 0,
                    isPoisoned: 0,
                    healingReduction: 1,
                    fastPetalDistance: fastPetalDistance,
                    beforeStreakHp: flower.hp,
                    petalDistance: fastPetalDistance
                };

                // 绘制花朵主体，完全参考drawPlayer的方式
                flower.drawFlower(flower.x, flower.y, flower.radius, flower.character);

                // 绘制其他玩家花朵的血条（参照玩家自己的血条样式）
                // 注释掉：现在其他玩家血条只在左上角显示
                // drawOtherPlayerHealthBar(flower.x, flower.y, flower.radius, flower.hp, flower.maxHp);
            } else {
                // 备用绘制：简单的圆形
                ctx.beginPath();
                ctx.arc(screenX, screenY, flowerSize, 0, Math.PI * 2);
                ctx.fillStyle = '#FFB6C1';
                ctx.fill();
                ctx.strokeStyle = '#FF69B4';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        } else {
            // 其他实体 - 使用服务器传输的原始大小
            const otherSize = Math.max(width, height) / 2;  // 这是半径，是正确的
            ctx.beginPath();
            ctx.arc(screenX, screenY, otherSize, 0, Math.PI * 2);
            ctx.fillStyle = '#FF6B6B';
            ctx.fill();
        }

        ctx.restore();
        return; // 矢量渲染完成，直接返回
    }
}


// 绘制玩家（支持矢量渲染）
function drawPlayer() {
    // 使用 flower.js 的 Flower 类来绘制玩家
    if (typeof Flower !== 'undefined') {
        const playerFlower = new Flower('player');

        // 设置玩家属性
        playerFlower.x = config.baseCanvasWidth / 2;
        playerFlower.y = config.baseCanvasHeight / 2;
        playerFlower.radius = (gameState.playerSize || config.playerSize) / 2; // 服务器发送直径值，转换为半径
        playerFlower.angle = gameState.playerAngle;
        playerFlower.hp = gameState.playerHp || 100;
        playerFlower.maxHp = gameState.playerMaxHp || 100;
        playerFlower.character = 'flower';
        playerFlower.ticksSinceLastDamaged = gameState.ticksSinceLastDamaged || 1000;

        // 根据玩家状态设置表情和花瓣距离
        let fastPetalDistance = 70; // 中立距离
        if (gameState.playerState === 1) {
            // 攻击状态
            fastPetalDistance = 70 * 1.91;
        } else if (gameState.playerState === -1) {
            // 防御状态
            fastPetalDistance = 70 * 0.6;
        }

        // 设置渲染状态
        playerFlower.render = {
            headX: playerFlower.x,
            headY: playerFlower.y,
            radius: playerFlower.radius,
            angle: playerFlower.angle,
            hp: playerFlower.hp,
            shield: gameState.playerShield || 0,
            isPoisoned: gameState.isPoisoned || 0,
            healingReduction: gameState.healingReduction || 1,
            fastPetalDistance: fastPetalDistance,
            beforeStreakHp: playerFlower.hp,
            petalDistance: fastPetalDistance
        };

        // 绘制花朵主体
        playerFlower.drawFlower(playerFlower.x, playerFlower.y, playerFlower.radius, playerFlower.character);

        // 如果有花瓣，绘制花瓣
        if (gameState.petals && gameState.petals.length > 0) {
            gameState.petals.forEach(petal => {
                if (petal && petal.draw) {
                    petal.draw();
                }
            });
        }
    } else {
        // 如果 flower.js 未加载，使用备用绘制
        const playerCenterX = config.baseCanvasWidth / 2;
        const playerCenterY = config.baseCanvasHeight / 2;

        if (gameState.useVectorRendering) {
            // 矢量渲染模式下的玩家，服务器发送的是直径值
            const playerRadius = (gameState.playerSize || config.playerSize) / 2;
            console.log(`🎮 矢量渲染玩家半径: ${playerRadius} (原始大小: ${gameState.playerSize || config.playerSize})`);
            // 将半径转换为直径传递给drawVectorPlayer（函数内部会再除以2）
            drawVectorPlayer(playerCenterX, playerCenterY, playerRadius * 2, gameState.playerAngle);
        } else {
            // 原始圆形绘制，服务器发送的是直径值
            const playerRadius = (gameState.playerSize || config.playerSize) / 2;
            console.log(`🎮 图片渲染玩家半径: ${playerRadius} (原始大小: ${gameState.playerSize || config.playerSize})`);
            ctx.beginPath();
            ctx.arc(playerCenterX, playerCenterY, playerRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffe763';
            ctx.fill();
            ctx.strokeStyle = '#cebb50';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// 设置画布大小和等比例缩放（支持高DPI）
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const dpr = gameState.devicePixelRatio;

    // 直接设置画布大小为屏幕大小
    config.baseCanvasWidth = containerWidth;
    config.baseCanvasHeight = containerHeight;

    // 计算缩放比例，保持等比例（使用较小的缩放值）
    const scaleX = containerWidth / 1200;  // 基于原始游戏宽度
    const scaleY = containerHeight / 800;  // 基于原始游戏高度
    const scale = Math.min(scaleX, scaleY);  // 使用较小的缩放比例保持比例

    // 更新游戏状态中的缩放信息
    gameState.scale = scale;     // 等比例缩放
    gameState.scaleX = scale;    // X轴缩放（与Y相同）
    gameState.scaleY = scale;    // Y轴缩放（与X相同）

    // 计算偏移量以居中显示
    const scaledWidth = config.baseCanvasWidth * scale;
    const scaledHeight = config.baseCanvasHeight * scale;
    gameState.offsetX = (containerWidth - scaledWidth) / 2;
    gameState.offsetY = (containerHeight - scaledHeight) / 2;

    // 设置画布CSS尺寸（显示尺寸）
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';

    // 设置画布实际像素尺寸（考虑设备像素比）
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;

    // 更新配置中的画布尺寸用于渲染计算
    config.canvasWidth = containerWidth;
    config.canvasHeight = containerHeight;

    // 设置DPR缩放变换以匹配高DPI显示
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 根据设备像素比和屏幕尺寸自动调整渲染质量
    if (dpr >= 2) {
        // 高DPI屏幕 - 使用最高质量
        gameState.renderQuality = 'high';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.textRenderingOptimization = 'optimizeQuality';
    } else if (dpr >= 1.5) {
        // 中等DPI屏幕 - 使用高质量
        gameState.renderQuality = 'high';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
    } else {
        // 普通屏幕 - 使用中等质量以节省性能
        gameState.renderQuality = 'medium';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
    }

    // 对于大屏幕，启用抗锯齿
    if (containerWidth > 1920 || containerHeight > 1080) {
        ctx.imageSmoothingEnabled = true;
        if (gameState.renderQuality === 'high') {
            ctx.imageSmoothingQuality = 'high';
        }
    }

    console.log(`DPR: ${dpr}, 缩放比例: ${scale.toFixed(3)}, 偏移: (${gameState.offsetX.toFixed(1)}, ${gameState.offsetY.toFixed(1)})`);
}

// 血条渲染函数（flower.js 兼容）
function renderHpBar(params, flower) {
    const { x, y, radius, hp, maxHp, shield, beforeStreakHp, flowerName, flowerUsername } = params;

    // 不要在玩家位置绘制血条（避免重复）
    if (flower && flower.id === 'player') {
        return;
    }

    const barWidth = radius * 3.2;
    const barHeight = radius * 0.39;
    const barX = x - barWidth / 2;
    const barY = y + radius * 1.775;

    // 背景
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 血条
    if (hp > 0) {
        ctx.fillStyle = '#73de36';
        const healthWidth = (barWidth - 2) * (hp / maxHp);
        ctx.fillRect(barX + 1, barY + 1, healthWidth, barHeight - 2);
    }

    // 护盾条
    if (shield > 0) {
        ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
        const shieldWidth = (barWidth - 2) * (shield / maxHp);
        ctx.fillRect(barX + 1, barY + 1, shieldWidth, barHeight - 2);
    }

    // 显示名称（如果有）
    if (flowerName || flowerUsername) {
        ctx.fillStyle = 'white';
        ctx.font = `${radius * 0.3}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(flowerName || flowerUsername || '', x, barY - 5);
    }
}

function drawEffects() {
    const now = Date.now() / 1000;
    gameState.effects = gameState.effects.filter(effect => {
        const elapsed = now - effect.startTime;

        if (effect.type === 'poison') {
            // 中毒效果：增强版 - 深绿毒气云 + 发光骷髅
            if (elapsed < effect.duration) {
                const alpha = 1 - (elapsed / effect.duration);
                const screenX = config.baseCanvasWidth/2 + (effect.position[0] - gameState.playerPosition.x);
                const screenY = config.baseCanvasHeight/2 + (effect.position[1] - gameState.playerPosition.y);

                ctx.save();

                // 绘制毒气云背景（深绿色半透明圆）
                ctx.fillStyle = `rgba(0, 100, 0, ${alpha * 0.3})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, 35 + Math.sin(elapsed * 3) * 5, 0, Math.PI * 2);
                ctx.fill();

                // 绘制多层毒气粒子（性能优化：减少粒子数量）
                const particleCount = 6; // 从8减少到6
                const time = elapsed * 2;
                const angleStep = Math.PI * 2 / particleCount;

                for (let i = 0; i < particleCount; i++) {
                    const angle = angleStep * i + time;
                    const distance = 18 + Math.sin(time * 2 + i) * 8;
                    const px = screenX + Math.cos(angle) * distance;
                    const py = screenY + Math.sin(angle) * distance;

                    // 外层粒子（合并绘制以减少状态切换）
                    ctx.fillStyle = '#00FF00';
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.fillRect(px - 2, py - 2, 4, 4); // 减小粒子尺寸

                    // 内层亮绿色粒子
                    ctx.fillStyle = '#66FF66';
                    ctx.globalAlpha = alpha * 0.8;
                    ctx.fillRect(px, py, 1, 1); // 进一步减小尺寸
                }

                // 绘制发光骷髅图标
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00FF00';
                ctx.fillStyle = '#00FF00';
                ctx.globalAlpha = alpha * 0.9;
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('☠', screenX, screenY);

                ctx.restore();
                return true;
            }
        }
        else if (effect.type === 'lightning') {
            // 闪电效果：蓝色折线，持续0.5秒 - 优化性能
            if (elapsed < 0.5) {
                const alpha = 1 - (elapsed / 0.5);
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = '#4169E1'; // 改为蓝色
                ctx.lineWidth = 3; // 减小线宽

                ctx.beginPath();
                effect.chain.forEach((pos, index) => {
                    const screenX = config.baseCanvasWidth/2 + (pos[0] - gameState.playerPosition.x);
                    const screenY = config.baseCanvasHeight/2 + (pos[1] - gameState.playerPosition.y);
                    if (index === 0) {
                        ctx.moveTo(screenX, screenY);
                    } else {
                        ctx.lineTo(screenX, screenY);
                    }
                });
                ctx.stroke();
                ctx.restore();
                return true;
            }
        }
        else if (effect.type === 'explosion') {
            // 爆炸效果：增强版 - 强烈光线 + 少量大粒子
            if (elapsed < 1) {
                const progress = elapsed;
                const screenX = config.baseCanvasWidth/2 + (effect.position[0] - gameState.playerPosition.x);
                const screenY = config.baseCanvasHeight/2 + (effect.position[1] - gameState.playerPosition.y);

                ctx.save();

                // 中心闪光效果
                const flashSize = (1 - progress) * 40;
                const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, flashSize);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${(1 - progress) * 0.9})`);
                gradient.addColorStop(0.3, `rgba(255, 200, 0, ${(1 - progress) * 0.7})`);
                gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenX, screenY, flashSize, 0, Math.PI * 2);
                ctx.fill();

                // 强烈放射光线（性能优化：减少射线数量）
                const rayCount = 6; // 从8减少到6
                const maxRayLength = effect.radius * 2;
                const angleStep = Math.PI * 2 / rayCount;

                for (let i = 0; i < rayCount; i++) {
                    const angle = angleStep * i;
                    const rayLength = maxRayLength * progress;
                    const endX = screenX + Math.cos(angle) * rayLength;
                    const endY = screenY + Math.sin(angle) * rayLength;

                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#FF6600';
                    ctx.strokeStyle = `rgba(255, ${150 + progress * 105}, 0, ${(1 - progress) * 0.8})`;
                    ctx.lineWidth = 5 * (1 - progress) + 2;
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }

                // 少量大型火焰粒子
                const particleCount = 4;
                const colors = ['#FF0000', '#FF3300', '#FF6600', '#FFAA00'];

                for (let i = 0; i < particleCount; i++) {
                    const angle = (Math.PI * 2 / particleCount) * i + progress * 0.5;
                    const distance = effect.radius * progress * (0.6 + i * 0.2);
                    const px = screenX + Math.cos(angle) * distance;
                    const py = screenY + Math.sin(angle) * distance;
                    const size = (15 + Math.random() * 10) * (1 - progress * 0.7);

                    // 粒子发光效果
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = colors[i];
                    ctx.fillStyle = colors[i];
                    ctx.globalAlpha = (1 - progress) * 0.8;

                    // 绘制大粒子
                    ctx.beginPath();
                    ctx.arc(px, py, size, 0, Math.PI * 2);
                    ctx.fill();

                    // 内部高光
                    ctx.fillStyle = '#FFFFFF';
                    ctx.globalAlpha = (1 - progress) * 0.4;
                    ctx.beginPath();
                    ctx.arc(px - size/3, py - size/3, size/3, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
                return true;
            }
        }
        return false; // 移除已结束的特效
    });
}




// ========== 聊天功能相关函数 ==========

// 初始化聊天功能
function initializeChat() {
    // 设置初始聊天标题
    updateChatTitle();

    // 根据默认状态设置聊天界面显示
    if (gameState.isChatClosed) {
        chatContainer.style.display = 'none';
        chatOpenButton.style.display = 'block';
    } else {
        chatContainer.style.display = 'flex';
        chatOpenButton.style.display = 'none';
    }

    // 聊天界面事件监听
    chatSendButton.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // 聊天类型切换
    chatTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有按钮的active类
            chatTypeButtons.forEach(btn => btn.classList.remove('active'));
            // 添加active类到当前按钮
            button.classList.add('active');
            // 更新聊天类型
            gameState.chatType = button.dataset.type;

            // 清空当前聊天显示
            chatMessages.innerHTML = '';

            // 加载对应类型的聊天历史
            loadChatHistory(gameState.chatType);

            // 更新聊天标题
            updateChatTitle();

            // 更新输入框提示
            updateChatPlaceholder();
        });
    });

    // 聊天窗口关闭
    chatClose.addEventListener('click', () => {
        gameState.isChatClosed = true;
        chatContainer.style.display = 'none';
        chatOpenButton.style.display = 'block';
    });

    // 重新打开聊天窗口
    chatOpenButton.addEventListener('click', () => {
        gameState.isChatClosed = false;
        chatContainer.style.display = 'flex';
        chatOpenButton.style.display = 'none';
    });
}

// 更新聊天标题
function updateChatTitle() {
    let title = '聊天';
    if (gameState.chatType === 'room') {
        if (gameState.hasSelectedRoom && gameState.currentRoom !== null) {
            title = `房间 ${gameState.currentRoom + 1}`;
        } else {
            title = '房间';
        }
    } else if (gameState.chatType === 'global') {
        title = '全局';
    } else if (gameState.chatType === 'private') {
        title = '私聊';
    }
    chatTitle.textContent = title;
}

// 更新聊天输入框提示
function updateChatPlaceholder() {
    if (gameState.chatType === 'private') {
        if (gameState.privateTarget) {
            chatInput.placeholder = `私聊 ${gameState.privateTarget}:`;
        } else {
            chatInput.placeholder = '私聊 /w <玩家名> <消息>';
        }
    } else {
        chatInput.placeholder = `输入${gameState.chatType === 'room' ? '房间' : '全局'}消息...`;
    }
}

// 发送聊天消息
function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message || !gameState.connected) return;

    // 检查是否在房间频道但没有选择房间
    if (gameState.chatType === 'room' && !gameState.hasSelectedRoom) {
        addChatMessage('system', '请先选择一个房间才能在房间频道发送消息', 'error');
        return;
    }

    // 检查是否是聊天命令
    if (message.startsWith('/')) {
        // 处理聊天命令
        sendToServer({
            COMMAND: 'CHAT_COMMAND',
            command: message,
            id: gameState.playerId
        });
        chatInput.value = '';
        return;
    }

    // 处理私聊命令
    if (message.startsWith('/w ') || message.startsWith('/whisper ')) {
        const parts = message.split(' ');
        if (parts.length >= 3) {
            const target = parts[1];
            const privateMessage = parts.slice(2).join(' ');

            sendToServer({
                COMMAND: 'CHAT_MESSAGE',
                message: privateMessage,
                type: 'private',
                target: target,
                id: gameState.playerId
            });
        }
        chatInput.value = '';
        return;
    }

    // 发送普通消息
    let messageType = gameState.chatType;
    let target = null;

    if (messageType === 'private') {
        if (!gameState.privateTarget) {
            addChatMessage('system', '请先选择私聊对象或使用 /w <玩家名> <消息> 命令', 'system');
            return;
        }
        target = gameState.privateTarget;
    }

    sendToServer({
        COMMAND: 'CHAT_MESSAGE',
        message: message,
        type: messageType,
        target: target,
        id: gameState.playerId
    });

    chatInput.value = '';
}

// 添加聊天消息到界面
function addChatMessage(playerName, message, type, timestamp = null) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${type}`;

    // 格式化时间戳
    const time = timestamp ? new Date(timestamp * 1000) : new Date();
    const timeString = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    // 处理私聊消息格式
    if (type === 'private') {
        const isFromMe = playerName === gameState.playerName;
        if (isFromMe) {
            messageElement.innerHTML = `
                <span class="chat-player-name">你 -> ${message}</span>
                <span class="chat-timestamp">${timeString}</span>
            `;
        } else {
            messageElement.innerHTML = `
                <span class="chat-player-name">${playerName} -> 你:</span>
                <span>${message}</span>
                <span class="chat-timestamp">${timeString}</span>
            `;
        }
    } else {
        // 处理其他类型消息
        let displayName = playerName;
        if (type === 'system') {
            displayName = '系统';
        }

        messageElement.innerHTML = `
            <span class="chat-player-name">${displayName}${type !== 'system' ? ':' : ''}</span>
            <span>${message}</span>
            <span class="chat-timestamp">${timeString}</span>
        `;
    }

    chatMessages.appendChild(messageElement);

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 限制消息数量
    if (chatMessages.children.length > 100) {
        chatMessages.removeChild(chatMessages.firstChild);
    }
}

// 清空聊天界面
function clearChatMessages() {
    chatMessages.innerHTML = '';
}

// 加载指定类型的聊天历史
function loadChatHistory(chatType) {
    const history = gameState.chatHistory[chatType] || [];
    history.forEach(msg => {
        // 对于房间消息和系统消息，检查是否来自当前房间
        if (msg.type === 'room' || msg.type === 'system') {
            if (msg.room_id !== undefined && msg.room_id !== gameState.currentRoom) {
                return; // 跳过不属于当前房间的消息
            }
        }
        addChatMessage(msg.player_name, msg.message, msg.type, msg.timestamp);
    });
}

// 处理聊天历史
function handleChatHistory(messages) {
    clearChatMessages();
    if (messages && messages.length > 0) {
        messages.forEach(msg => {
            // 对于房间消息和系统消息，检查是否来自当前房间
            if (msg.type === 'room' || msg.type === 'system') {
                if (msg.room_id !== undefined && msg.room_id !== gameState.currentRoom) {
                    return; // 跳过不属于当前房间的消息
                }
            }
            addChatMessage(msg.player_name, msg.message, msg.type, msg.timestamp);
        });
    }
}

// 处理服务器发送的聊天消息
function handleChatMessage(messageData) {
    // 调试信息：输出消息详情
    console.log('收到聊天消息:', messageData);
    console.log('当前房间:', gameState.currentRoom, '消息房间:', messageData.room_id, '消息类型:', messageData.type);

    // 将消息保存到对应类型的历史记录中
    if (messageData.type && gameState.chatHistory[messageData.type]) {
        gameState.chatHistory[messageData.type].push(messageData);

        // 限制历史记录数量
        if (gameState.chatHistory[messageData.type].length > 100) {
            gameState.chatHistory[messageData.type].shift();
        }
    }

    // 系统消息在所有频道都应该显示
    if (messageData.type !== gameState.chatType && messageData.type !== 'system') {
        console.log('消息类型不匹配，跳过显示');
        return;
    }

    // 对于房间消息，检查是否来自玩家当前所在的房间
    if (messageData.type === 'room') {
        // 如果消息有房间ID且不匹配当前房间，则不显示
        if (messageData.room_id !== undefined && messageData.room_id !== gameState.currentRoom) {
            console.log('房间ID不匹配，跳过显示');
            return;
        }
    }
    // 系统消息不检查房间ID，应该总是显示
    else if (messageData.type === 'system') {
        console.log('系统消息，直接显示');
    }

    if (messageData.type === 'private') {
        // 私聊消息
        const isFromMe = messageData.sender_id === gameState.playerId;
        const playerName = isFromMe ? '你' : messageData.sender_name;
        const message = isFromMe ? `-> ${messageData.target_name}: ${messageData.message}` : `-> 你: ${messageData.message}`;
        addChatMessage(playerName, message, 'private', messageData.timestamp);
    } else {
        // 其他消息
        addChatMessage(messageData.player_name, messageData.message, messageData.type, messageData.timestamp);
    }
}

// ========== 矢量渲染系统 ==========
// 高性能Canvas绘制替代图片渲染

// 获取花瓣类型对应的颜色方案
function getPetalColorScheme(type, level) {
    const schemes = {
        // 基础花瓣 (类型1) - 绿色系
        1: {
            primary: `hsl(120, 70%, ${40 + level * 5}%)`,
            secondary: `hsl(120, 60%, ${30 + level * 5}%)`,
            highlight: `hsl(120, 80%, ${50 + level * 5}%)`
        },
        // 蓝色花瓣 (类型2) - 蓝色系
        2: {
            primary: `hsl(200, 70%, ${40 + level * 5}%)`,
            secondary: `hsl(200, 60%, ${30 + level * 5}%)`,
            highlight: `hsl(200, 80%, ${50 + level * 5}%)`
        },
        // 紫色花瓣 (类型3) - 紫色系
        3: {
            primary: `hsl(280, 70%, ${40 + level * 5}%)`,
            secondary: `hsl(280, 60%, ${30 + level * 5}%)`,
            highlight: `hsl(280, 80%, ${50 + level * 5}%)`
        },
        // 红色花瓣 (类型4) - 红色系
        4: {
            primary: `hsl(0, 70%, ${40 + level * 5}%)`,
            secondary: `hsl(0, 60%, ${30 + level * 5}%)`,
            highlight: `hsl(0, 80%, ${50 + level * 5}%)`
        },
        // 黄色花瓣 (类型5) - 黄色系
        5: {
            primary: `hsl(60, 70%, ${40 + level * 5}%)`,
            secondary: `hsl(60, 60%, ${30 + level * 5}%)`,
            highlight: `hsl(60, 80%, ${50 + level * 5}%)`
        },
        // 橙色花瓣 (类型6) - 橙色系
        6: {
            primary: `hsl(30, 70%, ${40 + level * 5}%)`,
            secondary: `hsl(30, 60%, ${30 + level * 5}%)`,
            highlight: `hsl(30, 80%, ${50 + level * 5}%)`
        },
        // 稀有花瓣 (类型7+) - 彩虹色
        7: {
            primary: `hsl(${level * 30}, 80%, 50%)`,
            secondary: `hsl(${level * 30}, 70%, 40%)`,
            highlight: `hsl(${level * 30}, 90%, 60%)`
        }
    };

    return schemes[type] || schemes[1];
}

// 花瓣渲染函数（完全按照petal.js标准）
const petalRenderMap = {
    basic: (p) => {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.fillStyle = blendColor('#ffffff', '#FF0000', blendAmount(p));
        ctx.strokeStyle = blendColor('#cfcfcf', '#FF0000', blendAmount(p));
        if(checkForFirstFrame(p)){
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#FFFFFF";
        }

        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    },

    missile: (p) => {
        let bodyColor = blendColor("#333333", "#FF0000", blendAmount(p));
        if (checkForFirstFrame(p)) {
            bodyColor = "#FFFFFF";
        }
        ctx.lineJoin = 'round';
        ctx.rotate(Math.PI * 2 / 4);
        ctx.beginPath();
        ctx.fillStyle = bodyColor;
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = p.radius / 1.5;
        ctx.moveTo(0, -p.radius * Math.sqrt(3));
        ctx.lineTo(p.radius * Math.sqrt(3) * .48, p.radius / 2 * Math.sqrt(3));
        ctx.lineTo(-p.radius * Math.sqrt(3) * .48, p.radius / 2 * Math.sqrt(3));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.rotate(-Math.PI *2 / 4);
    },

    leaf: (p) => {
        const divCoef = 1.35;

        ctx.lineWidth = p.radius/divCoef/2.5;
        ctx.fillStyle = blendColor('#39b54a', '#FF0000', blendAmount(p));
        ctx.strokeStyle = blendColor('#2e933c', '#FF0000', blendAmount(p));
        if(checkForFirstFrame(p)){
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#FFFFFF";
        }

        ctx.rotate(Math.PI / 4 - 0.2);
        ctx.beginPath();

        ctx.moveTo(0, 1.854*p.radius/divCoef);

        // bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
        ctx.quadraticCurveTo(-2.88*p.radius/divCoef*.87, 0.31*p.radius/divCoef, 0, -2.325*p.radius/divCoef);
        ctx.moveTo(0, 1.854*p.radius/divCoef);
        ctx.quadraticCurveTo(2.88*p.radius/divCoef*.87, 0.31*p.radius/divCoef, 0, -2.325*p.radius/divCoef);

        // tail
        ctx.moveTo(0, 1.948*p.radius/divCoef);
        ctx.lineTo(0, 2.536*p.radius/divCoef);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        // curve in the middle
        ctx.moveTo(0, (1.948-1)*p.radius/divCoef);
        ctx.quadraticCurveTo(-0.18*p.radius/divCoef, -0.1885*p.radius/divCoef, 0, (-2.325+1.05)*p.radius/divCoef);
        ctx.stroke();
        ctx.closePath();
        ctx.rotate(-Math.PI / 4 + 0.2);
    },

    wing: (p) => {
        const divCoef = 1.35;
        ctx.lineWidth = p.radius/divCoef/1.9;
        ctx.fillStyle = blendColor('#ffffff', '#FF0000', blendAmount(p));
        ctx.strokeStyle = blendColor('#cdcdcd', '#FF0000', blendAmount(p));
        if(checkForFirstFrame(p)){
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#FFFFFF";
        }
        ctx.beginPath();
        ctx.arc(0, 0, p.radius*1.01, -Math.PI * 0.18, Math.PI * 0.818);
        ctx.arcTo(p.radius * 0.42, p.radius * 0.6, p.radius*0.85, -p.radius * 0.53, p.radius * 1.7);
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
    },

    lighting: (p) => { // thunder -> lighting
        ctx.strokeStyle = blendColor('#21c4b9', '#FF0000', blendAmount(p));
        ctx.fillStyle = blendColor('#29f2e5', '#FF0000', blendAmount(p));
        if(checkForFirstFrame(p)){
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#ffffff";
        }

        ctx.lineWidth = p.radius * 0.2;
        ctx.beginPath();
        for(let i = 0; i<10; i++){
            let ang = i * Math.PI/5;
            ctx.lineTo(Math.cos(ang) * p.radius * 0.7, Math.sin(ang) * p.radius * 0.7)
            ctx.lineTo(Math.cos(ang + Math.PI/10) * p.radius * 1.4, Math.sin(ang + Math.PI/10) * p.radius * 1.4)

        }
        ctx.lineTo(p.radius * 0.7, 0)
        ctx.fill();
        ctx.stroke();
    },

    iris: (p) => { // venom -> iris
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.fillStyle = blendColor('#ce76db', '#FF0000', blendAmount(p));
        ctx.strokeStyle = blendColor('#a760b1', '#FF0000', blendAmount(p));
        if(checkForFirstFrame(p)){
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#FFFFFF";
        }

        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    },

    shell: (p) => { // shield -> shell
        ctx.strokeStyle = blendColor('#ccb36d', '#FF0000', blendAmount(p));
        ctx.fillStyle = blendColor('#fcdd86', '#FF0000', blendAmount(p));
        if(checkForFirstFrame(p)){
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#ffffff";
        }

        ctx.lineWidth = p.radius * 0.2;

        ctx.beginPath();
        ctx.lineTo(p.radius * -0.73, p.radius * -0.375);
        ctx.lineTo(p.radius * 0.39, p.radius * -1.15)
        ctx.arcTo(p.radius * 3.3, p.radius * 0.21, p.radius * 0.14, p.radius * 1.19, p.radius * 1.24)
        ctx.lineTo(p.radius * 0.14, p.radius * 1.19);
        ctx.lineTo(p.radius * 0.14, p.radius * 1.19);
        ctx.lineTo(p.radius * -0.78, p.radius * 0.24);
        ctx.quadraticCurveTo(p.radius * -0.94, p.radius * -0.06, p.radius * -0.73, p.radius * -0.375)
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        ctx.lineWidth = p.radius * 0.16
        ctx.beginPath();
        ctx.lineTo(p.radius * -0.45, p.radius * -0.24);
        ctx.lineTo(p.radius * 0.44, p.radius * -0.585);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.lineTo(p.radius * -0.37, p.radius * -0.115);
        ctx.lineTo(p.radius * 0.62, p.radius * -0.19);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.lineTo(p.radius * -0.39, p.radius * 0.05);
        ctx.lineTo(p.radius * 0.57, p.radius * 0.31);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.lineTo(p.radius * -0.47, p.radius * 0.16);
        ctx.lineTo(p.radius * 0.31, p.radius * 0.656);
        ctx.stroke();
        ctx.closePath();
    },

    bomb: (p) => { // 新设计的bomb花瓣
        ctx.lineWidth = 3;
        ctx.fillStyle = blendColor('#2c2c2c', '#FF0000', blendAmount(p));
        ctx.strokeStyle = blendColor('#1a1a1a', '#FF0000', blendAmount(p));
        if(checkForFirstFrame(p)){
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#FFFFFF";
        }

        // 绘制圆形主体
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        // 绘制引线
        ctx.beginPath();
        ctx.moveTo(p.radius * 0.6, -p.radius * 0.6);
        ctx.quadraticCurveTo(p.radius * 0.8, -p.radius * 0.9, p.radius * 1.1, -p.radius * 0.8);
        ctx.stroke();
        ctx.closePath();

        // 绘制火花
        ctx.fillStyle = blendColor('#ff6b35', '#FF0000', blendAmount(p));
        ctx.beginPath();
        ctx.arc(p.radius * 1.1, -p.radius * 0.8, p.radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    },

    hornet_missile: (p) => {
        ctx.lineWidth = 3;
        ctx.fillStyle = blendColor('#ffd700', '#FF0000', blendAmount(p));
        ctx.strokeStyle = blendColor('#ffb347', '#FF0000', blendAmount(p));
        if(checkForFirstFrame(p)){
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#FFFFFF";
        }

        ctx.beginPath();
        ctx.moveTo(0, -p.radius);
        ctx.lineTo(p.radius * 0.7, 0);
        ctx.lineTo(p.radius * 0.5, p.radius);
        ctx.lineTo(-p.radius * 0.5, p.radius);
        ctx.lineTo(-p.radius * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    },

    magnet: (p) => {
        ctx.fillStyle = blendColor('#a44343', '#FF0000', blendAmount(p));
        ctx.strokeStyle = blendColor('#853636', '#FF0000', blendAmount(p));
        if(checkForFirstFrame(p)){
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#FFFFFF";
        }

        ctx.lineWidth = p.radius / 6;
        ctx.lineCap = "butt";
        ctx.beginPath();
        ctx.moveTo(p.radius * -0.25, p.radius * 0.38);
        ctx.quadraticCurveTo(p.radius * -0.47, p.radius * 0.22, p.radius * -0.42, p.radius * 0.08)
        ctx.quadraticCurveTo(p.radius * -0.28, p.radius * -0.25, p.radius * 0.05, p.radius * -0.48);
        ctx.quadraticCurveTo(p.radius * 0.32, p.radius * -1.12, p.radius * -0.39, p.radius * -1.05)
        ctx.quadraticCurveTo(p.radius * -1.78, p.radius * 0.1, p.radius * -0.66, p.radius * 0.96)
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        ctx.fillStyle = blendColor('#4343a4', '#FF0000', blendAmount(p));
        ctx.strokeStyle = blendColor('#363685', '#FF0000', blendAmount(p));
        if(checkForFirstFrame(p)){
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#FFFFFF";
        }
        ctx.beginPath();
        ctx.moveTo(p.radius * -0.68, p.radius * 0.95);
        ctx.quadraticCurveTo(p.radius * 0.65, p.radius * 1.65, p.radius * 1.1, p.radius * -0.06);
        ctx.quadraticCurveTo(p.radius * 0.9, p.radius * -0.75, p.radius * 0.4, p.radius * -0.24);
        ctx.quadraticCurveTo(p.radius * 0.18, p.radius * 0.7, p.radius * -0.25, p.radius * 0.38);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        ctx.lineCap = "round";
    },

    thirdeye: (p) => {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.fillStyle = blendColor("#000000", '#FF0000', blendAmount(p));
        ctx.strokeStyle = blendColor("#000000", '#FF0000', blendAmount(p));
        if (checkForFirstFrame(p)) {
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#FFFFFF"
        }

        ctx.beginPath();
        ctx.lineTo(0, -p.radius * 0.9);
        ctx.quadraticCurveTo(p.radius * 0.9, 0, 0, p.radius * 0.9);
        ctx.quadraticCurveTo(-p.radius * 0.9, 0, 0, -p.radius * 0.9);
        ctx.fill();
        ctx.stroke()
        ctx.fillStyle = blendColor("#ffffff", '#FF0000', blendAmount(p));

        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
};

// 绘制花瓣形状（完全按照petal.js标准）
function drawVectorPetal(x, y, size, angle, petalType) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // 创建模拟的petal对象
    const p = {
        radius: size / 2, // size是直径，转换为半径
        ticksSinceLastDamaged: 1000,
        lastTicksSinceLastDamaged: 1000
    };

    // 获取对应的渲染函数
    const renderFunc = petalRenderMap[petalType];
    if (renderFunc) {
        renderFunc(p);
    } else {
        // 默认使用basic花瓣
        petalRenderMap.basic(p);
    }

    ctx.restore();
}

// 绘制玩家角色（基于实际flower.png的emoji风格）
function drawVectorPlayer(x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // size是直径，需要除以2作为半径
    const radius = size / 2;

    // 外层圆形边框
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#D9CA8C'; // 浅黄褐色边框
    ctx.fill();

    // 内层主体圆形
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = '#FFDE00'; // 明亮黄色
    ctx.fill();

    // 绘制眼睛
    const eyeSize = radius * 0.15;
    const eyeHeight = eyeSize * 1.2; // 竖椭圆
    const eyeOffsetX = radius * 0.25;
    const eyeOffsetY = -radius * 0.15;

    // 左眼
    ctx.beginPath();
    ctx.ellipse(-eyeOffsetX, eyeOffsetY, eyeSize * 0.6, eyeHeight, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    // 左眼高光
    ctx.beginPath();
    ctx.ellipse(-eyeOffsetX, eyeOffsetY - eyeHeight * 0.3, eyeSize * 0.2, eyeHeight * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // 右眼
    ctx.beginPath();
    ctx.ellipse(eyeOffsetX, eyeOffsetY, eyeSize * 0.6, eyeHeight, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    // 右眼高光
    ctx.beginPath();
    ctx.ellipse(eyeOffsetX, eyeOffsetY - eyeHeight * 0.3, eyeSize * 0.2, eyeHeight * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // 绘制微笑嘴巴
    ctx.beginPath();
    ctx.arc(0, radius * 0.1, radius * 0.4, 0.2 * Math.PI, 0.8 * Math.PI, false);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.05;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();
}

// 绘制Shield实体（基于实际shield.png）
function drawVectorShield(x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // 图片渲染使用 size 作为直径，所以矢量也需要用 size/2
    const actualSize = size / 2;
    const scaleX = 1.2; // Shield的宽高比
    const scaleY = 1.0;

    // 绘制扇形主体
    ctx.beginPath();
    ctx.scale(scaleX, scaleY);

    // 创建扇形路径（类似贝壳形状）
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, actualSize, -Math.PI * 0.7, Math.PI * 0.7, false);
    ctx.closePath();

    // 填充主色（浅黄色）
    ctx.fillStyle = '#F8E08E';
    ctx.fill();

    // 绘制外轮廓边框（深棕色）
    ctx.strokeStyle = '#B38D3C';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 绘制内部装饰线条（浅棕色）
    ctx.strokeStyle = '#D9BC6A';
    ctx.lineWidth = 2;

    // 4条平行短线条
    for (let i = 0; i < 4; i++) {
        const lineY = -size * 0.3 + i * size * 0.2;
        const lineLength = size * 0.25;

        ctx.beginPath();
        ctx.moveTo(-lineLength/2, lineY);
        ctx.lineTo(lineLength/2, lineY);
        ctx.stroke();
    }

    ctx.restore();
}

// 绘制Bomb Beetle实体（基于实际bombbeetle.png）
function drawVectorBombBeetle(x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // 图片渲染使用 size 作为直径，所以矢量也需要用 size/2
    const e = {
        render: {
            angle: 0,
            radius: size / 2,
            time: Date.now(), // 使用实际当前时间
            lastX: x,
            lastY: y
        },
        ticksSinceLastDamaged: 1000,
        lastTicksSinceLastDamaged: 1000,
        team: "enemy"
    };

    ctx.lineWidth = e.render.radius / 3;

    // 将紫色改为红色
    let bodyColor = blendColor('#ff0000', "#FF0000", Math.max(0, blendAmount(e)));
    let sideColor = blendColor('#cc0000', "#FF0000", Math.max(0, blendAmount(e)));

    if (checkForFirstFrame(e)) {
        bodyColor = "#ffffff";
        sideColor = "#ffffff";
    }

    ctx.rotate(e.render.angle);

    // Front things - 螯的绘制
    // 恢复原始螯的颜色，移除边框
    ctx.fillStyle = "#333333";

    // 上螯
    ctx.translate(e.render.radius * 0.99, -e.render.radius * 0.37);
    let rotateAngle = Math.cos(e.render.time / 60) / 15 + 0.1; // 大幅降低动画速度，从/12改为/60，幅度从/7.5改为/15
    ctx.rotate(rotateAngle);
    ctx.beginPath();
    ctx.lineTo(e.render.radius * (0.66 - 0.99), e.render.radius * (-0.54 + 0.37));
    ctx.quadraticCurveTo(e.render.radius * (1.35 - 0.99), e.render.radius * (-0.81 + 0.37), e.render.radius * (1.8 - 0.99), e.render.radius * (-0.47 + 0.37));
    ctx.quadraticCurveTo(e.render.radius * (1.92 - 0.99), e.render.radius * (-0.38 + 0.37), e.render.radius * (1.81 - 0.99), e.render.radius * (-0.28 + 0.37));
    ctx.quadraticCurveTo(e.render.radius * (1.42 - 0.99), e.render.radius * (-0.37 + 0.37), e.render.radius * (0.74 - 0.99), e.render.radius * (-0.13 + 0.37));
    ctx.fill();
    ctx.closePath();
    ctx.rotate(-rotateAngle);
    ctx.translate(-e.render.radius * 0.99, e.render.radius * 0.37);

    // 下螯 - 使用相反的动画相位
    ctx.translate(e.render.radius * 0.99, e.render.radius * 0.37);
    ctx.rotate(-rotateAngle); // 恢复相同的动画相位
    ctx.beginPath();
    ctx.lineTo(e.render.radius * (0.66 - 0.99), e.render.radius * (0.54 - 0.37));
    ctx.quadraticCurveTo(e.render.radius * (1.35 - 0.99), e.render.radius * (0.81 - 0.37), e.render.radius * (1.8 - 0.99), e.render.radius * (0.47 - 0.37));
    ctx.quadraticCurveTo(e.render.radius * (1.92 - 0.99), e.render.radius * (0.38 - 0.37), e.render.radius * (1.81 - 0.99), e.render.radius * (0.28 - 0.37));
    ctx.quadraticCurveTo(e.render.radius * (1.42 - 0.99), e.render.radius * (0.37 - 0.37), e.render.radius * (0.74 - 0.99), e.render.radius * (0.13 - 0.37));
    ctx.fill();
    ctx.closePath();
    ctx.rotate(rotateAngle);
    ctx.translate(-e.render.radius * 0.99, -e.render.radius * 0.37);

    // Body
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = e.render.radius * 0.19310344827586207;
    ctx.strokeStyle = sideColor;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.lineTo(e.render.radius * -1.01, e.render.radius * 0);
    ctx.bezierCurveTo(e.render.radius * -1.1, e.render.radius * -1.01, e.render.radius * 1.1, e.render.radius * -1.01, e.render.radius * 1, e.render.radius * 0);
    ctx.bezierCurveTo(e.render.radius * 1.1, e.render.radius * 1.01, e.render.radius * -1.1, e.render.radius * 1.01, e.render.radius * -1.01, e.render.radius * 0);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    // Middle Line
    ctx.beginPath();
    ctx.lineTo(e.render.radius * -0.51, e.render.radius * 0);
    ctx.quadraticCurveTo(e.render.radius * 0.01, e.render.radius * -0.06, e.render.radius * 0.5, e.render.radius * 0);
    ctx.stroke();
    ctx.closePath();

    // Dots
    ctx.fillStyle = sideColor;

    ctx.beginPath();
    ctx.arc(e.render.radius * -0.43, e.render.radius * -0.3, e.render.radius * 0.12413793103448276, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(e.render.radius * -0.01, e.render.radius * -0.38, e.render.radius * 0.12413793103448276, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(e.render.radius * 0.43, e.render.radius * -0.3, e.render.radius * 0.12413793103448276, 0, Math.PI * 2, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = sideColor;
    ctx.arc(e.render.radius * -0.43, e.render.radius * 0.3, e.render.radius * 0.12413793103448276, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(e.render.radius * -0.01, e.render.radius * 0.38, e.render.radius * 0.12413793103448276, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(e.render.radius * 0.43, e.render.radius * 0.3, e.render.radius * 0.12413793103448276, 0, Math.PI * 2, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.rotate(-e.render.angle);

    ctx.restore();
}

// 辅助函数：从 enemy.js 复制
function blendColor(color1, color2, t) {
    const rgb1 = {
        r: parseInt(color1.slice(1, 3), 16),
        g: parseInt(color1.slice(3, 5), 16),
        b: parseInt(color1.slice(5, 7), 16)
    }
    const rgb2 = {
        r: parseInt(color2.slice(1, 3), 16),
        g: parseInt(color2.slice(3, 5), 16),
        b: parseInt(color2.slice(5, 7), 16)
    }
    return rgbToHex(Math.floor(rgb1.r * (1 - t) + rgb2.r * t), Math.floor(rgb1.g * (1 - t) + rgb2.g * t), Math.floor(rgb1.b * (1 - t) + rgb2.b * t));
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// 完全按照 enemy.js 的 Hornet 绘制方式
function drawVectorHornet(x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // 图片渲染使用 size 作为直径，所以矢量也需要用 size/2
    const actualSize = size / 2;
    const e = {
        render: {
            angle: 0,
            radius: actualSize
        },
        ticksSinceLastDamaged: 1000, // 默认值，表示没有受伤
        lastTicksSinceLastDamaged: 1000
    };

    // 完全复制 enemy.js 中的 Hornet 绘制逻辑
    let bodyColor = blendColor("#ffd363", "#FF0000", Math.max(0, 0)); // blendAmount(e)
    let stripesColor = blendColor("#333333", "#FF0000", Math.max(0, 0));

    // 由于没有 damageFlash，简化 checkForFirstFrame
    const isFirstFrame = false;
    if (isFirstFrame) {
        bodyColor = "#FFFFFF";
        stripesColor = "#FFFFFF";
    }

    ctx.lineJoin = 'round';

    ctx.rotate(e.render.angle + Math.PI / 2);

    // stinger/ tail thing
    ctx.strokeStyle = stripesColor;
    ctx.fillStyle = stripesColor;
    ctx.lineWidth = e.render.radius / 6;
    ctx.beginPath();
    ctx.moveTo(0, e.render.radius * 1.55);
    ctx.lineTo(-e.render.radius * .31, e.render.radius * .4);
    ctx.lineTo(e.render.radius * .31, e.render.radius * .4);
    ctx.lineTo(0, e.render.radius * 1.55);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = bodyColor;

    // body fill
    ctx.beginPath();
    ctx.ellipse(0, 0, e.render.radius * 2 / 3, e.render.radius, 0, 0, Math.PI * 2);
    ctx.fill();

    // stripes
    ctx.fillStyle = stripesColor;
    ctx.beginPath();
    ctx.moveTo(-e.render.radius * 0.45, -e.render.radius * 2 / 3);
    ctx.lineTo(-e.render.radius * 0.55, -e.render.radius * 1 / 3);
    ctx.lineTo(e.render.radius * 0.55, -e.render.radius * 1 / 3);
    ctx.lineTo(e.render.radius * 0.45, -e.render.radius * 2 / 3);
    ctx.fill();
    ctx.fillRect(-e.render.radius * 0.65, 0, e.render.radius * 2 * 0.65, e.render.radius / 3);
    ctx.beginPath();
    ctx.moveTo(-e.render.radius * 0.45, e.render.radius * 2 / 3);
    ctx.lineTo(-e.render.radius * 0.15, e.render.radius);
    ctx.lineTo(e.render.radius * 0.15, e.render.radius);
    ctx.lineTo(e.render.radius * 0.45, e.render.radius * 2 / 3);
    ctx.fill();

    ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
    if (isFirstFrame) {
        ctx.strokeStyle = '#FFFFFF';
    }
    ctx.lineWidth = e.render.radius * .15;

    // body stroke
    ctx.beginPath();
    ctx.ellipse(0, 0, e.render.radius * 2 / 3, e.render.radius, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();

    // antennae
    ctx.fillStyle = stripesColor;
    ctx.strokeStyle = stripesColor;
    ctx.lineWidth = e.render.radius / 10;
    ctx.beginPath();
    ctx.moveTo(e.render.radius * .16, -e.render.radius * .85);
    ctx.quadraticCurveTo(e.render.radius * .18, -e.render.radius * 1.36, e.render.radius * .49, -e.render.radius * 1.68);
    ctx.quadraticCurveTo(e.render.radius * .3, -e.render.radius * 1.26, e.render.radius * .16, -e.render.radius * .85);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(-e.render.radius * .16, -e.render.radius * .85);
    ctx.quadraticCurveTo(-e.render.radius * .18, -e.render.radius * 1.36, -e.render.radius * .49, -e.render.radius * 1.68);
    ctx.quadraticCurveTo(-e.render.radius * .3, -e.render.radius * 1.26, -e.render.radius * .16, -e.render.radius * .85);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    ctx.rotate(-e.render.angle - Math.PI / 2);

    ctx.restore();
}

// 完全按照 enemy.js 的 Ladybug 绘制方式
function drawVectorLadybug(x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // 图片渲染使用 size 作为直径，所以矢量也需要用 size/2
    const actualSize = size / 2;
    const e = {
        render: {
            angle: 0,
            radius: actualSize
        },
        ticksSinceLastDamaged: 1000,
        lastTicksSinceLastDamaged: 1000,
        rarity: 1,
        data: [0.5, 0.3, 0.5, 0.4, 0.2, 0.7, 0.6, 0.5, 0.3, 0.2, 0.8, 0.4, 0.7, 0.3, 0.6, 0.4, 0.5, 0.8, 0.2, 0.6, 0.3, 0.7, 0.4, 0.5, 0.6, 0.2, 0.8]
    };

    // 完全复制 enemy.js 中的 Ladybug 绘制逻辑
    let bodyColor = blendColor("#EB4034", "#FF0000", Math.max(0, 0)); // blendAmount(e)
    let headColor = blendColor("#111111", "#FF0000", Math.max(0, 0));

    // 由于没有 damageFlash，简化 checkForFirstFrame
    const isFirstFrame = false;
    if (isFirstFrame) {
        bodyColor = "#FFFFFF";
        headColor = "#FFFFFF";
    }

    ctx.rotate(e.render.angle + Math.PI);

    ctx.strokeStyle = blendColor(headColor, "#000000", 0.19);
    ctx.fillStyle = headColor;
    ctx.lineWidth = e.render.radius / 5;

    // head (little black thing sticking out)
    ctx.beginPath();
    ctx.arc(-e.render.radius / 2, 0, e.render.radius / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    // main body
    ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, e.render.radius, (5.9375 / 5) * Math.PI, (4.0625 / 5) * Math.PI);
    ctx.quadraticCurveTo(-10, 0, Math.cos((5.9375 / 5) * Math.PI) * e.render.radius, Math.sin((5.9375 / 5) * Math.PI) * e.render.radius);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();

    // ladybug spots - 使用 enemy.js 中的实际数据
    ctx.fillStyle = headColor;
    for (let i = 0; i < (Math.ceil(Math.min(e.rarity, 5) ** 1.5) * 3) + 9; i += 3) {
        ctx.beginPath();
        ctx.arc((-0.5 + e.data[i]) * e.render.radius / 30 * 35,
                (-0.5 + e.data[i + 1] * e.render.radius / 30 * 35),
                e.render.radius / 30 * (5 + e.data[i + 2] * 5),
                0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, e.render.radius, (5.9375 / 5) * Math.PI, (4.0625 / 5) * Math.PI);
    ctx.quadraticCurveTo(-10, 0, Math.cos((5.9375 / 5) * Math.PI) * e.render.radius, Math.sin((5.9375 / 5) * Math.PI) * e.render.radius);
    ctx.stroke();
    ctx.closePath();

    ctx.rotate(-e.render.angle - Math.PI);

    ctx.restore();
}

// 完全按照 enemy.js 的 Centipede 绘制方式
function drawVectorCentipede(x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // 图片渲染使用 size 作为直径，所以矢量也需要用 size/2
    const actualSize = size / 2;
    const e = {
        render: {
            angle: 0,
            radius: actualSize
        },
        ticksSinceLastDamaged: 1000,
        lastTicksSinceLastDamaged: 1000,
        isHead: false
    };

    // 完全复制 enemy.js 中的 Centipede 绘制逻辑
    let bodyColor = blendColor("#8ac255", "#FF0000", Math.max(0, 0)); // blendAmount(e)
    let sideColor = blendColor("#333333", "#FF0000", Math.max(0, 0));

    const isFirstFrame = false;
    if (isFirstFrame) {
        bodyColor = "#FFFFFF";
        sideColor = "#FFFFFF";
    }

    ctx.rotate(e.render.angle);

    const isOpaq = ctx.globalAlpha !== 1;

    if (isOpaq === true) {
        // draw head and clip so that legs dont appear insider body
        ctx.save();
        let p = new Path2D();
        p.rect(-10000, -10000, 20000, 20000);
        p.arc(0, 0, e.render.radius, 0, Math.PI * 2);
        ctx.clip(p, "evenodd");
    }

    // side
    ctx.fillStyle = sideColor;
    ctx.beginPath();
    ctx.arc(0, e.render.radius * 0.85, e.render.radius * 0.44, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(0, -e.render.radius * 0.85, e.render.radius * 0.44, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    if (isOpaq === true) {
        ctx.restore();
    }

    ctx.lineWidth = e.render.radius * .2;
    // main body
    ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, e.render.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    if (e.isHead === true) {
        ctx.strokeStyle = sideColor;
        ctx.lineWidth = e.render.radius * .075;

        // antennae
        ctx.beginPath();
        ctx.moveTo(e.render.radius * .71, -e.render.radius * .29);
        ctx.quadraticCurveTo(e.render.radius * 1.35, -e.render.radius * .33, e.render.radius * 1.57, -e.render.radius * .87);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(e.render.radius * .71, e.render.radius * .29);
        ctx.quadraticCurveTo(e.render.radius * 1.35, e.render.radius * .33, e.render.radius * 1.57, e.render.radius * .87);
        ctx.stroke();
        ctx.closePath();

        // little bulbs at the ends
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(e.render.radius * 1.57, -e.render.radius * .87, e.render.radius * .132, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(e.render.radius * 1.57, e.render.radius * .87, e.render.radius * .132, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    ctx.rotate(-e.render.angle);

    ctx.restore();
}

// 完全按照 enemy.js 的 Rock 绘制方式（简化版本）
function drawVectorRock(x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // 图片渲染使用 size 作为直径，所以矢量也需要用 size/2
    const actualSize = size / 2;
    const e = {
        render: {
            angle: 0,
            radius: actualSize
        },
        ticksSinceLastDamaged: 1000,
        lastTicksSinceLastDamaged: 1000,
        data: [] // 将生成简化的顶点数据
    };

    // 生成简化的顶点数据（使用固定种子确保形状稳定）
    const vertexCount = Math.max(6, Math.floor(Math.log(size) * 2));
    // 使用位置坐标作为种子，确保相同位置的rock有相同形状
    const seed = Math.floor(x * 1000 + y * 1000) % 10000;

    // 简单的伪随机数生成器
    function seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    for (let i = 0; i < vertexCount; i++) {
        const angle = (i / vertexCount) * Math.PI * 2;
        const radiusVariation = 0.8 + seededRandom(seed + i) * 0.4;
        e.data.push({
            x: Math.cos(angle) * radiusVariation,
            y: Math.sin(angle) * radiusVariation
        });
    }

    // 添加获取顶点坐标的方法
    e.getVertexX = (i) => {
        return e.data[i].x * e.render.radius;
    };
    e.getVertexY = (i) => {
        return e.data[i].y * e.render.radius;
    };

    // 完全复制 enemy.js 中的 Rock 绘制逻辑
    ctx.lineWidth = e.render.radius / 10;

    ctx.fillStyle = blendColor('#777777', "#FF0000", Math.max(0, 0)); // blendAmount(e)
    ctx.strokeStyle = blendColor('#606060', "#FF0000", Math.max(0, 0));

    const isFirstFrame = false;
    if (isFirstFrame) {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#ffffff";
    }

    ctx.beginPath();
    ctx.moveTo(e.getVertexX(0), e.getVertexY(0));
    for (let i = 0; i < e.data.length; i++) {
        ctx.lineTo(e.getVertexX(i), e.getVertexY(i));
    }
    ctx.lineTo(e.getVertexX(0), e.getVertexY(0));
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
}

// 绘制盾牌守卫（基于enemy.js中的Shell绘制方法）
function drawVectorShieldGuardian(x, y, size, angle) {
    // 模拟enemy对象结构
    const e = {
        radius: size / 2,
        render: {
            angle: angle
        },
        ticksSinceLastDamaged: 1000,
        lastTicksSinceLastDamaged: 1000
    };

    ctx.save();
    ctx.translate(x, y);

    // 设置颜色（从enemy.js的Shell复制）
    ctx.strokeStyle = blendColor('#ccb26e', "#FF0000", Math.max(0, blendAmount(e)));
    ctx.fillStyle = blendColor('#fcdd85', "#FF0000", Math.max(0, blendAmount(e)));

    const isFirstFrame = false;
    if (isFirstFrame) {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#ffffff";
    }

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = e.radius * 0.1696969696969697;

    ctx.rotate(e.render.angle);

    // 主体形状（从enemy.js的Shell复制）
    ctx.beginPath();
    ctx.lineTo(e.radius * -0.52, e.radius * -0.34);
    ctx.lineTo(e.radius * -0.78, e.radius * -0.5);
    ctx.quadraticCurveTo(e.radius * -0.61, e.radius * 0, e.radius * -0.76, e.radius * 0.5);
    ctx.lineTo(e.radius * -0.52, e.radius * 0.34);
    ctx.lineTo(e.radius * 0.21, e.radius * 0.95);
    ctx.arcTo(e.radius * 3.13, e.radius * 0, e.radius * 0.21, e.radius * -0.95, e.radius * 1);
    ctx.lineTo(e.radius * -0.52, e.radius * -0.34);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    // 内部线条
    ctx.beginPath();
    ctx.lineTo(e.radius * -0.52, e.radius * -0.34);
    ctx.arcTo(e.radius * -0.87, e.radius * 0, e.radius * -0.52, e.radius * 0.34, e.radius * 0.45454545454545453);
    ctx.stroke();
    ctx.closePath();

    // 装饰线条
    ctx.lineWidth = e.radius * 0.12727272727272726;

    ctx.beginPath();
    ctx.lineTo(e.radius * -0.31, e.radius * 0.07);
    ctx.lineTo(e.radius * 0.48, e.radius * 0.2);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.lineTo(e.radius * -0.37, e.radius * 0.16);
    ctx.lineTo(e.radius * 0.3, e.radius * 0.5);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.lineTo(e.radius * -0.31, e.radius * -0.07);
    ctx.lineTo(e.radius * 0.48, e.radius * -0.2);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.lineTo(e.radius * -0.37, e.radius * -0.16);
    ctx.lineTo(e.radius * 0.3, e.radius * -0.5);
    ctx.stroke();
    ctx.closePath();

    ctx.rotate(-e.render.angle);
    ctx.restore();
}

// 绘制毒蜘蛛（基于enemy.js中的Spider绘制方法）
function drawVectorVenomSpider(x, y, size, angle) {

    // 模拟enemy对象结构
    const currentTime = Date.now();
    const e = {
        radius: size/2,  // size是直径
        render: {
            angle: angle,
            time: currentTime,
            lastX: x,
            lastY: y
        },
        ticksSinceLastDamaged: 1000,
        lastTicksSinceLastDamaged: 1000,
        isMenuEnemy: false
    };

    ctx.save();
    ctx.translate(x, y);

    let bodyColor = blendColor("#4f412d", "#FF0000", Math.max(0, blendAmount(e)));
    let legColor = blendColor("#403425", "#FF0000", Math.max(0, blendAmount(e)));

    const isFirstFrame = false;
    if (isFirstFrame) {
        bodyColor = "#FFFFFF";
        legColor = "#FFFFFF";
    }

    ctx.rotate(e.render.angle + Math.PI);

    // 绘制腿 - 添加动画效果
    ctx.strokeStyle = legColor;
    ctx.lineWidth = e.radius / 4;
    ctx.rotate(Math.PI / 2);

    // 为每条腿添加独立的动画
    for (let i = 0; i < 4; i++) {
        let rotateAmount = i * 0.52359 - 0.52359 - 0.26179938;

        // 计算腿部动画偏移 - 模拟行走动作，大幅提升速度
        const walkCycle = Math.sin(currentTime / 25 + i * Math.PI / 2) * 0.15; // 从100改为25，速度再翻4倍，总共比原来快8倍
        const legBend = Math.sin(currentTime / 20 + i * Math.PI / 3) * 0.1; // 从75改为20，速度再翻3.75倍，总共比原来快15倍

        ctx.rotate(rotateAmount);
        ctx.beginPath();

        // 左腿
        ctx.save();
        ctx.rotate(walkCycle);
        ctx.moveTo(-e.radius * 2.2, 0);
        ctx.quadraticCurveTo(-e.radius * (1.2 + legBend), e.radius * 1 / 6, 0, 0);
        ctx.stroke();
        ctx.restore();

        // 右腿
        ctx.save();
        ctx.rotate(-walkCycle);
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(e.radius * (1.2 + legBend), -e.radius * 1 / 6, e.radius * 2.2, 0);
        ctx.stroke();
        ctx.restore();

        ctx.rotate(-rotateAmount);
        ctx.closePath();
    }

    ctx.rotate(-Math.PI / 2);

    // 绘制主体
    ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    ctx.rotate(-e.render.angle - Math.PI);
    ctx.restore();
}

// 绘制雷电元素（完全按照enemy.js中的Jellyfish绘制方法）
function drawVectorThunderElement(x, y, size, angle) {
    let savedAlpha = ctx.globalAlpha;

    // 模拟enemy对象结构
    const e = {
        radius: size/2,
        render: {
            angle: angle,
            time: 0,
            x: x,
            y: y
        },
        team: "enemy",
        ticksSinceLastDamaged: 1000,
        lastTicksSinceLastDamaged: 1000,
        lastShocked: 1000,
        shock: [] // 简化的shock数组
    };

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(e.render.angle);
    ctx.lineWidth = e.radius / 6;

    // 设置颜色（完全按照Jellyfish）
    ctx.fillStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));
    ctx.strokeStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));

    const isFirstFrame = false;
    if (isFirstFrame) {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#ffffff";
    }

    ctx.globalAlpha *= 0.5;

    // 旋转并绘制8条触手（完全按照Jellyfish）
    ctx.rotate(e.render.angle);
    for (let i = 8; i > 0; i--) {
        let offset = Math.cos(e.render.time / 500 + i * Math.PI / 4);
        ctx.rotate(Math.PI * 1 / 4 * i)
        ctx.beginPath();
        ctx.moveTo(e.radius * 0.8, 0);
        ctx.quadraticCurveTo(e.radius * 0.9, 0, e.radius * 1.5, e.radius * 0.2 * offset)
        ctx.stroke();
        ctx.closePath();
        ctx.rotate(-Math.PI * 1 / 4 * i)
    }
    ctx.rotate(-e.render.angle)

    ctx.globalAlpha *= 1.3;
    ctx.lineWidth = e.radius / 12;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 23 / 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();

    ctx.globalAlpha *= 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 22 / 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.rotate(-e.render.angle);

    
    ctx.globalAlpha = savedAlpha;
    ctx.restore();
}

// 绘制通用怪物形状（矢量版本）- 兼容旧版
function drawVectorMonster(x, y, size, type, angle) {
    // 根据类型调用具体的绘制函数
    switch (type) {
        case 'hornet':
            drawVectorHornet(x, y, size, angle);
            break;
        case 'ladybug':
            drawVectorLadybug(x, y, size, angle);
            break;
        case 'centipede':
        case 'centipede0':  // 蜈蚣头部（有触角）
            drawCentipede(x, y, size, angle, true); // 头部
            break;
        case 'centipede1':  // 蜈蚣身体（无触角）
            drawCentipede(x, y, size, angle, false); // 身体
            break;
        case 'rock':
            drawVectorRock(x, y, size, angle);
            break;
        case 'bombbeetle':
            drawVectorBombBeetle(x, y, size, angle);
            break;
        case 'shield':
            drawVectorShield(x, y, size, angle);
            break;
        case 'venomspider':
            drawVectorVenomSpider(x, y, size, angle);
            break;
        case 'thunderelement':
            drawVectorThunderElement(x, y, size, angle);
            break;
        case 'shieldguardian':
            drawVectorShieldGuardian(x, y, size, angle);
            break;
        default:
            // 默认绘制简单圆形
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, Math.PI * 2);  // 使用 size/2 作为半径
            ctx.fillStyle = '#9B59B6';
            ctx.fill();
            ctx.restore();
    }
}

// 性能测试：渲染模式切换
window.toggleRenderingMode = function() {
    gameState.useVectorRendering = !gameState.useVectorRendering;
    const mode = gameState.useVectorRendering ? '矢量渲染' : '图片渲染';
    console.log(`✅ 已切换到${mode}模式`);
};

// 动态调整渲染质量
function adjustRenderQuality() {
    const fps = gameState.fps;
    const dpr = gameState.devicePixelRatio;
    const entityCount = gameState.petals.length + gameState.mobs.length + gameState.collectDrops.length;

    let newQuality = gameState.renderQuality;

    // 根据FPS和实体数量调整质量
    if (fps < 30 || entityCount > 100) {
        // 性能不足时降低质量
        if (dpr >= 2) {
            newQuality = 'medium';
        } else {
            newQuality = 'low';
        }
    } else if (fps > 50 && entityCount < 50) {
        // 性能充足时提升质量
        if (dpr >= 1.5) {
            newQuality = 'high';
        } else {
            newQuality = 'medium';
        }
    }

    // 应用新的渲染质量
    if (newQuality !== gameState.renderQuality) {
        gameState.renderQuality = newQuality;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = newQuality;

        console.log(`🎯 渲染质量调整: ${newQuality} (FPS: ${fps}, 实体: ${entityCount}, DPR: ${dpr})`);
    }
}

// 显示性能统计
window.showPerformanceStats = function() {
    console.log(`🎮 游戏性能统计：`);
    console.log(`   当前FPS: ${gameState.fps}`);
    console.log(`   渲染模式: ${gameState.useVectorRendering ? '矢量' : '图片'}`);
    console.log(`   渲染质量: ${gameState.renderQuality}`);
    console.log(`   设备像素比: ${gameState.devicePixelRatio}`);
    console.log(`   缩放比例: ${gameState.scale.toFixed(3)}`);
    console.log(`   实体数量: ${gameState.petals.length + gameState.mobs.length + gameState.collectDrops.length}`);
};

// 快捷键：按V键切换渲染模式
document.addEventListener('keydown', (e) => {
    if (e.key === 'v' || e.key === 'V') {
        window.toggleRenderingMode();
    }
});

// 初始化游戏
initGame();