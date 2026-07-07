const assert = require("node:assert/strict");
const test = require("node:test");

const { searchSteam, searchEpic } = require("../src/services/search.service");

test("tim kiem khong crash khi key rong", async () => {
  // Test case don gian de dam bao search khong bi loi runtime voi keyword rong
  try {
    const results = await searchSteam("");
    assert.ok(Array.isArray(results));
  } catch (err) {
    assert.fail("searchSteam gap loi: " + err.message);
  }
});
