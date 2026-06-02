/**
 * UI Type Definitions
 *
 * Type definitions for UI components including toast notifications.
 */

import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

/**
 * Toast notification with id
 */
export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

/**
 * Toast action discriminated union
 */
export type Action =
  | {
      type: "ADD_TOAST";
      toast: ToasterToast;
    }
  | {
      type: "UPDATE_TOAST";
      toast: Partial<ToasterToast>;
    }
  | {
      type: "DISMISS_TOAST";
      toastId?: ToasterToast["id"];
    }
  | {
      type: "REMOVE_TOAST";
      toastId?: ToasterToast["id"];
    };

/**
 * Toast state interface
 */
export interface State {
  toasts: ToasterToast[];
}

/**
 * Toast type (omits id from ToasterToast)
 */
export type Toast = Omit<ToasterToast, "id">;
