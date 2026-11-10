import { supabase } from '@/lib/supabase';
import {
  BOOK_SECTIONS,
  GHOSN_AL_BAN_META,
  type BookSection
} from '@/data/ghosnAlBanKnowledge';

export interface ReferenceBookRecord {
  id: string;
  dbRowId?: string;
  title: string;
  author: string;
  fileType: 'builtin' | 'pdf-text' | 'pdf-scanned' | 'word' | 'image-ocr' | 'text';
  fileName: string;
  createdAt: string;
  totalPages: number;
  sections: BookSection[];
}

const DB_NAME = 'ouarjlane_history_refs_db';
const DB_VERSION = 1;
const STORE_BOOKS = 'reference_books';
const DELETED_BUILTIN_KEY = 'ouarjlane_deleted_builtin_ids_v1';
const GEMINI_KEY_STORAGE = 'ouarjlane_admin_gemini_ocr_key';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function getDeletedBuiltinIdsLocal(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_BUILTIN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function setDeletedBuiltinIdsLocal(ids: Set<string>) {
  localStorage.setItem(DELETED_BUILTIN_KEY, JSON.stringify(Array.from(ids)));
}

export function getAdminOcrApiKey(): string {
  return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
}

export function setAdminOcrApiKey(key: string) {
  localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
}

// ── Cloud Sync for Deleted Built-in IDs (via heritage_archive) ────────────
async function fetchCloudDeletedBuiltinIds(): Promise<{ rowId?: string; ids: Set<string> }> {
  try {
    const { data, error } = await supabase
      .from('heritage_archive')
      .select('id, content')
      .like('content', 'HREF_DELETED::%')
      .limit(1);

    if (error || !data || data.length === 0) {
      return { ids: getDeletedBuiltinIdsLocal() };
    }
    const row = data[0];
    const jsonStr = (row.content as string).slice('HREF_DELETED::'.length);
    const parsed = JSON.parse(jsonStr);
    const set = new Set<string>(Array.isArray(parsed) ? parsed : []);
    setDeletedBuiltinIdsLocal(set);
    return { rowId: row.id, ids: set };
  } catch {
    return { ids: getDeletedBuiltinIdsLocal() };
  }
}

async function saveCloudDeletedBuiltinIds(ids: Set<string>): Promise<void> {
  setDeletedBuiltinIdsLocal(ids);
  try {
    const { data } = await supabase
      .from('heritage_archive')
      .select('id')
      .like('content', 'HREF_DELETED::%')
      .limit(1);

    const payload = `HREF_DELETED::${JSON.stringify(Array.from(ids))}`;
    if (data && data.length > 0) {
      await supabase
        .from('heritage_archive')
        .update({ content: payload })
        .eq('id', data[0].id);
    } else {
      await supabase.from('heritage_archive').insert({
        title: '__SYSTEM_HREF_DELETED__',
        content: payload,
        image_url: null
      });
    }
  } catch {
    // Fallback to localStorage already done
  }
}

export function getDeletedBuiltinIds(): Set<string> {
  return getDeletedBuiltinIdsLocal();
}

// ── Upload DataURL Image to Supabase Storage (Bucket: events) ─────────────
async function uploadPageImageToCloud(dataUrl: string, bookId: string, pageNum: number): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl || '/book-ref/spread_1.jpg';
  }
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const filePath = `book-refs/${bookId}-page-${pageNum}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('events').upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: true
    });
    if (!error) {
      const { data } = supabase.storage.from('events').getPublicUrl(filePath);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }
  } catch {
    // Fallback to dataUrl if storage upload fails
  }
  return dataUrl;
}

// ── Local IndexedDB Helpers ───────────────────────────────────────────────
async function getLocalUploadedBooks(): Promise<ReferenceBookRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKS, 'readonly');
      const store = tx.objectStore(STORE_BOOKS);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result as ReferenceBookRecord[]) || [];
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function saveLocalBook(book: ReferenceBookRecord): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKS, 'readwrite');
      const store = tx.objectStore(STORE_BOOKS);
      const req = store.put(book);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore IndexedDB error
  }
}

async function deleteLocalBook(bookId: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKS, 'readwrite');
      const store = tx.objectStore(STORE_BOOKS);
      const req = store.delete(bookId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore
  }
}

// ── Cloud + Local Unified Reference Books CRUD ───────────────────────────
export async function getUploadedBooks(): Promise<ReferenceBookRecord[]> {
  const localBooks = await getLocalUploadedBooks();
  try {
    const { data, error } = await supabase
      .from('heritage_archive')
      .select('id, title, content, created_at')
      .like('content', 'HREF_BOOK::%')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return localBooks;
    }

    const cloudBooks: ReferenceBookRecord[] = [];
    for (const row of data) {
      try {
        const jsonPart = (row.content as string).slice('HREF_BOOK::'.length);
        const parsed = JSON.parse(jsonPart) as ReferenceBookRecord;
        parsed.dbRowId = row.id;
        cloudBooks.push(parsed);
      } catch {
        // Ignore malformed row
      }
    }

    // Merge cloudBooks and any local-only books
    const byId = new Map<string, ReferenceBookRecord>();
    for (const cb of cloudBooks) {
      byId.set(cb.id, cb);
    }
    for (const lb of localBooks) {
      if (!byId.has(lb.id)) {
        byId.set(lb.id, lb);
      }
    }

    return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return localBooks;
  }
}

export async function saveUploadedBook(book: ReferenceBookRecord): Promise<void> {
  await saveLocalBook(book);

  try {
    const payload = `HREF_BOOK::${JSON.stringify(book)}`;
    if (book.dbRowId) {
      await supabase
        .from('heritage_archive')
        .update({
          title: book.title,
          content: payload
        })
        .eq('id', book.dbRowId);
    } else {
      const { data } = await supabase
        .from('heritage_archive')
        .insert({
          title: book.title,
          content: payload,
          image_url: null
        })
        .select('id')
        .maybeSingle();

      if (data?.id) {
        book.dbRowId = data.id;
        await saveLocalBook(book);
      }
    }
  } catch {
    // Already saved locally
  }
}

export async function deleteUploadedBook(bookId: string): Promise<void> {
  if (bookId === GHOSN_AL_BAN_META.id) {
    const { ids } = await fetchCloudDeletedBuiltinIds();
    ids.add(GHOSN_AL_BAN_META.id);
    await saveCloudDeletedBuiltinIds(ids);
    return;
  }

  const all = await getUploadedBooks();
  const target = all.find((b) => b.id === bookId);
  await deleteLocalBook(bookId);

  try {
    if (target?.dbRowId) {
      await supabase.from('heritage_archive').delete().eq('id', target.dbRowId);
    } else {
      await supabase
        .from('heritage_archive')
        .delete()
        .like('content', `%${bookId}%`);
    }
  } catch {
    // Ignore cloud delete error
  }
}

export async function deleteSingleSection(bookId: string, sectionId: string): Promise<void> {
  if (bookId === GHOSN_AL_BAN_META.id) {
    const { ids } = await fetchCloudDeletedBuiltinIds();
    ids.add(sectionId);
    await saveCloudDeletedBuiltinIds(ids);
    return;
  }

  const books = await getUploadedBooks();
  const target = books.find((b) => b.id === bookId);
  if (!target) return;
  target.sections = target.sections.filter((s) => s.id !== sectionId);
  if (target.sections.length === 0) {
    await deleteUploadedBook(bookId);
  } else {
    await saveUploadedBook(target);
  }
}

export async function restoreBuiltinGhosnAlBan(): Promise<void> {
  localStorage.removeItem(DELETED_BUILTIN_KEY);
  try {
    await supabase
      .from('heritage_archive')
      .delete()
      .like('content', 'HREF_DELETED::%');
  } catch {
    // Ignore
  }
}

export async function getAllReferenceBooks(): Promise<ReferenceBookRecord[]> {
  const [uploaded, deletedInfo] = await Promise.all([
    getUploadedBooks(),
    fetchCloudDeletedBuiltinIds()
  ]);
  const deletedIds = deletedInfo.ids;

  const result: ReferenceBookRecord[] = [...uploaded];

  if (!deletedIds.has(GHOSN_AL_BAN_META.id)) {
    const activeBuiltinSections = BOOK_SECTIONS.filter((s) => !deletedIds.has(s.id)).map((s) => ({
      ...s,
      bookId: GHOSN_AL_BAN_META.id,
      bookTitle: GHOSN_AL_BAN_META.title,
      bookAuthor: GHOSN_AL_BAN_META.author
    }));

    if (activeBuiltinSections.length > 0) {
      result.push({
        id: GHOSN_AL_BAN_META.id,
        title: GHOSN_AL_BAN_META.title,
        author: GHOSN_AL_BAN_META.author,
        fileType: 'builtin',
        fileName: 'غصن البان في تاريخ وارجلان.pdf',
        createdAt: '2026-01-01T00:00:00.000Z',
        totalPages: GHOSN_AL_BAN_META.totalPages,
        sections: activeBuiltinSections
      });
    }
  }

  return result;
}

export async function getAllActiveSections(): Promise<BookSection[]> {
  const books = await getAllReferenceBooks();
  const all: BookSection[] = [];
  for (const b of books) {
    for (const sec of b.sections) {
      all.push({
        ...sec,
        bookId: b.id,
        bookTitle: sec.bookTitle || b.title,
        bookAuthor: sec.bookAuthor || b.author
      });
    }
  }
  return all;
}

// ── Text Chunking & Section Builder ─────────────────────────────────────────
function extractKeywordsFromArabicText(text: string): string[] {
  const words = text
    .replace(/[^\u0621-\u064A\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4);
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map((e) => e[0]);
}

function buildSectionsFromBlocks(
  bookId: string,
  bookTitle: string,
  bookAuthor: string,
  blocks: Array<{ label: string; pageLabel: string; text: string; pageImage?: string }>
): BookSection[] {
  const sections: BookSection[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const blk = blocks[i];
    const clean = blk.text.replace(/\s+\n/g, '\n').trim();
    if (clean.length < 15) continue;

    const lines = clean
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 10);

    const firstHeading =
      lines[0] && lines[0].length <= 95
        ? lines[0]
        : `${blk.label} (${blk.pageLabel})`;

    const summary = clean.slice(0, 360) + (clean.length > 360 ? '...' : '');
    const verbatimQuote = clean.slice(0, 520);
    const details = lines.slice(0, 5).map((l) => (l.length > 220 ? l.slice(0, 220) + '...' : l));

    sections.push({
      id: `${bookId}-sec-${i + 1}-${Date.now()}`,
      bookId,
      bookTitle,
      bookAuthor,
      chapterTitle: firstHeading,
      category: 'الزيارات والمخطوطات',
      pages: blk.pageLabel,
      spreadImage: blk.pageImage || '/book-ref/spread_1.jpg',
      keywords: extractKeywordsFromArabicText(clean),
      summary,
      verbatimQuote,
      details: details.length > 0 ? details : [summary]
    });
  }

  return sections;
}

// ── OCR Helper (Gemini Vision if key present, else Tesseract.js Arabic) ────
async function performArabicOcrOnDataUrl(
  imageDataUrl: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  const geminiKey = getAdminOcrApiKey();
  if (geminiKey) {
    try {
      const base64Data = imageDataUrl.split(',')[1];
      const mimeType = imageDataUrl.substring(
        imageDataUrl.indexOf(':') + 1,
        imageDataUrl.indexOf(';')
      );
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          geminiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'استخرج النص العربي الموجود في هذه الصفحة المصورة بدقة تامة دون أي إضافات خارجية:'
                  },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data
                    }
                  }
                ]
              }
            ]
          })
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 10) {
          return text.trim();
        }
      }
    } catch {
      // Fall back to Tesseract.js
    }
  }

  // Fallback: Browser-native Tesseract.js with Arabic ('ara')
  const Tesseract = await import('tesseract.js');
  const result = await Tesseract.recognize(imageDataUrl, 'ara', {
    logger: (m: { status?: string; progress?: number }) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number' && onProgress) {
        onProgress(`جاري القراءة الضوئية (OCR): ${Math.round(m.progress * 100)}%`);
      }
    }
  });
  return result.data.text || '';
}

// ── Main Drag-and-Drop File Processor ──────────────────────────────────────
export interface ProcessFileOptions {
  file: File;
  customTitle?: string;
  customAuthor?: string;
  maxOcrPages?: number;
  onStatus: (statusText: string, progressPct: number) => void;
}

export async function processDroppedReferenceFile(
  opts: ProcessFileOptions
): Promise<ReferenceBookRecord> {
  const { file, customTitle, customAuthor, maxOcrPages = 25, onStatus } = opts;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const bookTitle = customTitle?.trim() || baseName;
  const bookAuthor = customAuthor?.trim() || 'مرجع مرفوع من لوحة الإدارة';
  const bookId = `book-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // 1. Word Document (.docx)
  if (ext === 'docx' || ext === 'doc') {
    onStatus('جاري قراءة مستند Word واستخراج الفصول...', 25);
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const res = await mammoth.extractRawText({ arrayBuffer });
    const fullText = (res.value || '').trim();

    if (!fullText) {
      throw new Error('لم يتم العثور على نص داخل ملف Word.');
    }

    onStatus('جاري تقسيم النص وفهرسة الفقرات ورفعه للسحابة...', 75);
    const chunks: Array<{ label: string; pageLabel: string; text: string }> = [];
    const paragraphs = fullText.split(/\n{2,}/).filter((p) => p.trim().length > 20);
    let currentChunk = '';
    let partIndex = 1;

    for (const p of paragraphs) {
      if ((currentChunk + '\n\n' + p).length > 1400 && currentChunk.length > 200) {
        chunks.push({
          label: `${bookTitle} - القسم ${partIndex}`,
          pageLabel: `القسم ${partIndex}`,
          text: currentChunk.trim()
        });
        partIndex++;
        currentChunk = p;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + p;
      }
    }
    if (currentChunk.trim().length > 15) {
      chunks.push({
        label: `${bookTitle} - القسم ${partIndex}`,
        pageLabel: `القسم ${partIndex}`,
        text: currentChunk.trim()
      });
    }

    const sections = buildSectionsFromBlocks(bookId, bookTitle, bookAuthor, chunks);
    const record: ReferenceBookRecord = {
      id: bookId,
      title: bookTitle,
      author: bookAuthor,
      fileType: 'word',
      fileName: file.name,
      createdAt: new Date().toISOString(),
      totalPages: sections.length,
      sections
    };
    await saveUploadedBook(record);
    onStatus('اكتملت فهرسة ملف Word ومزامنته عبر السحابة!', 100);
    return record;
  }

  // 2. PDF Document (Text PDF or Scanned PDF)
  if (ext === 'pdf') {
    onStatus('جاري فتح ملف PDF وفحص الصفحات...', 10);
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdfDoc.numPages;

    const blocks: Array<{ label: string; pageLabel: string; text: string; pageImage?: string }> = [];
    let scannedPagesCount = 0;
    const pagesToProcess = Math.min(totalPages, maxOcrPages);

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pct = Math.min(90, Math.round((pageNum / totalPages) * 80) + 10);
      onStatus(`جاري معالجة الصفحة ${pageNum} من ${totalPages}...`, pct);

      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const extractedText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();

      let pageDataUrl: string | undefined;
      if (pageNum <= pagesToProcess || extractedText.length >= 25) {
        try {
          const viewport = page.getViewport({ scale: 1.25 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
            pageDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          }
        } catch {
          // Ignore canvas failure
        }
      }

      if (extractedText.length >= 25) {
        const cloudImgUrl = pageDataUrl
          ? await uploadPageImageToCloud(pageDataUrl, bookId, pageNum)
          : undefined;
        blocks.push({
          label: `${bookTitle} - صفحة ${pageNum}`,
          pageLabel: `ص ${pageNum}`,
          text: extractedText,
          pageImage: cloudImgUrl
        });
      } else if (pageNum <= pagesToProcess && pageDataUrl) {
        scannedPagesCount++;
        onStatus(
          `صفحة مصوّرة (${pageNum}/${pagesToProcess}): جاري استخراج النص العربي بالـ OCR...`,
          pct
        );
        const ocrText = await performArabicOcrOnDataUrl(pageDataUrl, (subMsg) => {
          onStatus(`صفحة ${pageNum}: ${subMsg}`, pct);
        });
        if (ocrText.trim().length >= 15) {
          const cloudImgUrl = await uploadPageImageToCloud(pageDataUrl, bookId, pageNum);
          blocks.push({
            label: `${bookTitle} - صفحة ${pageNum}`,
            pageLabel: `ص ${pageNum}`,
            text: ocrText.trim(),
            pageImage: cloudImgUrl
          });
        }
      }
    }

    if (blocks.length === 0) {
      throw new Error('لم يتمكن النظام من استخراج نصوص كافية من هذا الملف.');
    }

    onStatus('جاري حفظ المرجع ومزامنته على سحابة Supabase لجميع الزوار...', 95);
    const sections = buildSectionsFromBlocks(bookId, bookTitle, bookAuthor, blocks);
    const record: ReferenceBookRecord = {
      id: bookId,
      title: bookTitle,
      author: bookAuthor,
      fileType: scannedPagesCount > 0 ? 'pdf-scanned' : 'pdf-text',
      fileName: file.name,
      createdAt: new Date().toISOString(),
      totalPages,
      sections
    };
    await saveUploadedBook(record);
    onStatus('اكتملت فهرسة ملف PDF ومزامنته لجميع الزوار!', 100);
    return record;
  }

  // 3. Scanned Image (.jpg, .jpeg, .png, .webp)
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    onStatus('جاري قراءة صورة الوثيقة/الصفحة بالـ OCR العربي...', 25);
    const imageDataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    const ocrText = await performArabicOcrOnDataUrl(imageDataUrl, (msg) => {
      onStatus(msg, 65);
    });

    if (ocrText.trim().length < 10) {
      throw new Error('لم يتم العثور على نص عربي واضح في الصورة.');
    }

    onStatus('جاري رفع الوثيقة إلى سحابة Supabase...', 88);
    const cloudImgUrl = await uploadPageImageToCloud(imageDataUrl, bookId, 1);

    const sections = buildSectionsFromBlocks(bookId, bookTitle, bookAuthor, [
      {
        label: bookTitle,
        pageLabel: 'ص 1 (وثيقة مصوّرة)',
        text: ocrText.trim(),
        pageImage: cloudImgUrl
      }
    ]);

    const record: ReferenceBookRecord = {
      id: bookId,
      title: bookTitle,
      author: bookAuthor,
      fileType: 'image-ocr',
      fileName: file.name,
      createdAt: new Date().toISOString(),
      totalPages: 1,
      sections
    };
    await saveUploadedBook(record);
    onStatus('اكتملت فهرسة الصورة ومزامنتها لجميع الزوار!', 100);
    return record;
  }

  // 4. Plain Text / Markdown (.txt, .md)
  onStatus('جاري قراءة الملف النصي وفهرسته على السحابة...', 40);
  const rawText = (await file.text()).trim();
  if (!rawText) {
    throw new Error('الملف النصي فارغ.');
  }

  const paragraphs = rawText.split(/\n{2,}/).filter((p) => p.trim().length > 20);
  const chunks: Array<{ label: string; pageLabel: string; text: string }> = [];
  let current = '';
  let idx = 1;
  for (const p of paragraphs) {
    if ((current + '\n\n' + p).length > 1400 && current.length > 200) {
      chunks.push({
        label: `${bookTitle} - القسم ${idx}`,
        pageLabel: `القسم ${idx}`,
        text: current.trim()
      });
      idx++;
      current = p;
    } else {
      current += (current ? '\n\n' : '') + p;
    }
  }
  if (current.trim().length > 15) {
    chunks.push({
      label: `${bookTitle} - القسم ${idx}`,
      pageLabel: `القسم ${idx}`,
      text: current.trim()
    });
  }

  const sections = buildSectionsFromBlocks(bookId, bookTitle, bookAuthor, chunks);
  const record: ReferenceBookRecord = {
    id: bookId,
    title: bookTitle,
    author: bookAuthor,
    fileType: 'text',
    fileName: file.name,
    createdAt: new Date().toISOString(),
    totalPages: sections.length,
    sections
  };
  await saveUploadedBook(record);
  onStatus('اكتملت فهرسة الملف النصي ومزامنته لجميع الزوار!', 100);
  return record;
}
