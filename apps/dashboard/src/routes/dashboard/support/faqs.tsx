import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@sycom/ui/components/accordion";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@sycom/ui/components/card";
import { faq } from "@sycom/ui/lib/constants";
import { createFileRoute } from "@tanstack/react-router";

export function FaqsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Frequently Asked Questions</CardTitle>
        <CardDescription className="text-sm">
          Find answers to common questions about using the platform.
        </CardDescription>
      </CardHeader>
      <CardPanel className="pt-0">
        <Accordion defaultValue={[]}>
          {faq.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardPanel>
    </Card>
  );
}

export const Route = createFileRoute("/dashboard/support/faqs")({
  component: FaqsPage,
});
