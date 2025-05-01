import React from 'react'; 

import menu1 from '~/assets/menu/menu-1.png';
import menu2 from '~/assets/menu/menu-2.png';
import menu3 from '~/assets/menu/menu-3.png';
import menu4 from '~/assets/menu/menu-4.png';
import menu5 from '~/assets/menu/menu-5.png';
import menu6 from '~/assets/menu/menu-6.png';
import menu7 from '~/assets/menu/menu-7.png';
import menu8 from '~/assets/menu/menu-8.png';
import menu9 from '~/assets/menu/menu-9.png';
import menu10 from '~/assets/menu/menu-10.png';
import menu11 from '~/assets/menu/menu-11.png';
import menu12 from '~/assets/menu/menu-12.png';
import menu13 from '~/assets/menu/menu-13.png';
import menu14 from '~/assets/menu/menu-14.png';
import menu15 from '~/assets/menu/menu-15.png';
import menu16 from '~/assets/menu/menu-16.png';
import menu17 from '~/assets/menu/menu-17.png';
import menu18 from '~/assets/menu/menu-18.png';
import menu19 from '~/assets/menu/menu-19.png';
import menu20 from '~/assets/menu/menu-20.png';
import menu21 from '~/assets/menu/menu-21.png';
import menu22 from '~/assets/menu/menu-22.png';
import menu23 from '~/assets/menu/menu-23.png';
import menu24 from '~/assets/menu/menu-24.png';
import menu25 from '~/assets/menu/menu-25.png';
import menu26 from '~/assets/menu/menu-26.png';
import menu27 from '~/assets/menu/menu-27.png';
import menu28 from '~/assets/menu/menu-28.png';
import menu29 from '~/assets/menu/menu-29.png';
import menu30 from '~/assets/menu/menu-30.png';

import { Footer } from '~/components/footer';
import { baseMeta } from '~/utils/meta';
import styles from './menu.module.css'; 

const menuImageSources = [
  menu1,
  menu2,
  menu3,
  menu4,
  menu5,
  menu6,
  menu7,
  menu8,
  menu9,
  menu10,
  menu11,
  menu12,
  menu13,
  menu14,
  menu15,
  menu16,
  menu17,
  menu18,
  menu19,
  menu20,
  menu21,
  menu22,
  menu23,
  menu24,
  menu25,
  menu26,
  menu27,
  menu28,
  menu29,
  menu30,
];

const idMappings = {
  // "se index e 6 aggiungi l'id porridge" (cioè la 7a immagine)
  6: 'porridge',
  // "se index e 10 aggiungi l'id sweet-breakfast" (cioè l'11a immagine)
  10: 'sweet-breakfast',
  // "se 12 aggiungi l'id savory-breakfast" (cioè la 13a immagine)
  12: 'savory-breakfast',
  // "se l'ndex e 15 aggungi l'id smoothies" (cioè la 16a immagine)
  15: 'smoothies',
  // "se l'index e 19 aggiungi l'id main-courses" (cioè la 20a immagine)
  19: 'main-courses',
};



// Funzione meta (modificata per descrivere il menu)
// Rimuovi o modifica baseMeta se non è più necessario/disponibile
export const meta = () => {
  return baseMeta({
    title: 'Menu',
    description: 'Bla',
  });
};

// Il componente principale che renderizza le pagine del menu
export const Menu = () => {
  return (
    // Hai aggiunto questo wrapper div, lo manteniamo
    <div className={styles.wrapper}>
      {menuImageSources.map((imgSrc, index) => {
        // Ottieni l'ID corrispondente all'indice corrente dalla mappa
        // Se l'indice non è nella mappa, elementId sarà undefined
        const elementId = idMappings[index];

        return (
          // Un div per ogni pagina del menu
          <div
            key={index}
            className={styles.menuPage}
            // --- AGGIUNGI L'ID QUI ---
            // React non aggiungerà l'attributo 'id' se elementId è undefined
            id={elementId}
            // -------------------------
          >
            <img
              src={imgSrc}
              alt={`Menu pagina ${index + 1}`}
              className={styles.menuImage}
            />
          </div>
        );
      })}

      <Footer/>
    </div>
  );
};

