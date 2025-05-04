import { Button } from '~/components/button';
import { DecoderText } from '~/components/decoder-text';
import { Divider } from '~/components/divider';
import { Footer } from '~/components/footer';
import { Heading } from '~/components/heading';
import { Icon } from '~/components/icon';
import { Input } from '~/components/input';
import { Section } from '~/components/section';
import { Text } from '~/components/text';
import { tokens } from '~/components/theme-provider/theme';
import { Transition } from '~/components/transition';
import { useFormInput } from '~/hooks';
import { useRef } from 'react';
import { cssProps, msToNum, numToMs } from '~/utils/style';
import { baseMeta } from '~/utils/meta';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { json } from '@remix-run/cloudflare';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import styles from './contact.module.css';

export const meta = () => {
  return baseMeta({
    title: 'Contact',
    description:
      'Send me a message if you’re interested in discussing a project or if you just want to say hi',
  });
};

const MAX_EMAIL_LENGTH = 512;
const MAX_MESSAGE_LENGTH = 4096;
const EMAIL_PATTERN = /(.+)@(.+){2,}\.(.+){2,}/;

export async function action({ context, request }) {
  const ses = new SESClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: context.cloudflare.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: context.cloudflare.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const formData = await request.formData();
  const isBot = String(formData.get('name'));
  const email = String(formData.get('email'));
  const message = String(formData.get('message'));
  const errors = {};

  // Return without sending if a bot trips the honeypot
  if (isBot) return json({ success: true });

  // Handle input validation on the server
  if (!email || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!message) {
    errors.message = 'Please enter a message.';
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    errors.email = `Email address must be shorter than ${MAX_EMAIL_LENGTH} characters.`;
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    errors.message = `Message must be shorter than ${MAX_MESSAGE_LENGTH} characters.`;
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors });
  }

  // Send email via Amazon SES
  await ses.send(
    new SendEmailCommand({
      Destination: {
        ToAddresses: [context.cloudflare.env.EMAIL],
      },
      Message: {
        Body: {
          Text: {
            Data: `From: ${email}\n\n${message}`,
          },
        },
        Subject: {
          Data: `Message from ${email}`,
        },
      },
      Source: `Site <${context.cloudflare.env.FROM_EMAIL}>`,
      ReplyToAddresses: [email],
    })
  );

  return json({ success: true });
}

export const Contact = () => {
  const errorRef = useRef();
  const email = useFormInput('');
  const message = useFormInput('');
  const initDelay = tokens.base.durationS;
  const actionData = useActionData();
  const { state } = useNavigation();
  const sending = state === 'submitting';

  return (
    <Section className={styles.contact}>
      <div className={styles.wrapper}>
        <div className={styles.address}>
          <div className={styles.map}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2615.5754333685622!2d103.8582155916886!3d13.356272604245927!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3110173824530e15%3A0x58989ffc8660d3b!2sAmara%20Beer%20Lab!5e0!3m2!1sen!2skh!4v1745976533132!5m2!1sen!2skh"
              width="100%"
              height="400"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div className={styles.text}>
            <p>The Amara Bar and Resturant</p>
            <i>Plant-based and vegetarian resturant</i>
            <p>629, Central Market St</p>
            <p>12131 Krong Siem Reap</p>
            <p>Cambodia</p>
            <div>
              <span>Phone: </span>
              <a href="tel:+855977754816">+855 9 777 54 816</a>
            </div>
            <div>
              <span>Email: </span>
              <a href="mailto:theamara.siemreap@gmail.com">theamara.siemreap@gmail.com</a>
            </div>
          </div>
        </div>
        <Transition unmount in={!actionData?.success} timeout={1600}>
          {({ status, nodeRef }) => (
            <Form
              unstable_viewTransition
              className={styles.form}
              method="post"
              ref={nodeRef}
            >
              <Heading
                className={styles.title}
                data-status={status}
                level={3}
                as="h1"
                style={getDelay(tokens.base.durationXS, initDelay, 0.3)}
              >
                <span>Write Us</span>
              </Heading>
              <Input
                className={styles.botkiller}
                label="Name"
                name="name"
                maxLength={MAX_EMAIL_LENGTH}
              />
              <Input
                required
                className={styles.input}
                data-status={status}
                style={getDelay(tokens.base.durationXS, initDelay)}
                autoComplete="email"
                label="Your email"
                type="email"
                name="email"
                maxLength={MAX_EMAIL_LENGTH}
                {...email}
              />
              <Input
                required
                multiline
                className={styles.input}
                data-status={status}
                style={getDelay(tokens.base.durationS, initDelay)}
                autoComplete="off"
                label="Message"
                name="message"
                maxLength={MAX_MESSAGE_LENGTH}
                {...message}
              />
              <Transition
                unmount
                in={!sending && actionData?.errors}
                timeout={msToNum(tokens.base.durationM)}
              >
                {({ status: errorStatus, nodeRef }) => (
                  <div
                    className={styles.formError}
                    ref={nodeRef}
                    data-status={errorStatus}
                    style={cssProps({
                      height: errorStatus ? errorRef.current?.offsetHeight : 0,
                    })}
                  >
                    <div className={styles.formErrorContent} ref={errorRef}>
                      <div className={styles.formErrorMessage}>
                        <Icon className={styles.formErrorIcon} icon="error" />
                        {actionData?.errors?.email}
                        {actionData?.errors?.message}
                      </div>
                    </div>
                  </div>
                )}
              </Transition>
              <Button
                className={styles.button}
                data-status={status}
                data-sending={sending}
                style={getDelay(tokens.base.durationM, initDelay)}
                disabled={sending}
                loading={sending}
                loadingText="Sending..."
                icon="send"
                type="submit"
              >
                Send message
              </Button>
            </Form>
          )}
        </Transition>
        <Transition unmount in={actionData?.success}>
          {({ status, nodeRef }) => (
            <div className={styles.complete} aria-live="polite" ref={nodeRef}>
              <Heading
                level={3}
                as="h3"
                className={styles.completeTitle}
                data-status={status}
              >
                Message Sent
              </Heading>
              <Text
                size="l"
                as="p"
                className={styles.completeText}
                data-status={status}
                style={getDelay(tokens.base.durationXS)}
              >
                I’ll get back to you within a couple days, sit tight
              </Text>
              <Button
                secondary
                iconHoverShift
                className={styles.completeButton}
                data-status={status}
                style={getDelay(tokens.base.durationM)}
                href="/"
                icon="chevron-right"
              >
                Back to homepage
              </Button>
            </div>
          )}
        </Transition>
      </div>
    </Section>
  );
};

function getDelay(delayMs, offset = numToMs(0), multiplier = 1) {
  const numDelay = msToNum(delayMs) * multiplier;
  return cssProps({ delay: numToMs((msToNum(offset) + numDelay).toFixed(0)) });
}
