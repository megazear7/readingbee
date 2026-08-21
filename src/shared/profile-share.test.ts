import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createProfile } from "./algorithm.js";
import {
  decodeProfileParam,
  encodeProfileParam,
  PROFILE_SHARE_ORIGIN,
  profileShareUrl,
  readSharedProfileFromSearch,
} from "./profile-share.js";

describe("profile share links", () => {
  it("round-trips a profile through a share URL", () => {
    const profile = createProfile("Ava", "words", []);
    const url = profileShareUrl(profile);
    assert.equal(url.startsWith(`${PROFILE_SHARE_ORIGIN}/?profile=`), true);
    const parsed = readSharedProfileFromSearch(new URL(url).search);
    assert.equal(parsed?.name, "Ava");
    assert.equal(parsed?.id, profile.id);
    assert.equal(parsed?.level, profile.level);
  });

  it("rejects invalid profile payloads", () => {
    assert.equal(decodeProfileParam("not-json"), null);
    assert.equal(decodeProfileParam(encodeProfileParam({ name: "Nope" } as never)), null);
    assert.equal(readSharedProfileFromSearch("?profile=nope"), null);
    assert.equal(readSharedProfileFromSearch(""), null);
  });
});
