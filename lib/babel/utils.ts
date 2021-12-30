import Babel from "@babel/core";
import { parse } from "../tailwind/parser";

export const isClassAttribute = (node: Babel.types.JSXAttribute) => node.name.name === "class";

export const convertTailwindToChakra = (classValue: string) => {
  const selectors = classValue.split(" ");

  return selectors.reduce((attributes, selector) => {
    if (selector === "") return attributes;

    const attr = parse(selector);

    if (attr) attributes.push(attr);

    return attributes;
  }, []);
};
