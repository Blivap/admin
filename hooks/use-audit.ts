"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { listAuditLogs } from "@/lib/api/audit";
import { queryKeys } from "@/lib/query-keys";
import type { AuditLogsListParams } from "@/types";

import { toPositiveInt, useUrlParams } from "./use-url-params";

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

const urlDefaults = {
  page: "1",
  pageSize: "25",
  action: "",
  from: "",
  to: "",
};

export function useAudit() {
  const [url, setUrl] = useUrlParams(urlDefaults);

  const params: AuditLogsListParams = {
    page: toPositiveInt(url.page, 1),
    pageSize: toPositiveInt(url.pageSize, 25),
    action: url.action,
    from: url.from,
    to: url.to,
  };

  const [draftFrom, setDraftFrom] = useState(url.from);
  const [draftTo, setDraftTo] = useState(url.to);

  useEffect(() => {
    setDraftFrom(url.from);
    setDraftTo(url.to);
  }, [url.from, url.to]);

  const setParams = (
    patch:
      | Partial<AuditLogsListParams>
      | ((prev: AuditLogsListParams) => AuditLogsListParams),
  ) => {
    const next = typeof patch === "function" ? patch(params) : { ...params, ...patch };
    setUrl({
      page: String(next.page ?? 1),
      pageSize: String(next.pageSize ?? 25),
      action: next.action ?? "",
      from: next.from ?? "",
      to: next.to ?? "",
    });
  };

  const listQuery = useQuery({
    queryKey: queryKeys.audit.list(params),
    queryFn: () => listAuditLogs(params),
  });

  const applyFilters = () =>
    setUrl({
      from: draftFrom,
      to: draftTo,
      page: "1",
    });

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
