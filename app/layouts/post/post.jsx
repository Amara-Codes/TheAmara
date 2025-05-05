import { Divider } from '~/components/divider';
import { Footer } from '~/components/footer';
import { Heading } from '~/components/heading';
import { Image } from '~/components/image';
import { Section } from '~/components/section';
import { Text } from '~/components/text';
import { tokens } from '~/components/theme-provider/theme';
import { Transition } from '~/components/transition';
import { useParallax, useScrollToHash } from '~/hooks';
import { useRef, useState, useEffect } from 'react';
import { clamp } from '~/utils/clamp';
import { formatDate } from '~/utils/date';
import { cssProps, msToNum, numToMs } from '~/utils/style';
import styles from './post.module.css';
import { Link as RouterLink } from '@remix-run/react';

export const Post = ({ children, title, date, banner, timecode }) => {
  const scrollToHash = useScrollToHash();
  const imageRef = useRef();
  const [dateTime, setDateTime] = useState(null);

  useEffect(() => {
    setDateTime(formatDate(date));
  }, [date, dateTime]);

  useParallax(0.004, value => {
    if (!imageRef.current) return;
    imageRef.current.style.setProperty('--blurOpacity', clamp(value, 0, 1));
  });

  const handleScrollIndicatorClick = event => {
    event.preventDefault();
    scrollToHash(event.currentTarget.href);
  };

  const placeholder = '/static/posts/banner-placeholder.png';

  return (
    <article className={styles.post}>
      <Section>
        {banner && (
          <div className={styles.banner} ref={imageRef}>
            <div className={styles.bannerImage}>
              <Image role="presentation" src={banner} placeholder={placeholder} alt="" />
            </div>
            <div className={styles.bannerImageBlur}>
              <Image
                role="presentation"
                src={placeholder}
                placeholder={placeholder}
                alt=""
              />
            </div>
          </div>
        )}
        <header className={styles.header}>
          <div className={styles.headerText}>
          
            <Heading level={2} as="h1" className={styles.title} aria-label={title}>
              {title.split(' ').map((word, index) => (
                <span className={styles.titleWordWrapper} key={`${word}-${index}`}>
                  <span
                    className={styles.titleWord}
                    style={cssProps({ delay: numToMs(index * 100 + 100) })}
                  >
                    {word}
                    {index !== title.split(' ').length - 1 ? ' ' : ''}
                  </span>
                </span>
              ))}
  
            </Heading>
            <div className={styles.details}>
              <div className={styles.timecode}>Reading time: {timecode}</div>
              <Transition in timeout={msToNum(tokens.base.durationM)}>
              {({ visible, nodeRef }) => (
                <div className={styles.date} ref={nodeRef}>
                  <Text className={styles.dateText} data-visible={visible}>
                    {dateTime}
                  </Text>
                </div>
              )}
            </Transition>
            </div>
          </div>
        </header>
      </Section>
      <Section className={styles.wrapper} id="postContent" tabIndex={-1}>
        <Text as="div" size="l" className={styles.content}>
          {children}
        </Text>
      </Section>
      <Footer />
    </article>
  );
};
