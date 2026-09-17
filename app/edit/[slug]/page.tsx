import { notFound } from "next/navigation";
import { readMeta } from "@/lib/storage";
import EditForm from "./EditForm";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = await readMeta(slug);
  if (!meta) notFound();

  return <EditForm slug={meta.slug} title={meta.title} />;
}
