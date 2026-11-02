import type { BadgeTone } from "../../components/ui";

/** Maps the various group/membership status strings to a Badge tone. */
export function groupStatusTone(status: string): BadgeTone {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "FORMING":
    case "PENDING":
      return "warning";
    case "REMOVED":
      return "danger";
    case "LEADER":
      return "brand";
    case "CLOSED":
    case "MEMBER":
    default:
      return "neutral";
  }
}
