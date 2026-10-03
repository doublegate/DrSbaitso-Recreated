import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ConversationSession } from '@/types';

const printHtml = vi.fn();
const downloadExportResult = vi.fn();

vi.mock('@/utils/advancedExport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/advancedExport')>()),
  printHtml: (html: string) => printHtml(html),
  downloadExportResult: (result: unknown) => downloadExportResult(result),
}));

const { AdvancedExporter } = await import('@/components/AdvancedExporter');

const session: ConversationSession = {
  id: 's1',
  name: 'Night <shift>',
  characterId: 'sbaitso',
  themeId: 'dos-blue',
  audioQualityId: 'default',
  messages: [{ author: 'user', text: 'hello' }],
  createdAt: 1,
  updatedAt: 2,
  messageCount: 1,
  glitchCount: 0,
};

const renderExporter = () =>
  render(<AdvancedExporter isOpen onClose={() => {}} sessions={[session]} themes={[]} currentSession={session} />);

describe('AdvancedExporter print/PDF tab', () => {
  afterEach(() => vi.clearAllMocks());

  it('labels PDF honestly and opens the print dialog with the escaped document', () => {
    renderExporter();
    fireEvent.click(screen.getByRole('button', { name: 'PDF (VIA PRINT DIALOG)' }));
    expect(printHtml).toHaveBeenCalledTimes(1);
    const html = printHtml.mock.calls[0][0] as string;
    expect(html).toContain('Night &lt;shift&gt;');
    expect(downloadExportResult).not.toHaveBeenCalled();
  });

  it('keeps the HTML download as its own option', async () => {
    renderExporter();
    fireEvent.click(screen.getByRole('button', { name: 'DOWNLOAD HTML' }));
    await waitFor(() => expect(downloadExportResult).toHaveBeenCalledTimes(1));
    expect(downloadExportResult.mock.calls[0][0]).toMatchObject({ mimeType: 'text/html' });
    expect(printHtml).not.toHaveBeenCalled();
  });

  it('no longer offers a "PDF" batch format that produced HTML', () => {
    renderExporter();
    fireEvent.click(screen.getByText(/Batch/));
    expect(screen.queryByRole('option', { name: 'PDF' })).toBeNull();
    expect(screen.getByRole('option', { name: 'HTML (print-ready)' })).toBeInTheDocument();
  });
});
