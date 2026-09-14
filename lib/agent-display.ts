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
    case "tool_call_executed":
      return `Completed ${tool}`;
    case "tool_call_failed":
      return `Failed ${tool}`;
    case "tool_call_requested":
      return `Requested ${tool}`;
    case "policy_check_failed":
      return "Policy blocked";
    case "confirmation_required":
      return "Confirmation required";
    case "action_confirmed":
      return "Action confirmed";
    case "action_cancelled":
      return "Action cancelled";
    case "policy_denied":
      return "Policy blocked";
    case "page_view":
      return "Page viewed";
    case "tickets_list_viewed":
      return "Tickets list";
    case "ticket_opened":
      return "Ticket opened";
    case "ticket_created":
      return "Ticket created";
    case "ticket_comment_added":
      return "Comment added";
    case "kb_search":
      return "Help search";
    case "kb_article_viewed":
      return "Help article";
    case "login":
      return "Signed in";
    case "logout":
      return "Signed out";
    case "suspicious_prompt_detected":
      return "Suspicious prompt";
    case "unauthorized_access_attempt":
      return "Unauthorized access";
    case "agent_error":
      return "Assistant error";
    default:
      return eventType.replace(/_/g, " ");
  }
}

export function assistantEventTone(
  eventType: string,
): "default" | "success" | "warning" | "danger" | "info" {
  switch (eventType) {
    case "tool_call_executed":
    case "policy_check_passed":
    case "action_confirmed":
    case "ticket_created":
    case "ticket_comment_added":
      return "success";
    case "tool_call_failed":
    case "policy_check_failed":
    case "policy_denied":
    case "suspicious_prompt_detected":
    case "unauthorized_access_attempt":
    case "agent_error":
      return "danger";
    case "confirmation_required":
      return "warning";
    case "tool_call_requested":
      return "info";
    default:
      return "default";
  }
}

export const ASSISTANT_SECURITY_EVENTS = [
  "suspicious_prompt_detected",
  "unauthorized_access_attempt",
  "policy_check_failed",
  "agent_error",
] as const;
