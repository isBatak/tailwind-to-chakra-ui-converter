import * as chakraComponents from "@chakra-ui/react";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useEffect, useState } from "react";
import { WindowShell } from "../components/WindowShell";
import { BsLayoutSplit } from "react-icons/bs";
import { SiChakraui, SiTailwindcss } from "react-icons/si";
import JsxParser from "react-jsx-parser";
import { convert } from "../lib/babel";
import { runPostcssTest } from "../lib/postcss-test";

const {
  Box,
  Container,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  DarkMode,
} = chakraComponents;

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: {
    enabled: false
  }
};

const readOnlyEditor: editor.IStandaloneEditorConstructionOptions = {
  ...editorOptions,
  readOnly: true
};

const defaultValue = `<figure class="md:flex bg-gray-100 rounded-xl p-8 md:p-0 dark:bg-gray-800">
<img class="w-24 h-24 md:w-48 md:h-auto md:rounded-none rounded-full mx-auto" src="/sarah-dayan.jpg" alt="" width="384" height="512" />
<div class="pt-6 md:p-8 text-center md:text-left space-y-4">
  <blockquote>
    <p class="text-lg font-medium">
      “Tailwind CSS is the only framework that I've seen scale
      on large teams. It’s easy to customize, adapts to any design,
      and the build size is tiny.”
    </p>
  </blockquote>
  <figcaption class="font-medium">
    <div class="text-sky-500 dark:text-sky-400">
      Sarah Dayan
    </div>
    <div class="text-gray-700 dark:text-gray-500">
      Staff Engineer, Algolia
    </div>
  </figcaption>
</div>
</figure>`;


export default function IndexPage() {
  const [fragment, setFragment] = useState<string>(() => convert(defaultValue));

  const changeHandler = (value: string) => {
    setFragment(convert(value));
  };

  // useEffect(() => {
  //   runPostcssTest();
  // }, []);

  return (
    <Container maxW="container.xl" p="0" mt="8">
      <Grid
        gridTemplateColumns="2rem 1fr 52.5% 2rem"
        gridTemplateRows="auto 2.25rem auto 2.25rem"
      >
        <GridItem
          display="flex"
          colStart={{ base: 1, sm: 2, lg: 1, xl: 1 }}
          colEnd={{ base: 2, sm: 3, xl: 5 }}
          colSpan={{ lg: "full" }}
          rowStart={{ base: 1, xl: 2 }}
          rowEnd={{ xl: 5 }}
          rowSpan="full"
          py={{ lg: 10, xl: 16 }}
          ml={{ base: -8, sm: 0 }}
          pr={{ base: 4, ms: 0 }}
        >
          <Box
            sx={{
              bg: "gray.100",
              w: "full",
              flex: "none",
              borderRadius: "3xl"
            }}
          />
          <Box
            sx={{
              w: "full",
              flex: "none",
              ml: "-100%",
              borderRadius: "3xl",
              bgGradient: "linear(to-br, sky.400, blue.500)",
              boxShadow: "lg",
              transform: { base: "rotate(-1deg)", sm: "rotate(-2deg)" }
            }}
          />
        </GridItem>

        <GridItem
          position="relative"
          colStart={{ base: 1, sm: 2, lg: 1, xl: 2 }}
          colEnd={{ base: 2, sm: 3, xl: 3 }}
          colSpan={{ lg: "full" }}
          rowStart={{ base: 2, xl: 3 }}
          rowEnd={{ base: 3, xl: 4 }}
          alignSelf="center"
          px={{ sm: 6, md: 8, lg: 0 }}
          pr={-8}
          pb={{ base: -6, md: -8, lg: 0 }}
          mt={{ base: -6, sm: -10, md: -16, lg: -32, xl: 0 }}
        >
          <JsxParser components={chakraComponents} jsx={fragment} />
        </GridItem>
        <GridItem
          pt={{ base: 8, lg: 0 }}
          px={{ md: 8, lg: 0 }}
          position="relative"
          colStart={{ base: 1, lg: 1, xl: 3 }}
          colSpan="full"
          colEnd={4}
          rowStart={{ base: 1, xl: 2 }}
          rowEnd={{ base: 2, xl: 5 }}
          alignSelf="center"
        >
          <DarkMode>
            <Tabs color="whiteAlpha.900">
              <WindowShell
                tabs={
                  <TabList>
                    <Tab>
                      <SiTailwindcss />
                      &nbsp;Tailwind
                    </Tab>
                    <Tab>
                      <SiChakraui />
                      &nbsp;Chakra UI
                    </Tab>
                    <Tab>
                      <BsLayoutSplit />
                    </Tab>
                  </TabList>
                }
              >
                <TabPanels>
                  <TabPanel p="0">
                    <Editor
                      height="576px"
                      defaultLanguage="html"
                      defaultValue={defaultValue}
                      theme="vs-dark"
                      options={editorOptions}
                      onChange={changeHandler}
                    />
                  </TabPanel>
                  <TabPanel p="0">
                    <Editor
                      height="576px"
                      defaultLanguage="html"
                      theme="vs-dark"
                      value={fragment}
                      options={readOnlyEditor}
                    />
                  </TabPanel>
                  <TabPanel p="0">
                    <HStack spacing="4" justify="stretch">
                      <Box flex="1">
                        <Editor
                          height="576px"
                          defaultLanguage="html"
                          defaultValue={defaultValue}
                          theme="vs-dark"
                          options={editorOptions}
                          onChange={changeHandler}
                        />
                      </Box>
                      <Box flex="1">
                        <Editor
                          height="576px"
                          defaultLanguage="html"
                          theme="vs-dark"
                          value={fragment}
                          options={readOnlyEditor}
                        />
                      </Box>
                    </HStack>
                  </TabPanel>
                </TabPanels>
              </WindowShell>
            </Tabs>
          </DarkMode>
        </GridItem>
      </Grid>
    </Container>
  );
}
