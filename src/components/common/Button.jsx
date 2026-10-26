import { getStyles } from "../../styles/theme";
import { useIsDesktop } from "../../hooks/useDesktop";

const VARIANT_MAP = {
  primary: "primaryBtn",
  secondary: "secondaryBtn",
  back: "backBtn",
};

export default function Button({
  variant = "primary",
  fullWidth = true,
  children,
  style,
  ...props
}) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  const variantStyle = styles[VARIANT_MAP[variant]] || styles.primaryBtn;

  return (
    <button
      style={{
        ...styles.button,
        ...variantStyle,
        width: fullWidth ? "100%" : "auto",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
