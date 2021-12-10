import parse5 from "parse5";
import defaultTheme from 'tailwindcss/defaultTheme';

console.log(defaultTheme)

const isAtBreakpoint = (parts: Array<string>) =>
  parts.length && ["sm", "md", "lg", "xl", "2xl"].includes(parts[0]);

export const parse = (selector: string): parse5.Attribute => {
  const parts = selector.split(":");

  if (isAtBreakpoint(parts)) {
    const [mq, value] = parts;

    return;
  }

  const [value] = parts;

  const [name, ...rest] = value.split("-");

  if (name.length < 3) {
    return {
      name,
      value: rest.join(".")
    };
  }

  if (name === "text") {
    if (["lg"].includes(rest[0])) {
      return {
        name: "fontSize",
        value: rest[0]
      };
    }

    return {
      name: "color",
      value: rest.join(".")
    };
  }
};
