import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Extension should activate", async () => {
    // The development extension has an undefined publisher, so we find it by displayName
    const extensions = vscode.extensions.all;
    const ext = extensions.find(
      (e) => e.packageJSON.displayName === "VS Code Dungeon Crawler"
    );
    assert.ok(ext, "Extension should be present");
    await ext.activate();
    assert.strictEqual(ext.isActive, true, "Extension should be active");
  });
});
