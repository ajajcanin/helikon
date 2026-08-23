import { StarMark } from "../atoms/StarMark";
import { Overline } from "../atoms/Overline";
import { Heading } from "../atoms/Heading";
import { BodyParagraph } from "../atoms/BodyParagraph";
import { Divider } from "../atoms/Divider";
import { SubscribeForm } from "../molecules/SubscribeForm";

export function HeroContent() {
  return (
    <section className="relative z-2 mx-auto flex w-full max-w-[780px] flex-1 flex-col items-center justify-center px-8 pt-6 pb-10 text-center max-[720px]:px-[22px] max-[720px]:pt-4 max-[720px]:pb-8">
      <StarMark size="lg" alt="Helikon — zvijezda muza" className="mb-[30px]" />

      <Overline tone="accent" size="md" className="animate-rise">
        Radnja se sprema · Otvaranje 2026
      </Overline>

      <Heading className="animate-rise-delay-1 mt-5 max-[460px]:tracking-[0.04em] max-[460px]:text-[32px]">
        Boja se
        <br />
        miješa
      </Heading>

      <BodyParagraph className="animate-rise-delay-2 mt-[26px] max-[720px]:text-lg">
        Police se pune, boje biraju, a detalji polako dolaze na svoje mjesto.
      </BodyParagraph>
      <BodyParagraph className="animate-rise-delay-2 mt-[18px] max-[720px]:text-lg">
        Uskoro otvaramo vrata Helikona — kuće umjetničkih materijala, stvorene za one koji
        od praznog platna vide početak.
      </BodyParagraph>
      <BodyParagraph className="animate-rise-delay-2 mt-[18px] max-[720px]:text-lg">
        A uskoro stiže i webshop, za sve što vam treba kada inspiracija ne želi čekati.
      </BodyParagraph>

      <div className="animate-rise-delay-3 mt-10 w-full max-w-[440px]">
        <Divider />
        <Overline size="sm" className="mt-[22px] mb-3 block">
          Budite prvi koji će znati
        </Overline>
        <SubscribeForm />
      </div>
    </section>
  );
}
