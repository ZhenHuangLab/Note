import type {ReactNode} from 'react';
import Head from '@docusaurus/Head';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageCard from '@site/src/components/Cards/HomepageCard';

import styles from './index.module.css';

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const cardsBaseCss = useBaseUrl('/css/cards/base.css');
  const cardsCss = useBaseUrl('/css/cards/cards.css');
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
      noFooter>
      <Head>
        <link rel="stylesheet" href={cardsBaseCss} />
        <link rel="stylesheet" href={cardsCss} />
      </Head>
      <main>
        <section className={styles.cardShowcase}>
          <div className={styles.cardContainer}>
            <HomepageCard />
          </div>
        </section>
      </main>
    </Layout>
  );
}
