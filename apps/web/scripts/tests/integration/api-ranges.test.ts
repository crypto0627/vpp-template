/**
 * 測試 API 支援哪些 range 參數
 */

async function testAPIRanges() {
  const ranges = ["today", "month", "year", "2025"];

  for (const range of ranges) {
    console.log(`\n📡 Testing range: ${range}`);
    console.log("=".repeat(60));

    try {
      const url = `https://www.fortune-ess.com.tw/neihu/data?range=${range}`;
      const response = await fetch(url);
      const result = await response.json();

      console.log(`✅ Status: ${response.status}`);
      console.log(`   Data points: ${result.data?.length || 0}`);

      if (result.data && result.data.length > 0) {
        const first = result.data[0];
        const last = result.data[result.data.length - 1];
        console.log(`   First: ${first.createAt}`);
        console.log(`   Last: ${last.createAt}`);
      }
    } catch (error) {
      console.error(
        `❌ Error:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

testAPIRanges();
