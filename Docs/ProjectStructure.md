# 项目结构说明

## 目录结构

```
BusRoutePlanner/
├── Server/                     # 服务端
│   ├── API/                   # API服务
│   │   └── server.js         # Express服务器
│   ├── Core/                  # C语言核心算法
│   │   ├── main.c            # 路线规划算法（核心，不要修改）
│   │   ├── main.exe          # 编译后的可执行文件
│   │   └── build_data.c      # 数据生成程序
│   ├── node_modules/          # Node.js依赖包
│   ├── package.json          # Node.js依赖配置
│   └── package-lock.json
│
├── Client/                     # 客户端
│   ├── Scripts/               # JavaScript模块
│   │   ├── config.js         # 配置文件（API地址、轮询间隔等）
│   │   ├── api.js            # API请求模块
│   │   ├── autocomplete.js   # 自动补全模块
│   │   ├── ui.js             # UI控制模块
│   │   └── app.js            # 主应用逻辑
│   ├── Styles/
│   │   └── main.css          # 样式文件
│   └── index.html            # 主页面
│
├── Data/                       # 数据文件
│   ├── Binary/                # 二进制数据
│   │   └── bus_data.dat      # 二进制数据文件（GBK编码）
│   └── Source/                # 数据源
│       ├── bus_source.txt    # 文本数据源（可编辑）
│       ├── build_data.exe    # 数据生成工具
│       └── bus_data.dat      # 生成的数据文件
│
├── Docs/                       # 文档
│   ├── README.md             # 项目说明
│   ├── CoreTechnology.md     # 核心技术与算法
│   └── ProjectStructure.md   # 本文件
│
└── Start.bat                   # 一键启动脚本
```

## 模块说明

### 服务端模块

#### 1. API服务 (`Server/API/server.js`)
- **功能**：提供HTTP API接口
- **端口**：3000
- **主要接口**：
  - `POST /api/route` - 路线规划
  - `GET /api/search-stations` - 站点搜索
  - `GET /api/health` - 健康检查

#### 2. C语言核心 (`Server/Core/`)
- **main.c**：核心算法实现（Dijkstra + 状态扩展图）
  - ⚠️ **重要**：此文件较为脆弱，不建议修改
  - 后期会进行专门优化
- **build_data.c**：数据生成工具
  - 将文本数据转换为二进制格式
  - 处理经纬度转换

### 客户端模块

#### 1. 配置模块 (`config.js`)
```javascript
- API_BASE: API服务器地址
- AUTO_REFRESH_INTERVAL: 自动刷新间隔（30秒）
- DEBOUNCE_DELAY: 自动补全延迟（300ms）
```

#### 2. API模块 (`api.js`)
```javascript
- searchRoute(start, end, mode): 搜索路线
- searchStations(keyword): 搜索站点
- healthCheck(): 健康检查
```

#### 3. 自动补全模块 (`autocomplete.js`)
```javascript
- init(inputId, suggestionsId): 初始化自动补全
- displaySuggestions(): 显示建议列表
- 键盘导航支持（上下箭头、回车）
```

#### 4. UI模块 (`ui.js`)
```javascript
- show/hide: 显示/隐藏元素
- showLoading/hideLoading: 加载状态
- updatePlanCard(): 更新方案卡片
- updateRouteDetail(): 更新路线详情
```

#### 5. 主应用模块 (`app.js`)
```javascript
- init(): 初始化应用
- searchAllRoutes(): 搜索所有方案
- swapLocations(): 交换起点终点
- startAutoRefresh(): 启动自动刷新（30秒轮询）
- stopAutoRefresh(): 停止自动刷新
```

## 数据流

```
用户输入
  ↓
客户端 (app.js)
  ↓
API模块 (api.js)
  ↓
HTTP请求
  ↓
Node.js服务器 (server.js)
  ↓
调用C程序 (main.exe)
  ↓
读取数据 (Data/Binary/bus_data.dat)
  ↓
计算路线
  ↓
返回JSON结果
  ↓
客户端显示 (ui.js)
```

## 自动刷新机制

- **触发条件**：搜索成功后自动启动
- **刷新间隔**：30秒
- **停止条件**：
  - 用户修改起点或终点
  - 搜索失败
  - 网络错误
- **刷新方式**：静默刷新（不显示加载动画）

## 开发指南

### 修改配置
编辑 `Client/Scripts/config.js`：
```javascript
const CONFIG = {
    API_BASE: 'http://localhost:3000/api',  // 修改API地址
    AUTO_REFRESH_INTERVAL: 30000,           // 修改刷新间隔
};
```

### 添加新功能
1. 在对应模块文件中添加函数
2. 在 `app.js` 中调用
3. 在 `ui.js` 中添加UI更新逻辑

### 修改数据
1. 编辑 `Data/Source/bus_source.txt`
2. 运行 `build_data.exe` 生成新数据
3. 复制 `bus_data.dat` 到 `Data/Binary/`
4. 重启服务器

### 调试
- 打开浏览器开发者工具（F12）
- 查看Console标签页的日志输出
- 查看Network标签页的网络请求

## 注意事项

1. **C程序核心算法**：
   - `Server/Core/main.c` 较为脆弱
   - 不建议修改，后期会专门优化
   - 如需修改，请先备份

2. **编码问题**：
   - 所有 `.bat` 文件必须是 GBK 编码
   - 数据文件 `Data/Binary/bus_data.dat` 是 GBK 编码
   - 客户端使用 UTF-8 编码
   - Node.js 使用 `iconv-lite` 进行编码转换

3. **模块化**：
   - 客户端已模块化，便于维护
   - 各模块职责清晰，互不干扰
   - 修改时只需关注对应模块

4. **性能优化**：
   - 自动补全使用防抖（300ms）
   - 并发请求三个方案
   - 静默刷新不影响用户体验

## 未来优化方向

1. **C程序优化**：
   - 重构算法代码
   - 提高计算精度
   - 优化时间计算

2. **功能扩展**：
   - 添加地图显示
   - 支持实时公交信息
   - 添加收藏功能

3. **性能提升**：
   - 使用WebSocket替代轮询
   - 添加缓存机制
   - 优化数据结构
