"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@sycom/ui/components/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Popover, PopoverContent, PopoverTrigger } from "@sycom/ui/components/popover";
import { Textarea } from "@sycom/ui/components/textarea";
import { toastManager } from "@sycom/ui/components/toast";
import { MessageSquareMoreIcon } from "@sycom/ui/components/animated/icons/message-square-more";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";
import { useUser } from "@/hooks/use-user";
import { useTRPCClient } from "@/lib/trpc/client";
import { AnimateIcon } from "@sycom/ui/components/animated/icons/icon";

const FEEDBACK_MAX_LENGTH = 500;

const submitFeedbackSchema = z.object({
  message: z
    .string()
    .check(
      z.trim(),
      z.minLength(5, "Feedback must be at least 5 characters"),
      z.maxLength(FEEDBACK_MAX_LENGTH, "Feedback must be 500 characters or fewer"),
    ),
});
type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

export function FeedbackPopover() {
  const [open, setOpen] = useState(false);
  const trpcClient = useTRPCClient();
  const {
    data: { user },
  } = useUser();

  const form = useForm<SubmitFeedbackInput>({
    resolver: zodResolver(submitFeedbackSchema),
    defaultValues: { message: "" },
  });

  const onSubmit = async (data: SubmitFeedbackInput) => {
    const message = data.message.trim();
    if (!message) {
      form.setError("message", {
        type: "manual",
        message: "Feedback is required",
      });
      return;
    }

    try {
      await trpcClient.feedback.submit.mutate({
        email: user.email,
        message,
      });

      toastManager.add({
        title: "Thank you!",
        description: "Your feedback has been submitted.",
        type: "success",
      });

      form.reset({ message: "" });
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't submit feedback. Please try again.";
      toastManager.add({
        title: "Failed to submit",
        description: message,
        type: "error",
      });
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset({ message: "" });
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      <AnimateIcon animateOnHover>
        <PopoverTrigger
          className="hidden md:flex"
          render={
            <Button aria-label="Open feedback form" size="lg" variant="ghost">
              <MessageSquareMoreIcon size={16} />
              Feedback
            </Button>
          }
        />
      </AnimateIcon>

      <PopoverContent align="end" className="w-80" side="top">
        <div className="mb-2 w-full space-y-1">
          <h3 className="text-sm font-medium text-foreground">Send feedback</h3>
          <p className="text-xs text-muted-foreground">Help us improve by sharing your thoughts.</p>
        </div>

        <Form {...form} className="flex w-full flex-col gap-3">
          <form className="contents" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="message"
              render={({ field, fieldState }) => (
                <FormItem>
                  <Field>
                    <FieldLabel className="text-xs text-muted-foreground sm:text-xs">
                      Your feedback
                    </FieldLabel>
                    <FormControl>
                      <Textarea
                        className="field-sizing-fixed resize-none"
                        maxLength={FEEDBACK_MAX_LENGTH}
                        placeholder="What could we do better?"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FieldDescription className="text-right text-xs">
                      {field.value?.length ?? 0}/{FEEDBACK_MAX_LENGTH}
                    </FieldDescription>
                    <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                  </Field>
                </FormItem>
              )}
            />

            <Button className="w-full" loading={form.formState.isSubmitting} type="submit">
              Submit feedback
            </Button>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
}
