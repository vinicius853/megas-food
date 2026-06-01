import PublicMenuClient from '@/components/public-menu/public-menu-client'

type PublicMenuPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function PublicMenuPage({
  params,
}: PublicMenuPageProps) {
  const { slug } = await params

  return <PublicMenuClient slug={slug} />
}
