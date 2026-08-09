import { Fragment } from "react";
import { Text } from "@react-email/components";
import { emailColors, emailFont } from "../tokens";

/** Splits free-text message bodies (blank line = paragraph break, single
 *  newline = <br/>) into email-safe <p> elements — the React Email
 *  equivalent of the old services/email/templates.ts `paragraphs()` string
 *  builder. Needed anywhere a human-typed message (advisor note, admin
 *  announcement) has to render inside a template, since a single <Text>
 *  with `white-space: pre-wrap` isn't reliable across email clients. */
export function Paragraphs({ children }: { children: string }) {
  const blocks = children.trim().split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, i) => (
        <Text key={i} style={{ margin: i === blocks.length - 1 ? 0 : "0 0 16px", fontFamily: emailFont, fontSize: 15, lineHeight: "24px", color: emailColors.ink }}>
          {block.split("\n").map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </Text>
      ))}
    </>
  );
}
