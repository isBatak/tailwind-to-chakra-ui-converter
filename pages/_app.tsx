import { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";

import "focus-visible/dist/focus-visible";

function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default App;
