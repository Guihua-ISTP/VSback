# 公交路线规划系统（Web版）

基于C语言核心算法 + Node.js后端 + Web前端的公交路线规划系统。

## 功能特点

- 🚌 支持多种路线规划模式：
  - 最便宜路线（模式1）
  - 最快路线-不考虑等车（模式2）
  - 最快路线-考虑等车（模式3）
- 🔍 智能站点匹配和自动补全
- 📊 详细的换乘信息和路线展示
- 🌐 Web界面友好操作
- ⚡ 毫秒级响应速度

## 快速开始

### 前置要求

- Node.js (推荐 v14+)
- GCC 编译器（用于编译C程序）
- Windows 系统

### 启动步骤

1. 双击运行 `start.bat`
2. 等待自动编译和启动
3. 浏览器访问 `http://localhost:3000`

就这么简单！

## 项目结构

```
├── backend/
│   ├── api/
│   │   └── server.js          # Node.js API服务器
│   ├── c/
│   │   ├── main.c             # C语言核心算法
│   │   ├── main.exe           # 编译后的可执行文件
│   │   ├── bus_data.dat       # 公交数据文件（385站点，14线路）
│   │   ├── build_data.c       # 数据生成程序
│   │   └── output/
│   │       └── bus_source.txt # 数据源文件
│   └── package.json
├── frontend/
│   ├── index.html             # 主页面
│   ├── js/
│   │   └── main.js            # 前端逻辑（含自动补全）
│   └── styles/
│       └── main.css           # 样式文件
├── start.bat                  # 一键启动脚本
├── README.md                  # 本文件
└── 核心技术与算法.md          # 详细技术文档
```

## 技术架构

- **前端**: HTML + CSS + JavaScript (原生)
- **后端**: Node.js + Express
- **核心算法**: C语言（Dijkstra + 状态扩展图）
- **编码处理**: GBK → UTF-8 自动转换（iconv-lite）

详细技术说明请查看：[核心技术与算法.md](核心技术与算法.md)

## 数据说明

- 站点数量：385个
- 线路数量：14条
- 数据来源：常州市新北区公交线路（真实GPS坐标）
- 数据格式：二进制DAT文件（GBK编码）

## 使用说明

### Web界面

1. 输入起点站名称（支持自动补全）
2. 输入终点站名称（支持自动补全）
3. 选择出行偏好（最省钱/最快）
4. 点击"查询路线"
5. 查看详细路线规划结果

### 自定义数据

如果想使用自己的公交数据：

1. 编辑 `backend/c/output/bus_source.txt`
2. 按格式添加线路和站点信息（包含GPS坐标）
3. 编译并运行数据生成程序：
   ```bash
   cd backend/c/output
   gcc build_data.c -o build_data.exe -lm
   build_data.exe
   copy bus_data.dat ..\bus_data.dat
   ```
4. 重启服务器

## API接口

### 路线规划
```
POST /api/route
Content-Type: application/json

{
  "start": "常工院",
  "end": "常州北站",
  "mode": 1
}
```

### 站点搜索
```
GET /api/search-stations?keyword=常州
```

### 健康检查
```
GET /api/health
```

## 常见问题

**Q: 中文显示乱码？**  
A: 确保所有.bat文件是GBK编码。运行start.bat会自动处理编码转换。

**Q: 编译失败？**  
A: 确保已安装GCC编译器（MinGW或TDM-GCC）。

**Q: 找不到站点？**  
A: 系统支持模糊匹配和自动补全，输入站点关键词即可看到建议。

**Q: 时间计算不准确？**  
A: 可以调整速度、停靠时间等参数，详见[核心技术与算法.md](核心技术与算法.md)第三章。

## 开发说明

### 手动编译C程序
```bash
cd backend/c
gcc main.c -o main.exe -lm
```

### 手动启动服务器
```bash
cd backend
npm install
node api/server.js
```

## 技术文档

详细的算法说明、数据结构、性能分析等请查看：
- [核心技术与算法.md](核心技术与算法.md)

## 许可证

MIT License

## 作者

数据结构课程设计项目
