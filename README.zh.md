# RoamTested 网站使用手册(中文)

这是你的网站源码。**你日常只需要碰两个文件夹**,其他都不用动:

```
src/content/providers/en/   ← 每个 eSIM 一个 JSON 文件(评分、价格、测速数据)
src/content/posts/en/       ← 每篇文章一个 Markdown 文件(叙述正文)
```

## 日常任务怎么做

### 1. 发布一篇新的单品测评

分两步:

**第一步:建数据文件。** 复制 `src/content/providers/en/airalo.json`,
改名为新服务商(如 `nomad.json`),把里面的分数、价格、测速记录、
优缺点换成你的实测数据。字段含义文件里都有注释说明。

**第二步:建文章文件。** 复制 `src/content/posts/en/airalo-china-esim-review.md`,
改名(文件名就是网址,如 `nomad-china-esim-review.md` → roamtested.com/nomad-china-esim-review/),
改头部的 title、description、date,并把 `provider:` 改成 `"en/nomad"`。
正文用英文写叙述,评分卡和数据表格会自动出现,不用你排版。

保存后把文件传到 GitHub 仓库,一两分钟后网站自动更新。

### 2. 更新已有测评的数据(比如回国复测)

打开对应的 provider JSON,在 `speedTests` 数组里**追加**新记录(旧记录保留,
这是你的存证资产),需要的话调整分数。在文章 md 文件头部加一行
`updated: "2026-XX-XX"`,页面上会显示"Updated"标签。

### 3. 修改评测指标(增删改权重)

只改一个文件:`src/config/metrics.ts`。里面有详细注释。
改完后首页表格、评分卡全站自动更新。
新增指标后记得给每个 provider JSON 的 `scores` 补分数。

### 4. 换掉演示数据

现在三个 provider 文件都是 `"sampleData": true`,页面上会显示黄色
"Demo data" 横幅。填入真实数据后把它改成 `false`,横幅消失。
**在改成 false 之前,网站可以放心公开,读者会看到明确的演示声明。**

### 5. 填 About 页面

打开 `src/pages/about.astro`,找到 `(Author introduction coming soon.)`
那一行,替换成你的介绍。

### 6. 联盟链接

每个 provider JSON 里的 `affiliateUrl` 现在是占位符
(`https://example.com/REPLACE-...`)。拿到各家联盟计划的专属链接后替换。

## 不常动但可能用到

| 想改什么 | 改哪个文件 |
|---|---|
| 品牌口号、联系邮箱、菜单 | `src/config/site.ts` |
| 配色、字体 | `src/styles/global.css` 顶部的变量 |
| 页脚披露文字 | `src/layouts/Base.astro` |
| 隐私政策、披露页 | `src/pages/privacy.astro`、`src/pages/affiliate-disclosure.astro` |

## 以后加中文版(结构已预留)

1. `astro.config.mjs` 里 locales 加 `'zh'`
2. 建 `src/content/posts/zh/` 和 `src/content/providers/zh/` 放中文内容
3. 到时候让 Claude 带你把路由部分补齐即可,内容结构完全不用动

## 本地预览(可选,不装也不影响发布)

装了 Node.js 的话,在项目文件夹运行:

```
npm install     # 第一次运行,装依赖
npm run dev     # 启动本地预览,浏览器打开 http://localhost:4321
npm run build   # 检查能否正常构建(Cloudflare 发布时会自动跑这个)
```

## Cloudflare Pages 部署设置(连接仓库时填)

- Build command: `npm run build`
- Build output directory: `dist`
- 其他保持默认
