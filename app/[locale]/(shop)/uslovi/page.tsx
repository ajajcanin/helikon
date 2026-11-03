import { ContentPage, contentMetadata } from "@/features/content/components/ContentPage";

export const revalidate = 3600;

export const generateMetadata = () => contentMetadata("uslovi");

export default function Page() {
  return <ContentPage slug="uslovi" />;
}
