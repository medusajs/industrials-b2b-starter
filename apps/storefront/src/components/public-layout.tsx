import { PublicHeader } from "./public-header"
import { PublicFooter } from "./public-footer"
import { PreviewBanner } from "./preview-banner"

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const bannerFlag = import.meta.env.VITE_SHOW_BANNER_FOR_PREVIEW
  // Show banner whenever the env var is defined (set in dev/preview, absent in production).
  // Treat "false" and "0" as opt-out values.
  const showBanner =
    bannerFlag !== undefined &&
    bannerFlag !== "false" &&
    bannerFlag !== "0" &&
    bannerFlag !== false

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PreviewBanner forceShow={showBanner} />
      <PublicHeader bannerVisible={showBanner} />
      <main className={`flex-1 ${showBanner ? "pt-[112px]" : "pt-16"}`}>
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
