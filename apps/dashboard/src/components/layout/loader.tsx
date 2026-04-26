import { Loader as BaseLoader } from "@sycom/ui/components/loader";

export default function Loader() {
  return <BaseLoader mode="container" text="Loading" spinnerClassName="text-primary  " />;
}

export function RootLoader() {
  return <BaseLoader mode="screen" text="Loading workspace" spinnerClassName=" text-primary  " />;
}
