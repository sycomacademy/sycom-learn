import { lazy, Suspense } from "react";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sycom/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@sycom/ui/components/charts";
import { formatDate, formatShortMonthDay } from "@sycom/ui/lib/date";

const chartConfig = {
  total: {
    label: "New enrollments",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type EnrollmentChartDay =
  AppRouterOutputs["creator"]["getDashboardOverview"]["enrollmentsByDay"][number];

const LazyContentCreatorEnrollmentsChartContent = lazy(async () => {
  const { Area, AreaChart, CartesianGrid, XAxis, YAxis } = await import("recharts");

  return {
    default: function ContentCreatorEnrollmentsChartContent({
      data,
    }: {
      data: EnrollmentChartDay[];
    }): React.ReactElement {
      return (
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="date"
            tickFormatter={(value) => (typeof value === "string" ? formatShortMonthDay(value) : "")}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(label, payload) => {
                  const rawDate =
                    typeof label === "string"
                      ? label
                      : (payload?.[0]?.payload as { date?: string } | undefined)?.date;

                  return rawDate ? formatDate(rawDate) : null;
                }}
              />
            }
            cursor={false}
          />
          <Area
            dataKey="total"
            fill="var(--color-total)"
            fillOpacity={0.2}
            stroke="var(--color-total)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      );
    },
  };
});

export function ContentCreatorEnrollmentsChart({
  data,
}: {
  data: EnrollmentChartDay[];
}): React.ReactElement {
  return (
    <Card className="h-full shadow-xs">
      <CardHeader>
        <CardTitle>Course enrollments</CardTitle>
        <CardDescription>
          People who enrolled in courses you instruct over the last 7 days.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <ChartContainer className="h-64 w-full min-w-0" config={chartConfig}>
          <Suspense fallback={<div className="h-64 w-full rounded-md bg-muted/40" />}>
            <LazyContentCreatorEnrollmentsChartContent data={data} />
          </Suspense>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
