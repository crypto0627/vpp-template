/**
 * 測試 Context Provider 能否正確獲取數據
 */

import { getSiteDataContext } from "../services/ai/context-provider.js";

async function testContextProvider() {
  console.log("🧪 測試 Context Provider\n");
  console.log("=".repeat(60));

  try {
    console.log("\n📡 正在獲取內湖站數據...\n");

    const context = await getSiteDataContext("neihu");

    console.log("\n✅ Context 獲取成功！\n");
    console.log("Context 內容:");
    console.log("=".repeat(60));
    console.log(context);
    console.log("=".repeat(60));
    console.log(`\nContext 長度: ${context.length} 字符`);

    if (
      context.includes("error") ||
      context.includes("錯誤") ||
      context.includes("失敗")
    ) {
      console.error("\n⚠️  警告：Context 包含錯誤訊息！");
      process.exit(1);
    }

    console.log("\n✅ 測試通過！數據獲取正常。");
  } catch (error) {
    console.error("\n❌ 測試失敗:");
    console.error(error);
    process.exit(1);
  }
}

testContextProvider();
