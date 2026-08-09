import { Hr } from "@react-email/components";
import { emailColors } from "../tokens";

export function Divider() {
  return <Hr style={{ borderColor: emailColors.lineSoft, margin: "20px 0" }} />;
}
