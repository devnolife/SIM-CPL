// ============================ MOCK API DI PERAMBAN ============================
// Dipakai bila NEXT_PUBLIC_MOCK_API=1 (demo Vercel): permintaan API dijawab oleh
// mock/api.mjs di peramban, tanpa backend Go maupun `npm run mock`. Data dan
// rumusnya sama dengan mock-server.cjs.
//
// Impor nilai disimpan di localStorage dan diputar ulang saat halaman dimuat
// ulang, jadi tiap pengunjung memegang salinan data contohnya sendiri.

type MockApi = typeof import('../../mock/api.mjs');

const WRITES_KEY = 'simcpl_demo_writes';
const IMPORT_PATH = '/api/nilai-mk/import';
/** Meniru jeda jaringan agar status memuat dan pembatalan berperilaku seperti dengan backend. */
const LATENCY_MS = 120;

let mockApi: Promise<MockApi> | null = null;

function savedWrites(): unknown[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(WRITES_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWrite(body: unknown) {
  try {
    localStorage.setItem(WRITES_KEY, JSON.stringify([...savedWrites(), body]));
  } catch {
    // Penyimpanan penuh atau diblokir: perubahan tetap berlaku sampai halaman dimuat ulang.
  }
}

function loadMockApi(): Promise<MockApi> {
  mockApi ??= import('../../mock/api.mjs').then((api) => {
    for (const body of savedWrites()) api.handle('POST', IMPORT_PATH, body);
    return api;
  });
  return mockApi;
}

function delay(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException('The operation was aborted.', 'AbortError');
    if (signal?.aborted) return reject(abortError());
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Pengganti `fetch` untuk mode mock; status dan body sama dengan mock-server.cjs. */
export async function mockFetch(url: string, init?: RequestInit): Promise<Response> {
  const api = await loadMockApi();
  await delay(LATENCY_MS, init?.signal);

  const method = (init?.method ?? 'GET').toUpperCase();
  let body: unknown;
  if (typeof init?.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = null;
    }
  }

  const { status, data } = api.handle(method, url, body);
  if (method === 'POST' && status === 200 && new URL(url, 'http://mock.local').pathname === IMPORT_PATH) saveWrite(body);

  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
