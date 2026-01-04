const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const cors = require('cors');
const iconv = require('iconv-lite');
const fs = require('fs');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../Client')));

// C程序路径
const C_PROGRAM = path.join(__dirname, '../Core/main.exe');
const DATA_FILE = 'Data\\Binary\\bus_data.dat'; // 相对于项目根目录a
const PROJECT_ROOT = path.join(__dirname, '../..');

// 路线规划API
app.post('/api/route', (req, res) => {
    const { start, end, mode } = req.body;
    
    // 参数验证
    if (!start || !end || !mode) {
        return res.status(400).json({
            success: false,
            message: '缺少必要参数：start, end, mode'
        });
    }
    
    if (![1, 2, 3].includes(parseInt(mode))) {
        return res.status(400).json({
            success: false,
            message: '模式无效：必须是1(最便宜)、2(最快不等车)或3(最快等车)'
        });
    }
    
    // 使用Node.js包装脚本调用C程序（使用绝对路径）
    const wrapperScript = path.resolve(__dirname, '../Core/run_query.js');
    const child = spawn('node', [wrapperScript, start, end, mode.toString(), DATA_FILE], {
        windowsHide: true
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
        stdout += data.toString('utf8');
    });
    
    child.stderr.on('data', (data) => {
        stderr += data.toString('utf8');
    });
    
    child.on('close', (code) => {
        if (code !== 0) {
            console.error('查询失败:', stderr || stdout);
            return res.status(500).json({
                success: false,
                message: '服务器内部错误'
            });
        }
        
        try {
            const result = JSON.parse(stdout);
            res.json(result);
        } catch (e) {
            console.error('JSON解析错误:', e);
            console.error('输出:', stdout);
            res.status(500).json({
                success: false,
                message: '结果解析失败'
            });
        }
    });
    
    child.on('error', (error) => {
        console.error('启动包装脚本失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    });
});

// 站点搜索API（用于自动补全）
app.get('/api/search-stations', (req, res) => {
    const keyword = req.query.keyword || '';
    
    if (!keyword) {
        return res.json({ success: true, stations: [] });
    }
    
    // 使用Node.js包装脚本调用C程序（使用绝对路径）
    const wrapperScript = path.resolve(__dirname, '../Core/run_query.js');
    const child = spawn('node', [wrapperScript, keyword, keyword, '1', DATA_FILE], {
        windowsHide: true
    });
    
    let stdout = '';
    
    child.stdout.on('data', (data) => {
        stdout += data.toString('utf8');
    });
    
    child.on('close', (code) => {
        try {
            const result = JSON.parse(stdout);
            
            if (result.matches) {
                res.json({ success: true, stations: result.matches });
            } else {
                res.json({ success: true, stations: [] });
            }
        } catch (e) {
            res.json({ success: true, stations: [] });
        }
    });
    
    child.on('error', (error) => {
        res.json({ success: true, stations: [] });
    });
});

// 获取所有站点列表
app.get('/api/stations', (req, res) => {
    // 这里可以从数据文件读取所有站点
    // 暂时返回示例数据
    res.json({
        success: true,
        stations: []
    });
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`局域网访问: http://<你的IP>:${PORT}`);
    console.log(`公网访问: http://<公网IP>:${PORT}`);
});
