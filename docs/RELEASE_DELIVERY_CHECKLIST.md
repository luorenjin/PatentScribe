# PatentMate 发布/授权交付清单

## 1. 文档目的

本文档用于发布前自检，以及向其他同事、测试、实施或运营交付时的检查与说明。

重点覆盖：

- 发布前应确认的代码与构建事项
- 授权、公钥、许可证相关交付边界
- 默认模式下阿里百炼 API Key 的获取与配置
- 交付包中应包含哪些文件

## 2. 先说结论

本项目当前有两种 Qwen/百炼接入方式，务必区分：

1. `builtin` 内置模式
   - 代码读取 `VITE_QWEN_API_KEY`
   - 该值来自前端构建期环境变量
   - 终端用户无法在应用设置里直接修改这一模式的 Key

2. `qwen` 自定义 Qwen 模式
   - 用户可以在应用设置页填写 API Key、Endpoint、Model ID
   - 更适合交付给不同同事后各自配置自己的百炼账号

因此：

- 如果希望“开箱即用”，发布前必须配置好 `VITE_QWEN_API_KEY` 再构建
- 如果不希望把长期有效 Key 打进安装包，交付时应引导使用 `qwen` 模式，而不是依赖 `builtin`

## 3. 发布前检查清单

### 3.1 代码与配置

- [ ] `package.json` 版本号已确认
- [ ] 执行过 `yarn version-sync`
- [ ] `.env` 中的目标环境变量已确认
- [ ] 默认模型、默认 Provider 与交付方案一致
- [ ] 若启用激活机制，`LICENSE_PUBLIC_KEY` 已确认
- [ ] 不应外发的测试地址、测试密钥、临时调试开关已清理

### 3.2 必跑命令

- [ ] `yarn lint`
- [ ] `yarn build`
- [ ] `yarn tauri build`

### 3.3 最低回归

- [ ] 应用可正常启动
- [ ] 上传 `.docx/.pdf/.txt/图片` 能进入分析流程
- [ ] 设置页可正常切换 Provider
- [ ] 工作台保存/加载/删除正常
- [ ] DOCX 导出正常
- [ ] PDF 导出正常
- [ ] 激活流程可正常校验许可证

## 4. 默认模式下阿里百炼 API Key 获取与配置

## 4.1 官方获取路径

根据阿里云百炼官方文档，调用百炼模型前需要先创建 API Key。建议在百炼控制台选择目标地域后进入 API Key 页面创建，推荐使用默认业务空间。创建完成后，明文 API Key 只会在创建成功弹窗中完整显示一次，关闭后不能再次查看，只能重置或新建。  
参考：

- API Key 获取：https://help.aliyun.com/zh/model-studio/get-api-key/

对本项目，建议默认使用：

- 地域：`华北 2（北京）`
- Base URL：`https://dashscope.aliyuncs.com/compatible-mode/v1`

这是当前仓库里 `builtin` 和 `qwen` 的默认百炼接入地址。

## 4.2 百炼控制台操作步骤

建议按下面的顺序操作：

1. 登录阿里云账号，进入百炼控制台
2. 在右上角切换到目标地域，建议使用 `华北 2（北京）`
3. 进入 `API Key` 管理页面
4. 创建 API Key
5. `归属业务空间` 建议选择 `默认业务空间`
6. `权限` 如无细粒度隔离要求，可先使用较通用的权限配置
7. 创建成功后立即复制并妥善保存 API Key

注意事项：

- API Key 丢失后无法再次查看明文，只能新建或重置
- 默认业务空间的 API Key 可调用该空间下的标准模型和应用
- 北京地域支持更细的权限控制和 IP 白名单
- API Key 默认长期有效，删除后失效

## 4.3 本项目中的两种配置方式

### 方式 A：作为“默认内置模式”打进安装包

适用场景：

- 交付给不希望手动配置模型参数的同事
- 演示版、样机版、内部固定账号版

配置方法：

1. 在仓库根目录创建或修改 `.env`
2. 设置以下变量：

```env
VITE_QWEN_API_KEY=你的百炼APIKey
```

3. 保持默认 Provider 为 `builtin`
4. 执行：

```bash
yarn build
yarn tauri build
```

重要说明：

- `VITE_QWEN_API_KEY` 是 Vite 前端环境变量，属于构建期注入
- 也就是说，Key 会在打包前进入前端产物
- 更换这个 Key 后，需要重新构建安装包
- 已经打好的安装包，终端用户不能靠设置页改掉 `builtin` 模式的 Key

换句话说，`builtin` 更像“预置百炼账号通道”，不是“最终用户自助配置通道”。

### 方式 B：交付后让使用者自行填写百炼配置

适用场景：

- 不希望把组织级长期 Key 随安装包分发
- 每位同事使用自己的百炼账号
- 测试、实施、外部协作环境

