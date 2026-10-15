/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { SystemTranslationTokens } from "~/translation.server";

export const errorBoundaryEnglish = {
  ErrorBoundaryConnectionDesc:
    "Could not reach Inventory Simulator. Check your internet connection.",
  ErrorBoundaryConnectionRetry: "Click here to try again.",
  ErrorBoundaryConnectionTitle: "Connection Error",
  ErrorBoundaryContactAdmin: "Contact the application administrator.",
  ErrorBoundaryDesc: "An error has occurred.",
  ErrorBoundaryKeepsHappening: "If this keeps happening:",
  ErrorBoundaryRefresh: "Click here to refresh.",
  ErrorBoundaryReportIssue: "Report the issue here.",
  ErrorBoundaryResetInventory: "Try resetting your inventory.",
  ErrorBoundaryTitle: "Inventory Simulator Application Error",
  GenericCancel: "Cancel",
  GenericOK: "OK",
  LoadoutResetInventoryDesc:
    "Your loadouts will also lose their inventory items.",
  SettingsConfirmRemoveAllItems:
    "Are you sure you want to remove all items from your inventory?\nTHIS ACTION CANNOT BE UNDONE.",
  SettingsRemoveAllItems: "Reset my inventory"
} satisfies Partial<Record<SystemTranslationTokens, string>>;
