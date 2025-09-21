# Home Singularity Web

家庭智能系统前端

## 环境要求

- Node.js 16+
- npm 8+ 或 yarn 1.22+

## 安全指南

1. **前端安全最佳实践**
   - 使用HTTPS协议
   - 实现CSP(内容安全策略)
   - 防范XSS攻击
   - 防范CSRF攻击

2. **开发安全**
   - 使用.env文件存储敏感配置
   - 不提交.env文件到版本控制
   - 使用npm audit检查依赖漏洞

3. **构建与部署**
   - 生产环境禁用source map
   - 启用代码压缩和混淆
   - 使用子资源完整性(SRI)

## 项目启动

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```