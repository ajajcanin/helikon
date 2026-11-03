import { ContentPage, contentMetadata } from "@/features/content/components/ContentPage";

export const revalidate = 600;

export const generateMetadata = () => contentMetadata("o-nama");

export default function Page() {
  return <ContentPage slug="o-nama" />;
}
