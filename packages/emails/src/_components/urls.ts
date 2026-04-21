import { env } from "@sycom/env/server";

const dashboardUrl = env.DASHBOARD_URL;
const websiteUrl = env.WEBSITE_URL;

export function getWebsiteUrl() {
  return websiteUrl;
}

export function getDashboardUrl() {
  return dashboardUrl;
}
