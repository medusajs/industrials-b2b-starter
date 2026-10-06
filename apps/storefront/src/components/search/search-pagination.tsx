import Pagination from "@/components/ui/pagination"
import { usePagination } from "react-instantsearch"

const SCROLL_TO_TOP_THRESHOLD_PX = 40

export const SearchPagination = ({
  isExactCount,
}: {
  isExactCount: boolean
}) => {
  const { currentRefinement, nbPages, refine, canRefine } = usePagination()

  if (!canRefine) {
    return null
  }

  return (
    <div className="mt-2">
      <Pagination
        page={currentRefinement + 1}
        totalPages={nbPages}
        onPageChange={(page) => {
          refine(page - 1)

          if (window.scrollY > SCROLL_TO_TOP_THRESHOLD_PX) {
            window.scrollTo({ top: 0, behavior: "smooth" })
          }
        }}
        data-testid="search-pagination"
      />
      {isExactCount && (
        <p className="mt-2 text-center text-sm text-text-muted">
          Page {currentRefinement + 1} of {nbPages}
        </p>
      )}
    </div>
  )
}

export default SearchPagination
