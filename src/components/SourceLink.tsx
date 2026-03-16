export default function SourceLink({ source, sourceUrl, className }: { source: string; sourceUrl?: string; className?: string }) {
  if (sourceUrl) {
    return (
      <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className={`${className} hover:underline`}>
        {source}
      </a>
    )
  }
  return <span className={className}>{source}</span>
}
