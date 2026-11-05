import { beforeEach, describe, expect, it, vi } from "vitest";
import { addPhoto, deletePhoto, replacePhoto } from "@/features/catalog/photos";
import { deleteImage } from "@/server/uploads";
import { resetDb, seedVariant } from "./helpers";

vi.mock("@/server/uploads", () => ({ deleteImage: vi.fn() }));

const actor = { id: null, name: "Klijent" };
const shared = { storageKey: "products/shared-1", width: 320, height: 320 };

describe("a file shared by two sizes' photos", () => {
  beforeEach(async () => {
    await resetDb();
    vi.mocked(deleteImage).mockClear();
  });

  it("is deleted only when the last photo using it goes", async () => {
    const a = await seedVariant();
    const first = await addPhoto(a.productId, shared, actor, a.id);
    const second = await addPhoto(a.productId, shared, actor);

    await deletePhoto(first.id, actor);
    expect(deleteImage).not.toHaveBeenCalled();

    await deletePhoto(second.id, actor);
    expect(deleteImage).toHaveBeenCalledWith(shared.storageKey, [320]);
  });

  it("stays when one of the photos is replaced", async () => {
    const a = await seedVariant();
    const first = await addPhoto(a.productId, shared, actor, a.id);
    await addPhoto(a.productId, shared, actor);

    await replacePhoto(first.id, a.productId, { ...shared, storageKey: "products/new-1" }, actor);
    expect(deleteImage).not.toHaveBeenCalled();
  });
});
