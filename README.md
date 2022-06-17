# eslint-plugin-lang

`eslint-plugin-lang`

## 使用

- 安装

```
npm install
```

#### 开发引入
- 包文件夹中运行

```
npm link
```

- 项目文件夹运行，链接到 `eslint-plugin-lang`

```
npm link "eslint-plugin-lang"
```

#### 实际引入
```json
{
  "devDependencies": {
    "eslint-plugin-lang": "git+ssh://xxx.git"
  }
}
```

- 引入

```js
// 逐条引入
module.exports = {
  "rules": {
    "lang/no-chinese": 'error'
  },
  "plugins": ["lang"]
}

// 全部引入
module.exports = {
  'extends': [
    'plugin:lang/base', // 放在最上面 防止覆盖vue/essential的配置, 放下面就会有影响0.0
    'plugin:vue/essential',
    'eslint:recommended',
  ],
}
```

## rules
- no-chinese：检查template里的中文（jsx里的不能检测）
> 如有误检测 请使用 `<!-- eslint-disable-next-line lang/no-chinese -->`
```html
<template>
  <div>中文</div>
  <div>{{"中文"}}</div>
  <div>{{false||"中文"}}</div>
  <div>{{123 + "中文"}}</div>
  <div attribute="中文"></div>
  <div :attribute="'中文'"></div>
  <div :attribute="1+'中文'"></div>
  <div :attribute="false || '中文'"></div>
  <div :attribute="['中文']"></div>
</template>
```