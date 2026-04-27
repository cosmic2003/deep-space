import { LaunchDetail } from "@/components/LaunchDetail";
import { Modal } from "@/components/Modal";
import { getLaunchDetail } from "@/lib/sources/launchLibrary";

export const revalidate = 300;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InterceptedLaunchModal({ params }: Props) {
  const { id } = await params;
  const launch = await getLaunchDetail(id);
  if (!launch) return null;

  return (
    <Modal>
      <LaunchDetail launch={launch} />
    </Modal>
  );
}
