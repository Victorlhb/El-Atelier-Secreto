import { useWindowDimensions } from "react-native";

export function useResponsive() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1100;
  const contentWidth = isLargeTablet ? 1040 : isTablet ? 880 : 640;
  const columns = isLargeTablet ? 3 : isTablet ? 2 : 1;

  return {
    width,
    isTablet,
    isLargeTablet,
    contentWidth,
    columns,
  };
}
