const CHINESE_REGEX = /\p{Unified_Ideograph}/u;
function hasChinese(value) {
    return CHINESE_REGEX.test(value);
}

module.exports = {
    create(context) {
        const message = '{{ str }} 需要国际化'
        let templateBodyVisitor = {
            // 标签内文字
            "VText": function (node) {
                const { value } = node;
                if (value && hasChinese(value)) {
                    context.report({
                        node,
                        message,
                        data: {
                            str: value,
                        },
                    });
                }
            },
            // 普通属性的值 <div a="中文"></div>
            "VLiteral": function (node) {
                if (!node.value) {
                    return
                }
                const { value } = node;
                if (value && hasChinese(value)) {
                    context.report({
                        node,
                        message,
                        data: {
                            str: value,
                        },
                    });
                }
            },

            // 表达式的值
            "VExpressionContainer": function (node) {
                // 表达式的值：<div :id="'中文'"/>
                // 子表达式的值：<div :id="123||'中文'"/>
                // 表达式数组的值：<div :id="['中文']"/>
                // 再深层的没有校验
                function checkExpression (expression) {
                    // slot-scope="item, index" 这种写法 expression会是null
                    if (!expression) {
                        return
                    }
                    if (expression.value) {
                        checkValue(expression.value)
                    } else {
                        Object.values(expression).forEach(value => {
                            if (Array.isArray(value)) {
                                value.forEach(item => {
                                    if (!item.value) { return }
                                    checkValue(item.value)
                                })
                            } else if (value && value.value) {
                                checkValue(value.value)
                            }
                        })
                    }
                }

                function checkValue (value) {
                    if (hasChinese(value)) {
                        context.report({
                            node,
                            message,
                            data: {
                                str: value,
                            },
                        });
                    }
                }
                checkExpression(node.expression);
            },
            VElement: function (node) {
                if (!node.tokens) {
                    return
                }
                let tokensCopy = [...node.tokens]
                let styleTokens = []
                const getStartIndex = (tokens) => tokens.findIndex(token => token.type =='HTMLTagOpen' && token.value == 'style')
                const getEndIndex = (tokens) => tokens.findIndex(token => token.type =='HTMLEndTagOpen' && token.value == 'style')
                // 获取style标签内的所有token
                while(tokensCopy.length) {
                    // console.log(tokensCopy.length)
                    let start = getStartIndex(tokensCopy)
                    let end = getEndIndex(tokensCopy)
                    if (start == -1 || end == -1) {
                        tokensCopy = []
                    } else {
                        styleTokens.push(...tokensCopy.slice(start, end+1))
                        tokensCopy = tokensCopy.slice(end+1)
                    }
                }
                // console.log(styleTokens)
                // 排除单行注释
                let containSingle = str => {
                    // 删除 包含在引号里面的内容 "aa//";//bb => ;//bb
                    str = str.replace(/("|')[\w\W]*?\1/g, '')
                    return /^[\w\W]*\/\/[\w\W]*$/.test(str)
                }
                let styleTokensCopy = JSON.parse(JSON.stringify(styleTokens))
                let index = styleTokensCopy.findIndex(token => containSingle(token.value))
                while(index != -1) {
                    let comment =  styleTokensCopy[index].value
                            .replace(/("|')[\w\W]*?\1/g, '')
                            .replace(/^[\w\W]*\/\//, '//')
                    // 删除注释部分
                    styleTokensCopy[index].value = styleTokensCopy[index].value.replace(comment, '')
                    // 删除和注释同行的元素，非注释token本身
                    styleTokensCopy = styleTokensCopy.filter(token => {
                        if (token==styleTokensCopy[index]) {
                            return true
                        }
                        // token{ loc: { start: { line, column }, end: { line, column } } }
                        if (token.loc.start.line == styleTokensCopy[index].loc.start.line
                            && token.loc.start.column > styleTokensCopy[index].loc.end.column) {
                                return false
                            }
                        return true
                    })
                    index = styleTokensCopy.findIndex(token => containSingle(token.value))
                }
                // 开除多行注释
                // console.log(styleTokensCopy)

                styleTokensCopy.forEach(token => {
                    if (hasChinese(token.value)) {
                        context.report({
                            node: token,
                            message,
                            data: {
                                str: token.value,
                            },
                        });
                    }
                })
            },
        }
        let scriptVisitor = {
            // js里的中文校验
            Program: function (node) {
                // String类型的token
                let strTokens = node.tokens.filter(t => t.type == 'String')
                strTokens.forEach(token => {
                    if (hasChinese(token.value)) {
                        context.report({
                            node: token,
                            // loc: token.loc,
                            message,
                            data: {
                                str: token.value,
                            },
                        });
                    }
                })
            },
        }
        // console.log(context.getSourceCode().getText())
        // less.render(`
        //     .a {
        //         color: red; // aa
        //         /**
        //          * haha
        //         */
        //     }
        // `).then(res => {
        //     console.log(res, res.css)
        // }).catch(err => {
        //     console.error(err)
        // })
        // console.log(less.render)
        return context.parserServices.defineTemplateBodyVisitor(templateBodyVisitor,scriptVisitor)
    }
};
