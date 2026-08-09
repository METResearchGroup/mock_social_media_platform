import { ImagePlus, ListOrdered, MapPin, Smile } from "lucide-react";
import type { ReactNode } from "react";

export function ComposerStrip(): ReactNode {
  return (
    <section className="composer-strip" aria-label="Compose preview">
      <div className="avatar tone-sky" aria-hidden="true">
        You
      </div>
      <div className="composer-body">
        <p className="composer-placeholder">What is happening?</p>
        <div className="composer-actions">
          <div className="composer-tools" aria-hidden="true">
            <span className="composer-tool">
              <ImagePlus size={18} />
            </span>
            <span className="composer-tool">
              <Smile size={18} />
            </span>
            <span className="composer-tool">
              <ListOrdered size={18} />
            </span>
            <span className="composer-tool">
              <MapPin size={18} />
            </span>
          </div>
          <button type="button" className="composer-post" disabled>
            Post
          </button>
        </div>
        <p className="composer-note">Compose stays off in this seed build.</p>
      </div>
    </section>
  );
}
