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
                // console.log(node)
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
            // "VAttribute[value!=null]": function (node) {
            //     // console.log(node)
            //     if (!node.value) {
            //         return
            //     }
            //     const { value } = node.value;
            //     if (value && hasChinese(value)) {
            //         context.report({
            //             node,
            //             message,
            //             data: {
            //                 str: value,
            //             },
            //         });
            //     }
            // },
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
        }
        let scriptVisitor = {
            // js里的中文校验
            Program: function (node) {
                // String类型的token
                let strTokens = node.tokens.filter(t => t.type == 'String')
                strTokens.forEach(token => {
                    if (hasChinese(token.value)) {
                        context.report({
                            node,
                            message,
                            data: {
                                str: token.value,
                            },
                        });
                    }
                })
            }
        }
        return context.parserServices.defineTemplateBodyVisitor(templateBodyVisitor,scriptVisitor)
    }
};
