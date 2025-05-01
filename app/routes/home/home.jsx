import coffeeMachine from '~/assets/imgs/home/coffee.jpg';
import avocadoToast from '~/assets/imgs/home/savory.jpg';
import porridge from '~/assets/imgs/home/porridge.jpg';
import guacamole from '~/assets/imgs/home/guacamole.jpg';

import { Footer } from '~/components/footer';
import { baseMeta } from '~/utils/meta';
import { Intro } from './intro'; // Mantiene modello 3D
import { ProjectSummary } from './project-summary'; // Versione aggiornata con props immagine
import { useEffect, useRef, useState } from 'react';
import styles from './home.module.css';

// Prefetch Draco (mantenuto per <Intro>)
export const links = () => {
  return [
    { rel: 'prefetch', href: '/draco/draco_wasm_wrapper.js', as: 'script', type: 'text/javascript', importance: 'low'},
    { rel: 'prefetch', href: '/draco/draco_decoder.wasm', as: 'fetch', type: 'application/wasm', importance: 'low'},
  ];
};

// Meta (invariato)
export const meta = () => {
    return baseMeta({
        title: 'The Amara | Vegan & Vegetarian Bar & Restaurant in Siem Reap',
        description: `The Amara Bar & Restaurant: Explore our delicious vegan & vegetarian food and drinks in Siem Reap. We offer creative plant-based meals, refreshing cocktails, local craft beer, and healthy probiotic drinks. Visit us for a unique dining experience!`,
    });
};

export const Home = () => {
  // Stati e Refs (invariati)
  const [visibleSections, setVisibleSections] = useState([]);
  const [scrollIndicatorHidden, setScrollIndicatorHidden] = useState(false);
  const intro = useRef();
  const projectOne = useRef();
  const projectTwo = useRef();
  const projectThree = useRef();
  const projectFour = useRef();
  const details = useRef();

  // useEffect per IntersectionObserver (invariato)
   useEffect(() => {
    const sections = [intro, projectOne, projectTwo, projectThree, projectFour, details];
    const sectionObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          const section = entry.target;
          if (entry.isIntersecting) {
            setVisibleSections(prevSections => (!prevSections.includes(section) ? [...prevSections, section] : prevSections));
          } else {
            setVisibleSections(prevSections => prevSections.filter(s => s !== section));
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );
    const indicatorObserver = new IntersectionObserver(
      ([entry]) => { setScrollIndicatorHidden(!entry.isIntersecting); },
      { rootMargin: '-100% 0px 0px 0px' }
    );
    sections.forEach(sectionRef => { if (sectionRef.current) sectionObserver.observe(sectionRef.current); });
    if (intro.current) indicatorObserver.observe(intro.current);
    return () => { sectionObserver.disconnect(); indicatorObserver.disconnect(); };
  }, []);


  return (
    <div className={styles.home}>
      <Intro id="intro" sectionRef={intro} scrollIndicatorHidden={scrollIndicatorHidden} />

      {/* --- Chiamate a ProjectSummary AGGIORNATE --- */}
      {/* Ora usano props dirette per l'immagine */}

      <ProjectSummary
        id="project-1"
        sectionRef={projectOne}
        visible={visibleSections.includes(projectOne.current)}
        index={1}
        title="Our Coffee"
        description="Discover what makes our coffee different"
        buttonText="Learn more"
        buttonLink="/ingredients/coffee"
        // Passa props immagine dirette
        imageSrc={coffeeMachine}
        imageSrcSet={`${coffeeMachine} 375w, ${coffeeMachine} 750w`}
        imageAlt="Amara's Hand leveler Espresso coffee machine" // Alt text aggiornato
      />
      
       <ProjectSummary
        id="project-2"
        alternate
        sectionRef={projectTwo}
        visible={visibleSections.includes(projectTwo.current)}
        index={2}
        title="Savory Breakfast"
        description="Perfect way to start your day"
        buttonText="Our offer"
        buttonLink="/menu/#savory-breakfast"
        imageSrc={avocadoToast}
        imageSrcSet={`${avocadoToast} 375w, ${avocadoToast} 750w`}
        imageAlt="Delicious vegan savory breakfast dish served at The Amara" // Alt text aggiornato
      />
       <ProjectSummary
        id="project-3"
        sectionRef={projectThree}
        visible={visibleSections.includes(projectThree.current)}
        index={3}
        title="Sweet Breakfast"
        description="Our porridge isn't enough? Discover our delicious dishes"
        buttonText="View all"
        buttonLink="/menu/#sweet-breakfast"
         // Passa props immagine dirette
        imageSrc={porridge}
        imageSrcSet={`${porridge} 375w, ${porridge} 750w`}
        imageAlt="Healthy and tasty sweet breakfast option at The Amara" // Alt text aggiornato
      />
       <ProjectSummary
        id="project-4"
        alternate
        sectionRef={projectFour}
        visible={visibleSections.includes(projectFour.current)}
        index={4}
        title="Plant-Based and Vegeterian"
        description="A wide selection of Plant-Based and Vegeterian main courses and apetizer, for your brunch and dinner"
        buttonText="Discover them all"
        buttonLink="/menu/#main-courses"
        imageSrc={guacamole} // <-- CAMBIA QUESTO (es. mainCourseTexture)
        imageSrcSet={`${guacamole} 375w, ${guacamole} 750w`} // <-- CAMBIA QUESTO// <-- CAMBIA QUESTO
        imageAlt="A vibrant vegan main course available at The Amara" // Alt text aggiornato
      />
      <Footer />
    </div>
  );
};