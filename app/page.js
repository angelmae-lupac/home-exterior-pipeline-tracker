import { getJobs } from "@/app/actions/jobs";
import { toJobViewModel } from "@/lib/jobs";
import PipelineApp from "@/components/PipelineApp";

export default async function Page() {
  const rows = await getJobs();
  const jobs = rows.map(toJobViewModel);
  return <PipelineApp initialJobs={jobs} />;
}
