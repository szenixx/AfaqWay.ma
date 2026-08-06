"use client";

import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

/* Mobile-only FAQ presentation — same content and same source data as the
   desktop .acc accordion (Modules.tsx), built on the reui/Base UI accordion
   primitive instead, restyled with AfaqWay's own tokens (see .af-faq* in
   globals.css). Desktop is untouched; see FaqAccordion's sibling render in
   Support() below for the .acc version. */
export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="af-faq">
      <Accordion multiple={false} defaultValue={["0"]}>
        {items.map((item, i) => (
          <AccordionItem key={i} value={String(i)} className="af-faq-item">
            <AccordionTrigger className="af-faq-trigger">{item.q}</AccordionTrigger>
            <AccordionContent className="af-faq-content">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export default FaqAccordion;
