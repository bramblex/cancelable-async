import * as acorn from 'acorn';
import * as astring from 'astring';
import estraverse from 'estraverse';

import * as ESTree from 'estree';

const signalName = "__$isCancel__";
const shouldCancelName = "__$shouldCancel__";

function transform(node: ESTree.Node) {
    return estraverse.replace(node, {
        enter(node) {
            if (/function/i.test(node.type)) {
                return estraverse.VisitorOption.Skip;
            }
            return node;
        },
        leave(node) {
            if (node.type === "AwaitExpression") {
                return {
                    type: "CallExpression",
                    callee: {
                        type: "Identifier",
                        name: shouldCancelName,
                    },
                    arguments: [node],
                };
            }
            return node;
        },
    });
}


export function cancelable<F extends (...args: any[]) => any>(func: F | string): string {
    console.log(func);
    const ast = acorn.parse(typeof func === 'function' ? func.toString() : func, {}) as any;
    ast.body[0].body = transform(ast.body[0].body);

    const funcCode = astring.generate(ast).replace(/;\s*$/, "");
    return `((function () {
    var ${signalName} = false;
    function ${shouldCancelName}(value) { 
      if (${signalName}) throw new Error('Cancel'); 
      return value;
    };
    return [${funcCode}, function (){ ${signalName} = true }];
  })())`;
}