import { forwardRef, useId } from 'react';
import { classes } from '~/utils/style'; // Assicurati che questa utility gestisca valori booleani/nulli
import styles from './monogram.module.css';

export const Monogram = forwardRef(({ highlight, className, ...props }, ref) => {
  // useId non è più necessario qui perché non usiamo clipPath SVG,
  // ma lo lascio se dovesse servire per altri scopi futuri legati all'accessibilità.
  const id = useId();

  return (
    // Aggiungi la classe 'styles.highlight' condizionalmente
    // quando la prop 'highlight' è true.
    <div
      ref={ref} // Assicurati di passare il ref al div esterno se necessario
      className={classes(
        styles.monogram,
        className// Aggiungi questa riga
      )}
      {...props} // Sposta le props rimanenti qui
    >
      {/* Il contenuto interno rimane lo stesso */}
      <p className='bg'>A</p>
      <p className={classes(
        className,
        highlight && styles.highlight // Aggiungi questa riga
      )}>A</p>
    </div>
  );
});