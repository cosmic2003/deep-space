import { DailyDigest } from "@/components/ai/DailyDigest";
import { ModelBenchmarks } from "@/components/ai/ModelBenchmarks";
import { getDailyDigest, getRecentPosts } from "@/lib/ai/source";
import { AiSectorClient } from "./AiSectorClient";

export async function AiSector() {
  const [posts, digest] = await Promise.all([
    getRecentPosts({ limit: 100 }),
    getDailyDigest(),
  ]);

  const staticHeader = (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
      {digest && <DailyDigest digest={digest} />}
      <ModelBenchmarks />
    </div>
  );

  return <AiSectorClient posts={posts} staticHeader={staticHeader} />;
}
