import { AppearanceSettings } from "./appearance-settings";
import { ChatSettings } from "./chat-settings";
import { DisplaySettings } from "./display-settings";
import { ShipRegistrationForm } from "./ship-registration-form";
import { ShippingForm } from "./shipping-form";

export default function FormsPage() {
  return (
    <div className="flex flex-1 flex-col gap-12 p-4">
      <div className="grid flex-1 @3xl:grid-cols-2 @5xl:grid-cols-3 @[120rem]:grid-cols-4 gap-12 [&>div]:max-w-lg">
        <div className="flex flex-col gap-12">
          <ChatSettings />
        </div>
        <div className="flex flex-col gap-12">
          <AppearanceSettings />
        </div>
        <div className="flex flex-col gap-12">
          <DisplaySettings />
        </div>
        <div className="flex flex-col gap-12">
          <ShippingForm />
        </div>
        <div className="col-span-2 flex flex-col gap-12">
          <ShipRegistrationForm />
        </div>
      </div>
    </div>
  );
}
