"use client";

import React from "react";
import { Alert, Button, Empty, Input, Modal, message } from "antd";
import {
  CheckCircle2,
  CloudDownload,
  CloudUpload,
  RefreshCw,
  ShieldAlert,
  WifiOff,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useConnectivity } from "@/components/providers/connectivity-provider";
import {
  useResolveSyncReview,
  useSyncPending,
  useSyncQueue,
} from "@/features/sync/hooks";
import {
  PageHeadingSecondary,
  SectionCardSecondary,
} from "@/components/elements/secondary";
import { StatusBadge } from "@/components/elements/primary";
import { useQuery } from "@tanstack/react-query";
import { getDevices } from "@/features/users/api";
import { getBranches } from "@/features/branches/api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function SyncSection() {
  const auth = useAuth();
  const connectivity = useConnectivity();
  const queue = useSyncQueue(auth.session.branch_id);
  const syncMutation = useSyncPending();
  const resolveReview = useResolveSyncReview();
  const [reviewOperationId, setReviewOperationId] = React.useState("");
  const [reviewNote, setReviewNote] = React.useState("");
  const devices = useQuery({
    queryKey: ["devices", auth.session.branch_id],
    queryFn: () => getDevices(auth.session.branch_id ?? undefined),
  });
  const branches = useQuery({
    queryKey: [
      "branches",
      auth.session.role === "owner_admin" ? "all" : auth.session.branch_id,
    ],
    queryFn: () =>
      getBranches(
        auth.session.role === "owner_admin"
          ? undefined
          : (auth.session.branch_id ?? undefined),
      ),
  });
  const pending =
    queue.data?.filter(
      (item) => item.status === "pending" || item.status === "syncing",
    ) ?? [];
  const attention =
    queue.data?.filter(
      (item) =>
        item.status === "rejected" ||
        (item.status === "needs_review" && item.review_status !== "resolved"),
    ) ?? [];
  const latestSync = (queue.data ?? [])
    .filter((item) => item.synced_at)
    .sort((first, second) =>
      (second.synced_at ?? "").localeCompare(first.synced_at ?? ""),
    )[0]?.synced_at;
  const synced = queue.data?.filter((item) => item.status === "synced") ?? [];

  async function handleResolveReview() {
    if (!reviewOperationId || !reviewNote.trim()) {
      message.warning("Add a note explaining the review outcome.");
      return;
    }
    try {
      await resolveReview.mutateAsync({
        operation_id: reviewOperationId,
        actor_name: auth.session.full_name,
        note: reviewNote.trim(),
      });
      setReviewOperationId("");
      setReviewNote("");
      message.success(
        "Discrepancy review was recorded in the local audit trail.",
      );
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Could not resolve discrepancy",
      );
    }
  }

  async function handleSync() {
    if (!connectivity.isOnline) {
      message.warning("Reconnect before running the simulated sync.");
      return;
    }
    try {
      const result = await syncMutation.mutateAsync(
        auth.session.branch_id ?? undefined,
      );
      message.success(
        `${result.length} local operation${result.length === 1 ? "" : "s"} processed by the simulated sync.`,
      );
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Sync failed");
    }
  }

  return (
    <div className="page-stack">
      <PageHeadingSecondary
        eyebrow="Offline operations"
        title="Sync center"
        description="Inspect pending local operations and simulate acknowledgements. The current mock data lives only in this browser profile."
        action={
          <Button
            type="primary"
            icon={<RefreshCw size={16} />}
            onClick={handleSync}
            loading={syncMutation.isPending}
            disabled={!connectivity.isOnline || pending.length === 0}
          >
            Sync pending operations
          </Button>
        }
      />
      <Alert
        type="warning"
        showIcon
        message="Simulated synchronization only"
        description="This prototype does not connect to a shared server. It cannot synchronize separate cashier devices or browser profiles. A production Django API must acknowledge operation IDs and issue a server-owned pull cursor."
      />
      <div className="sync-summary-grid">
        <article className="sync-summary">
          <span className="sync-summary-icon warning">
            <CloudUpload size={18} />
          </span>
          <span>
            <small>Pending operations</small>
            <strong>{pending.length}</strong>
          </span>
        </article>
        <article className="sync-summary">
          <span className="sync-summary-icon danger">
            <ShieldAlert size={18} />
          </span>
          <span>
            <small>Needs review</small>
            <strong>{attention.length}</strong>
          </span>
        </article>
        <article className="sync-summary">
          <span className="sync-summary-icon success">
            <CheckCircle2 size={18} />
          </span>
          <span>
            <small>Simulated acknowledgements</small>
            <strong>{synced.length}</strong>
          </span>
        </article>
        <article className="sync-summary">
          <span className="sync-summary-icon blue">
            <CloudDownload size={18} />
          </span>
          <span>
            <small>Registered demo devices</small>
            <strong>{devices.data?.length ?? 0}</strong>
          </span>
        </article>
      </div>
      <div className="sync-last-success">
        Last simulated acknowledgement:{" "}
        <strong>
          {latestSync ? formatDate(latestSync) : "No successful sync yet"}
        </strong>
      </div>
      <div className="dashboard-grid-main">
        <SectionCardSecondary
          title="Pending & reviewed operations"
          subtitle="Outbox items remain until acknowledged or explicitly resolved."
        >
          {(queue.data ?? []).length === 0 ? (
            <Empty description="No sync operations yet. Complete a sale in POS to create an outbox operation." />
          ) : (
            <div className="sync-operation-list">
              {(queue.data ?? []).map((item) => (
                <article className="sync-operation" key={item.id}>
                  <span className={`sync-operation-icon sync-${item.status}`}>
                    {item.status === "needs_review" ||
                    item.status === "rejected" ? (
                      <ShieldAlert size={17} />
                    ) : item.status === "synced" ? (
                      <CheckCircle2 size={17} />
                    ) : (
                      <CloudUpload size={17} />
                    )}
                  </span>
                  <div className="sync-operation-main">
                    <strong>{item.operation_type}</strong>
                    <small>Operation {item.operation_id}</small>
                    <small>
                      {branches.data?.find(
                        (branch) => branch.id === item.branch_id,
                      )?.name ?? "Unknown branch"}{" "}
                      · {formatDate(item.created_at)}
                    </small>
                    {item.last_error ? (
                      <p className="sync-operation-error">{item.last_error}</p>
                    ) : null}
                    {item.status === "needs_review" &&
                    item.review_status === "resolved" ? (
                      <small className="sync-review-resolved">
                        Review recorded locally
                      </small>
                    ) : null}
                  </div>
                  <StatusBadge status={item.status} />
                  {item.status === "needs_review" &&
                  item.review_status !== "resolved" &&
                  (auth.session.role === "owner_admin" ||
                    auth.session.role === "store_manager") ? (
                    <Button
                      size="small"
                      onClick={() => {
                        setReviewOperationId(item.operation_id);
                        setReviewNote("");
                      }}
                    >
                      Review
                    </Button>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </SectionCardSecondary>
        <SectionCardSecondary
          title="Device status"
          subtitle="Last known status from this browser's demo dataset"
        >
          <div className="device-list">
            {(devices.data ?? []).map((device) => (
              <div className="device-list-row" key={device.id}>
                <div className="device-list-icon">
                  <CloudDownload size={17} />
                </div>
                <div>
                  <strong>{device.name}</strong>
                  <small>
                    {branches.data?.find(
                      (branch) => branch.id === device.branch_id,
                    )?.name ?? "Assigned branch"}
                  </small>
                </div>
                <StatusBadge status={device.status} />
              </div>
            ))}
          </div>
        </SectionCardSecondary>
      </div>
      {!connectivity.isOnline ? (
        <Alert
          type="info"
          showIcon
          icon={<WifiOff size={17} />}
          message="Offline mode is enabled"
          description="Checkout still records locally. Re-enable online mode to run the simulated acknowledgement action."
        />
      ) : null}
      <Modal
        title="Review stock discrepancy"
        open={Boolean(reviewOperationId)}
        onCancel={() => setReviewOperationId("")}
        onOk={handleResolveReview}
        confirmLoading={resolveReview.isPending}
        okText="Record review"
      >
        <p className="modal-intro">
          Record what was checked and how the store resolved this local
          discrepancy. This does not confirm a remote-server sync.
        </p>
        <Input.TextArea
          rows={4}
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          placeholder="e.g. Physical count verified; shortage recorded as a stock adjustment."
        />
      </Modal>
    </div>
  );
}
