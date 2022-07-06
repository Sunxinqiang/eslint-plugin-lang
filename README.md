# eslint-plugin-lang

eslint插件 ，校验vue文件内容是否含有中文

## 使用

- 安装

```shell
npm install eslint-plugin-lang
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
- no-chinese：检查.vue里的中文
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
<script>
  let a = "中文"
</script>
<style>
  .a::before {
    content: "中文";
  }
</style>
```