const fs = require('fs');
const path = require('path');

// 加载 iconv-lite
let iconv;
try {
    iconv = require(path.join(__dirname, '../../Server/node_modules/iconv-lite'));
} catch (e) {
    try {
        iconv = require('iconv-lite');
    } catch (e2) {
        console.error('❌ 找不到 iconv-lite');
        process.exit(1);
    }
}

const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.join(SCRIPT_DIR, '../..');
const SOURCE_FILE = path.join(PROJECT_ROOT, 'Data/Source/bus_source.txt');
const OUTPUT_FILE = path.join(SCRIPT_DIR, 'stations.js');

function main() {
    console.log('='. repeat(60));
    console.log('🚀 站点数据生成工具');
    console.log('='.repeat(60));
    
    // ========== 调试信息：显示完整路径 ==========
    console. log(`📂 工作目录: ${process.cwd()}`);
    console.log(`📖 读取:  ${SOURCE_FILE}`);
    console.log(`📝 输出: ${OUTPUT_FILE}`);
    console.log('');
    
    // ========== 1. 检查文件是否存在 ==========
    if (!fs.existsSync(SOURCE_FILE)) {
        console.error(`❌ 文件不存在: ${SOURCE_FILE}`);
        process.exit(1);
    }
    
    // ========== 2. 读取文件 ==========
    console.log('[1/4] 读取 bus_source.txt...');
    let content;
    try {
        const buffer = fs.readFileSync(SOURCE_FILE);
        content = iconv.decode(buffer, 'gbk');
        console.log(`      ✓ 读取成功，文件大小: ${buffer.length} 字节`);
    } catch (error) {
        console.error(`❌ 读取失败:  ${error.message}`);
        process.exit(1);
    }
    
    // ========== 3. 提取站点（带详细日志） ==========
    console. log('[2/4] 提取站点...');
    const stationSet = new Set();
    const lineSet = new Set();
    const lines = content.split('\n');
    
    let lineCount = 0;
    let stopCount = 0;
    
    // ========== 调试：打印前5个 STOP 行 ==========
    let debugStopCount = 0;
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // 匹配 LINE: 
        if (/^LINE:/i.test(trimmed)) {
            lineCount++;
            const parts = trimmed.replace(/^LINE:\s*/i, '').split(',');
            if (parts[0]) {
                lineSet.add(parts[0]. trim());
            }
        }
        
        // 匹配 STOP:
        if (/^STOP:/i.test(trimmed)) {
            stopCount++;
            const content = trimmed.replace(/^STOP:\s*/i, '').trim();
            const parts = content.split(',');
            
            // ========== 调试：打印前5个站点 ==========
            if (debugStopCount < 5) {
                console.log(`      [调试] STOP ${stopCount}:  "${parts[1]?. trim()}"`);
                debugStopCount++;
            }
            
            if (parts. length >= 4) {
                const name = parts[1].trim();
                if (name) {
                    stationSet.add(name);
                }
            }
        }
    }
    
    console.log(`      ✓ 识别到 ${lineCount} 个 LINE 行`);
    console.log(`      ✓ 识别到 ${stopCount} 个 STOP 行`);
    
    // ========== 4. 生成数组 ==========
    console.log('[3/4] 生成数组...');
    const stations = Array.from(stationSet).sort();
    
    console.log(`      - 线路: ${lineSet.size} 条`);
    console.log(`      - 站点: ${stations.length} 个（去重后）`);
    
    // ========== 调试：打印包含"吕"的站点 ==========
    const luStations = stations.filter(s => s.includes('吕'));
    console.log(`      - 包含"吕"的站点: ${luStations.join(', ')}`);
    
    // ========== 5. 生成 JS 文件 ==========
    console. log('[4/4] 写入文件...');
    
    const timestamp = new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai'
    });
    
    // 每行5个站点
    const stationLines = [];
    for (let i = 0; i < stations.length; i += 5) {
        const chunk = stations.slice(i, i + 5);
        stationLines.push('    ' + chunk.map(s => `"${s}"`).join(', '));
    }
    
    const jsContent = `// ============================================
// 自动生成 - 请勿手动编辑
// ============================================
// 生成时间: ${timestamp}
// 数据源: Data/Source/bus_source.txt
// 线路: ${lineSet.size} 条
// 站点:  ${stations.length} 个
// ============================================

const STATION_DATA = [
${stationLines.join(',\n')}
];

window.STATIONS_DB = STATION_DATA;
console.log(\`✅ 已加载 \${STATION_DATA.length} 个站点\`);
`;
    
    // ========== 6. 强制覆盖写入 ==========
    try {
        // 先删除
        if (fs.existsSync(OUTPUT_FILE)) {
            fs.unlinkSync(OUTPUT_FILE);
            console.log('      ✓ 已删除旧文件');
        }
        
        // 再写入
        fs.writeFileSync(OUTPUT_FILE, jsContent, {
            encoding: 'utf8',
            flag: 'w'
        });
        
        console.log('      ✓ 新文件已生成');
        
        // ========== 验证写入 ==========
        const written = fs.readFileSync(OUTPUT_FILE, 'utf8');
        const writtenLu = written.match(/"[^"]*吕[^"]*"/g) || [];
        console.log(`      ✓ 验证：文件中包含"吕"的站点:  ${writtenLu.join(', ')}`);
        
    } catch (error) {
        console.error(`❌ 写入失败: ${error.message}`);
        process.exit(1);
    }
    
    console.log('');
    console.log('='. repeat(60));
    console.log('✅ 完成！');
    console.log('='.repeat(60));
}

if (require.main === module) {
    main();
}