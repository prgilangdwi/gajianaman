import { http, HttpResponse } from 'msw';

export const mswHandlers = {
  supabase: [
    http.post(/supabase\.co\/auth\/v1\/token/, () =>
      HttpResponse.json({ user: null, session: null })
    ),
    http.get(/supabase\.co\/rest\/v1\/goals/, () =>
      HttpResponse.json([])
    ),
    http.get(/supabase\.co\/rest\/v1\/transactions/, () =>
      HttpResponse.json([])
    ),
    http.get(/supabase\.co\/rest\/v1\/budgets/, () =>
      HttpResponse.json([])
    ),
    http.get(/supabase\.co\/rest\/v1\/users/, () =>
      HttpResponse.json([])
    ),
  ],
};
