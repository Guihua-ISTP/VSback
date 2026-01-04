const UI = {
    show(id) {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = id === 'planSelector' ? 'grid' : 'block';
        }
    },
    
    hide(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    },
    
    showLoading() { this.show('loading'); },
    hideLoading() { this.hide('loading'); },
    
    updatePlanCard(mode, data) {
        const card = document.querySelector(`.plan-card[data-mode="${mode}"]`);
        if (!card) return;
        
        const mainStat = card.querySelector('.main-stat');
        const subStat = card.querySelector('.sub-stat');
        
        if (data && data.success) {
            card.style.display = 'flex'; 
            if (mode === 1) {
                mainStat.textContent = `¥${data.totalCost}`;
                subStat.textContent = `${data.transfers} 次换乘`;
            } else {
                mainStat.textContent = `${Math.round(data.totalTime)} 分钟`;
                subStat.textContent = `${data.transfers} 次换乘`;
            }
            card.classList.remove('active');
        } else {
            card.style.display = 'none';
        }
    },
    
    updateRouteDetail(mode, data) {
        const titleEl = document.getElementById('detailTitle');
        const subEl = document.getElementById('detailSubInfo');
        const contentEl = document.getElementById('detailContent');
        
        const modeNames = {1: '省钱方案', 2: '最快方案', 3: '综合推荐'};
        titleEl.textContent = modeNames[mode];
        
        const costStr = mode === 1 ? `${data.totalCost}元` : `${Math.round(data.totalTime)}分钟`;
        subEl.innerHTML = `<span style="color:var(--primary-blue);font-weight:700">${costStr}</span> · 全程换乘 ${data.transfers} 次`;
        
        let html = '';
        
        data.segments.forEach((seg, idx) => {
            const isLastSeg = idx === data.segments.length - 1;
            
            html += `
                <div class="route-segment">
                    <div class="segment-header">
                        <div class="segment-dot"></div>
                        <div class="segment-badge">${seg.line}路</div>
                    </div>
                    
                    <div class="station-list">
            `;
            
            // 1. 起点
            html += `<div class="station-item start-node">${seg.stations[0]}</div>`;
            
            // 2. 中间站点（超过3站则折叠）
            const midStations = seg.stations.slice(1, -1);
            if (midStations.length > 0) {
                if (midStations.length > 3) {
                    // 折叠逻辑：按钮调用 UI.toggleStations(this)
                    html += `
                        <div class="toggle-btn" onclick="UI.toggleStations(this)">
                            <i class="fa-solid fa-angle-down"></i>
                            <span>经过 ${midStations.length} 站 (点击展开)</span>
                        </div>
                        <div class="hidden-stations" style="display:none; flex-direction:column; gap:1rem; margin-top:0.5rem; margin-bottom:0.5rem; padding-left:10px; border-left:1px dashed #CBD5E1;">
                            ${midStations.map(s => `<div class="station-item" style="font-size:1rem; color:#64748B">${s}</div>`).join('')}
                        </div>
                    `;
                } else {
                    midStations.forEach(s => {
                        html += `<div class="station-item" style="color:#64748B">${s}</div>`;
                    });
                }
            }
            
            // 3. 终点
            html += `<div class="station-item end-node">${seg.stations[seg.stations.length - 1]}</div>`;
            
            html += `</div>`; // End station-list
            
            // 4. 换乘
            if (!isLastSeg) {
                html += `
                    <div class="transfer-block">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 11l5-5 5 5M7 13l5 5 5-5"/></svg>
                        <span>在此站下车换乘</span>
                    </div>
                `;
            }
            
            html += `</div>`;
        });
        
        contentEl.innerHTML = html;
        
        document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('active'));
        document.querySelector(`.plan-card[data-mode="${mode}"]`)?.classList.add('active');
    },
    
    // --- 新增：折叠/展开逻辑 ---
    toggleStations(btn) {
        // 找到紧跟在按钮后面的列表容器
        const list = btn.nextElementSibling;
        const icon = btn.querySelector('i');
        const textSpan = btn.querySelector('span');
        
        // 提取原有的站点数量数字，保留它
        const countMatch = textSpan.textContent.match(/\d+/);
        const count = countMatch ? countMatch[0] : '';
        
        if (list.style.display === 'none') {
            // 展开
            list.style.display = 'flex';
            icon.className = 'fa-solid fa-angle-up';
            textSpan.textContent = `收起站点`;
        } else {
            // 收起
            list.style.display = 'none';
            icon.className = 'fa-solid fa-angle-down';
            textSpan.textContent = `经过 ${count} 站 (点击展开)`;
        }
    },
    
    showError(msg) {
        document.getElementById('errorMessage').textContent = msg;
        this.show('error');
    },
    hideError() { this.hide('error'); }
};