import { api } from './api';

/**
 * Downloads a file from the authenticated API endpoint as a blob,
 * ensuring Bearer tokens are always properly transmitted.
 */
export async function downloadAuthenticatedFile({
  url,
  filename,
  method = 'GET',
  body,
}: {
  url: string;
  filename: string;
  method?: 'GET' | 'POST';
  body?: any;
}): Promise<boolean> {
  try {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken') || localStorage.getItem('token')
        : null;

    // Strip leading /api if present because api instance baseURL is already /api
    const apiPath = url.startsWith('/api/') ? url.replace(/^\/api/, '') : url;

    const response = await api({
      url: apiPath,
      method,
      data: body,
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    // Determine filename
    let downloadName = filename;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        downloadName = match[1];
      }
    }

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', downloadName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
    return true;
  } catch (err: any) {
    console.error('Authenticated download failed, attempting authenticated fallback redirect...', err);
    // Fallback: direct window open with query token param (ensuring leading /api for Next rewrite)
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken') || localStorage.getItem('token')
        : null;

    if (method === 'GET' && token) {
      const browserPath = url.startsWith('/api/') ? url : `/api${url.startsWith('/') ? '' : '/'}${url}`;
      const separator = browserPath.includes('?') ? '&' : '?';
      const authenticatedUrl = `${browserPath}${separator}token=${encodeURIComponent(token)}`;
      window.open(authenticatedUrl, '_blank');
      return true;
    }
    throw err;
  }
}
