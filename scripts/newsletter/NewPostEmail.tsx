import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Markdown,
  Preview,
  Section,
  Text,
} from '@react-email/components';

// The newsletter email, composed with react-email so the library owns the
// email-client HTML (inline styles, Gmail width quirks, dark mode). The
// post intro goes in as markdown; the Markdown component renders it
// email-safe with the styles below. Images MUST stay width-constrained:
// post screenshots are 1200 to 1600px wide and one unconstrained <img>
// forces the 600px column open and Gmail stops wrapping text.

const SITE = 'https://ciprianrarau.com';

const palette = {
  background: '#F5F4F1',
  card: '#FFFFFF',
  border: '#E4E1DB',
  text: '#2B2723',
  muted: '#7C746B',
  primary: '#21517C',
  secondary: '#A45C36',
  codeBg: '#F7F5F2',
};

const markdownStyles = {
  p: { fontSize: '16px', lineHeight: '1.65', margin: '0 0 16px', color: palette.text },
  li: { fontSize: '16px', lineHeight: '1.65', color: palette.text },
  link: { color: palette.secondary },
  image: {
    display: 'block',
    width: '100%',
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px',
    margin: '16px 0',
  },
  codeBlock: {
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    maxWidth: '100%',
    background: palette.codeBg,
    border: `1px solid ${palette.border}`,
    borderRadius: '8px',
    padding: '14px',
    fontSize: '13px',
    lineHeight: '1.5',
  },
  codeInline: { background: palette.codeBg, borderRadius: '4px', padding: '1px 4px' },
  h2: { fontSize: '20px', lineHeight: '1.3', margin: '24px 0 8px', color: palette.text },
  h3: { fontSize: '17px', lineHeight: '1.3', margin: '20px 0 8px', color: palette.text },
};

export type NewPostEmailProps = {
  title: string;
  date: string;
  excerpt?: string;
  introMarkdown: string;
  postUrl: string;
  unsubscribeUrl: string;
};

export function NewPostEmail(props: NewPostEmailProps) {
  return (
    <Html>
      <Head />
      {props.excerpt ? <Preview>{props.excerpt}</Preview> : null}
      <Body style={{ margin: 0, padding: '24px 0', background: palette.background, fontFamily: 'Helvetica,Arial,sans-serif' }}>
        <Container style={{ maxWidth: '600px', width: '100%' }}>
          <Text style={{ padding: '0 20px', margin: '0 0 16px', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: palette.muted }}>
            Ciprian (Chip) Rarau &middot; New post
          </Text>
          <Section style={{ background: palette.card, border: `1px solid ${palette.border}`, borderRadius: '12px', padding: '36px 32px' }}>
            <Text style={{ margin: '0 0 8px', fontSize: '26px', lineHeight: '1.2', fontWeight: 'bold', color: palette.primary }}>
              {props.title}
            </Text>
            <Text style={{ margin: '0 0 24px', fontSize: '13px', color: palette.muted }}>{props.date}</Text>
            <Markdown markdownCustomStyles={markdownStyles} markdownContainerStyles={{ maxWidth: '100%', overflow: 'hidden' }}>
              {props.introMarkdown}
            </Markdown>
            <Button
              href={props.postUrl}
              style={{ marginTop: '28px', background: palette.primary, borderRadius: '8px', padding: '13px 26px', fontSize: '15px', fontWeight: 'bold', color: '#FFFFFF', textDecoration: 'none' }}
            >
              Read the full post &rarr;
            </Button>
          </Section>
          <Text style={{ padding: '20px 24px', margin: 0, fontSize: '12px', lineHeight: '1.6', color: palette.muted }}>
            You&apos;re getting this because you subscribed on{' '}
            <Link href={SITE} style={{ color: palette.secondary }}>ciprianrarau.com</Link> or{' '}
            <Link href="https://ideaplaces.com" style={{ color: palette.secondary }}>ideaplaces.com</Link>.
            One email per post, nothing else.
            <br />
            Ciprian Rarau &middot; Montreal, Canada &middot;{' '}
            <Link href={props.unsubscribeUrl} style={{ color: palette.secondary }}>Unsubscribe</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
