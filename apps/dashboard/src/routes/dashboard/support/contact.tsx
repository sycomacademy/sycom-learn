import { buttonVariants } from "@sycom/ui/components/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@sycom/ui/components/card";
import { InstagramLogo } from "@sycom/ui/components/logos/instagram";
import { LinkedinLogo } from "@sycom/ui/components/logos/linkedin";
import { MetaLogo } from "@sycom/ui/components/logos/meta";
import { TwitterLogo } from "@sycom/ui/components/logos/twitter";
import { contacts } from "@sycom/ui/lib/constants";
import { cn } from "@sycom/ui/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

export const Route = createFileRoute("/dashboard/support/contact")({
  component: ContactPage,
});

function ContactPage() {
  const socialIcons = {
    Twitter: TwitterLogo,
    Facebook: MetaLogo,
    Instagram: InstagramLogo,
    LinkedIn: LinkedinLogo,
  } as const;
  const channels = [
    {
      label: "Phone",
      value: contacts.support.phone.contact,
      href: `tel:${contacts.support.phone.contact}`,
    },
    {
      label: "Email",
      value: contacts.support.email.contact,
      href: `mailto:${contacts.support.email.contact}`,
    },
  ];
  const socialLinks = [
    { label: "Twitter", href: contacts.socialMedia.twitter.contact },
    { label: "Facebook", href: contacts.socialMedia.facebook.contact },
    { label: "Instagram", href: contacts.socialMedia.instagram.contact },
    { label: "LinkedIn", href: contacts.socialMedia.linkedin.contact },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Contact Information</CardTitle>
          <CardDescription className="text-sm">
            Reach out to us directly through any of the following channels.
          </CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-3 pt-0">
          {channels.map((channel) => (
            <div
              className="flex items-center gap-3 rounded-md border px-3 py-2.5"
              key={`${channel.label}-${channel.value}`}
            >
              <div className="rounded-full border p-2 text-muted-foreground">
                {channel.label === "Phone" ? (
                  <PhoneIcon aria-hidden className="size-4" />
                ) : (
                  <MailIcon aria-hidden className="size-4" />
                )}
              </div>
              <div className="flex flex-col">
                <p className="text-xs text-muted-foreground">{channel.label}</p>
                <a className="text-sm font-medium hover:underline" href={channel.href}>
                  {channel.value}
                </a>
              </div>
            </div>
          ))}
        </CardPanel>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Follow Us on Social Media</CardTitle>
          <CardDescription className="text-sm">
            Stay connected and get the latest updates from our social channels.
          </CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-wrap gap-3 pt-0">
          {socialLinks.map((link) => {
            const Icon = socialIcons[link.label as keyof typeof socialIcons];
            return (
              <a
                className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
                href={link.href}
                key={link.label}
                rel="noreferrer"
                target="_blank"
              >
                {Icon ? <Icon aria-hidden className="size-4" /> : null}
                {link.label}
              </a>
            );
          })}
        </CardPanel>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Business Hours &amp; Location</CardTitle>
          <CardDescription className="text-sm">
            Our support team is available during the following hours.
          </CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-4 pt-0">
          <div className="flex flex-col divide-y divide-border">
            {contacts.address.businessHours.map((entry) => (
              <div
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                key={entry.day}
              >
                <p className="text-sm text-muted-foreground">{entry.day}</p>
                <p className="text-sm font-medium">{entry.value}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{contacts.address.timezoneLabel}</p>
          <div className="flex items-start gap-3 rounded-md border px-3 py-3">
            <div className="rounded-full border p-2 text-muted-foreground">
              <MapPinIcon aria-hidden className="size-4" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="text-sm font-medium">{contacts.address.address.line1}</p>
              <p className="text-sm text-muted-foreground">{contacts.address.address.line2}</p>
              <p className="text-sm text-muted-foreground">{contacts.address.address.country}</p>
            </div>
          </div>
        </CardPanel>
      </Card>
    </div>
  );
}
