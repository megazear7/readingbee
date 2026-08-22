# Reading Bee OpenAI MCP

Local MCP server that proxies image generation to OpenAI. Callers only pass a
`description`. The apple reference image and style prompt are applied inside
the tool.

## Setup

```sh
cd util
npm install
export OPENAI_API_KEY=sk-...
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

Set `OPENAI_API_KEY` in the environment. Generated PNGs are written to
`util/output/`.
