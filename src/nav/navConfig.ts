import {
    Inbox as InboxIcon,
    Collections as CollectionsIcon,
    Bolt as BoltIcon,
    Insights as InsightsIcon,
    Settings as SettingsIcon,
    Help as HelpIcon,
    FileDownload as ExportIcon
  } from '@mui/icons-material';
  
  export type NavItem = {
    id: string;
    label: string;
    icon: React.ElementType;
    route?: string;
    kind: "primary" | "secondary" | "overflow";
  };
  
  export const NAV_ITEMS: NavItem[] = [
    { id: "inbox", label: "Inbox", icon: InboxIcon, route: "/inbox", kind: "primary" },
    { id: "collections", label: "Collections", icon: CollectionsIcon, route: "/collections", kind: "primary" },
    { id: "rules", label: "Rules", icon: BoltIcon, route: "/rules", kind: "primary" },
    { id: "analytics", label: "Analytics", icon: InsightsIcon, route: "/analytics", kind: "primary" },
    { id: "settings", label: "Settings", icon: SettingsIcon, route: "/settings", kind: "primary" },
  
    { id: "export", label: "Export", icon: ExportIcon, kind: "overflow" },
    { id: "help", label: "Help", icon: HelpIcon, kind: "overflow" },
  ];
