"use client";

import { Button } from "@/components/ui/button";
import { useErrorToast } from "@/components/ui";

export function ErrorTest() {
  const { showError, showSuccess, showWarning, showInfo } = useErrorToast();

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">錯誤處理測試</h2>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="destructive"
          onClick={() =>
            showError({
              title: "測試錯誤",
              description: "這是一個測試錯誤訊息",
            })
          }
        >
          測試錯誤
        </Button>

        <Button
          variant="default"
          onClick={() => showSuccess("這是一個成功訊息")}
        >
          測試成功
        </Button>

        <Button
          variant="outline"
          onClick={() => showWarning("這是一個警告訊息")}
        >
          測試警告
        </Button>

        <Button
          variant="secondary"
          onClick={() => showInfo("這是一個資訊訊息")}
        >
          測試資訊
        </Button>
      </div>
    </div>
  );
}
