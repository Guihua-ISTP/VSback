const App = {
    allPlans: {},
    currentMode: null, // 记录当前查看的模式
    autoRefreshTimer: null,
    
    init() {
        console.log('Transit Pro Max Initialized');
        
        // 核心搜索
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.search(false); // false = 不是静默刷新，显示Loading
        });
        
        // 智能交换 (Smart Swap)
        const swapBtn = document.getElementById('swapBtn');
        swapBtn.addEventListener('click', () => {
            // 1. 视觉动画
            swapBtn.classList.add('rotating');
            setTimeout(() => swapBtn.classList.remove('rotating'), 300);

            // 2. 数据交换
            const s = document.getElementById('start');
            const e = document.getElementById('end');
            const temp = s.value;
            s.value = e.value;
            e.value = temp;

            // 3. 智能判断：如果两个框都有值，直接搜索！
            if (s.value.trim() && e.value.trim()) {
                console.log('Swap triggered auto-search');
                // 使用静默刷新体验更好，或者快速Loading
                this.search(false); 
            }
        });
        
        // 返回按钮
        document.getElementById('backBtn').addEventListener('click', () => {
            UI.hide('routeDetail');
            UI.show('planSelector');
            this.currentMode = null;
        });

        // 绑定卡片点击
        document.querySelectorAll('.plan-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const mode = parseInt(card.dataset.mode);
                this.showDetail(mode);
            });
        });

        Autocomplete.init('start', 'startSuggestions');
        Autocomplete.init('end', 'endSuggestions');

        // 启动轮询
        this.startPolling();
    },

    // 搜索主函数
    // isSilent: true时不显示大Loading遮罩
    async search(isSilent = false) {
        const start = document.getElementById('start').value;
        const end = document.getElementById('end').value;
        
        if (!start || !end) {
            if (!isSilent) UI.showError('请填写起点和终点');
            return;
        }
        
        if (!isSilent) {
            UI.showLoading();
            UI.hide('planSelector');
            UI.hide('routeDetail');
            UI.hideError();
        }
        
        try {
            const results = await Promise.all([
                API.searchRoute(start, end, 1),
                API.searchRoute(start, end, 2),
                API.searchRoute(start, end, 3)
            ]);
            
            this.allPlans = { 1: results[0], 2: results[1], 3: results[2] };
            
            const hasSuccess = results.some(r => r.success);
            
            if (hasSuccess) {
                // 更新卡片数据
                UI.updatePlanCard(1, this.allPlans[1]);
                UI.updatePlanCard(2, this.allPlans[2]);
                UI.updatePlanCard(3, this.allPlans[3]);
                
                if (!isSilent) {
                    UI.hideLoading();
                    UI.show('planSelector');
                } else {
                    // 如果是静默刷新，且当前正在看详情，需要更新详情页
                    if (this.currentMode) {
                        UI.updateRouteDetail(this.currentMode, this.allPlans[this.currentMode]);
                    }
                }
            } else {
                if (!isSilent) {
                    UI.hideLoading();
                    UI.showError(results[0].message || '未找到合适路线');
                }
            }
            
        } catch (err) {
            console.error(err);
            if (!isSilent) {
                UI.hideLoading();
                UI.showError('服务器连接失败');
            }
        }
    },

    showDetail(mode) {
        if (this.allPlans[mode]) {
            this.currentMode = mode;
            UI.updateRouteDetail(mode, this.allPlans[mode]);
            UI.hide('planSelector');
            UI.show('routeDetail');
        }
    },

    // 轮询机制
    startPolling() {
        if (this.autoRefreshTimer) clearInterval(this.autoRefreshTimer);
        // 每 30 秒静默刷新一次
        this.autoRefreshTimer = setInterval(() => {
            const s = document.getElementById('start').value;
            const e = document.getElementById('end').value;
            if (s && e) {
                console.log('Auto refreshing...');
                this.search(true); // True = Silent Mode
            }
        }, 30000);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());