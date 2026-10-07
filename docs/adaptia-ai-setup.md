# ADAPTIA AI setup and current capabilities

## AI adaptation

The API server reads `OPENAI_API_KEY` from Replit Secrets. The key is never
sent to the browser. The default model is `gpt-5-mini`; set `OPENAI_MODEL` to a
model available to your OpenAI account if you need to change it. Adaptations
use the model for language detection, planning, simplification, translation,
image description, and a separate preservation check. That check compares the
output with the submitted material; it is not external fact-checking.

Requests are limited to 10 per signed-in user per 10 minutes. Image data is
processed in memory for the request and is not saved by this app. Do not submit
sensitive material unless you are comfortable sending it to the configured AI
provider.

## Sign-in

The application uses the Replit-managed Clerk tenant and Clerk's session
cookies. Google sign-in is provided through Clerk, not through a custom
Google Identity Services client in this build. Enable Google as a sign-in
provider in the Replit Auth pane for the Development environment, and enable
it separately for Production before publishing. No Google client secret is
stored in application code.

## Supabase

Supabase credentials were not supplied, so cloud persistence and private
Supabase Storage are not active. Until they are configured, preferences and
adaptation history are stored in this browser only. They are not cloud-synced
or available on another device. Uploaded source files are sent only for the
current adaptation request and are not saved by this app.

The intended server-only environment variables are:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public project key, used only where a browser client is needed |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for private database and storage operations |

To enable Supabase, create a project, add these values through Replit Secrets,
then implement and apply the ADAPTIA profile/adaptation schema and private
bucket policies before switching browser-local history to cloud storage.
Never put `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_` variable or frontend bundle.

## Language capability states

The registry uses stable language codes and the states `FULL`, `PARTIAL`, and
`UNAVAILABLE`. Text translation and visual text understanding are marked
`PARTIAL` only for languages with broader model coverage; unsupported
Eighth-Schedule languages remain visible as `UNAVAILABLE`. Transliteration,
OCR, text-to-speech, and speech-to-text are marked unavailable in this build.
Do not treat the registry as a guarantee of translation quality; review
important content with a fluent speaker.
