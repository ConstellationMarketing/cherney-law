import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  fetchMock: vi.fn(),
  uploadMock: vi.fn(),
  getPublicUrlMock: vi.fn(),
  storageFromMock: vi.fn(),
  insertMock: vi.fn(),
  tableFromMock: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClientMock,
}));

import {
  handleBulkImportImages,
  normalizeThirdPartyImageDownloadUrl,
} from "./bulk-import-images";

describe("normalizeThirdPartyImageDownloadUrl", () => {
  it.each([
    [
      "https://images.example.com/photo-300x200.jpg",
      "https://images.example.com/photo.jpg",
    ],
    [
      "https://images.example.com/photo-300x196.webp?fit=cover",
      "https://images.example.com/photo.webp?fit=cover",
    ],
    [
      "https://images.example.com/photo-300x200.jpg.webp#hero",
      "https://images.example.com/photo.jpg.webp#hero",
    ],
    [
      "https://images.example.com/photo-300x196.png.webp?ver=2#section",
      "https://images.example.com/photo.png.webp?ver=2#section",
    ],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeThirdPartyImageDownloadUrl(input)).toBe(expected);
  });

  it("leaves non-matching URLs unchanged", () => {
    const input = "https://images.example.com/photo-768x512.jpg";
    expect(normalizeThirdPartyImageDownloadUrl(input)).toBe(input);
  });
});

describe("handleBulkImportImages", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", mocks.fetchMock);

    process.env.VITE_SUPABASE_URL = "https://supabase.example.com";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const storageApi = {
      upload: mocks.uploadMock,
      getPublicUrl: mocks.getPublicUrlMock,
    };

    mocks.storageFromMock.mockReturnValue(storageApi);
    mocks.tableFromMock.mockReturnValue({ insert: mocks.insertMock });
    mocks.createClientMock.mockReturnValue({
      storage: { from: mocks.storageFromMock },
      from: mocks.tableFromMock,
    });

    mocks.uploadMock.mockResolvedValue({ error: null });
    mocks.getPublicUrlMock.mockReturnValue({
      data: { publicUrl: "https://cdn.example.com/imported.webp" },
    });
    mocks.insertMock.mockResolvedValue({ error: null });
    mocks.fetchMock.mockResolvedValue(
      new Response(Uint8Array.from([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "image/webp" },
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function createResponse() {
    return {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  }

  it("fetches resized jpg URLs using the cleaned original-image URL", async () => {
    const req = {
      body: {
        imageUrls: ["https://images.example.com/photo-300x200.jpg"],
      },
    };
    const res = createResponse();

    await handleBulkImportImages(req as never, res as never);

    expect(mocks.fetchMock).toHaveBeenCalledWith(
      "https://images.example.com/photo.jpg",
      expect.objectContaining({
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BulkImporter/1.0)" },
      }),
    );
    expect(res.json).toHaveBeenCalledWith({
      mappings: [
        {
          originalUrl: "https://images.example.com/photo-300x200.jpg",
          newUrl: "https://cdn.example.com/imported.webp",
        },
      ],
    });
  });

  it("preserves compound extensions and query strings when fetching cleaned URLs", async () => {
    const req = {
      body: {
        imageUrls: ["https://images.example.com/photo-300x196.png.webp?ver=2"],
      },
    };
    const res = createResponse();

    await handleBulkImportImages(req as never, res as never);

    expect(mocks.fetchMock).toHaveBeenCalledWith(
      "https://images.example.com/photo.png.webp?ver=2",
      expect.any(Object),
    );
    expect(mocks.uploadMock).toHaveBeenCalledTimes(1);
    expect(mocks.insertMock).toHaveBeenCalledTimes(1);
  });

  it("fetches non-matching URLs unchanged", async () => {
    const req = {
      body: {
        imageUrls: ["https://images.example.com/photo-768x512.jpg"],
      },
    };
    const res = createResponse();

    await handleBulkImportImages(req as never, res as never);

    expect(mocks.fetchMock).toHaveBeenCalledWith(
      "https://images.example.com/photo-768x512.jpg",
      expect.any(Object),
    );
  });
});
