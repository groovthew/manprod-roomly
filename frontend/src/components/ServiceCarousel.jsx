import { useRef, useState, useEffect } from "react";
import { formatRupiah } from "../api.js";

export default function ServiceCarousel({ services, selectedId, onSelect }) {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateButtons = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateButtons();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    return () => {
      el.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, [services]);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const slide = el.querySelector(".service-slide");
    const step = slide ? slide.offsetWidth + 16 : 280;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="carousel-wrapper">
      <button
        type="button"
        className="carousel-nav prev"
        onClick={() => scroll(-1)}
        disabled={!canPrev}
        aria-label="Sebelumnya"
      >
        ‹
      </button>

      <div className="carousel-track" ref={trackRef}>
        {services.map((service) => {
          const selected = selectedId === service.id;
          return (
            <button
              key={service.id}
              type="button"
              className={`service-slide ${selected ? "selected" : ""}`}
              onClick={() => onSelect(service.id)}
            >
              <div className="slide-image">
                {service.image && (
                  <img
                    src={service.image}
                    alt={service.name}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
                <div className="slide-icon">{service.icon}</div>
                {selected && <div className="slide-check">✓ Dipilih</div>}
              </div>
              <div className="slide-body">
                <h3>{service.name}</h3>
                {service.description && <p className="slide-desc">{service.description}</p>}
                <div className="slide-meta">
                  <span className="slide-duration">⏱ {service.duration}</span>
                  <span className="slide-price">
                    {formatRupiah(service.price)}<small>/{service.unit}</small>
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="carousel-nav next"
        onClick={() => scroll(1)}
        disabled={!canNext}
        aria-label="Selanjutnya"
      >
        ›
      </button>
    </div>
  );
}