操作方法：

1. 启动应用
2. 打开 `设置`
3. 将 Provider 切换为 `通义千问 (Qwen)`
4. 填写：
   - `API Key`：百炼控制台创建的 Key
   - `API Endpoint`：`https://dashscope.aliyuncs.com/compatible-mode/v1`
   - `Model ID`：建议 `qwen3.6-plus` 或项目当前要求的模型名
5. 保存配置

说明：

- `qwen` 模式走本地设置存储，适合每台机器独立配置
- 对交付对象来说，这通常比依赖 `builtin` 更稳妥

## 4.4 推荐交付策略

建议按场景选一种，不要混用说明：

- 内部统一账号、追求开箱即用：使用 `builtin`
- 多人分发、强调密钥隔离：使用 `qwen`

如果当前版本准备交付给多个同事继续开发或测试，推荐：

1. 安装包仍可保留 `builtin`
2. 但交付文档明确要求他们优先改用 `qwen` 填自己的 Key
3. 组织共享 Key 不应长期直接嵌入发散分发的安装包

## 5. 授权/许可证交付清单

### 5.1 必须确认的文件与变量

- [ ] `LICENSE_PUBLIC_KEY` 已与本次许可证生成逻辑匹配
- [ ] 如存在许可证生成流程，私钥未被误放入对外交付包
- [ ] `scripts/keys/private.pem` 是否需要保留在仓库内，已由负责人确认
- [ ] `scripts/keys/public.pem` 是否与当前客户端校验逻辑一致

### 5.2 代码行为说明

当前客户端授权逻辑：

- 前端通过 Tauri 命令获取机器码
- 前端提交许可证串到 Rust 侧校验
- Rust 侧会优先读取环境变量 `LICENSE_PUBLIC_KEY`
- 若未提供，则退回到 `src-tauri/src/main.rs` 中的默认公钥常量

因此发布前必须确认：

- 是使用环境变量中的公钥
- 还是依赖代码中的后备公钥

否则容易出现“生成许可证和客户端校验公钥不一致”的问题。

### 5.3 不建议对外交付的内容

默认不建议把以下内容直接发给普通使用者：

- `.env`
- `scripts/keys/private.pem`
- 任意长期有效的组织级 API Key 原文
- 用于签发许可证的脚本或内部操作口令

## 6. 打包产物交付清单

建议交付包至少包含：

- [ ] 安装包或可执行程序
- [ ] `docs/USER_GUIDE.md`
- [ ] `docs/DEVELOPMENT_GUIDE.md`
- [ ] `docs/RELEASE_DELIVERY_CHECKLIST.md`
- [ ] `docs/INSTALLATION_FIRST_RUN_GUIDE.md`
- [ ] `docs/ENVIRONMENT_SETUP_GUIDE.md`

如交付给开发同事，建议补充：

- [ ] `.env.example`
- [ ] 本次版本号与变更摘要
- [ ] 使用哪个 Provider 作为默认配置
- [ ] 是否需要单独申请百炼 API Key
- [ ] 是否开启强制激活

## 7. 交付时需要明确告知对方的事项

建议在交付说明里明确写清：

1. 当前默认 Provider 是什么
2. 如果默认模式不可用，是否应切换到 `qwen`
3. 百炼 API Key 应由谁申请
4. 是否允许共用组织级 Key
5. 是否必须激活后才能上传分析
6. 许可证申请联系人是谁
7. 当前版本已知限制有哪些

## 8. 推荐交付模板

可直接复用下面这段说明发给接手同事：

```text
本次交付版本默认支持百炼/Qwen 调用。

如果你打开后可直接使用，说明安装包内已预置 builtin 通道。
如果内置通道不可用，进入“设置”切换到“通义千问 (Qwen)”并填写：

- API Key：你在阿里云百炼控制台申请的 Key
- API Endpoint：https://dashscope.aliyuncs.com/compatible-mode/v1
- Model ID：qwen3.6-plus

注意：builtin 模式的 Key 不是在设置里改的，而是在打包前写入构建环境的。
如果要更换 builtin 通道，需要重新构建安装包。
```

## 9. 官方参考链接

以下内容已按 2026-06-09 核对过，后续若阿里云控制台改版，请以官方文档为准：

- 获取 API Key  
  https://help.aliyun.com/zh/model-studio/get-api-key/

- 配置 API Key 到环境变量  
  https://help.aliyun.com/zh/model-studio/configure-api-key-through-environment-variables

- 百炼兼容 OpenAI 接口与接入点说明  
  https://help.aliyun.com/zh/model-studio/what-is-model-studio

- 更多工具接入说明（含按量计费地域 Base URL）  
  https://help.aliyun.com/zh/model-studio/more-tools
