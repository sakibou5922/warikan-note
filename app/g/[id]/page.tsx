import { redirect } from "next/navigation";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`https://sakibou5922.github.io/warikan-note/?g=${encodeURIComponent(id)}`);
}
