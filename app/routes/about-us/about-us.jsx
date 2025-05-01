import {useRef } from 'react';
import { Section } from '~/components/section';
import { baseMeta } from '~/utils/meta';
import { Us } from './us';
import { Footer } from '~/components/footer';
import styles from './about-us.module.css'

export const meta = () => {
  return baseMeta({
    title: 'About Us',
    description:
      'bla bla bla',
  });
};


export const AboutUs = () => {
const details = useRef();

  return (
    <article className={styles.wrapper}>
    <Section>
      <Us
        sectionRef={details}
        visible={true}
        id="us"
      />
         <Footer />
    </Section>
    </article>
  );
};

