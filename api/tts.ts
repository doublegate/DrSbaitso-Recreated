/** POST /api/tts: synthesise a persona line as raw PCM16. See api/_lib/gemini.ts. */
import { handleTts } from './_lib/gemini.js';
import { serve } from './_lib/http.js';

export function POST(request: Request): Promise<Response> {
  return serve(request, handleTts);
}
