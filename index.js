module.exports = {
  // 自定义 parser, 在使用入口若不设置，会导致自定义 parser 不生效
  parser: require.resolve('vue-eslint-parser'),
  configs: {
    base: require('./configs/base'),
  },
  rules: {
    'no-chinese': require('./rules/no-chinese'),
  }
}

