import type { Route } from "./+types/home";
import Dashboard from "./dashboard";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Dashboard | IssueTracker" },
    { name: "description", content: "IssueTracker project dashboard" },
  ];
}

export default function Home() {
  return <Dashboard />;
}
