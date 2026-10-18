import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQAccordion({
  items,
}: {
  items: readonly { question: string; answer: string }[];
}) {
  return (
    <Accordion type="single" collapsible className="reveal mx-auto w-full max-w-3xl">
      {items.map((item, i) => (
        <AccordionItem key={item.question} value={`item-${i}`} className="border-border">
          <AccordionTrigger className="text-left text-base font-bold text-navy hover:no-underline sm:text-lg">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
