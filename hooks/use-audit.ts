"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { listAuditLogs } from "@/lib/api/audit";
import { queryKeys } from "@/lib/query-keys";
import type { AuditLogsListParams } from "@/types";

export const AUDIT_ACTION_OPTIONS = [
  "",
  "user.suspend",
  "user.reactivate",
  "user.verify",
  "user.reset_password",
  "user.merge",
  "request.assign_donor",
  "request.escalate",
  "request.rebroadcast",
  "notification.broadcast",
  "verification.approve",
  "verification.reject",
  "settings.update",
  "cms.update",
  "auth.login",
];

const defaultParams: AuditLogsListParams = {
  page: 1,
  pageSize: 25,
  action: "",
  from: "",
  to: "",
};

export function useAudit() {
  const [params, setParams] = useState<AuditLogsListParams>(defaultParams);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  const listQuery = useQuery({
    queryKey: queryKeys.audit.list(params),
    queryFn: () => listAuditLogs(params),
  });

  const applyFilters = () =>
    setParams((prev) => ({
      ...prev,
      from: draftFrom,
      to: draftTo,
      page: 1,
    }));

  return {
    params,
    setParams,
    draftFrom,
    setDraftFrom,
    draftTo,
    setDraftTo,
    applyFilters,
    listQuery,
  };
}
