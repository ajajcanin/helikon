import { JournalList } from "@/features/content/components/JournalList";

export const revalidate = 3600;

export default function JournalPage() {
  return <JournalList />;
}
