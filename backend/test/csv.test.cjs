const test = require("node:test");
const assert = require("node:assert/strict");
const { csvCell, rowsToCsv } = require("../dist/utils/csv.js");
const { Types } = require("mongoose");
const { buildLeadFilter } = require("../dist/utils/leadFilter.js");

test("CSV cells quote delimiters and escape embedded quotes", () => {
  assert.equal(csvCell('North, "West"'), '"North, ""West"""');
});

test("CSV cells neutralize spreadsheet formula prefixes", () => {
  assert.equal(csvCell("=1+1"), "\"'=1+1\"");
  assert.equal(csvCell("  @SUM(A1:A2)"), "\"'  @SUM(A1:A2)\"");
});

test("CSV rows use CRLF separators", () => {
  assert.equal(rowsToCsv([["Name", "Email"], ["A", "a@example.com"]]), '"Name","Email"\r\n"A","a@example.com"');
});

test("sales filters are always restricted to their own leads", () => {
  const ownerId = new Types.ObjectId();
  const filter = buildLeadFilter({ search: "a.*", ownerId: new Types.ObjectId().toString() }, ownerId, "sales");
  assert.equal(filter.owner, ownerId);
  assert.equal(filter.$or[0].name.$regex, "a\\.\\*");
});

test("admin can query all leads unless an assignee filter is provided", () => {
  const adminId = new Types.ObjectId();
  assert.deepEqual(buildLeadFilter({}, adminId, "admin"), {});
  const assignedId = new Types.ObjectId().toString();
  assert.deepEqual(buildLeadFilter({ ownerId: assignedId }, adminId, "admin"), { owner: assignedId });
});
