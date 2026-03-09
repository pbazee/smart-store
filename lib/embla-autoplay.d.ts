declare module "embla-carousel-autoplay" {
  import type { EmblaPluginType } from "embla-carousel";
  function Autoplay(options?: { delay?: number; stopOnInteraction?: boolean }): EmblaPluginType;
  export default Autoplay;
}
