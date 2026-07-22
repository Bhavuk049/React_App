import { useGetLegalPageQuery } from "../store/api/legalPagesApi.js";

export function LegalPagePage({ slug }) {
  const { data: page, isLoading, isError } = useGetLegalPageQuery(slug);

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">Loading...</div>;
  }

  if (isError || !page) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-neutral-500">This page isn't available right now.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-neutral-900">{page.title}</h1>
      <div
        className="mt-6 leading-relaxed text-neutral-700 [&_a]:text-rose-600 [&_a]:underline [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-neutral-900 [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-neutral-900 [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:mb-4 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:mb-4"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
