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

tester.run('no-chinese', rule,
  {
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
          `
          <style>
          body::before {
            content: "哈哈一";
          }
          </style>
          <template>
            <div></div>
          </template>
          <script>
            let a = '哈哈二'; // 哈哈三
          </script>
          <style lang="less">
            .app {
              &::before {
                content: "哈哈四";
              }
            }
            body::before {
              content: "哈哈五";// 哈哈六
            }
          </style>
        `,
        errors: [
          `"哈哈一"; 需要国际化`,
          `'哈哈二' 需要国际化`,
          `"哈哈四"; 需要国际化`,
          `"哈哈五"; 需要国际化`,
        ]
      }
    ]
  })
