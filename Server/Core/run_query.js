// Node.js包装脚本，用于调用C程序并处理中文编码
const { spawn } = require('child_process');
const path = require('path');
// iconv-lite在Server/node_modules中
const iconv = require(path.join(__dirname, '../node_modules/iconv-lite'));

// 从命令行参数获取输入
const [,, start, end, mode, dataFile] = process.argv;

if (!start || !end || !mode || !dataFile) {
    console.error(JSON.stringify({
        success: false,
        message: '参数不足'
    }));
    process.exit(1);
}

// C程序路径（绝对路径）
const C_PROGRAM = path.join(__dirname, 'main.exe');
// 项目根目录（从当前脚本位置向上两级）
const PROJECT_ROOT = path.join(__dirname, '../..');
// 数据文件绝对路径
const DATA_FILE_ABS = path.join(PROJECT_ROOT, dataFile);

// 调用C程序，使用绝对路径
const child = spawn(C_PROGRAM, [start, end, mode, DATA_FILE_ABS], {
    cwd: PROJECT_ROOT,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = Buffer.alloc(0);
let stderr = Buffer.alloc(0);

child.stdout.on('data', (data) => {
    stdout = Buffer.concat([stdout, data]);
});

child.stderr.on('data', (data) => {
    stderr = Buffer.concat([stderr, data]);
});

child.on('close', (code) => {
    if (code !== 0) {
        const errorMsg = iconv.decode(stderr, 'gbk') || iconv.decode(stdout, 'gbk');
        console.error(JSON.stringify({
            success: false,
            message: '查询失败',
            error: errorMsg
        }));
        process.exit(1);
    }
    
    // 输出结果（GBK转UTF-8）
    const output = iconv.decode(stdout, 'gbk');
    console.log(output);
});

child.on('error', (error) => {
    console.error(JSON.stringify({
        success: false,
        message: '程序启动失败: ' + error.message
    }));
    process.exit(1);
});
