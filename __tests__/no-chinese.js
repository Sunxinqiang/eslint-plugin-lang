'use strict'

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const RuleTester = require('eslint').RuleTester
const rule = require('../rules/no-chinese.js')

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

const tester = new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  }
})

tester.run('no-chinese', rule, {
  valid: [
    `
    <template>
      <div id="foo" />
      <div id></div>
      <div id=""></div>
      <div>{{}}</div>
    </template>`,
  ],
  invalid: [
    {
      code:
        `<template>
          <div>中文</div>
          <div>{{"中文"}}</div>
          <div>{{false||"中文"}}</div>
          <div>{{123 + "中文"}}</div>
        </template>`,
      errors: [
        '中文 需要国际化',
        '中文 需要国际化',
        '中文 需要国际化',
        '中文 需要国际化',
      ]
    },
    {
      code:
        `<template>
          <div attribute="中文"></div>
          <div :attribute="'中文'"></div>
          <div :attribute="1+'中文'"></div>
          <div :attribute="false || '中文'"></div>
          <div :attribute="['中文']"></div>
        </template>`,
      errors: [
        '中文 需要国际化',
        '中文 需要国际化',
        '中文 需要国际化',
        '中文 需要国际化',
        '中文 需要国际化',
      ]
    },
    {
      code:
        `<template>
          <div></div>
        </template>
        <script>
          let a = '中文'; // 中文
        </script>
        `,
      errors: [
        `'中文' 需要国际化`,
      ]
    }
  ]
})
