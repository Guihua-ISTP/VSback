// 配置文件
const CONFIG = {
    // 自动使用当前访问的主机地址（支持localhost、局域网IP、公网IP）
    API_BASE: `${window.location.protocol}//${window.location.hostname}:3000/api`,
    AUTO_REFRESH_INTERVAL: 30000, // 30秒
    DEBOUNCE_DELAY: 300, // 自动补全延迟
};

console.log('API地址:', CONFIG.API_BASE); // 调试信息
