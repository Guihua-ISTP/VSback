// API 请求模块
const API = {
    // 搜索路线
    async searchRoute(start, end, mode) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/route`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start, end, mode })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`模式${mode}请求失败:`, error);
            return { success: false, message: '请求失败: ' + error.message };
        }
    },
    
    // 搜索站点（自动补全）
    async searchStations(keyword) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/search-stations?keyword=${encodeURIComponent(keyword)}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取建议失败:', error);
            return { success: false, stations: [] };
        }
    },
    
    // 健康检查
    async healthCheck() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/health`);
            return await response.json();
        } catch (error) {
            return { status: 'error' };
        }
    }
};
