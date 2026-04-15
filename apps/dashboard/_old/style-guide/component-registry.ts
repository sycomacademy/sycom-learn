import FormsPage from "./(pages)/forms/page";
import NextFormPage from "./(pages)/next-form/page";
import TanstackFormPage from "./(pages)/tanstack-form/page";
import { AccordionDemo } from "./demo/accordion-demo";
import { AlertDemo } from "./demo/alert-demo";
import { AlertDialogDemo } from "./demo/alert-dialog-demo";
import { AspectRatioDemo } from "./demo/aspect-ratio-demo";
import { AvatarDemo } from "./demo/avatar-demo";
import { BadgeDemo } from "./demo/badge-demo";
import { BreadcrumbDemo } from "./demo/breadcrumb-demo";
import { ButtonDemo } from "./demo/button-demo";
import { ButtonGroupDemo } from "./demo/button-group-demo";
import { CalendarDemo } from "./demo/calendar-demo";
import { CardDemo } from "./demo/card-demo";
import { CarouselDemo } from "./demo/carousel-demo";
import { ChartDemo } from "./demo/chart-demo";
import { CheckboxDemo } from "./demo/checkbox-demo";
import { CollapsibleDemo } from "./demo/collapsible-demo";
import { ComboboxDemo } from "./demo/combobox-demo";
import { CommandDemo } from "./demo/command-demo";
import { ContextMenuDemo } from "./demo/context-menu-demo";
import { DialogDemo } from "./demo/dialog-demo";
import { DrawerDemo } from "./demo/drawer-demo";
import { EditableDemo } from "./demo/editable-demo";
import { EditorDemo } from "./demo/editor-demo";
import { FileUploaderDemo } from "./demo/file-uploader-demo";
import { FormDemo } from "./demo/form-demo";
import { HoverCardDemo } from "./demo/hover-card-demo";
import { InputDemo } from "./demo/input-demo";
import { InputOTPDemo } from "./demo/input-otp-demo";
import { ItemDemo } from "./demo/item-demo";
import { KbdDemo } from "./demo/kbd-demo";
import { LabelDemo } from "./demo/label-demo";
import { MenubarDemo } from "./demo/menubar-demo";
import { NativeSelectDemo } from "./demo/native-select-demo";
import { PaginationDemo } from "./demo/pagination-demo";
import { PopoverDemo } from "./demo/popover-demo";
import { ProgressDemo } from "./demo/progress-demo";
import { RadioGroupDemo } from "./demo/radio-group-demo";
import { ResizableDemo } from "./demo/resizable-demo";
import { ScrollAreaDemo } from "./demo/scroll-area-demo";
import { SelectDemo } from "./demo/select-demo";
import { SeparatorDemo } from "./demo/separator-demo";
import { SheetDemo } from "./demo/sheet-demo";
import { SkeletonDemo } from "./demo/skeleton-demo";
import { SliderDemo } from "./demo/slider-demo";
import { SonnerDemo } from "./demo/sonner-demo";
import { SpinnerDemo } from "./demo/spinner-demo";
import { SwitchDemo } from "./demo/switch-demo";
import { TableDemo } from "./demo/table-demo";
import { TabsDemo } from "./demo/tabs-demo";
import { TextareaDemo } from "./demo/textarea-demo";
import { ToggleDemo } from "./demo/toggle-demo";
import { ToggleGroupDemo } from "./demo/toggle-group-demo";
import { TooltipDemo } from "./demo/tooltip-demo";

interface ComponentConfig {
  name: string;
  component: React.ComponentType;
  className?: string;
  type: "registry:ui" | "registry:page" | "registry:block";
  href: `/style-guide/${string}`;
  label?: string;
}

