import { ContentPage, contentMetadata } from "@/features/content/components/ContentPage";

export const revalidate = 3600;

export const generateMetadata = () => contentMetadata("dostava-i-povrat");

export default function Page() {
  return <ContentPage slug="dostava-i-povrat" />;
}
