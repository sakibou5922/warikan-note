import GroupClient from "./group-client";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  return <GroupClient id={(await params).id} />;
}
