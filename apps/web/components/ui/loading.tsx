"use client";

import { cn } from "@/lib/utils";

// 基礎 Spinner 組件
interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-primary",
        sizeClasses[size],
        className,
      )}
    />
  );
}

// 帶文字的載入組件
interface LoadingWithTextProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingWithText({
  text = "載入中...",
  size = "md",
  className,
}: LoadingWithTextProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className,
      )}
    >
      <Spinner size={size} />
      <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
    </div>
  );
}

// 全屏載入組件
interface FullScreenLoadingProps {
  text?: string;
  backdrop?: boolean;
}

export function FullScreenLoading({
  text = "載入中...",
  backdrop = true,
}: FullScreenLoadingProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        backdrop && "bg-background/80 backdrop-blur-sm",
      )}
    >
      <LoadingWithText text={text} size="lg" />
    </div>
  );
}

// 頁面載入組件
interface PageLoadingProps {
  text?: string;
  className?: string;
}

export function PageLoading({
  text = "載入中...",
  className,
}: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[400px]",
        className,
      )}
    >
      <LoadingWithText text={text} size="lg" />
    </div>
  );
}

// 按鈕載入狀態組件
interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function ButtonLoading({
  isLoading,
  children,
  loadingText,
  className,
}: ButtonLoadingProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {isLoading && <Spinner size="sm" />}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </div>
  );
}

// 卡片載入骨架組件
interface CardSkeletonProps {
  lines?: number;
  className?: string;
}

export function CardSkeleton({ lines = 3, className }: CardSkeletonProps) {
  return (
    <div className={cn("animate-pulse space-y-3", className)}>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-3 bg-gray-200 rounded",
            i === lines - 1 ? "w-1/2" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

// 表格載入骨架組件
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("animate-pulse space-y-3", className)}>
      {/* 表頭 */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-300 rounded" />
        ))}
      </div>

      {/* 表格內容 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-3 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

// 載入點動畫組件
interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

// 進度條載入組件
interface ProgressLoadingProps {
  progress: number;
  text?: string;
  className?: string;
}

export function ProgressLoading({
  progress,
  text,
  className,
}: ProgressLoadingProps) {
  return (
    <div className={cn("w-full space-y-2", className)}>
      {text && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{text}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

// 脈衝載入組件
interface PulseLoadingProps {
  className?: string;
}

export function PulseLoading({ className }: PulseLoadingProps) {
  return (
    <div className={cn("flex justify-center items-center", className)}>
      <div className="relative">
        <div className="h-8 w-8 rounded-full border-4 border-primary/20"></div>
        <div className="absolute top-0 left-0 h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-pulse"></div>
      </div>
    </div>
  );
}
