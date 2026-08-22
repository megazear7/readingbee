# Reading Bee OpenAI MCP

Local MCP server that proxies image generation to OpenAI. Callers pass a
`description` and an optional `destination` path. The apple reference image and
style prompt are applied inside the tool.

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

The reference image lives at `util/reference/apple.png`.

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
