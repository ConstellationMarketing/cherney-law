import { describe, expect, it, vi } from 'vitest';
import { insertPageWithUrlPathReconciliation, rewritePracticeContentSectionImages } from './bulk-import';

describe('insertPageWithUrlPathReconciliation', () => {
  it('treats duplicate url_path inserts as successful updates when the page already exists', async () => {
    const pageData = {
      title: 'Chapter 13 Bankruptcy Lawyer Sandy Springs',
      url_path: '/chapter-13-bankruptcy-lawyer-sandy-springs/',
      page_type: 'practice_detail',
      content: { hero: { title: 'Chapter 13' } },
    };

    const insertSingle = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: 'duplicate key value violates unique constraint "pages_url_path_key"',
      },
    });
    const insertSelect = vi.fn(() => ({ single: insertSingle }));
    const insert = vi.fn(() => ({ select: insertSelect }));

    const lookupMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'existing-page-id' },
      error: null,
    });
    const lookupEq = vi.fn(() => ({ maybeSingle: lookupMaybeSingle }));
    const lookupSelect = vi.fn(() => ({ eq: lookupEq }));

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq: updateEq }));

    const from = vi
      .fn()
      .mockReturnValueOnce({ insert })
      .mockReturnValueOnce({ select: lookupSelect })
      .mockReturnValueOnce({ update });

    const supabase = { from };

    await expect(insertPageWithUrlPathReconciliation(supabase as never, pageData)).resolves.toEqual({
      entityId: 'existing-page-id',
      action: 'updated',
    });

    expect(from).toHaveBeenNthCalledWith(1, 'pages');
    expect(from).toHaveBeenNthCalledWith(2, 'pages');
    expect(from).toHaveBeenNthCalledWith(3, 'pages');
    expect(insert).toHaveBeenCalledWith(pageData);
    expect(lookupEq).toHaveBeenCalledWith('url_path', pageData.url_path);
    expect(update).toHaveBeenCalledWith(pageData);
    expect(updateEq).toHaveBeenCalledWith('id', 'existing-page-id');
  });

  it('preserves real insert failures when the error is not a url_path duplicate', async () => {
    const pageData = {
      title: 'Test Page',
      url_path: '/test-page/',
    };

    const insertSingle = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: 'permission denied for table pages',
      },
    });
    const insertSelect = vi.fn(() => ({ single: insertSingle }));
    const insert = vi.fn(() => ({ select: insertSelect }));
    const from = vi.fn().mockReturnValue({ insert });

    const supabase = { from };

    await expect(insertPageWithUrlPathReconciliation(supabase as never, pageData)).rejects.toThrow(
      'Insert failed: permission denied for table pages'
    );

    expect(from).toHaveBeenCalledTimes(1);
  });
});

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

  it('clears placeholder data urls instead of preserving them as section images', async () => {
    const uploadImage = vi.fn(async (imageUrl: string) => imageUrl);
    const content = {
      contentSections: [
        { body: '<p>Section one</p>', image: 'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3C/svg%3E', imageAlt: 'Placeholder' },
        { body: '<p>Section two</p>', image: 'https://images.example.com/two.jpg', imageAlt: 'Two' },
      ],
    };

    const rewritten = await rewritePracticeContentSectionImages(content, uploadImage) as {
      contentSections: Array<{ image: string; imageAlt: string }>;
    };

    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(uploadImage).toHaveBeenCalledWith('https://images.example.com/two.jpg');
    expect(rewritten.contentSections[0].image).toBe('');
    expect(rewritten.contentSections[0].imageAlt).toBe('Placeholder');
    expect(rewritten.contentSections[1].image).toBe('https://images.example.com/two.jpg');
  });

  it('recovers later section images from inline lazy-loaded html and removes inline img tags from the body', async () => {
    const uploadImage = vi.fn(async (imageUrl: string) => `https://cdn.example.com/${encodeURIComponent(imageUrl)}`);
    const content = {
      contentSections: [
        {
          body: '<h2>Debt Relief</h2><p><img src="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3C/svg%3E" data-lazy-srcset="https://images.example.com/debt-relief-300x200.jpg.webp 300w, https://images.example.com/debt-relief.jpg.webp 1200w" alt="Debt relief" /></p><p>Debt relief copy.</p>',
          image: '',
          imageAlt: '',
        },
      ],
    };

    const rewritten = await rewritePracticeContentSectionImages(content, uploadImage) as {
      contentSections: Array<{ body: string; image: string; imageAlt: string }>;
    };

    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(uploadImage).toHaveBeenCalledWith('https://images.example.com/debt-relief-300x200.jpg.webp');
    expect(rewritten.contentSections[0].image).toBe('https://cdn.example.com/https%3A%2F%2Fimages.example.com%2Fdebt-relief-300x200.jpg.webp');
    expect(rewritten.contentSections[0].imageAlt).toBe('Debt relief');
    expect(rewritten.contentSections[0].body).toContain('Debt relief copy.');
    expect(rewritten.contentSections[0].body).not.toContain('<img');
  });

  it('recovers noscript fallback images and removes leftover noscript markup from section bodies', async () => {
    const uploadImage = vi.fn(async (imageUrl: string) => `https://cdn.example.com/${encodeURIComponent(imageUrl)}`);
    const content = {
      contentSections: [
        {
          body: '<h2>Employer Notice</h2><p><noscript><img src="https://images.example.com/employer-notice.jpg" alt="Employer notice" /></noscript></p><p>Employer notice copy.</p>',
          image: '',
          imageAlt: '',
        },
      ],
    };

    const rewritten = await rewritePracticeContentSectionImages(content, uploadImage) as {
      contentSections: Array<{ body: string; image: string; imageAlt: string }>;
    };

    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(uploadImage).toHaveBeenCalledWith('https://images.example.com/employer-notice.jpg');
    expect(rewritten.contentSections[0].image).toBe('https://cdn.example.com/https%3A%2F%2Fimages.example.com%2Femployer-notice.jpg');
    expect(rewritten.contentSections[0].imageAlt).toBe('Employer notice');
    expect(rewritten.contentSections[0].body).toContain('Employer notice copy.');
    expect(rewritten.contentSections[0].body).not.toContain('<noscript');
    expect(rewritten.contentSections[0].body).not.toContain('<img');
  });
});
