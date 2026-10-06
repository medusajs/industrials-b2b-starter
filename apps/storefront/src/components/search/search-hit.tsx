import { Thumbnail } from "@/components/ui/thumbnail"
import { Link } from "@tanstack/react-router"
import type { Hit as HitType } from "instantsearch.js"

export type ProductHit = HitType<{
  title: string | null
  handle: string | null
  thumbnail: string | null
  category?: string[] | null
}>

type SearchHitProps = {
  hit: ProductHit
  countryCode: string
  onNavigate: () => void
}

export const SearchHit = ({ hit, countryCode, onNavigate }: SearchHitProps) => {
  if (!hit.handle) {
    return null
  }

  const category = hit.category?.[0]

  return (
    <li>
      <Link
        to="/$countryCode/products/$handle"
        params={{ countryCode, handle: hit.handle }}
        onClick={onNavigate}
        className="flex items-center gap-x-4 px-6 py-3 hover:bg-zinc-50 transition-colors"
        data-testid="search-hit-link"
      >
        <Thumbnail
          thumbnail={hit.thumbnail}
          alt={hit.title ?? ""}
          className="w-16 h-16 flex-shrink-0 rounded object-cover"
        />
        <span className="flex flex-col gap-y-0.5 min-w-0">
          <span className="text-sm font-semibold text-zinc-900 line-clamp-2">
            {hit.title}
          </span>
          {category && (
            <span className="text-xs text-zinc-500">{category}</span>
          )}
        </span>
      </Link>
    </li>
  )
}

export default SearchHit
