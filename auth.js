// 认证系统管理
class AuthManager {
    constructor() {
        this.setupEventListeners();
        this.loadStoredCredentials();
    }

    setupEventListeners() {
        // 表单切换
        const showRegisterLink = document.getElementById('showRegister');
        const showLoginLink = document.getElementById('showLogin');

        if (showRegisterLink) {
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }

        // 登录按钮
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            loginButton.addEventListener('click', () => this.handleLogin());
        }

        // 注册按钮
        const registerButton = document.getElementById('registerButton');
        if (registerButton) {
            registerButton.addEventListener('click', () => this.handleRegister());
        }

        // 回车键提交
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLogin();
                }
            });
        }

        if (registerForm) {
            registerForm.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleRegister();
                }
            });
        }

        // 用户名实时验证
        const registerUsernameInput = document.getElementById('registerUsername');
        if (registerUsernameInput) {
            let checkTimeout;
            registerUsernameInput.addEventListener('input', (e) => {
                clearTimeout(checkTimeout);
                checkTimeout = setTimeout(() => {
                    this.checkUsernameAvailability(e.target.value.trim());
                }, 500); // 500ms防抖
            });
        }
    }

    loadStoredCredentials() {
        const storedUsername = localStorage.getItem('authUsername');
        const storedPassword = localStorage.getItem('authPassword');
        const rememberMe = localStorage.getItem('authRememberMe') === 'true';

        if (storedUsername && storedPassword && rememberMe) {
            // 填充登录表单
            const loginUsername = document.getElementById('loginUsername');
            const loginPassword = document.getElementById('loginPassword');
            const rememberCheckbox = document.getElementById('rememberMe');

            if (loginUsername) loginUsername.value = storedUsername;
            if (loginPassword) loginPassword.value = storedPassword;
            if (rememberCheckbox) rememberCheckbox.checked = true;

            // 等待WebSocket连接建立后尝试自动登录
            this.waitForWebSocketAndAutoLogin(storedUsername, storedPassword);
        }
    }

    async waitForWebSocketAndAutoLogin(username, password) {
        // 等待WebSocket连接建立
        let attempts = 0;
        const maxAttempts = 100; // 最多等待10秒

        while ((!window.gameState || !window.gameState.connected ||
                !window.gameState.socket ||
                window.gameState.socket.readyState !== WebSocket.OPEN) &&
                attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (window.gameState && window.gameState.connected &&
            window.gameState.socket &&
            window.gameState.socket.readyState === WebSocket.OPEN) {
            console.log('WebSocket连接已建立，开始自动登录');
            try {
                await this.autoLogin(username, password);
            } catch (error) {
                console.error('自动登录失败:', error);
            }
        } else {
            console.log('WebSocket连接超时，不执行自动登录');
        }
    }

    saveCredentials(username, password, remember) {
        if (remember) {
            localStorage.setItem('authUsername', username);
            localStorage.setItem('authPassword', password);
            localStorage.setItem('authRememberMe', 'true');
        } else {
            localStorage.removeItem('authUsername');
            localStorage.removeItem('authPassword');
            localStorage.setItem('authRememberMe', 'false');
        }
    }

    clearCredentials() {
        localStorage.removeItem('authUsername');
        localStorage.removeItem('authPassword');
        localStorage.setItem('authRememberMe', 'false');
    }

    showLoginForm() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        this.hideError();
    }

    showRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        this.hideError();
    }

    showError(message) {
        const errorElement = document.getElementById('authError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.className = 'auth-error';
            errorElement.style.display = 'block';

            // 自动隐藏错误消息
            setTimeout(() => {
                this.hideError();
            }, 5000);
        }
    }

    showSuccess(message) {
        const errorElement = document.getElementById('authError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.className = 'auth-success';
            errorElement.style.display = 'block';

            // 自动隐藏成功消息
            setTimeout(() => {
                this.hideError();
            }, 3000);
        }
    }

    hideError() {
        const errorElement = document.getElementById('authError');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    validateForm(username, password, confirmPassword = null) {
        const errors = [];

        // 验证用户名
        if (!username || username.trim().length < 3) {
            errors.push('用户名至少需要3个字符');
        }
        if (username.length > 20) {
            errors.push('用户名不能超过20个字符');
        }
        if (!/^[a-zA-Z0-9_\u4e00-\u9fff]+$/.test(username)) {
            errors.push('用户名只能包含字母、数字、下划线和中文字符');
        }

        // 验证密码
        if (!password || password.length < 6) {
            errors.push('密码至少需要6个字符');
        }
        if (password.length > 50) {
            errors.push('密码不能超过50个字符');
        }

        // 验证确认密码（注册时）
        if (confirmPassword !== null && password !== confirmPassword) {
            errors.push('两次输入的密码不一致');
        }

        return errors;
    }

    setLoading(isLoading, buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = isLoading;
            if (isLoading) {
                button.innerHTML = '处理中<span class="loading-spinner"></span>';
            } else {
                button.textContent = buttonId === 'loginButton' ? '登录' : '注册';
            }
        }
    }

    async checkUsernameAvailability(username) {
        if (!username || username.length < 3) {
            return;
        }

        const input = document.getElementById('registerUsername');
        if (!input) return;

        // 检查WebSocket是否可用
        if (!window.gameState || !window.gameState.connected ||
            !window.gameState.socket ||
            window.gameState.socket.readyState !== WebSocket.OPEN) {
            console.log('WebSocket未连接，跳过用户名检查');
            return;
        }

        try {
            const response = await this.sendWebSocketMessage({
                COMMAND: 'CHECK_USERNAME',
                username: username
            });

            // 处理响应（在消息处理器中处理）
        } catch (error) {
            console.error('检查用户名可用性失败:', error);
        }
    }

    async waitForWebSocketConnection() {
        // 简化的WebSocket检查，因为连接应该已经在game.js中建立
        if (!window.gameState || !window.gameState.socket) {
            throw new Error('游戏状态未初始化 - 请刷新页面重试');
        }

        if (window.gameState.socket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket未连接 - 请检查服务器是否在运行');
        }

        console.log('WebSocket连接确认成功');
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // 表单验证
        const errors = this.validateForm(username, password);
        if (errors.length > 0) {
            this.showError(errors[0]);
            return;
        }

        // 检查WebSocket连接
        try {
            await this.waitForWebSocketConnection();
        } catch (error) {
            this.showError('服务器未连接，请稍后重试');
            return;
        }

        this.setLoading(true, 'loginButton');

        try {
            const response = await this.sendWebSocketMessage({
                COMMAND: 'LOGIN',
                username: username,
                password: password
            });

            // 实际处理在WebSocket消息回调中进行
        } catch (error) {
            console.error('登录失败:', error);
            // 区分不同类型的错误
            if (error.message === '用户名或密码错误') {
                this.showError('用户名或密码错误');
            } else if (error.message === '用户名或密码不能为空') {
                this.showError('用户名和密码不能为空');
            } else if (error.message === 'WebSocket连接未建立') {
                this.showError('服务器未连接，请稍后重试');
            } else if (error.message === '请求超时') {
                this.showError('服务器响应超时，请重试');
            } else {
                this.showError('登录失败，请检查网络连接');
            }
            this.setLoading(false, 'loginButton');
        }
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const rememberMe = document.getElementById('registerRememberMe').checked;

        // 表单验证
        const errors = this.validateForm(username, password, confirmPassword);
        if (errors.length > 0) {
            this.showError(errors[0]);
            return;
        }

        // 检查WebSocket连接
        try {
            await this.waitForWebSocketConnection();
        } catch (error) {
            this.showError('服务器未连接，请稍后重试');
            return;
        }

        this.setLoading(true, 'registerButton');

        try {
            const response = await this.sendWebSocketMessage({
                COMMAND: 'REGISTER',
                username: username,
                password: password
            });

            // 实际处理在WebSocket消息回调中进行
        } catch (error) {
            console.error('注册失败:', error);
            // 区分不同类型的错误
            if (error.message === '用户名已存在') {
                this.showError('用户名已存在');
            } else if (error.message === '用户名至少需要3个字符') {
                this.showError('用户名至少需要3个字符');
            } else if (error.message === '用户名不能超过20个字符') {
                this.showError('用户名不能超过20个字符');
            } else if (error.message === '密码至少需要6个字符') {
                this.showError('密码至少需要6个字符');
            } else if (error.message === '密码不能超过50个字符') {
                this.showError('密码不能超过50个字符');
            } else if (error.message === '用户名已被使用') {
                this.showError('用户名已被使用');
            } else if (error.message === 'WebSocket连接未建立') {
                this.showError('服务器未连接，请稍后重试');
            } else if (error.message === '请求超时') {
                this.showError('服务器响应超时，请重试');
            } else {
                this.showError('注册失败，请检查网络连接');
            }
            this.setLoading(false, 'registerButton');
        }
    }

    async autoLogin(username, password) {
        try {
            // 检查WebSocket连接（调用autoLogin时连接应该已经建立）
            if (!window.gameState || !window.gameState.connected ||
                !window.gameState.socket ||
                window.gameState.socket.readyState !== WebSocket.OPEN) {
                throw new Error('WebSocket未连接');
            }

            const response = await this.sendWebSocketMessage({
                COMMAND: 'LOGIN',
                username: username,
                password: password
            });
        } catch (error) {
            console.error('自动登录失败:', error);
            // 清除无效的存储凭据
            this.clearCredentials();
        }
    }

    sendWebSocketMessage(data) {
        return new Promise((resolve, reject) => {
            if (!window.gameState || !window.gameState.socket ||
                window.gameState.socket.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket连接未建立'));
                return;
            }

            // 设置消息回调
            const messageId = Date.now() + '_' + Math.random();
            data.messageId = messageId;

            // 存储回调函数
            if (!window.authCallbacks) {
                window.authCallbacks = {};
            }
            window.authCallbacks[messageId] = { resolve, reject };

            console.log('发送认证消息:', data);

            // 发送消息
            window.gameState.socket.send(JSON.stringify(data));

            // 设置超时
            setTimeout(() => {
                if (window.authCallbacks[messageId]) {
                    console.log('消息超时:', messageId, data);
                    delete window.authCallbacks[messageId];
                    reject(new Error('请求超时'));
                }
            }, 10000);
        });
    }

    handleLoginSuccess(data, messageId = null) {
        this.setLoading(false, 'loginButton');

        // 保存凭据
        const rememberMe = document.getElementById('rememberMe').checked;
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        this.saveCredentials(username, password, rememberMe);

        // 更新游戏状态
        if (window.gameState) {
            window.gameState.playerId = data.id;
            window.gameState.playerName = username;

            // 保存玩家ID
            localStorage.setItem('playerId', data.id);
        }

        this.showSuccess('登录成功！正在进入游戏...');

        // 发送CONNECT消息
        if (window.sendConnectAfterAuth) {
            window.sendConnectAfterAuth(data.id);
        }

        // 隐藏登录界面，显示大厅界面
        setTimeout(() => {
            this.hideAuthInterface();
            this.showLobbyInterface();
        }, 1000);

        // 清理回调
        if (messageId && window.authCallbacks && window.authCallbacks[messageId]) {
            window.authCallbacks[messageId].resolve(data);
            delete window.authCallbacks[messageId];
        }
    }

    handleRegisterSuccess(data, messageId = null) {
        this.setLoading(false, 'registerButton');

        this.showSuccess('注册成功！请登录');

        // 切换到登录表单
        setTimeout(() => {
            this.showLoginForm();

            // 填充登录表单
            const loginUsername = document.getElementById('loginUsername');
            const loginPassword = document.getElementById('loginPassword');
            const registerUsername = document.getElementById('registerUsername');
            const registerPassword = document.getElementById('registerPassword');
            const registerRemember = document.getElementById('registerRememberMe');

            if (loginUsername && registerUsername) {
                loginUsername.value = registerUsername.value;
            }
            if (loginPassword && registerPassword) {
                loginPassword.value = registerPassword.value;
            }
            if (registerRemember && registerRemember.checked) {
                document.getElementById('rememberMe').checked = true;
            }

            // 清空注册表单
            if (registerUsername) registerUsername.value = '';
            if (registerPassword) registerPassword.value = '';
            if (document.getElementById('confirmPassword')) {
                document.getElementById('confirmPassword').value = '';
            }
        }, 1000);

        // 清理回调
        if (messageId && window.authCallbacks && window.authCallbacks[messageId]) {
            window.authCallbacks[messageId].resolve(data);
            delete window.authCallbacks[messageId];
        }
    }

    handleLoginError(message, messageId = null) {
        this.setLoading(false, 'loginButton');
        this.showError(message);

        // 清理回调，传递服务器返回的具体错误消息
        if (messageId && window.authCallbacks && window.authCallbacks[messageId]) {
            window.authCallbacks[messageId].reject(new Error(message));
            delete window.authCallbacks[messageId];
        }
    }

    handleRegisterError(message, messageId = null) {
        this.setLoading(false, 'registerButton');
        this.showError(message);

        // 清理回调
        if (messageId && window.authCallbacks && window.authCallbacks[messageId]) {
            window.authCallbacks[messageId].reject(new Error(message));
            delete window.authCallbacks[messageId];
        }
    }

    handleUsernameCheckResult(data) {
        const input = document.getElementById('registerUsername');
        if (!input) return;

        if (data.available) {
            input.classList.remove('form-validation-error');
            input.classList.add('form-validation-success');
        } else {
            input.classList.remove('form-validation-success');
            input.classList.add('form-validation-error');
            this.showError('用户名已存在');
        }
    }

    hideAuthInterface() {
        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            startScreen.style.display = 'none';
        }
    }

    showAuthInterface() {
        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            startScreen.style.display = 'flex';
        }
        this.showLoginForm();
    }

    showLobbyInterface() {
        const lobbyUI = document.getElementById('lobbyUI');
        const gameCanvas = document.getElementById('gameCanvas');
        const waveBar = document.getElementById('waveBar');

        // 隐藏游戏画布和wave条，显示大厅界面
        if (gameCanvas) {
            gameCanvas.style.display = 'none';
        }

        if (waveBar) {
            waveBar.style.display = 'none';
        }

        if (lobbyUI) {
            lobbyUI.style.display = 'flex';
        } else {
            console.error('找不到lobbyUI元素');
        }

        // 初始化大厅功能（如果存在的话）
        if (window.showLobby) {
            window.showLobby();
        }
    }
}

