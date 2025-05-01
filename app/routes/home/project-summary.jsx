import { Button } from '~/components/button';
import { Divider } from '~/components/divider';
import { Heading } from '~/components/heading';
import { Section } from '~/components/section';
import { Text } from '~/components/text';
import { useTheme } from '~/components/theme-provider';
import { Transition } from '~/components/transition';
import { Loader } from '~/components/loader';
import { useWindowSize } from '~/hooks';
import { useState, useEffect, useCallback } from 'react';
import { cssProps, media } from '~/utils/style';
import { useHydrated } from '~/hooks/useHydrated';
// Importa Img se hai un componente custom
// import { Img } from '~/components/image';

import styles from './project-summary.module.css';

export function ProjectSummary({
  id,
  visible: sectionVisible,
  sectionRef,
  index,
  title,
  description,
  // --- NUOVE PROPS PER L'IMMAGINE ---
  imageSrc,         // URL immagine principale (obbligatorio)
  imageAlt,         // Testo alternativo (obbligatorio)
  imageSrcSet,      // srcSet opzionale per responsive
  imagePlaceholder, // Placeholder opzionale (URL)
  // --- --------------------------- ---
  buttonText,
  buttonLink,
  alternate,
  // Rimuoviamo 'model' dalle props se non serve più a nulla
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [placeholderLoaded, setPlaceholderLoaded] = useState(false); // Stato per caricamento placeholder
  const { theme } = useTheme();
  const { width } = useWindowSize();
  const isHydrated = useHydrated();
  const titleId = `${id}-title`;
  const isMobile = width <= media.tablet;
  const indexText = index < 10 ? `0${index}` : index;

  const imageSizes = `(max-width: ${media.tablet}px) 90vw, 40vw`; // Adatta se necessario

  // Callback per caricamento immagine principale
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Callback per caricamento placeholder
   const handlePlaceholderLoad = useCallback(() => {
    setPlaceholderLoaded(true);
  }, []);

  // Resetta stato caricamento se src cambia
  useEffect(() => {
    setImageLoaded(false);
    setPlaceholderLoaded(false); // Resetta anche placeholder
  }, [imageSrc]);

  // Rimuovi funzione renderKatakana se non usata
  // function renderKatakana(...) {}

  // Funzione renderDetails - Invariata
  function renderDetails(visible) {
    return (
      <div className={styles.details}>
        <div aria-hidden className={styles.index}>
          <Divider notchWidth="64px" notchHeight="8px" collapsed={!visible} collapseDelay={1000} />
          <span className={styles.indexNumber} data-visible={visible}>{indexText}</span>
        </div>
        <Heading level={3} as="h2" className={styles.title} data-visible={visible} id={titleId}>{title}</Heading>
        <Text className={styles.description} data-visible={visible} as="p">{description}</Text>
        {buttonText && buttonLink && (
          <div className={styles.button} data-visible={visible}>
            <Button iconHoverShift href={buttonLink} iconEnd="arrow-right">{buttonText}</Button>
          </div>
        )}
      </div>
    );
  }

  // Funzione renderPreview - Modificata per usare props dirette
  function renderPreview(visible) {
    const showPlaceholder = imagePlaceholder && !imageLoaded;
    const showLoader = visible && !imageLoaded && !placeholderLoaded; // Mostra loader solo se non c'è neanche il placeholder caricato

    return (
      <div className={styles.preview}>
        {/* Contenitore immagine */}
        <div
            className={styles.imageContainer}
            data-visible={isHydrated && visible && (imageLoaded || placeholderLoaded)} // Visibile se immagine o placeholder sono pronti
        >
          {/* Loader */}
          {showLoader && (
            <Loader center className={styles.loader} data-visible={true} />
          )}

          {/* Placeholder Image (se fornito e immagine principale non ancora caricata) */}
          {isHydrated && visible && showPlaceholder && (
             <img
               className={styles.imagePlaceholder} // Stile specifico per placeholder
               src={imagePlaceholder}
               alt="" // Alt vuoto per immagine decorativa/placeholder
               role="presentation"
               onLoad={handlePlaceholderLoad}
             />
          )}

          {/* Immagine Principale (se src esiste, idratato e visibile) */}
          {isHydrated && visible && imageSrc && (
            <img
              className={styles.imagePreview}
              src={imageSrc}
              srcSet={imageSrcSet}
              sizes={imageSizes}
              alt={imageAlt} // Usa la prop diretta
              loading="lazy"
              onLoad={handleImageLoad}
              style={{ opacity: imageLoaded ? 1 : 0 }} // Mostra solo quando caricata
            />
             // Se hai un componente <Img> custom:
             // <Img className={styles.imagePreview} src={imageSrc} srcSet={imageSrcSet} sizes={imageSizes} alt={imageAlt} lazy load={visible} onLoaded={handleImageLoad} />
          )}

          {/* Fallback se manca src */}
          {isHydrated && visible && !imageSrc && (
            <div className={styles.noImage}>Immagine non disponibile</div>
          )}
        </div>
      </div>
    );
  }

  // Rendering Principale - Invariato
  return (
    <Section
      className={styles.summary}
      data-alternate={alternate}
      data-first={index === 1}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      as="section"
      aria-labelledby={titleId}
      ref={sectionRef}
      id={id}
      tabIndex={-1}
      {...rest}
    >
      <div className={styles.content}>
        <Transition in={sectionVisible || focused} timeout={0}>
          {({ visible: transitionVisible }) => (
            <>
              {!alternate && !isMobile && (
                <>
                  {renderDetails(transitionVisible)}
                  {renderPreview(transitionVisible)}
                </>
              )}
              {(alternate || isMobile) && (
                <>
                  {renderPreview(transitionVisible)}
                  {renderDetails(transitionVisible)}
                </>
              )}
            </>
          )}
        </Transition>
      </div>
    </Section>
  );
}