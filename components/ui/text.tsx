import { Text as RNText, type TextProps as RNTextProps } from "react-native";

const MAX_FONT_SIZE_MULTIPLIER = 1.25;

interface TextProps extends RNTextProps {
  children?: React.ReactNode;
}

export function Text({ maxFontSizeMultiplier, ...props }: TextProps) {
  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? MAX_FONT_SIZE_MULTIPLIER}
      {...props}
    />
  );
}
