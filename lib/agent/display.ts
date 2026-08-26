/**
 * Human-readable labels for agent event logs shown in dashboards.
 */
export function formatAgentEventLabel(
  eventType: string,
  toolName?: string | null,
): string {
  const tool = toolName?.replace(/_/g, " ") ?? "action";

  switch (eventType) {
    case "user_message_received":
      return "Message sent";
    case "agent_message_created":
      return "Assistant replied";
    case "agent_intent_classified":
      return "Intent classified";
    case "tool_call_requested":
      return `Requested ${tool}`;
    case "tool_call_executed":
      return `Completed ${tool}`;
    case "tool_call_failed":
      return `Failed ${tool}`;
    case "policy_check_passed":
      return "Policy check passed";
    case "policy_check_failed":
      return "Action blocked by policy";
    case "confirmation_required":
      return "Confirmation required";
    case "action_confirmed":
      return "Action confirmed";
    case "action_cancelled":
      return "Action cancelled";
    case "suspicious_prompt_detected":
      return "Suspicious prompt detected";
    case "unauthorized_access_attempt":
      return "Unauthorized access attempt";
    case "agent_error":
      return "Assistant error";
    case "elah_scored":
      return "ELAH scored";
    case "elah_scoring_unavailable":
      return "ELAH scoring unavailable";
    default:
      return eventType.replace(/_/g, " ");
  }
}

export function agentEventBadgeVariant(
  eventType: string,
): "status-approved" | "status-rejected" | "warning" | "info" | "default" {
  switch (eventType) {
    case "tool_call_executed":
    case "policy_check_passed":
    case "action_confirmed":
      return "status-approved";
    case "tool_call_failed":
    case "policy_check_failed":
    case "suspicious_prompt_detected":
    case "unauthorized_access_attempt":
    case "agent_error":
      return "status-rejected";
    case "confirmation_required":
      return "warning";
    case "tool_call_requested":
    case "elah_scored":
      return "info";
    case "elah_scoring_unavailable":
      return "warning";
    default:
      return "default";
  }
}
