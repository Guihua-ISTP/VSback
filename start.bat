@echo off
chcp 65001 >nul
title 公交路线规划系统

echo ============================================
echo   公交路线规划系统 - 启动中... 
echo ============================================
echo. 

REM ========== 1. 同步前端站点数据 ==========
echo [1/4] 同步站点数据...
node Client\Scripts\generate_stations.js
REM ↑ 去掉 >nul 2>&1，显示完整输出

if errorlevel 1 (
    echo. 
    echo ❌ 错误：站点数据同步失败
    pause
    exit /b 1
)

echo.

REM ========== 2. 生成后端数据 ==========
echo [2/4] 生成后端数据...
cd Data\Source

REM 临时切换到 GBK 避免乱码
chcp 936 >nul
build_data.exe >nul
set BUILD_RESULT=%errorlevel%
chcp 65001 >nul

if %BUILD_RESULT% neq 0 (
    echo. 
    echo ❌ 错误：后端数据生成失败
    cd ..\..
    pause
    exit /b 1
)

if not exist . .\Binary mkdir ..\Binary
copy /Y bus_data.dat . .\Binary\bus_data.dat >nul 2>&1
cd ..\..

REM ========== 3. 启动后端服务 ==========
echo [3/4] 启动后端服务... 

if not exist Server\API\server.js (
    echo.
    echo ❌ 错误：找不到 Server\API\server.js
    pause
    exit /b 1
)

REM 清理端口占用
netstat -ano | findstr ":3000" >nul 2>&1
if not errorlevel 1 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do taskkill /F /PID %%a >nul 2>&1
    timeout /t 1 >nul
)

cd Server\API
start /B node server.js
cd ..\.. 

REM ========== 4. 获取本机IP地址 ==========
echo [4/4] 打开前端页面... 

REM 获取本机IPv4地址（排除虚拟网卡）
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    set IP_TEMP=%%a
    set IP_TEMP=! IP_TEMP:  =!
    echo ! IP_TEMP!  | findstr /R "^192\. 168\.  ^10\.  ^172\." >nul
    if not errorlevel 1 (
        set LOCAL_IP=!IP_TEMP!
        goto :IP_FOUND
    )
)
set LOCAL_IP=127.0.0.1
: IP_FOUND

REM 构造访问URL
set FRONTEND_URL=http://%LOCAL_IP%:3000

REM 等待服务启动
timeout /t 2 >nul

REM 打开浏览器（使用IP地址）
start %FRONTEND_URL%

echo. 
echo ============================================
echo ✅ 启动完成
echo. 
echo    访问地址: %FRONTEND_URL%
echo    本机IP:    %LOCAL_IP%
echo. 
echo 💡 提示: 
echo    - 局域网内其他设备可通过上述地址访问
echo    - 关闭此窗口将停止后端服务
echo ============================================
echo.
pause