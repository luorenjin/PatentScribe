# PatentMate 环境安装教程（面向非开发同事）

## 1. 先判断你需不需要安装这些环境

不是所有接手人员都需要安装开发环境。

请先按下面三种情况判断：

### 情况 A：你只是正常使用软件

只需要做这些事：

- 安装程序
- 配置百炼 API Key
- 申请并导入授权码

这类情况 **不需要** 安装 Node.js、Yarn、Rust、Visual Studio Build Tools。

### 情况 B：你要修改设置、切换模型、生成授权码

如果只是：

- 在软件里切换到 `qwen`
- 填写自己的阿里百炼 API Key
- 使用已经构建好的 `keygen.exe` 生成授权码

通常也 **不需要完整开发环境**。

但要注意：

- 如果你手里没有现成的 `keygen.exe`，而只有源码，那就需要安装 Rust 环境来重新构建

### 情况 C：你要重新打包、重新构建、修改代码

只有在下面这些情况下，才需要完整安装开发环境：

- 重新打包安装包
- 修改源码
- 重新生成 `keygen.exe`
- 更新依赖
- 修复构建失败

如果你属于情况 C，请继续往下看。

## 2. 本项目重新构建所需环境

Windows 下重新构建本项目，建议按下面顺序安装：

1. Microsoft Visual Studio C++ Build Tools
2. Microsoft Edge WebView2 Runtime（多数 Win10/Win11 已自带）
3. Rust
4. Node.js
5. Yarn

本项目是 `React + Vite + Tauri` 桌面程序，所以：

- 前端部分依赖 `Node.js + Yarn`
- 桌面端部分依赖 `Rust + MSVC 工具链`
- Windows 构建 Tauri 依赖 `Microsoft C++ Build Tools`

## 3. 安装前准备

开始安装前，建议先准备：

- 一台 Windows 10 或 Windows 11 电脑
- 管理员权限
- 稳定网络
- 20GB 左右可用磁盘空间

如果电脑被企业安全策略严格限制，还应提前确认：

- 是否允许安装 Visual Studio Build Tools
- 是否允许安装 Rust
- 是否允许从官方站点下载安装程序

## 4. 安装 Visual Studio C++ Build Tools

根据 Tauri 官方文档，Windows 开发需要：

- Microsoft C++ Build Tools
- 安装时勾选 `Desktop development with C++`

官方参考：

- Tauri Prerequisites  
  https://v2.tauri.app/start/prerequisites/

### 4.1 下载

打开微软官方下载页，下载 C++ Build Tools 安装器：

- https://visualstudio.microsoft.com/visual-cpp-build-tools/

### 4.2 安装步骤

1. 双击打开安装器
2. 等待安装器加载完成
3. 在工作负载列表中勾选：
   - `Desktop development with C++`
4. 保持默认安装路径即可
5. 点击安装
6. 安装完成后重启电脑

### 4.3 安装后检查

如果后续 Rust 或 Tauri 构建时报 MSVC、linker、cl.exe 相关错误，优先怀疑这里没装好。

## 5. 检查 WebView2 Runtime

Tauri 官方说明中提到，Windows 下开发依赖 `Microsoft Edge WebView2`。  
不过从 Windows 10 1803 起，大部分系统已自带。

官方参考：

- Tauri Windows prerequisites  
  https://v2.tauri.app/start/prerequisites/

### 5.1 先判断是否需要安装

如果你使用的是：

- Windows 10
- Windows 11

大概率已经有了，可以先不单独安装。

### 5.2 如果运行时报 WebView2 缺失

再去微软官方下载并安装：

- https://developer.microsoft.com/microsoft-edge/webview2/

建议安装：

- `Evergreen Bootstrapper`

## 6. 安装 Rust

Rust 是 Tauri 后端和授权工具 `keygen` 的构建基础。

官方参考：

- Rust 安装页  
  https://www.rust-lang.org/tools/install

Tauri 官方也建议在 Windows 下使用 `MSVC` 工具链。

### 6.1 下载

打开 Rust 官方安装页，下载：

- `rustup-init.exe (x64)`  

如果你的电脑是常规 64 位 Windows，通常选这个。

### 6.2 安装步骤

1. 双击运行 `rustup-init.exe`
2. 如果弹出提示，允许程序运行
3. 保持默认安装选项
4. 确认默认工具链是 `stable-msvc`
5. 完成安装
6. 关闭并重新打开 PowerShell

### 6.3 验证安装

打开 PowerShell，依次执行：

```powershell
rustc --version
cargo --version
rustup --version
```

如果都能看到版本号，说明 Rust 安装成功。

### 6.4 如果命令提示找不到 rustc/cargo

通常是环境变量未刷新。

按下面顺序处理：

1. 关闭 PowerShell
2. 重新打开 PowerShell
3. 如果还不行，重启电脑
4. 再不行，检查下面目录是否存在：

```text
%USERPROFILE%\.cargo\bin
```

如果目录存在但命令仍不可用，说明 PATH 未正确生效。

