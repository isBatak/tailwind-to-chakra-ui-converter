import { TailwindConfig } from "tailwindcss/tailwind-config";
import expandApplyAtRules from "tailwindcss/lib/lib/expandApplyAtRules";
import { createContext } from "tailwindcss/lib/lib/setupContextUtils";
import { resolveMatches } from 'tailwindcss/lib/lib/generateRules';
import { corePlugins } from 'tailwindcss/lib/corePlugins';
import createUtilityPlugin from 'tailwindcss/lib/util/createUtilityPlugin'
import defaultTheme from "tailwindcss/defaultTheme";
import resolveConfig from "tailwindcss/resolveConfig";
import postcss from 'postcss-js';
import camelCaseCss from 'camelcase-css';

function extractApplyCandidates(params: string) {
  let candidates = params.split(/[\s\t\n]+/g)

  if (candidates[candidates.length - 1] === '!important') {
    return [candidates.slice(0, -1), true]
  }

  return [candidates, false]
}

interface IContext {
  tailwindConfig: TailwindConfig;
}

const config: TailwindConfig = {
  theme: defaultTheme,
  darkMode: "class",
  // @ts-ignore
  corePlugins: { preflight: false },
};

// const postCss = processor.process(classValue, { from: '' }).then((reuslt) => console.log(reuslt));

export const runPostcssTest = () => {
  const rules = 'md:flex bg-gray-100 rounded-xl p-8 md:p-0 dark:bg-gray-800';
  const applyAtRules =`.card { @apply ${rules}; }`;

  let context = {
    disposables: [],
    ruleCache: new Set(), // TODO fill in this map
    classCache: new Map(),
    applyClassCache: new Map(),
    notClassCache: new Set(),
    postCssNodeCache: new Map(),
    candidateRuleMap: new Map(), // TODO fill in this map
    tailwindConfig: resolveConfig(config),
    changedContent: [],
    variantMap: new Map(),
    stylesheetCache: null,
  }

  console.log(context.tailwindConfig.theme)

  let [candidates] = extractApplyCandidates(rules);

  for (let candidate of candidates) {
    console.log(candidate)
    let matches = Array.from(resolveMatches(candidate, context));

    console.log(matches)
  }

  const processor = postcss.sync({
    postcssPlugin: "tailwindcss",
    plugins: [
      function (root, result) {

        expandApplyAtRules(context)(root, result)
      },
    ],
  });

  console.log(processor(applyAtRules));
};
