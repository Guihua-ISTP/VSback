// check_sync.js - 检测前后端站点数据是否同步
// 位置: Client/Scripts/check_sync.js
// 运行方式: node Client/Scripts/check_sync.js

const fs = require('fs');
const path = require('path');

// 尝试加载 iconv-lite
let iconv;
try {
    iconv = require(path.join(__dirname, '../../Server/node_modules/iconv-lite'));
} catch (e) {
    try {
        iconv = require('iconv-lite');
    } catch (e2) {
        console.error('❌ 错误：找不到 iconv-lite 模块');
        process.exit(1);
    }
}

// ==================== 配置路径（使用相对路径） ====================
const SCRIPT_DIR = __dirname;  // Client/Scripts
const PROJECT_ROOT = path.join(SCRIPT_DIR, '../..');
const SOURCE_FILE = path.join(PROJECT_ROOT, 'Data/Source/bus_source.txt');
const JS_FILE = path.join(SCRIPT_DIR, 'stations. js');

console.log('🔍 数据同步检查工具');
console.log('='.repeat(60));

// 1. 从 bus_source.txt 提取站点
console.log('[1/2] 读取后端数据源 (bus_source.txt)...');
if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`      ❌ 找不到文件: ${SOURCE_FILE}`);
    process.exit(1);
}

const sourceBuffer = fs.readFileSync(SOURCE_FILE);
const sourceContent = iconv.decode(sourceBuffer, 'gbk');
const sourceStations = new Set();

sourceContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('STOP:')) {
        const parts = trimmed.substring(5).split(',');
        if (parts.length >= 4) {
            const name = parts[1].trim();
            if (name) sourceStations.add(name);
        }
    }
});

console.log(`      ✓ 提取到 ${sourceStations.size} 个站点`);

// 2. 从 stations.js 提取站点
console.log('[2/2] 读取前端数据 (stations.js)...');
if (!fs.existsSync(JS_FILE)) {
    console.error(`      ❌ 找不到文件: ${JS_FILE}`);
    console.error('      请运行: node Client/Scripts/generate_stations.js');
    process.exit(1);
}

const jsContent = fs.readFileSync(JS_FILE, 'utf8');
const match = jsContent.match(/STATION_DATA\s*=\s*\[([\s\S]*?)\];/);

if (! match) {
    console.error('      ❌ 无法解析 stations.js 格式');
    process.exit(1);
}

const jsStations = new Set();
const stationMatches = match[1].match(/"([^"]+)"/g);
if (stationMatches) {
    stationMatches.forEach(s => {
        jsStations.add(s. slice(1, -1)); // 去掉引号
    });
}

console.log(`      ✓ 提取到 ${jsStations.size} 个站点`);
console.log('');

// 3. 对比差异
const onlyInSource = [... sourceStations].filter(s => !jsStations.has(s));
const onlyInJs = [...jsStations].filter(s => ! sourceStations.has(s));

console.log('='.repeat(60));

if (onlyInSource.length === 0 && onlyInJs.length === 0) {
    console.log('✅ 数据同步正常！');
    console.log(`   前后端站点数量一致: ${sourceStations.size} 个`);
    console.log('='.repeat(60));
    process.exit(0);
} else {
    console.log('⚠️ 数据不同步！');
    console.log('');
    
    if (onlyInSource. length > 0) {
        console.log(`❌ 后端有 ${onlyInSource.length} 个站点未同步到前端:`);
        onlyInSource.slice(0, 10).forEach(s => console.log(`   - ${s}`));
        if (onlyInSource.length > 10) {
            console.log(`   ... 还有 ${onlyInSource. length - 10} 个`);
        }
        console.log('');
    }
    
    if (onlyInJs.length > 0) {
        console.log(`❌ 前端有 ${onlyInJs.length} 个站点在后端不存在:`);
        onlyInJs.slice(0, 10).forEach(s => console. log(`   - ${s}`));
        if (onlyInJs.length > 10) {
            console.log(`   ... 还有 ${onlyInJs.length - 10} 个`);
        }
        console.log('');
    }
    
    console.log('🔧 解决方法: ');
    console.log('   运行:  node Client/Scripts/generate_stations.js');
    console.log('='.repeat(60));
    process.exit(1);
}