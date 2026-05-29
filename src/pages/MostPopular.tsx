import TrendingSection from "@/components/TrendingSection";
import { useTranslation } from "react-i18next";

const MostPopular = () => {
  const { t } = useTranslation();

  return (
    <div className="py-8">
      <div className="container px-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("mostPopular.title")}</h1>
      </div>
      <TrendingSection />
    </div>
  );
};

export default MostPopular;
