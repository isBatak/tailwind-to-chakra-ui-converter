import { transformFromAst } from "@babel/standalone";
import Babel, { PluginObj, TransformOptions } from "@babel/core";
import * as parser from "@babel/parser";
import generate from "@babel/generator";
import { convertTailwindToChakra, isClassAttribute } from "./utils";

function updateContent(babel: typeof Babel) {
  const { types: t, template } = babel;

  const box = t.jSXIdentifier("Box");

  return {
    visitor: {
      // Program(path) {
      //   path.traverse({
      //     JSXElement(path) {
      //       console.log(path)
      //     }
      //   })
      // },
      JSXOpeningElement(path) {
        const nodeName = path.node.name["name"];

        if (nodeName !== "Box") {
          const asAttribute =
            nodeName !== "div"
              ? t.jSXAttribute(t.jSXIdentifier("as"), t.stringLiteral(nodeName))
              : null;

          console.log(path.node.attributes)
          const attributes = [asAttribute, ...path.node.attributes].filter(
            Boolean
          );

          const element = t.jsxOpeningElement(box, attributes, path.node.selfClosing);

          path.replaceWith(element);
        }
      },
      JSXClosingElement(path) {
        if (path.node.name["name"] !== "Box") {
          path.replaceWith(t.jsxClosingElement(box));
        }
      },
      JSXAttribute(path) {
        if (isClassAttribute(path.node)) {
          const classValue = (
            path.get("value").node as Babel.types.StringLiteral
          ).value;

          const attributes = convertTailwindToChakra(classValue);

          path.replaceWithMultiple(
            attributes.map((attribute) =>
              t.jSXAttribute(
                t.jSXIdentifier(attribute.name),
                t.stringLiteral(attribute.value)
              )
            )
          );

          //   path.replaceWithMultiple([
          //     t.jSXAttribute(
          //       t.jSXIdentifier("p"),
          //       t.jSXExpressionContainer(t.numericLiteral(2))
          //     ),
          //     t.jSXAttribute(t.jSXIdentifier("m"), t.stringLiteral("1")),
          //     t.jSXAttribute(
          //       t.jSXIdentifier("display"),
          //       t.jSXExpressionContainer(
          //         t.objectExpression([
          //           t.objectProperty(
          //             t.identifier("base"),
          //             t.stringLiteral("unset")
          //           ),
          //         ])
          //       )
          //     ),
          //     t.jSXAttribute(
          //       t.jSXIdentifier("_hover"),
          //       t.jSXExpressionContainer(
          //         template.expression.ast`{ bg: 'gray.500' }`
          //       )
          //     ),
          //   ]);
        }
      },
    },
  } as PluginObj;
}

export function convert(code) {
  const ast = parser.parse(code, { plugins: ["jsx"] });

  const options: TransformOptions = {
    code: false,
    ast: true,
    plugins: [updateContent],
  };

  // @ts-ignore
  const { ast: transformedAST } = transformFromAst(ast, code, options);

  const result = generate(transformedAST, { concise: true }, code).code.slice(0, -1);

  return result;
}
