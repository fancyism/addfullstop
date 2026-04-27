/**
 * AdSense banner placeholder.
 * Replace the data-ad-slot and data-ad-client when you get your AdSense code.
 * For now renders nothing visible so the layout is clean.
 */
export function AdBanner({ slot = "horizontal" }: { slot?: "horizontal" | "sidebar" }) {
  // AdSense is disabled by default. Enable by:
  // 1. Uncomment the script in layout.tsx <head>
  // 2. Replace ca-pub-XXXXXXX with your publisher ID
  // 3. Replace the ad-slot values below

  return (
    <div
      className={`mx-auto my-4 flex items-center justify-center ${
        slot === "horizontal" ? "max-w-4xl" : "w-full"
      }`}
      aria-label="Advertisement"
    >
      {/* Uncomment when AdSense is ready:
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXX"
        data-ad-slot="XXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      */}
    </div>
  );
}
