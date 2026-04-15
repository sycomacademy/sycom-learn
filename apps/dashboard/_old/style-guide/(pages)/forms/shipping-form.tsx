import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

export function ShippingForm() {
  return (
    <FieldSet>
      <FieldLegend>Shipping Details</FieldLegend>
      <FieldDescription>
        Please provide your shipping details so we can deliver your order.
      </FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="street-address">Street Address</FieldLabel>
          <Input autoComplete="off" id="street-address" />
        </Field>
        <Field>
          <FieldLabel htmlFor="city">City</FieldLabel>
          <Input id="city" />
        </Field>
        <FieldSet>
          <FieldLegend variant="label">Shipping Method</FieldLegend>
          <FieldDescription>
            Please select the shipping method for your order.
          </FieldDescription>
          <RadioGroup>
            <Field orientation="horizontal">
              <RadioGroupItem id="shipping-method-1" value="standard" />
              <FieldLabel className="font-normal" htmlFor="shipping-method-1">
                Standard{" "}
                <Badge className="rounded-full py-px" variant="outline">
                  Free
                </Badge>
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem id="shipping-method-2" value="express" />
              <FieldLabel className="font-normal" htmlFor="shipping-method-2">
                Express
              </FieldLabel>
            </Field>
          </RadioGroup>
        </FieldSet>
        <Field>
          <FieldLabel htmlFor="message">Message</FieldLabel>
          <Textarea id="message" />
          <FieldDescription>Anything else you want to add?</FieldDescription>
        </Field>
        <FieldSet>
          <FieldLegend>Additional Items</FieldLegend>
          <FieldDescription>
            Please select the additional items for your order.
          </FieldDescription>
          <FieldGroup data-slot="checkbox-group">
            <FieldLabel htmlFor="gift-wrapping">
              <Field orientation="horizontal">
                <Checkbox
                  aria-label="Gift Wrapping"
                  id="gift-wrapping"
                  value="gift-wrapping"
                />
                <FieldContent>
                  <FieldTitle>Gift Wrapping</FieldTitle>
                  <FieldDescription>
                    Add elegant gift wrapping with a personalized message.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="insurance">
              <Field orientation="horizontal">
                <Checkbox
                  aria-label="Package Insurance"
                  id="insurance"
                  value="insurance"
                />
                <FieldContent>
                  <FieldTitle>Package Insurance</FieldTitle>
                  <FieldDescription>
                    Protect your shipment with comprehensive insurance coverage.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="signature-confirmation">
              <Field orientation="horizontal">
                <Checkbox
                  aria-label="Signature Confirmation"
                  id="signature-confirmation"
                  value="signature-confirmation"
                />
                <FieldContent>
                  <FieldTitle>Signature Confirmation</FieldTitle>
                  <FieldDescription>
                    Require recipient signature upon delivery for added
                    security.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </FieldSet>
  );
}
