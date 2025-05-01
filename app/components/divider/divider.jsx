import { classes, cssProps, numToMs } from '~/utils/style';
import styles from './divider.module.css';
import { Image } from '../image';
import dividerImg from '~/assets/imgs/elements/divider.png';


export const Divider = ({
  className,
  style,
  ...rest
}) => (
  <div
    className={classes(styles.divider, className)}
    {...rest}
  >
<Image src={dividerImg} width="200" height="80" />
  </div>
);

