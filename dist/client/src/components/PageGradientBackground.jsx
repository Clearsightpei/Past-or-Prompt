import React from "react";
/**
 * Gradient section background for main content area only.
 * Usage: Wrap your main content with <PageGradientBackground>...</PageGradientBackground>
 */
export default function PageGradientBackground(_a) {
    var children = _a.children;
    return (<section className="relative mx-auto max-w-5xl px-4 py-8 rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-[#1b262c]/90 via-[#3282b8]/85 to-[#bbe1fa]/80 border border-white/10" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      {/* Optional mesh/texture overlay can go here */}
      {children}
    </section>);
}
