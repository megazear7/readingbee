# Reading Bee OpenAI MCP

Local MCP server that proxies image generation to OpenAI. Callers pass a
`description` and an optional `destination` path. Each call picks a random
image from `util/reference/` and asks OpenAI to match that style with a
transparent background.

## Setup

```sh
cd util
npm install
cp .env.example .env
```

Put your key in `util/.env` (gitignored):

```
OPENAI_API_KEY=sk-your-key-here
```

Put style references in `util/reference/` (`apple.png`, `dog.png`, and any
other PNG/JPEG/WebP). `make_image` chooses one at random for each call.

## Run

```sh
node util/mcp-server.mjs
```

## Grok config

In `~/.grok/config.toml` or the project's `.grok/config.toml`:

```toml
[mcp_servers.readingbee-openai]
command = "node"
args = ["util/mcp-server.mjs"]
```

The server loads `util/.env` automatically. If `destination` is omitted, PNGs
are written to `util/output/`. If `destination` is set, it is resolved from the
repository root, for example `src/static/letters/bat.png`. An image already at
that path is replaced.
