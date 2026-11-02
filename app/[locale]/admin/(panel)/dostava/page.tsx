import { getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/atoms/PageTitle";
import { listDeliveryRates } from "@/features/orders/admin";
import { DeliveryManager } from "@/features/orders/components/DeliveryManager";

export default async function DeliveryPage() {
  const [rates, t] = await Promise.all([listDeliveryRates(), getTranslations("deliveryRates")]);
  return (
    <>
      <PageTitle intro={t("intro")}>{t("title")}</PageTitle>
      <DeliveryManager rates={rates} />
    </>
  );
}
