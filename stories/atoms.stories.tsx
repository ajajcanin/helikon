import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Field";
import { Icon } from "@/components/atoms/Icon";
import { PaintSwatch, SmearFilter } from "@/components/atoms/PaintSwatch";

const meta: Meta = { title: "Atoms" };
export default meta;

export const Buttons: StoryObj = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button variant="primary">Naruči</Button>
      <Button>Sačuvaj</Button>
      <Button variant="danger">Obriši</Button>
      <Button variant="icon" aria-label="Obriši">
        <Icon name="trash" size={16} />
      </Button>
    </div>
  ),
};

export const Fields: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState("");
    return (
      <div className="max-w-[360px]">
        <Input label="Ime i prezime" value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
    );
  },
};

export const Swatches: StoryObj = {
  render: () => (
    <div className="grid max-w-[480px] grid-cols-2 gap-4">
      <SmearFilter />
      <PaintSwatch color="#1F3A93" className="aspect-[4/3]" />
      <PaintSwatch color={null} className="aspect-[4/3]" />
    </div>
  ),
};
