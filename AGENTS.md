# Next.js 15 — Key Breaking Changes

Dynamic route params are a **Promise** in Next.js 15. Always `await` them:

```ts
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
