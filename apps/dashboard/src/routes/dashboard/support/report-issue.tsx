import { zodResolver } from "@hookform/resolvers/zod";
import { uploadFile } from "@sycom/storage/client";
import { Button } from "@sycom/ui/components/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@sycom/ui/components/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { FileUploader } from "@sycom/ui/components/file-uploader";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";
import { Textarea } from "@sycom/ui/components/textarea";
import { toastManager } from "@sycom/ui/components/toast";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

import { useUser } from "@/hooks/use-user";
import { useTRPCClient } from "@/lib/trpc/client";

const reportTypeOptions = [
  { label: "Bug", value: "bug" },
  { label: "Feature request", value: "feature" },
  { label: "Complaint", value: "complaint" },
  { label: "Other", value: "other" },
] as const;
const reportTypeValues = ["bug", "feature", "complaint", "other"] as const;

const reportIssueSchema = z.object({
  type: z.enum(reportTypeValues),
  subject: z
    .string()
    .check(z.trim(), z.minLength(3, "Subject must be at least 3 characters"), z.maxLength(160)),
  description: z
    .string()
    .check(
      z.trim(),
      z.minLength(10, "Description must be at least 10 characters"),
      z.maxLength(5000),
    ),
  screenshot: z.optional(z.any()),
});
type ReportIssueInput = z.infer<typeof reportIssueSchema>;

export function ReportIssuePage() {
  const trpcClient = useTRPCClient();
  const {
    data: { user },
  } = useUser();
  const [uploadProgresses, setUploadProgresses] = useState<Record<string, number>>({});
  const [uploaderResetKey, setUploaderResetKey] = useState(0);

  const form = useForm<ReportIssueInput>({
    resolver: zodResolver(reportIssueSchema),
    defaultValues: {
      type: "bug",
      subject: "",
      description: "",
      screenshot: undefined,
    },
  });

  const onSubmit = async (data: ReportIssueInput) => {
    const reportId = crypto.randomUUID();

    try {
      let imageUrl: string | undefined;
      const screenshotFile = data.screenshot as File | undefined;

      if (screenshotFile) {
        const signedParams = await trpcClient.storage.signUpload.mutate({
          folder: "feedback_reports",
          entityType: "feedback",
          entityId: reportId,
        });

        const uploadResult = await uploadFile({
          file: screenshotFile,
          signedParams,
          onProgress: (progress) => {
            setUploadProgresses((current) => ({ ...current, [screenshotFile.name]: progress }));
          },
        });

        await trpcClient.storage.saveAsset.mutate({
          publicId: uploadResult.publicId,
          secureUrl: uploadResult.secureUrl,
          folder: "feedback_reports",
          entityType: "feedback",
          entityId: reportId,
          resourceType: uploadResult.resourceType,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
          width: uploadResult.width,
          height: uploadResult.height,
          name: screenshotFile.name,
          tags: ["support-report"],
        });

        imageUrl = uploadResult.secureUrl;
      }

      await trpcClient.feedback.submitReport.mutate({
        reportId,
        email: user.email,
        type: data.type,
        subject: data.subject.trim(),
        description: data.description.trim(),
        imageUrl,
      });

      toastManager.add({
        title: "Report submitted",
        description: "Thanks for the report. Our team will review it shortly.",
        type: "success",
      });

      setUploadProgresses({});
      setUploaderResetKey((current) => current + 1);
      form.reset({
        type: reportTypeOptions[0].value,
        subject: "",
        description: "",
        screenshot: undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't submit your report. Check your connection and try again.";

      toastManager.add({
        title: "Failed to submit report",
        description: message,
        type: "error",
      });
    }
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="text-sm">Submit a report</CardTitle>
            <CardDescription className="text-sm">
              Report a bug, request a feature, or share your feedback with us.
            </CardDescription>
          </CardHeader>
          <CardPanel className="flex flex-col gap-4 py-0">
            <FormField
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <FormItem>
                  <Field>
                    <FieldLabel>Report type</FieldLabel>
                    <FormControl>
                      <Select
                        items={reportTypeOptions}
                        onValueChange={(value) => {
                          if (value) {
                            field.onChange(value);
                          }
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {reportTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                  </Field>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field, fieldState }) => (
                <FormItem>
                  <Field>
                    <FieldLabel>Subject</FieldLabel>
                    <FormControl>
                      <Input placeholder="Brief summary of your report" {...field} />
                    </FormControl>
                    <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                  </Field>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <FormItem>
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <FormControl>
                      <Textarea
                        maxLength={5000}
                        placeholder="Provide as much detail as possible..."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                  </Field>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="screenshot"
              render={({ field, fieldState }) => (
                <FormItem className="w-full">
                  <Field className="w-full">
                    <FieldLabel>Screenshot (optional)</FieldLabel>
                    <FormControl>
                      <FileUploader
                        accept="image/*"
                        className="w-full"
                        key={uploaderResetKey}
                        maxFileCount={1}
                        maxSize={1024 * 1024 * 5}
                        onFilesChange={(files) => {
                          const [firstFile] = files;
                          field.onChange(firstFile?.file);
                        }}
                        progresses={uploadProgresses}
                      />
                    </FormControl>
                    <FieldDescription>Upload one image up to 5 MiB</FieldDescription>
                    <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                  </Field>
                </FormItem>
              )}
            />
          </CardPanel>
          <CardFooter className="justify-end">
            <Button loading={form.formState.isSubmitting} type="submit">
              Submit report
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export const Route = createFileRoute("/dashboard/support/report-issue")({
  component: ReportIssuePage,
});
