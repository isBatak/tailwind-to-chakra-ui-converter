import defaultTheme from 'tailwindcss/defaultTheme';
import resolveConfig from "tailwindcss/resolveConfig";
import { TailwindConfig } from 'tailwindcss/tailwind-config';

const config: TailwindConfig = {
  theme: defaultTheme,
  darkMode: "class",
};

const { theme, separator } = resolveConfig(config);

const isAtBreakpoint = (parts: Array<string>) => parts.length && Object.keys(theme.screens).includes(parts[0]);

export const parse = (selector: string) => {
  const parts = selector.split(separator);

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
