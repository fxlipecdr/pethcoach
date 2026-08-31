import { Skeleton } from "@/components/ui/primitives";
import { PageContainer } from "@/components/layouts/page-container";
export default function Loading() {
  return (
    <PageContainer className="space-y-5 py-6" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando página
      </span>
      <Skeleton className="h-10 max-w-lg" />
      <Skeleton className="h-5 max-w-xl" />
      <Skeleton className="h-64" />
    </PageContainer>
  );
}