## 7. 安装 Node.js

本项目的前端构建依赖 Node.js。

Tauri 官方建议安装 Node.js LTS。  
Node.js 官网下载页会明确标注当前的 `LTS` 版本，请优先选择它，不要选 `Current`。

官方参考：

- Node.js 下载页  
  https://nodejs.org/en/download

### 7.1 下载

打开官网，下载：

- `LTS` 版本

不要选：

- `Current`
- 已过期版本

### 7.2 安装步骤

1. 双击 Node.js 安装包
2. 一路点 `Next`
3. 保持默认安装路径
4. 安装完成后关闭安装器
5. 重新打开 PowerShell

### 7.3 验证安装

在 PowerShell 中执行：

```powershell
node -v
npm -v
```

如果都能看到版本号，说明 Node.js 安装成功。

## 8. 安装 Yarn

本项目仓库使用的是 `yarn.lock`，日常命令也是 `yarn`。

虽然 Yarn 官方现在推荐使用 `Corepack` 管理 Yarn 版本，但对这个仓库来说，为了减少非开发同事踩坑，建议直接安装 **Yarn Classic 1.x**。

原因很简单：

- 这个仓库没有配置 Yarn Berry 的完整项目元数据
- 直接装最新 Yarn 4，非开发同事遇到兼容问题时很难排查
- 用 `Yarn 1.22.x` 更接近当前仓库习惯

### 8.1 推荐安装方式

在 PowerShell 中执行：

```powershell
npm install -g yarn@1.22.22
```

### 8.2 验证安装

执行：

```powershell
yarn -v
```

看到类似下面的结果即可：

```text
1.22.22
```

### 8.3 如果你已经装过 Corepack 或新版本 Yarn

如果执行 `yarn -v` 显示的是 3.x 或 4.x，不建议直接用于这个仓库的首次接手。

优先处理方式：

```powershell
npm install -g yarn@1.22.22
```

## 9. 可选但强烈建议安装的工具

下面这些不是必须，但会大幅降低接手难度。

### 9.1 Visual Studio Code

下载地址：

- https://code.visualstudio.com/

作用：

- 看源码
- 搜索文件
- 运行终端命令
- 编辑 `.env`

### 9.2 Git

如果你要拉代码、切换分支、备份修改，建议安装：

- https://git-scm.com/download/win

如果只是拿到现成项目目录、只负责本地打包，不装 Git 也可以。

## 10. 环境安装完成后的第一次操作

全部装完后，建议按下面顺序检查：

### 10.1 打开 PowerShell

进入项目目录，例如：

```powershell
cd D:\Workspace\PatentScribe
```

### 10.2 验证基础命令

```powershell
node -v
npm -v
yarn -v
rustc --version
cargo --version
```

### 10.3 安装前端依赖

```powershell
yarn
```

如果依赖安装成功，再继续下面操作。

### 10.4 运行前端调试

```powershell
yarn dev
```

看到本地地址后，说明前端基本正常。

### 10.5 运行桌面调试

```powershell
yarn tauri dev
```

如果桌面窗口能正常打开，说明核心环境安装成功。

## 11. 常见问题排查

## 11.1 `cargo` 找不到

优先处理：

1. 重开 PowerShell
2. 重启电脑
3. 检查 `%USERPROFILE%\.cargo\bin` 是否在 PATH

## 11.2 `yarn` 找不到

重新执行：

```powershell
npm install -g yarn@1.22.22
```

## 11.3 `yarn tauri dev` 报 C++ 编译错误

优先检查：

- Visual Studio C++ Build Tools 是否安装
- 是否勾选 `Desktop development with C++`

## 11.4 `yarn tauri dev` 报 WebView2 错误

优先检查：

- 系统是否安装 WebView2 Runtime

必要时去微软官方页面补装。

## 11.5 MSI 打包失败

Tauri 官方提到，构建 MSI 时某些 Windows 环境可能需要启用 `VBSCRIPT` 可选功能。  
如果报 `light.exe` 相关错误，优先排查这个方向。

参考：

- Tauri Windows prerequisites  
  https://v2.tauri.app/start/prerequisites/

## 12. 最低可操作建议

如果接手人完全没有开发背景，我建议至少做到下面这一级：

1. 会安装 Node.js
2. 会安装 Yarn
3. 会安装 Rust
4. 会执行 `yarn`
5. 会执行 `yarn tauri dev`
6. 会执行 `yarn tauri build`
7. 会执行 `yarn build:keygen`

只要完成这一级，后续即使不懂源码，也至少有能力：

- 跑起来
- 打包
- 生成授权码
- 根据文档排查最常见问题

## 13. 官方参考链接

- Tauri Prerequisites  
  https://v2.tauri.app/start/prerequisites/

- Rust 安装  
  https://www.rust-lang.org/tools/install

- Node.js 下载  
  https://nodejs.org/en/download

- Yarn 安装  
  https://yarnpkg.com/getting-started/install
