import { FC, ReactNode } from "react";
import { Box, Flex, HStack } from "@chakra-ui/react";

interface IWindowShellProps {
  tabs?: ReactNode;
}

export const WindowShell: FC<IWindowShellProps> = ({
  tabs,
  children,
  ...rest
}) => {
  return (
    <Flex
      direction="column"
      sx={{
        position: "relative",
        _before: {
          display: "block",
          content: '""',
          position: "absolute",
          inset: 0,
          bg: "#1E1E1E",
          boxShadow: "2xl",
          borderRadius: "xl",
          zIndex: 0
        }
      }}
      {...rest}
    >
      <Flex px="4" zIndex="1">
        <HStack>
          <Box w="3" h="3" borderRadius="full" bg="red.500" />
          <Box w="3" h="3" borderRadius="full" bg="orange.400" />
          <Box w="3" h="3" borderRadius="full" bg="green.400" />
        </HStack>
        <Box pl="4">{tabs}</Box>
      </Flex>
      <Flex
        position="relative"
        direction="column"
        borderTopWidth="1px"
        borderColor="whiteAlpha.100"
        zIndex="1"
      >
        {children}
      </Flex>
    </Flex>
  );
};
