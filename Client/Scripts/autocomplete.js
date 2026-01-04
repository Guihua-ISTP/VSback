// 自动补全模块 - 极速本地版
const Autocomplete = {
    currentFocus: -1,
    
    init(inputId, suggestionsId) {
        const input = document.getElementById(inputId);
        const suggestionsDiv = document.getElementById(suggestionsId);
        
        // 监听输入
        input.addEventListener('input', () => {
            const keyword = input.value.trim().toLowerCase();
            this.closeAllLists();
            
            if (!keyword) return;
            
            // 使用本地数据进行过滤
            // 确保 window.STATIONS_DB 已在 stations.js 中加载
            const db = window.STATIONS_DB || [];
            
            // 模糊匹配逻辑：只要包含关键词即可
            const matches = db.filter(station => 
                station.toLowerCase().includes(keyword)
            ).slice(0, 8); // 只显示前8个，保持界面整洁
            
            if (matches.length > 0) {
                this.displaySuggestions(matches, suggestionsDiv, input);
            }
        });
        
        // 键盘导航
        input.addEventListener('keydown', (e) => {
            const items = suggestionsDiv.getElementsByClassName('suggestion-item');
            if (e.key === 'ArrowDown') {
                this.currentFocus++;
                this.addActive(items);
            } else if (e.key === 'ArrowUp') {
                this.currentFocus--;
                this.addActive(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (this.currentFocus > -1 && items[this.currentFocus]) {
                    items[this.currentFocus].click();
                }
            }
        });
        
        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (e.target !== input) {
                this.closeAllLists();
            }
        });
    },
    
    displaySuggestions(stations, div, input) {
        div.innerHTML = '';
        div.classList.add('active');
        
        stations.forEach(station => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            // 高亮匹配文字（可选优化）
            item.textContent = station;
            
            item.addEventListener('click', () => {
                input.value = station;
                this.closeAllLists();
            });
            
            div.appendChild(item);
        });
    },
    
    addActive(items) {
        if (!items) return;
        this.removeActive(items);
        if (this.currentFocus >= items.length) this.currentFocus = 0;
        if (this.currentFocus < 0) this.currentFocus = items.length - 1;
        items[this.currentFocus].classList.add('selected');
        items[this.currentFocus].scrollIntoView({ block: 'nearest' });
    },
    
    removeActive(items) {
        for (let item of items) item.classList.remove('selected');
    },
    
    closeAllLists() {
        document.querySelectorAll('.suggestions-panel').forEach(el => {
            el.innerHTML = '';
            el.classList.remove('active');
        });
        this.currentFocus = -1;
    }
};