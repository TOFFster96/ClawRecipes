import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";

export function RecipeContent({ md }: { md: string }) {
  const hasFrontmatter = md.startsWith("---\n");
  let frontmatter = "";
  let body = md;
  if (hasFrontmatter) {
    const end = md.indexOf("\n---", 4);
    if (end > 0) {
      frontmatter = md.slice(4, end);
      body = md.slice(end + 4).trimStart();
    }
  }
  return (
    <>
      {body && (
        <div className="recipe-detail-markdown mb-3">
          <ReactMarkdown rehypePlugins={[rehypeSanitize, rehypeHighlight]}>
            {body}
          </ReactMarkdown>
        </div>
      )}
      {frontmatter && (
        <pre className="recipe-frontmatter p-3 rounded overflow-auto">
          {frontmatter}
        </pre>
      )}
    </>
  );
}
