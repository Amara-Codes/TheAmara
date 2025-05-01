import profileImgLarge from '~/assets/profile-large.jpg';
import profileImgPlaceholder from '~/assets/profile-placeholder.jpg';
import profileImg from '~/assets/profile.jpg';

import { Heading } from '~/components/heading';
import { Image } from '~/components/image';
import { Link } from '~/components/link';
import { Section } from '~/components/section';
import { Text } from '~/components/text';
import { Transition } from '~/components/transition';
import { Fragment, useState } from 'react';
import { media } from '~/utils/style';
import styles from './us.module.css';

const ProfileText = ({ visible, titleId }) => (
<>
  <Fragment>
    <Heading className={styles.title} data-visible={visible} level={3} id={titleId}>
     <p>Amara ???</p>
    </Heading>
    <Text className={styles.description} data-visible={visible} size="l" as="p">
    The name 'Amara' was chosen with deliberate layers of meaning, 
    weaving together my heritage and my chosen home. 
    Its heart lies in its Sanskrit roots, where 'Amara' (अमर) signifies the 'immortal,' the 'deathless.' 
    This resonates profoundly here, chosen to honour the enduring essence of Khmer culture and spirit – those invaluable things that, despite history, can never truly be looted or extinguished. 
    This word lives on, still present in the modern Khmer language and cherished as a common female name. Conversely, in Italian, 'Amara' translates to 'bitter.' 
    This isn't seen as negative; rather, it reflects complexity. 
    Bitterness, like acidity, was originally a primal warning signal, 
    nature's way to help us avoid poisons – it’s why children instinctively favour sweetness. 
    However, bitterness is a flavour profile we learn to appreciate, often with maturity, 
    representing depth beyond simple gratification. 
    </Text>

  </Fragment>
  <Fragment>
  <Heading className={styles.title} data-visible={visible} level={3} id={titleId}>
     <p></p>
    </Heading>
    <Text className={styles.description} data-visible={visible} size="l" as="p">

</Text>
  </Fragment>
  </>
);

export const Us = ({ id, visible, sectionRef }) => {
  const [focused, setFocused] = useState(false);
  const titleId = `${id}-title`;

  return (
    <Section
      className={styles.profile}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      as="section"
      id={id}
      ref={sectionRef}
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <Transition in={visible || focused} timeout={0}>
        {({ visible, nodeRef }) => (
          <div className={styles.content} ref={nodeRef}>
            <div className={styles.column}>
              <ProfileText visible={visible} titleId={titleId} />

            </div>
            <div className={styles.column}>
              <div className={styles.image}>
                <Image
                  reveal
                  delay={100}
                  placeholder={profileImgPlaceholder}
                  srcSet={`${profileImg} 480w, ${profileImgLarge} 960w`}
                  width={960}
                  height={1280}
                  sizes={`(max-width: ${media.mobile}px) 100vw, 480px`}
                  alt="Me smiling like a goofball at the Qwilr office in Sydney"
                />

              </div>
            </div>
          </div>
        )}
      </Transition>
    </Section>
  );
};
