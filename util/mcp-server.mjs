#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const ROOT = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(ROOT, "..");
loadEnv({ path: join(ROOT, ".env") });
const REFERENCE_IMAGE = join(ROOT, "reference", "apple.png");
const OUTPUT_DIR = join(ROOT, "output");
const MODEL = "gpt-image-2-2026-04-21";
const OPENAI_EDITS_URL = "https://api.openai.com/v1/images/edits";

const promptFor = (description) =>
  `Make an image based on the below description. The background should be transparent and the style should match the style of the provided image.

Description: ${description}`;

const openaiKey = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return key;
};

const editImage = async (prompt, { transparent = true } = {}) => {
  const bytes = await readFile(REFERENCE_IMAGE);
  const form = new FormData();
  form.set("model", MODEL);
  form.set("prompt", prompt);
  form.set("image", new Blob([bytes], { type: "image/png" }), "apple.png");
  form.set("output_format", "png");
  if (transparent) {
    form.set("background", "transparent");
  }

  const response = await fetch(OPENAI_EDITS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey()}`,
    },
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message ?? response.statusText;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  const b64 = body?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI did not return image data");
  }
  return b64;
};

const resolveDestination = (destination) => {
  if (!destination) {
    return null;
  }
  const target = resolve(REPO_ROOT, destination);
  const rel = relative(REPO_ROOT, target);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error("destination must be a path inside the repository");
  }
  return target;
};

const generateImage = async (description) => {
  const prompt = promptFor(description);
  try {
    return await editImage(prompt, { transparent: true });
  } catch (error) {
    if (error.status === 400) {
      return await editImage(prompt, { transparent: false });
    }
    throw error;
  }
};

const server = new McpServer({
  name: "readingbee-openai",
  version: "1.0.0",
});

server.registerTool(
  "make_image",
  {
    title: "Make image",
    description:
      "Generate an image from a short description. Optionally save it to a path relative to the repository root.",
    inputSchema: {
      description: z.string().min(1).describe("What the image should show"),
      destination: z
        .string()
        .min(1)
        .optional()
        .describe("Optional path relative to the repository root where the PNG should be written"),
    },
  },
  async ({ description, destination }) => {
    try {
      const b64 = await generateImage(description);
      let outputPath = resolveDestination(destination);
      let replaced = false;
      if (!outputPath) {
        await mkdir(OUTPUT_DIR, { recursive: true });
        outputPath = join(OUTPUT_DIR, `image-${Date.now()}.png`);
      } else {
        await mkdir(dirname(outputPath), { recursive: true });
        if (existsSync(outputPath)) {
          await unlink(outputPath);
          replaced = true;
        }
      }
      await writeFile(outputPath, Buffer.from(b64, "base64"));
      return {
        content: [
          {
            type: "text",
            text: replaced ? `Replaced ${outputPath}` : `Saved ${outputPath}`,
          },
          {
            type: "image",
            mimeType: "image/png",
            data: b64,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : "Image generation failed",
          },
        ],
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("readingbee openai mcp ready");
