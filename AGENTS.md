<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Application architecture
- Keep the campaign in the index route with section anchors, because the supplied brief explicitly requires a single-page experience.
- Keep reusable validation and normalization in the shared trial-request module and revalidate public submissions server-side, because browser validation cannot protect stored data.
- Store requests privately and derive priority in the database with a unique normalized WhatsApp, because concurrent submissions must obey classification and duplicate rules.
- Load privileged clients only inside the narrowly scoped insert handler and never expose stored requests publicly, because lead data is personal.
- Treat webhook delivery as confirmed only after a successful response and persisted delivery status; keep the URL in server secrets, because unconfigured integrations must not create false confirmations.
- Keep supplied media in asset pointers and visual tokens in the global stylesheet, because the official visual identity and asset delivery must stay consistent.
