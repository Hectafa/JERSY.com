import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./BannerCarousel.css";
import Button from "../common/Button";
import Icon from "../common/Icon/Icon";

export default function BannerCarousel({ banners = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-cambio cada 5 segundos
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return;

    setIsTransitioning(true);
    setCurrentIndex(index);

    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToPrevious = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setCurrentIndex(currentIndex === 0 ? banners.length - 1 : currentIndex - 1);

    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToNext = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setCurrentIndex(currentIndex === banners.length - 1 ? 0 : currentIndex + 1);

    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleKeyDown = (e, action) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  if (banners.length === 0) {
    return (
      <div className="banner-carousel">
        <div className="banner-empty">
          <Icon name="image" size={48} />
          <h3>No hay banners disponibles</h3>
          <p>Los banners aparecerán aquí cuando estén disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="banner-carousel">
      <div
        className="carousel-container"
        role="region"
        aria-label="Carrusel de banners promocionales"
      >
        {/* Slides container */}
        <div className="slides-wrapper">
          {banners.map((banner, index) => {
            return (
              <div
                key={banner.id || index}
                className={`banner-slide ${
                  index === currentIndex ? "active" : ""
                } ${
                  index === currentIndex - 1 ||
                  (currentIndex === 0 && index === banners.length - 1)
                    ? "prev"
                    : ""
                } ${
                  index === currentIndex + 1 ||
                  (currentIndex === banners.length - 1 && index === 0)
                    ? "next"
                    : ""
                }`}
                style={{
                  backgroundImage: `url(${banner.image})`,
                  backgroundColor: banner.backgroundColor,
                }}
                aria-hidden={index !== currentIndex}
              >
                <div className="banner-overlay"></div>
                <div className="banner-content">
                  <div className="content-wrapper">
                    <h1 className="banner-title">{banner.title}</h1>
                    <p className="banner-subtitle">{banner.subtitle}</p>
                    <div className="banner-actions">
                      <Button
                        variant="primary"
                        size="large"
                        onClick={() => {
                          console.log(`Navegando a: ${banner.buttonLink}`);
                          // Aquí iría la navegación real
                        }}
                        aria-label={`${banner.buttonText} - ${banner.title}`}
                      >
                        {banner.buttonText}
                      </Button>
                      {banner.secondaryButton && (
                        <Button
                          variant="secondary"
                          size="large"
                          onClick={() =>
                            console.log(`Acción secundaria: ${banner.title}`)
                          }
                        >
                          {banner.secondaryButton}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation controls */}
        {banners.length > 1 && (
          <>
            <button
              className="carousel-btn carousel-btn-prev"
              onClick={goToPrevious}
              onKeyDown={(e) => handleKeyDown(e, goToPrevious)}
              aria-label="Banner anterior"
              disabled={isTransitioning}
            >
              <Icon name="chevronLeft" size={24} />
            </button>

            <button
              className="carousel-btn carousel-btn-next"
              onClick={goToNext}
              onKeyDown={(e) => handleKeyDown(e, goToNext)}
              aria-label="Banner siguiente"
              disabled={isTransitioning}
            >
              <Icon name="chevronRight" size={24} />
            </button>
          </>
        )}

        {/* Indicators */}
        {banners.length > 1 && (
          <div className="carousel-indicators" role="tablist">
            {banners.map((banner, index) => (
              <button
                key={banner.id || index}
                className={`indicator ${
                  index === currentIndex ? "active" : ""
                }`}
                onClick={() => goToSlide(index)}
                onKeyDown={(e) => handleKeyDown(e, () => goToSlide(index))}
                aria-label={`Ir al banner ${index + 1}: ${banner.title}`}
                role="tab"
                aria-selected={index === currentIndex}
                disabled={isTransitioning}
              />
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="carousel-progress">
          <div
            className="progress-bar"
            style={{
              width: `${((currentIndex + 1) / banners.length) * 100}%`,
            }}
          ></div>
        </div>

        {/* Banner counter */}
        <div className="banner-counter">
          <span>{currentIndex + 1}</span>
          <span className="divider">/</span>
          <span>{banners.length}</span>
        </div>
      </div>
    </div>
  );
}

BannerCarousel.propTypes = {
  banners: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string,
      image: PropTypes.string.isRequired,
      button: PropTypes.shape({
        text: PropTypes.string.isRequired,
        link: PropTypes.string.isRequired,
      }),
    })
  ),
};

BannerCarousel.defaultProps = {
  banners: [],
};
