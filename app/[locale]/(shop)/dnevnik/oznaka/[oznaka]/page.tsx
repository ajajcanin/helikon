import { JournalList } from "@/features/content/components/JournalList";

type Props = { params: Promise<{ oznaka: string }> };

export const revalidate = 600;

export function generateStaticParams() {
  return [];
}

export default async function JournalTagPage({ params }: Props) {
  return <JournalList tagSlug={(await params).oznaka} />;
}
