import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Head from '@docusaurus/Head';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import HomepageCard from '@site/src/components/Cards/HomepageCard';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Docusaurus Tutorial - 5min ⏱️
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const cardsBaseCss = useBaseUrl('/css/cards/base.css');
  const cardsCss = useBaseUrl('/css/cards/cards.css');
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <Head>
        <link rel="stylesheet" href={cardsBaseCss} />
        <link rel="stylesheet" href={cardsCss} />
      </Head>
      <HomepageHeader />
      <main>
        <section className={styles.cardShowcase}>
          <div className={styles.cardContainer}>
            <HomepageCard />
          </div>
        </section>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
