// ============================================
// 🌓 主题切换 + 3D 视差效果 + 启动动画（优化版）
// ============================================

(function() {
    'use strict';
    
    // --- 1. 启动动画控制（立即执行，避免卡顿） ---
    const splashScreen = document.getElementById('splashScreen');
    
    // 设置最大显示时间 1 秒
    const splashTimeout = setTimeout(() => {
        if (splashScreen) {
            splashScreen.style.display = 'none';
        }
    }, 1000);
    
    // 页面完全加载后也关闭
    window.addEventListener('load', () => {
        clearTimeout(splashTimeout);
        setTimeout(() => {
            if (splashScreen) {
                splashScreen.style.display = 'none';
            }
        }, 500);
    });
    
    // --- 2. 主题切换逻辑 ---
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    if (themeToggle) {
        // 页面加载时恢复主题
        const savedTheme = localStorage.getItem('theme') || 'light';
        html.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
        
        // 点击切换主题
        themeToggle. addEventListener('click', () => {
            const currentTheme = html. getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
            
            // 添加按钮旋转动画
            themeToggle.style.transform = 'rotate(360deg) scale(1.2)';
            setTimeout(() => {
                themeToggle.style.transform = '';
            }, 400);
        });
    }
    
    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon. className = theme === 'dark' 
                ? 'fa-solid fa-sun' 
                : 'fa-solid fa-moon';
        }
    }
    
    // --- 3. 方案卡片 3D 视差效果 ---
    setTimeout(() => {
        const planCards = document.querySelectorAll('. plan-card');
        
        planCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 15;
                const rotateY = (centerX - x) / 15;
                
                card.style. transform = `
                    perspective(1000px) 
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg) 
                    translateY(-8px) 
                    scale(1.03)
                `;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
            });
        });
    }, 100);
    
    // --- 4. 搜索按钮波纹效果 ---
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                width: 100px;
                height: 100px;
                margin-top: -50px;
                margin-left: -50px;
                top: ${e.offsetY}px;
                left: ${e.offsetX}px;
                animation: ripple-effect 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple. remove();
            }, 600);
        });
    }
    
    // 添加波纹动画 CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple-effect {
            from {
                opacity: 1;
                transform: scale(0);
            }
            to {
                opacity: 0;
                transform: scale(2. 5);
            }
        }
    `;
    document.head.appendChild(style);
    
    // --- 5. 输入框聚焦动画 ---
    const inputs = document.querySelectorAll('input[type="text"]');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.01)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
    
    console.log('🎨 Transit Pro 豪华版已加载');
    console.log('✅ 主题切换：已启用');
    console.log('✅ 3D视差：已启用');
    console.log('✅ 启动动画：已优化（1秒自动关闭）');
    
})();