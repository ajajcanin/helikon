import {
  ArrowLeftRight,
  BookOpen,
  BookOpenCheck,
  Boxes,
  ChartColumn,
  ChevronDown,
  ChevronUp,
  Factory,
  FileText,
  FolderInput,
  FolderTree,
  History,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  Trash2,
  Truck,
  Users,
  X,
} from "lucide-react";

const ICONS = {
  overview: LayoutDashboard,
  orders: ShoppingBag,
  delivery: Truck,
  products: Boxes,
  categories: FolderTree,
  manufacturers: Factory,
  analytics: ChartColumn,
  integrations: ArrowLeftRight,
  review: BookOpenCheck,
  users: Users,
  settings: Settings,
  history: History,
  search: Search,
  cart: ShoppingBag,
  menu: Menu,
  close: X,
  content: FileText,
  journal: BookOpen,
  move: FolderInput,
  trash: Trash2,
  up: ChevronUp,
  down: ChevronDown,
} as const;

export type IconName = keyof typeof ICONS;

/** The only place Lucide icons are used. Decorative: the label next to it says what it means. */
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const Glyph = ICONS[name];
  return <Glyph size={size} strokeWidth={1.5} aria-hidden="true" />;
}
