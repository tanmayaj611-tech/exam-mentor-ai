<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Mock tests reuse quizzes/quiz_questions (kind=mock, section per question) — one scoring and review path for practice and mocks.
- UI Marathi labels live in src/lib/i18n.ts keyed by English text — missing keys fall back to English safely.
- Server entry (src/server.ts) imports src/lib/server-env.ts first — fills SUPABASE_URL/PUBLISHABLE_KEY from public build-time VITE_ values when the host's runtime env lacks them (Netlify scope issues).
