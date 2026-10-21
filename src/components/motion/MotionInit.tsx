import { motionConfig } from "@/config/motion";

/*
 * Adds `motion-ready` to <html> before the first paint. The hidden starting state of [data-reveal]
 * (src/styles/motion.css) exists only under that class, so a visitor without JavaScript sees everything.
 * The class is added only if IntersectionObserver exists, and removed again after 5 s if RevealObserver
 * never marked the page `data-reveal-ready`, so a failed hydration cannot leave content hidden.
 */
const SCRIPT = `(function(d){if(!("IntersectionObserver"in window))return;var h=d.documentElement;h.classList.add("motion-ready");setTimeout(function(){h.hasAttribute("data-reveal-ready")||h.classList.remove("motion-ready")},5e3)})(document)`;

/**
 * Pre-paint switch for the reveal system (animation-plan 2.4). It is an inline script in <head>, not an
 * effect: an effect runs after the first paint, which would show the content, hide it, then reveal it.
 * Renders nothing when motion is off. A site with a strict Content-Security-Policy needs a nonce on it.
 */
export function MotionInit() {
  if (motionConfig.mode === "off") return null;
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
