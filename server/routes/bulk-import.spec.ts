import { describe, expect, it, vi } from 'vitest';
import { rewritePracticeContentSectionImages } from './bulk-import';

describe('rewritePracticeContentSectionImages', () => {
  it('rewrites every practice section image and reuses uploads for duplicate source URLs', async () => {
    const uploadImage = vi.fn(async (imageUrl: string) => `https://cdn.example.com/${encodeURIComponent(imageUrl)}`);

    const content = {
      hero: { sectionLabel: 'Brain Injury Lawyer' },
      contentSections: [
        { body: '<p>Section one</p>', image: 'https://images.example.com/one.jpg', imageAlt: 'One' },
        { body: '<p>Section two</p>', image: 'https://images.example.com/two.jpg', imageAlt: 'Two' },
        { body: '<p>Section three</p>', image: 'https://images.example.com/one.jpg', imageAlt: 'Repeat' },
        { body: '<p>Section four</p>', image: '', imageAlt: '' },
      ],
    };

    const rewritten = await rewritePracticeContentSectionImages(content, uploadImage) as {
      contentSections: Array<{ image: string; imageAlt: string }>;
    };

    expect(uploadImage).toHaveBeenCalledTimes(2);
    expect(uploadImage).toHaveBeenNthCalledWith(1, 'https://images.example.com/one.jpg');
    expect(uploadImage).toHaveBeenNthCalledWith(2, 'https://images.example.com/two.jpg');
    expect(rewritten.contentSections[0].image).toBe('https://cdn.example.com/https%3A%2F%2Fimages.example.com%2Fone.jpg');
    expect(rewritten.contentSections[1].image).toBe('https://cdn.example.com/https%3A%2F%2Fimages.example.com%2Ftwo.jpg');
    expect(rewritten.contentSections[2].image).toBe('https://cdn.example.com/https%3A%2F%2Fimages.example.com%2Fone.jpg');
    expect(rewritten.contentSections[3].image).toBe('');
    expect(rewritten.contentSections[2].imageAlt).toBe('Repeat');
  });

  it('leaves practice content unchanged when there are no external section images to upload', async () => {
    const uploadImage = vi.fn(async (imageUrl: string) => imageUrl);
    const content = {
      contentSections: [
        { body: '<p>Section one</p>', image: '/media/local.jpg', imageAlt: 'Local' },
        { body: '<p>Section two</p>', image: '', imageAlt: '' },
      ],
    };

    const rewritten = await rewritePracticeContentSectionImages(content, uploadImage);

    expect(uploadImage).not.toHaveBeenCalled();
    expect(rewritten).toEqual(content);
  });
});
