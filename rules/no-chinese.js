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
            /**
             * 所有节点
             * @param {*} node
             * @returns
             */
            VElement: function (node) {
                if (!node.tokens) {
                    return
                }
                let styleTokens = getStyleTokens(node.tokens)
                styleTokens = getTokensNoSingComment(styleTokens)
                styleTokens = getTokensNoMultiComment(styleTokens)

                // 遍历检查中文
                styleTokens.forEach(token => {
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
        return context.parserServices.defineTemplateBodyVisitor(templateBodyVisitor,scriptVisitor)
    }
};

/**
 * 获取所有style Tokens
 * @param {Array} tokens token数组
 * @returns {Array}
 */
function getStyleTokens (tokens) {
    let res = []
    const getStartIndex = (tokens) => tokens.findIndex(token => token.type =='HTMLTagOpen' && token.value == 'style')
    const getEndIndex = (tokens) => tokens.findIndex(token => token.type =='HTMLEndTagOpen' && token.value == 'style')
    let tokensCopy = [...tokens]
    // 获取style标签内的所有token
    while(tokensCopy.length) {
        let start = getStartIndex(tokensCopy)
        let end = getEndIndex(tokensCopy)
        if (start == -1 || end == -1) {
            tokensCopy = []
        } else {
            res.push(...tokensCopy.slice(start, end+1))
            tokensCopy = tokensCopy.slice(end+1)
        }
    }
    return res
}

/**
 * 排除token里的单行注释，一个token部分含有注释，则删除注释部分
 * @param {Array} tokens token数组
 * @returns {Array}
 */
function getTokensNoSingComment (tokens) {
    let tokensCopy = JSON.parse(JSON.stringify(tokens))
    let index = tokensCopy.findIndex(token => noQuotContain(token.value, '//'))
    while(index != -1) {
        let comment =  tokensCopy[index].value
                .replace(/("|')[\w\W]*?\1/g, '')
                .replace(/^[\w\W]*\/\//, '//')
        // 删除注释部分
        tokensCopy[index].value = tokensCopy[index].value.replace(comment, '')
        // 删除和注释同行的元素，非注释token本身
        tokensCopy = tokensCopy.filter(token => {
            if (token==tokensCopy[index]) {
                return true
            }
            // token{ loc: { start: { line, column }, end: { line, column } } }
            if (token.loc.start.line == tokensCopy[index].loc.start.line
                && token.loc.start.column > tokensCopy[index].loc.end.column) {
                    return false
                }
            return true
        })
        index = tokensCopy.findIndex(token => noQuotContain(token.value, '//'))
    }
    return tokensCopy
}
/**
 * 排除token里的多行注释，一个token部分含有注释，则删除注释部分
 * @param {Array} tokens token数组
 * @returns {Array}
 */
function getTokensNoMultiComment (tokens) {
    let tokensCopy = JSON.parse(JSON.stringify(tokens))
    let indexStart = tokensCopy.findIndex(token => noQuotContain(token.value, '/*'))
    let indexEnd = tokensCopy.findIndex(token => noQuotContain(token.value, '*/'))
    while(indexStart != -1 && indexEnd != -1) {
        let comment =  tokensCopy[indexStart].value
                .replace(/("|')[\w\W]*?\1/g, '')
                .replace(/^[\w\W]*\/\*/, '/*')
        // 删除注释部分
        tokensCopy[indexStart].value = tokensCopy[indexStart].value.replace(comment, '')
        // 删除和注释同行的元素，非注释token本身
        tokensCopy[indexEnd].value = tokensCopy[indexEnd].value.replace(/^[\w\W]*?\*\//, '')
        // 删除中间的元素
        if (indexStart != indexEnd) {
            tokensCopy.splice(indexStart+1, indexEnd-indexStart-1)
        }
        indexStart = tokensCopy.findIndex(token => noQuotContain(token.value, '/*'))
        indexEnd = tokensCopy.findIndex(token => noQuotContain(token.value, '*/'))
    }
    return tokensCopy
}

/**
 * 是否包含指定字符串，非引号内包含
 * @param {*} str
 * @param {string} symbol 符号字符串
 */
function noQuotContain (str, symbol) {
    // 删除 包含在引号里面的内容 "aa//";//bb => ;//bb
    str = str.replace(/("|')[\w\W]*?\1/g, '')
    // 正则里有特殊意义的符号 都转义一下，/这个不用转义，会自动转
    let encodeSymbol = symbol.replace(/([*.\\^$+?:=<>!|])/g, '\\$1')
    let reg = new RegExp(`^[\\w\\W]*${encodeSymbol}[\\w\\W]*$`)
    return reg.test(str)
}