// 初始化认证管理器
let authManager;

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();

    // 等待WebSocket连接建立后再启用自动登录等功能
    setTimeout(() => {
        if (window.gameState && window.gameState.connected) {
            console.log('WebSocket已连接，认证系统准备就绪');
        } else {
            console.log('等待WebSocket连接建立...');
        }
    }, 100);
});

// 扩展WebSocket消息处理器以支持认证消息
function extendMessageHandler() {
    if (typeof handleServerMessage === 'function') {
        const originalHandleServerMessage = handleServerMessage;

        window.handleServerMessage = function(data) {
            const message = typeof data === 'string' ? JSON.parse(data) : data;

            // 添加调试信息
            // console.log('收到服务器消息:', message.cmd, message);

            // 处理认证相关的消息
            switch(message.cmd) {
                case 'LOGIN_SUCCESS':
                    console.log('处理登录成功消息:', message);
                    // 查找对应的回调
                    if (window.authCallbacks) {
                        for (let messageId in window.authCallbacks) {
                            if (window.authCallbacks[messageId]) {
                                authManager.handleLoginSuccess(message, messageId);
                                return;
                            }
                        }
                    }
                    // 如果没找到回调，直接处理
                    authManager.handleLoginSuccess(message);
                    return;

                case 'REGISTER_SUCCESS':
                    console.log('处理注册成功消息:', message);
                    // 查找对应的回调
                    if (window.authCallbacks) {
                        for (let messageId in window.authCallbacks) {
                            if (window.authCallbacks[messageId]) {
                                authManager.handleRegisterSuccess(message, messageId);
                                return;
                            }
                        }
                    }
                    // 如果没找到回调，直接处理
                    authManager.handleRegisterSuccess(message);
                    return;

                case 'LOGIN_ERROR':
                    console.log('处理登录错误消息:', message);
                    // 查找对应的回调
                    if (window.authCallbacks) {
                        for (let messageId in window.authCallbacks) {
                            if (window.authCallbacks[messageId]) {
                                authManager.handleLoginError(message.message, messageId);
                                return;
                            }
                        }
                    }
                    // 如果没找到回调，直接处理
                    authManager.handleLoginError(message.message);
                    return;

                case 'REGISTER_ERROR':
                    console.log('处理注册错误消息:', message);
                    // 查找对应的回调
                    if (window.authCallbacks) {
                        for (let messageId in window.authCallbacks) {
                            if (window.authCallbacks[messageId]) {
                                authManager.handleRegisterError(message.message, messageId);
                                return;
                            }
                        }
                    }
                    // 如果没找到回调，直接处理
                    authManager.handleRegisterError(message.message);
                    return;

                case 'USERNAME_CHECK_RESULT':
                    console.log('处理用户名检查结果:', message);
                    authManager.handleUsernameCheckResult(message);
                    return;

                case 'USERNAME_CHECK_ERROR':
                    console.log('处理用户名检查错误:', message);
                    authManager.showError(message.message);
                    return;

                case 'CONNECTED':
                    console.log('WebSocket连接成功确认');
                    return;
            }

            // 调用原始的消息处理器
            return originalHandleServerMessage.call(this, data);
        };

        console.log('Enhanced handleServerMessage with authentication support');
    } else {
        console.warn('handleServerMessage function not found');
    }
}

// 扩展消息处理器
extendMessageHandler();