export const componentRegistry: Record<string, ComponentConfig> = {
  accordion: {
    name: "Accordion",
    component: AccordionDemo,
    type: "registry:ui",
    href: "/style-guide/accordion",
  },
  alert: {
    name: "Alert",
    component: AlertDemo,
    type: "registry:block",
    href: "/style-guide/alert",
  },
  "alert-dialog": {
    name: "Alert Dialog",
    component: AlertDialogDemo,
    type: "registry:ui",
    href: "/style-guide/alert-dialog",
  },
  "aspect-ratio": {
    name: "Aspect Ratio",
    component: AspectRatioDemo,
    type: "registry:block",
    href: "/style-guide/aspect-ratio",
  },
  avatar: {
    name: "Avatar",
    component: AvatarDemo,
    type: "registry:ui",
    href: "/style-guide/avatar",
  },
  badge: {
    name: "Badge",
    component: BadgeDemo,
    type: "registry:ui",
    href: "/style-guide/badge",
  },
  breadcrumb: {
    name: "Breadcrumb",
    component: BreadcrumbDemo,
    type: "registry:ui",
    href: "/style-guide/breadcrumb",
  },
  button: {
    name: "Button",
    component: ButtonDemo,
    type: "registry:ui",
    href: "/style-guide/button",
  },
  "button-group": {
    name: "Button Group",
    component: ButtonGroupDemo,
    type: "registry:block",
    href: "/style-guide/button-group",
    label: "Button Group",
  },
  calendar: {
    name: "Calendar",
    component: CalendarDemo,
    type: "registry:block",
    href: "/style-guide/calendar",
  },
  card: {
    name: "Card",
    component: CardDemo,
    type: "registry:block",
    href: "/style-guide/card",
  },
  carousel: {
    name: "Carousel",
    component: CarouselDemo,
    type: "registry:block",
    href: "/style-guide/carousel",
  },
  chart: {
    name: "Chart",
    component: ChartDemo,
    className: "w-full",
    type: "registry:block",
    href: "/style-guide/chart",
  },
  checkbox: {
    name: "Checkbox",
    component: CheckboxDemo,
    type: "registry:ui",
    href: "/style-guide/checkbox",
  },
  collapsible: {
    name: "Collapsible",
    component: CollapsibleDemo,
    type: "registry:ui",
    href: "/style-guide/collapsible",
  },
  combobox: {
    name: "Combobox",
    component: ComboboxDemo,
    type: "registry:ui",
    href: "/style-guide/combobox",
  },
  command: {
    name: "Command",
    component: CommandDemo,
    type: "registry:ui",
    href: "/style-guide/command",
  },
  "context-menu": {
    name: "Context Menu",
    component: ContextMenuDemo,
    type: "registry:ui",
    href: "/style-guide/context-menu",
  },

  dialog: {
    name: "Dialog",
    component: DialogDemo,
    type: "registry:ui",
    href: "/style-guide/dialog",
  },
  drawer: {
    name: "Drawer",
    component: DrawerDemo,
    type: "registry:ui",
    href: "/style-guide/drawer",
  },
  editable: {
    name: "Editable",
    component: EditableDemo,
    type: "registry:ui",
    href: "/style-guide/editable",
  },
  editor: {
    name: "Editor",
    component: EditorDemo,
    className: "w-full",
    type: "registry:block",
    href: "/style-guide/editor",
    label: "Editor",
  },
  "file-uploader": {
    name: "File Uploader",
    component: FileUploaderDemo,
    type: "registry:block",
    href: "/style-guide/file-uploader",
  },
  form: {
    name: "Form",
    component: FormDemo,
    type: "registry:ui",
    href: "/style-guide/form",
  },
  "hover-card": {
    name: "Hover Card",
    component: HoverCardDemo,
    type: "registry:ui",
    href: "/style-guide/hover-card",
  },
  input: {
    name: "Input",
    component: InputDemo,
    type: "registry:ui",
    href: "/style-guide/input",
  },
  "input-otp": {
    name: "Input OTP",
    component: InputOTPDemo,
    type: "registry:ui",
    href: "/style-guide/input-otp",
  },
  item: {
    name: "Item",
    component: ItemDemo,
    type: "registry:block",
    href: "/style-guide/item",
    label: "Item",
  },
  kbd: {
    name: "Kbd",
    component: KbdDemo,
    type: "registry:ui",
    href: "/style-guide/kbd",
    label: "Kbd",
  },
  label: {
    name: "Label",
    component: LabelDemo,
    type: "registry:ui",
    href: "/style-guide/label",
  },
  menubar: {
    name: "Menubar",
    component: MenubarDemo,
    type: "registry:ui",
    href: "/style-guide/menubar",
  },
  "native-select": {
    name: "Native Select",
    component: NativeSelectDemo,
    type: "registry:ui",
    href: "/style-guide/native-select",
    label: "Native Select",
  },
  pagination: {
    name: "Pagination",
    component: PaginationDemo,
    type: "registry:ui",
    href: "/style-guide/pagination",
  },
  popover: {
    name: "Popover",
    component: PopoverDemo,
    type: "registry:ui",
    href: "/style-guide/popover",
  },
  progress: {
    name: "Progress",
    component: ProgressDemo,
    type: "registry:ui",
    href: "/style-guide/progress",
  },
  "radio-group": {
    name: "Radio Group",
    component: RadioGroupDemo,
    type: "registry:ui",
    href: "/style-guide/radio-group",
  },
  resizable: {
    name: "Resizable",
    component: ResizableDemo,
    type: "registry:block",
    href: "/style-guide/resizable",
  },
  "scroll-area": {
    name: "Scroll Area",
    component: ScrollAreaDemo,
    type: "registry:block",
    href: "/style-guide/scroll-area",
  },
  select: {
    name: "Select",
    component: SelectDemo,
    type: "registry:ui",
    href: "/style-guide/select",
  },
  separator: {
    name: "Separator",
    component: SeparatorDemo,
    type: "registry:ui",
    href: "/style-guide/separator",
  },
  sheet: {
    name: "Sheet",
    component: SheetDemo,
    type: "registry:block",
    href: "/style-guide/sheet",
  },
  skeleton: {
    name: "Skeleton",
    component: SkeletonDemo,
    type: "registry:block",
    href: "/style-guide/skeleton",
  },
  slider: {
    name: "Slider",
    component: SliderDemo,
    type: "registry:ui",
    href: "/style-guide/slider",
  },
  toast: {
    name: "Toast",
    component: SonnerDemo,
    type: "registry:ui",
    href: "/style-guide/toast",
  },
  spinner: {
    name: "Spinner",
    component: SpinnerDemo,
    type: "registry:block",
    href: "/style-guide/spinner",
    label: "Spinner",
  },
  switch: {
    name: "Switch",
    component: SwitchDemo,
    type: "registry:ui",
    href: "/style-guide/switch",
  },
  table: {
    name: "Table",
    component: TableDemo,
    type: "registry:block",
    href: "/style-guide/table",
  },
  tabs: {
    name: "Tabs",
    component: TabsDemo,
    type: "registry:ui",
    href: "/style-guide/tabs",
  },
  textarea: {
    name: "Textarea",
    component: TextareaDemo,
    type: "registry:ui",
    href: "/style-guide/textarea",
  },
  toggle: {
    name: "Toggle",
    component: ToggleDemo,
    type: "registry:ui",
    href: "/style-guide/toggle",
  },
  "toggle-group": {
    name: "Toggle Group",
    component: ToggleGroupDemo,
    type: "registry:ui",
    href: "/style-guide/toggle-group",
  },
  tooltip: {
    name: "Tooltip",
    component: TooltipDemo,
    type: "registry:ui",
    href: "/style-guide/tooltip",
  },
  blocks: {
    name: "Forms",
    component: FormsPage,
    type: "registry:page",
    href: "/style-guide/forms",
  },
  "next-form": {
    name: "Next.js Form",
    component: NextFormPage,
    type: "registry:page",
    href: "/style-guide/next-form",
  },
  "tanstack-form": {
    name: "Tanstack Form",
    component: TanstackFormPage,
    type: "registry:page",
    href: "/style-guide/tanstack-form",
  },
};

export type ComponentKey = keyof typeof componentRegistry;
