"use client";

import Form from "next/form";
import React from "react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { addons, type exampleFormSchema } from "../schema";

import { subscriptionAction } from "./actions";

export interface FormState {
  values: z.infer<typeof exampleFormSchema>;
  errors: null | Partial<
    Record<keyof z.infer<typeof exampleFormSchema>, string[]>
  >;
  success: boolean;
}

export function ExampleForm() {
  const formId = React.useId();
  const [formKey, setFormKey] = React.useState(formId);
  const [showResults, setShowResults] = React.useState(false);
  const [formState, formAction, pending] = React.useActionState<
    FormState,
    FormData
  >(subscriptionAction, {
    values: {
      name: "",
      email: "",
      plan: "basic",
      billingPeriod: "",
      addons: ["analytics"],
      teamSize: 1,
      emailNotifications: false,
      comments: "",
      startDate: new Date(),
      theme: "system",
      password: "",
    },
    errors: null,
    success: false,
  });

  React.useEffect(() => {
    if (formState.success) {
      setShowResults(true);
    }
  }, [formState.success]);

  return (
    <>
      <Card className="w-full max-w-lg">
        <CardHeader className="border-b">
          <CardTitle>Subscription Form</CardTitle>
          <CardDescription>
            Create your subscription using server actions and useActionState.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form action={formAction} id="subscription-form" key={formKey}>
            <FieldGroup>
              <Field data-invalid={!!formState.errors?.name?.length}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  aria-invalid={!!formState.errors?.name?.length}
                  autoComplete="off"
                  defaultValue={formState.values.name}
                  disabled={pending}
                  id="name"
                  name="name"
                />
                <FieldDescription>Enter your name</FieldDescription>
                {formState.errors?.name && (
                  <FieldError>{formState.errors.name[0]}</FieldError>
                )}
              </Field>
              <Field data-invalid={!!formState.errors?.email?.length}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  aria-invalid={!!formState.errors?.email?.length}
                  autoComplete="off"
                  defaultValue={formState.values.email}
                  disabled={pending}
                  id="email"
                  name="email"
                  type="email"
                />
                <FieldDescription>Enter your email address</FieldDescription>
                {formState.errors?.email && (
                  <FieldError>{formState.errors.email[0]}</FieldError>
                )}
              </Field>
              <FieldSeparator />
              <FieldSet data-invalid={!!formState.errors?.plan?.length}>
                <FieldLegend>Subscription Plan</FieldLegend>
                <FieldDescription>
                  Choose your subscription plan.
                </FieldDescription>
                <RadioGroup
                  aria-invalid={!!formState.errors?.plan?.length}
                  defaultValue={formState.values.plan}
                  disabled={pending}
                  name="plan"
                >
                  <FieldLabel htmlFor="basic">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Basic</FieldTitle>
                        <FieldDescription>
                          For individuals and small teams
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem id="basic" value="basic" />
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
                      <RadioGroupItem id="pro" value="pro" />
                    </Field>
                  </FieldLabel>
                </RadioGroup>
                {formState.errors?.plan && (
                  <FieldError>{formState.errors.plan[0]}</FieldError>
                )}
              </FieldSet>
              <FieldSeparator />
              <Field data-invalid={!!formState.errors?.billingPeriod?.length}>
                <FieldLabel htmlFor="billingPeriod">Billing Period</FieldLabel>
                <Select
                  aria-invalid={!!formState.errors?.billingPeriod?.length}
                  defaultValue={formState.values.billingPeriod}
                  disabled={pending}
                  name="billingPeriod"
                >
                  <SelectTrigger id="billingPeriod">
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
                {formState.errors?.billingPeriod && (
                  <FieldError>{formState.errors.billingPeriod[0]}</FieldError>
                )}
              </Field>
              <FieldSeparator />
              <FieldSet data-invalid={!!formState.errors?.addons?.length}>
                <FieldLegend>Add-ons</FieldLegend>
                <FieldDescription>
                  Select additional features you&apos;d like to include.
                </FieldDescription>
                <FieldGroup data-slot="checkbox-group">
                  {addons.map((addon) => (
                    <Field key={addon.id} orientation="horizontal">
                      <Checkbox
                        aria-invalid={!!formState.errors?.addons?.length}
                        defaultChecked={formState.values.addons.includes(
                          addon.id
                        )}
                        disabled={pending}
                        id={addon.id}
                        name="addons"
                        value={addon.id}
                      />
                      <FieldContent>
                        <FieldLabel htmlFor={addon.id}>
                          {addon.title}
                        </FieldLabel>
                        <FieldDescription>{addon.description}</FieldDescription>
                      </FieldContent>
                    </Field>
                  ))}
                </FieldGroup>
                {formState.errors?.addons && (
                  <FieldError>{formState.errors.addons[0]}</FieldError>
                )}
              </FieldSet>
              <FieldSeparator />
              <Field data-invalid={!!formState.errors?.teamSize?.length}>
                <FieldLabel htmlFor="teamSize">Team Size</FieldLabel>
                <Input
                  aria-invalid={!!formState.errors?.teamSize?.length}
                  defaultValue={formState.values.teamSize.toString()}
                  disabled={pending}
                  id="teamSize"
                  max="50"
                  min="1"
                  name="teamSize"
                  type="number"
                />
                <FieldDescription>
                  How many people will be using the subscription? (1-50)
                </FieldDescription>
                {formState.errors?.teamSize && (
                  <FieldError>{formState.errors.teamSize[0]}</FieldError>
                )}
              </Field>
              <FieldSeparator />
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="emailNotifications">
                    Email Notifications
                  </FieldLabel>
                  <FieldDescription>
                    Receive email updates about your subscription
                  </FieldDescription>
                </FieldContent>
                <Switch
                  aria-invalid={!!formState.errors?.emailNotifications?.length}
                  defaultChecked={formState.values.emailNotifications}
                  disabled={pending}
                  id="emailNotifications"
                  name="emailNotifications"
                />
              </Field>
              <FieldSeparator />
              <Field data-invalid={!!formState.errors?.startDate?.length}>
                <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
                <Input
                  aria-invalid={!!formState.errors?.startDate?.length}
                  defaultValue={
                    formState.values.startDate.toISOString().split("T")[0]
                  }
                  disabled={pending}
                  id="startDate"
                  name="startDate"
                  type="date"
                />
                <FieldDescription>
                  Choose when your subscription should start
                </FieldDescription>
                {formState.errors?.startDate && (
                  <FieldError>{formState.errors.startDate[0]}</FieldError>
                )}
              </Field>
              <FieldSeparator />
              <Field data-invalid={!!formState.errors?.theme?.length}>
                <FieldLabel htmlFor="theme">Theme Preference</FieldLabel>
                <Select
                  aria-invalid={!!formState.errors?.theme?.length}
                  defaultValue={formState.values.theme}
                  disabled={pending}
                  name="theme"
                >
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Choose your preferred color theme
                </FieldDescription>
                {formState.errors?.theme && (
                  <FieldError>{formState.errors.theme[0]}</FieldError>
                )}
              </Field>
              <FieldSeparator />
              <Field data-invalid={!!formState.errors?.password?.length}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  aria-invalid={!!formState.errors?.password?.length}
                  defaultValue={formState.values.password}
                  disabled={pending}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  type="password"
                />
                <FieldDescription>
                  Must contain uppercase, lowercase, number, and be 8+
                  characters
                </FieldDescription>
                {formState.errors?.password && (
                  <FieldError>{formState.errors.password[0]}</FieldError>
                )}
              </Field>
              <FieldSeparator />
              <Field data-invalid={!!formState.errors?.comments?.length}>
                <FieldLabel htmlFor="comments">Additional Comments</FieldLabel>
                <Textarea
                  aria-invalid={!!formState.errors?.comments?.length}
                  defaultValue={formState.values.comments}
                  disabled={pending}
                  id="comments"
                  name="comments"
                  placeholder="Tell us more about your needs..."
                  rows={3}
                />
                <FieldDescription>
                  Share any additional requirements or feedback (10-240
                  characters)
                </FieldDescription>
                {formState.errors?.comments && (
                  <FieldError>{formState.errors.comments[0]}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </Form>
        </CardContent>
        <CardFooter className="border-t">
          <Field className="justify-end" orientation="horizontal">
            <Button
              disabled={pending}
              form="subscription-form"
              onClick={() => setFormKey(formKey + 1)}
              type="button"
              variant="outline"
            >
              Reset
            </Button>
            <Button disabled={pending} form="subscription-form" type="submit">
              {pending && <Spinner />}
              Create Subscription
            </Button>
          </Field>
        </CardFooter>
      </Card>
      <Dialog onOpenChange={setShowResults} open={showResults}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscription Created!</DialogTitle>
            <DialogDescription>
              Here are the details of your subscription.
            </DialogDescription>
          </DialogHeader>
          <pre className="overflow-x-auto rounded-md bg-black p-4 font-mono text-sm text-white">
            <code>{JSON.stringify(formState.values, null, 2)}</code>
          </pre>
        </DialogContent>
      </Dialog>
    </>
  );
}
