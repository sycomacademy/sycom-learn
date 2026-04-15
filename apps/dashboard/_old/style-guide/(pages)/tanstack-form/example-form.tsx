/** biome-ignore-all lint/complexity/noVoid: this is a demo */
/** biome-ignore-all lint/correctness/noChildrenProp: this is a demo */
"use client";

import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { addons, exampleFormSchema } from "../schema";

export function ExampleForm() {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      plan: "",
      billingPeriod: "",
      addons: ["analytics"],
      emailNotifications: false,
      teamSize: 1,
      comments: "",
      startDate: new Date(),
      theme: "system",
      password: "",
    },
    validators: {
      onBlur: exampleFormSchema,
    },
    onSubmit: async ({ value }) => {
      setValues(value);
      setOpen(true);
    },
  });
  const [values, setValues] = React.useState<typeof form.state.values>();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Card className="w-full max-w-lg">
        <CardHeader className="border-b">
          <CardTitle>Example Form</CardTitle>
          <CardDescription>
            This is an example form using TanStack Form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="example-form"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                      <Input
                        aria-invalid={isInvalid}
                        autoComplete="off"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        value={field.state.value}
                      />
                      <FieldDescription>Enter your name</FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
                name="name"
              />
              <form.Field
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        aria-invalid={isInvalid}
                        autoComplete="off"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="email"
                        value={field.state.value}
                      />
                      <FieldDescription>
                        Enter your email address
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
                name="email"
              />
              <FieldSeparator />
              <form.Field
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <FieldSet data-invalid={isInvalid}>
                      <FieldLegend>Subscription Plan</FieldLegend>
                      <FieldDescription>
                        Choose your subscription plan.
                      </FieldDescription>
                      <RadioGroup
                        aria-invalid={isInvalid}
                        name={field.name}
                        onValueChange={field.handleChange}
                        value={field.state.value}
                      >
                        <FieldLabel htmlFor="basic">
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>Basic</FieldTitle>
                              <FieldDescription>
                                For individuals and small teams
                              </FieldDescription>
                            </FieldContent>
                            <RadioGroupItem
                              aria-invalid={isInvalid}
                              id="basic"
                              value="basic"
                            />
                          </Field>
                        </FieldLabel>
                        <FieldLabel htmlFor="pro">
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>Pro</FieldTitle>
                              <FieldDescription>
                                For businesses with higher demands
                              </FieldDescription>
                            </FieldContent>
                            <RadioGroupItem
                              aria-invalid={isInvalid}
                              id="pro"
                              value="pro"
                            />
                          </Field>
                        </FieldLabel>
                      </RadioGroup>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </FieldSet>
                  );
                }}
                name="plan"
              />
              <FieldSeparator />
              <form.Field
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Billing Period
                      </FieldLabel>
                      <Select
                        aria-invalid={isInvalid}
                        name={field.name}
                        onValueChange={(value) =>
                          field.handleChange(value as string)
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="Select billing period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Choose how often you want to be billed.
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
                name="billingPeriod"
              />
              <FieldSeparator />
              <form.Field
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <FieldSet data-invalid={isInvalid}>
                      <FieldLegend>Add-ons</FieldLegend>
                      <FieldDescription>
                        Select additional features you&apos;d like to include.
                      </FieldDescription>
                      <FieldGroup data-slot="checkbox-group">
                        {addons.map((addon) => (
                          <Field key={addon.id} orientation="horizontal">
                            <Checkbox
                              aria-invalid={isInvalid}
                              checked={field.state.value.includes(addon.id)}
                              id={addon.id}
                              name={field.name}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.pushValue(addon.id);
                                } else {
                                  const index = field.state.value.indexOf(
                                    addon.id
                                  );
                                  if (index > -1) {
                                    field.removeValue(index);
                                  }
                                }
                              }}
                            />
                            <FieldContent>
                              <FieldLabel htmlFor={addon.id}>
                                {addon.title}
                              </FieldLabel>
                              <FieldDescription>
                                {addon.description}
                              </FieldDescription>
                            </FieldContent>
                          </Field>
                        ))}
                      </FieldGroup>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </FieldSet>
                  );
                }}
                mode="array"
                name="addons"
              />
              <FieldSeparator />
              <form.Field
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldTitle>Team Size</FieldTitle>
                      <FieldDescription>
                        How many people will be using the subscription?
                      </FieldDescription>
                      <Slider
                        id={field.name}
                        max={50}
                        min={1}
                        name={field.name}
                        onValueChange={(value) =>
                          field.handleChange(value as number)
                        }
                        step={10}
                        value={[field.state.value]}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
                name="teamSize"
              />
              <FieldSeparator />
              <form.Field
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldLabel htmlFor={field.name}>
                          Email Notifications
                        </FieldLabel>
                        <FieldDescription>
                          Receive email updates about your subscription
                        </FieldDescription>
                      </FieldContent>
                      <Switch
                        checked={field.state.value}
                        id={field.name}
                        name={field.name}
                        onCheckedChange={field.handleChange}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
                name="emailNotifications"
              />
              <FieldSeparator />
              <form.Field
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Start Date</FieldLabel>
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              className="justify-start"
                              id={field.name}
                              variant="outline"
                            >
                              {field.state.value ? (
                                format(field.state.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          }
                        />
                        <PopoverContent align="start" className="w-auto p-0">
                          <Calendar
                            mode="single"
                            onSelect={field.handleChange}
                            required
                            selected={field.state.value}
                          />
                        </PopoverContent>
                      </Popover>
                      <FieldDescription>
                        Choose when your subscription should start
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
                name="startDate"
              />
              <FieldSeparator />
              <form.Field
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldTitle>Theme Preference</FieldTitle>
                      <ToggleGroup
                        aria-invalid={isInvalid}
                        id={field.name}
                        onValueChange={(value) =>
                          value && field.handleChange(value[0])
                        }
                        value={[field.state.value[0]]}
                        variant="outline"
                      >
                        <ToggleGroupItem value="light">Light</ToggleGroupItem>
                        <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
                        <ToggleGroupItem value="system">System</ToggleGroupItem>
                      </ToggleGroup>
                      <FieldDescription>
                        Choose your preferred color theme
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
                name="theme"
              />
              <FieldSeparator />
              <form.Field
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <Input
                        aria-invalid={isInvalid}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter your password"
                        type="password"
                        value={field.state.value}
                      />
                      <FieldDescription>
                        Must contain uppercase, lowercase, number, and be 8+
                        characters
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
                name="password"
              />
              <FieldSeparator />
              <form.Field
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Additional Comments
                      </FieldLabel>
                      <Textarea
                        aria-invalid={isInvalid}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Tell us more about your needs..."
                        rows={3}
                        value={field.state.value}
                      />
                      <FieldDescription>
                        Share any additional requirements or feedback (10-240
                        characters)
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
                name="comments"
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="border-t">
          <Field className="justify-end" orientation="horizontal">
            <Button
              onClick={() => form.reset()}
              type="button"
              variant="outline"
            >
              Reset
            </Button>
            <Button form="example-form" type="submit">
              Submit
            </Button>
          </Field>
        </CardFooter>
      </Card>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submitted Values</DialogTitle>
            <DialogDescription>
              Here are the values you submitted.
            </DialogDescription>
          </DialogHeader>
          <pre className="overflow-x-auto rounded-md bg-black p-4 font-mono text-sm text-white">
            <code>{JSON.stringify(values, null, 2)}</code>
          </pre>
        </DialogContent>
      </Dialog>
    </>
  );
}
