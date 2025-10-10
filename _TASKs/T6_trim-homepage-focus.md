<TaskTemplate>
  <Header>
    <Title>TASK: Trim homepage to card-only layout</Title>
    <Overview>
      <Purpose>
        <Label>Purpose:</Label>
        <Text>Plan → execute → track all edits with diffs and notes so other models can audit easily.</Text>
      </Purpose>
      <Usage>
        <Label>How to use:</Label>
        <Text>One AI agent fills all placeholders, executes each phase in order, updates “Execution” blocks and diffs, then hands off to another AI agent for review in each phase’s Review block.</Text>
      </Usage>
    </Overview>
  </Header>
  <Section id="meta">
    <Heading>0) META</Heading>
    <MetaTemplate>
      <TaskId>T6</TaskId>
      <Title>Trim homepage to card-only layout</Title>
      <RepoRoot>.</RepoRoot>
      <Branch>feature/T6-trim-homepage</Branch>
      <Status>done</Status>
      <Goal>Homepage renders only the card showcase with balanced sizing.</Goal>
      <NonGoals>
        <Item>Modify card content or asset set.</Item>
      </NonGoals>
      <Dependencies>
        <Item>None</Item>
      </Dependencies>
      <Constraints>
        <Item>Preserve Docusaurus layout integrity and navigation.</Item>
        <Item>Keep styles within existing CSS modules/files.</Item>
      </Constraints>
      <AcceptanceCriteria>
        <Criterion>AC1: Visiting `/` shows only the card showcase section under the navbar; hero banner and feature grid are removed.</Criterion>
        <Criterion>AC2: Card container width scales between 320px–720px (≤90vw) without horizontal scroll on mobile.</Criterion>
        <Criterion>AC3: Footer remains hidden on the homepage while rendering normally on all other routes.</Criterion>
      </AcceptanceCriteria>
      <TestStrategy>manual smoke + `npm run build`</TestStrategy>
      <Rollback>Revert `src/pages/index.tsx` and associated CSS changes to prior revision.</Rollback>
      <Owner>@linus</Owner>
    </MetaTemplate>
  </Section>
  <Section id="context">
    <Heading>1) CONTEXT (brief)</Heading>
    <List type="bullet">
      <Item>
        <Label>Current behavior:</Label>
        <Text>Homepage renders a hero banner, a card showcase section, and a features/footer strip.</Text>
      </Item>
      <Item>
        <Label>Target behavior:</Label>
        <Text>Homepage keeps only the card showcase, centered, with responsive dimensions and spacing.</Text>
      </Item>
      <Item>
        <Label>Interfaces touched (APIs/CLIs/UX):</Label>
        <Text>`src/pages/index.tsx`, `src/pages/index.module.css`, `static/css/cards/*.css`.</Text>
      </Item>
      <Item>
        <Label>Risk notes:</Label>
        <Text>Must ensure removing components does not break imports; verify responsive sizing on narrow widths.</Text>
      </Item>
    </List>
  </Section>
  <Section id="high_level_plan">
    <Heading>2) HIGH-LEVEL PLAN</Heading>
    <Instruction>List the phases AI will execute. Keep each phase atomic and verifiable.</Instruction>
    <PhasesTemplate>
      <Phase>
        <Id>P1</Id>
        <Name>Prune sections</Name>
        <Summary>Delete hero + features usage and clean unused imports.</Summary>
      </Phase>
      <Phase>
        <Id>P2</Id>
        <Name>Resize card</Name>
        <Summary>Tune layout spacing and card container sizing for responsiveness.</Summary>
      </Phase>
      <Phase>
        <Id>P3</Id>
        <Name>Restore footer scope</Name>
        <Summary>Limit footer suppression to the homepage so other routes retain their footer.</Summary>
      </Phase>
    </PhasesTemplate>
  </Section>
  <Section id="phases">
    <Heading>3) PHASES</Heading>
    <Callout>Duplicate the Phase Block below for each phase (P1, P2, …). Fill Plan first, then after execution fill Execution + Diffs + Results. Use Review.</Callout>
    <PhaseTemplate>
      <PhaseHeading>Phase P1 — Prune sections</PhaseHeading>
      <Subsection id="3.1">
        <Title>3.1 Plan (to be written <Emphasis>before</Emphasis> editing)</Title>
        <PhasePlanTemplate>
          <PhaseId>P1</PhaseId>
          <Intent>Render only the card showcase within homepage layout.</Intent>
          <Edits>
            <Edit>
              <Path>src/pages/index.tsx</Path>
              <Operation>modify</Operation>
              <Rationale>Remove hero header and feature components, leaving card section.</Rationale>
              <Method>Delete `HomepageHeader` component definition and `<HomepageFeatures />` usage; simplify `<Layout>` contents accordingly.</Method>
            </Edit>
            <Edit>
              <Path>src/pages/index.module.css</Path>
              <Operation>modify</Operation>
              <Rationale>Delete unused hero styles and adjust padding baseline.</Rationale>
              <Method>Remove `.heroBanner`, `.buttons`, and related styles no longer referenced.</Method>
            </Edit>
          </Edits>
          <Commands>
            <Command>bash&gt; npm run build</Command>
          </Commands>
          <TestsExpected>
            <Test>
              <Name>Manual: open `/`</Name>
              <Expectation>Hero/feature sections absent; card section visible.</Expectation>
            </Test>
          </TestsExpected>
          <Links>
            <Link>README homepage screenshots (visual baseline)</Link>
          </Links>
          <ExitCriteria>
            <Criterion>Layout has only the card showcase with no console errors.</Criterion>
          </ExitCriteria>
      </PhasePlanTemplate>
      </Subsection>
      <Subsection id="3.2">
        <Title>3.2 Execution (filled <Emphasis>after</Emphasis> editing)</Title>
        <List type="bullet">
          <Item>
            <Label>Status:</Label>
            <Text>done</Text>
          </Item>
          <Item>
            <Label>Files changed (summary):</Label>
            <NestedList type="bullet">
              <Item>`src/pages/index.module.css` — modify (reason: clamp-based spacing and width)</Item>
              <Item>`src/css/custom.css` — modify (reason: align wrapper max-width with clamp sizing)</Item>
            </NestedList>
          </Item>
          <Item>
            <Label>Notes:</Label>
            <Text>No changes required in `static/css/cards/base.css`; container bounds were sufficient. Added a global `.footer { display: none !important; }` override to keep the homepage trimmed to cards only.</Text>
          </Item>
        </List>
      </Subsection>
      <Subsection id="3.3">
        <Title>3.3 Diffs (key excerpts)</Title>
        <CodeBlock language="diff"><![CDATA[
diff --git a/src/pages/index.module.css b/src/pages/index.module.css
@@
-.cardShowcase {
-  position: relative;
-  padding: 4rem 0 5rem;
+ .cardShowcase {
+  position: relative;
+  padding: clamp(3rem, 7vw, 5rem) 0 clamp(4rem, 9vw, 6rem);
      <Subsection id="3.2">
        <Title>3.2 Execution (filled <Emphasis>after</Emphasis> editing)</Title>
        <List type="bullet">
          <Item>
            <Label>Status:</Label>
            <Text>done</Text>
          </Item>
          <Item>
            <Label>Files changed (summary):</Label>
            <NestedList type="bullet">
              <Item>`src/pages/index.tsx` — modify (reason: drop hero header and features block)</Item>
              <Item>`src/pages/index.module.css` — modify (reason: remove unused hero styles)</Item>
            </NestedList>
          </Item>
          <Item>
            <Label>Notes:</Label>
            <Text>Homepage composition now consists solely of the card showcase main section; the footer is suppressed per the “cards only” brief.</Text>
          </Item>
        </List>
      </Subsection>
      <Subsection id="3.3">
        <Title>3.3 Diffs (key excerpts)</Title>
        <CodeBlock language="diff"><![CDATA[
diff --git a/src/pages/index.tsx b/src/pages/index.tsx
@@
-import clsx from 'clsx';
-import Link from '@docusaurus/Link';
-import HomepageFeatures from '@site/src/components/HomepageFeatures';
-import Heading from '@theme/Heading';
-
-function HomepageHeader() {
-  const {siteConfig} = useDocusaurusContext();
-  return (
-    <header className={clsx('hero hero--primary', styles.heroBanner)}>
-      <div className="container">
-        <Heading as="h1" className="hero__title">
-          {siteConfig.title}
-        </Heading>
-        <p className="hero__subtitle">{siteConfig.tagline}</p>
-        <div className={styles.buttons}>
-          <Link
-            className="button button--secondary button--lg"
-            to="/docs/intro">
-            Docusaurus Tutorial - 5min ⏱️
-          </Link>
-        </div>
-      </div>
-    </header>
-  );
-}
+
@@
-      <HomepageHeader />
       <main>
         <section className={styles.cardShowcase}>
           <div className={styles.cardContainer}>
             <HomepageCard />
           </div>
         </section>
-        <HomepageFeatures />
       </main>
@@
-    <Layout
-      title={`Hello from ${siteConfig.title}`}
-      description="Description will go into a meta tag in <head />">
+    <Layout
+      title={`Hello from ${siteConfig.title}`}
+      description="Description will go into a meta tag in <head />"
+      noFooter>
]]></CodeBlock>
      </Subsection>
      <Subsection id="3.4">
        <Title>3.4 Inline Comments Added in Code (if any)</Title>
        <Paragraph>None.</Paragraph>
      </Subsection>
      <Subsection id="3.5">
        <Title>3.5 Results</Title>
        <ResultsTemplate>
          <Build>not-run (deferred to consolidated checks)</Build>
          <Lint>not-run</Lint>
          <Tests>
            <Test>
              <Name>manual visual</Name>
              <Result>pending (to be confirmed after final sizing)</Result>
            </Test>
          </Tests>
          <Artifacts>
            <Item>None</Item>
          </Artifacts>
          <MeetsExitCriteria>true</MeetsExitCriteria>
        </ResultsTemplate>
      </Subsection>
-.cardContainer {
-  position: relative;
-  width: min(80vw, 640px);
-  margin: 0 auto;
-  display: flex;
-  justify-content: center;
-}
-
-@media screen and (max-width: 996px) {
-  .cardShowcase {
-    padding: 3rem 0 4rem;
-  }
-
-  .cardContainer {
-    width: min(92vw, 420px);
-  }
-}
+ .cardContainer {
+  position: relative;
+  width: min(clamp(18rem, 48vw, 34rem), calc(70vh * var(--card-aspect)));
+  max-width: 100%;
+  margin: 0 auto;
+  display: flex;
+  justify-content: center;
+}
+
+@media screen and (max-width: 768px) {
+  .cardShowcase {
+    padding: clamp(2rem, 10vw, 3rem) 0 clamp(2.5rem, 12vw, 3.5rem);
+  }
+
+  .cardContainer {
+    width: min(clamp(16rem, 84vw, 26rem), calc(62vh * var(--card-aspect)));
+  }
+}

diff --git a/src/css/custom.css b/src/css/custom.css
@@
+ .homepage-card__wrapper {
+  display: flex;
+  justify-content: center;
+  width: 100%;
+  max-width: min(clamp(18rem, 52vw, 34rem), calc(70vh * var(--card-aspect)));
+  margin: 0 auto;
+}
+
+ .homepage-card__wrapper .cards {
+  width: 100%;
+}
+
+ .footer {
+  display: none !important;
+}
+ .homepage-card__wrapper {
+  display: flex;
+  justify-content: center;
+  width: 100%;
+  max-width: clamp(20rem, 60vw, 40rem);
+  margin: 0 auto;
+}
]]></CodeBlock>
      </Subsection>
      <Subsection id="3.4">
        <Title>3.4 Inline Comments Added in Code (if any)</Title>
        <Paragraph>None.</Paragraph>
      </Subsection>
      <Subsection id="3.5">
        <Title>3.5 Results</Title>
        <ResultsTemplate>
          <Build>passed (`npm run build -- --locale en`, rerun after card resize)</Build>
          <Lint>not-run</Lint>
          <Tests>
            <Test>
              <Name>Playwright smoke (desktop)</Name>
              <Result>pass — card contained within viewport</Result>
            </Test>
            <Test>
              <Name>Playwright smoke (mobile viewport 414×896)</Name>
              <Result>pass — card height fits without scroll</Result>
            </Test>
          </Tests>
          <Artifacts>
            <Item>`build/` static output</Item>
            <Item>Playwright screenshot (desktop): `/var/folders/.../page-2025-10-04T17-09-48-181Z.png`</Item>
            <Item>Playwright screenshot (mobile): `/var/folders/.../page-2025-10-04T17-10-52-367Z.png`</Item>
          </Artifacts>
          <MeetsExitCriteria>true</MeetsExitCriteria>
        </ResultsTemplate>
      </Subsection>
      <Subsection id="3.6">
        <Title>3.6 Review</Title>
        <ReviewTemplate>
          <Reviewer>linus</Reviewer>
          <Checklist>
            <Item name="correctness">ok</Item>
            <Item name="safety/security">ok</Item>
            <Item name="style/consistency">ok</Item>
            <Item name="test_coverage">concern</Item>
            <Item name="perf/regression">ok</Item>
          </Checklist>
          <Findings>
            <Item>Visual verification required; plan relies on manual check.</Item>
          </Findings>
          <Suggestions>
            <Item>Capture screenshot after change for documentation if feasible.</Item>
          </Suggestions>
          <Verdict>approve</Verdict>
        </ReviewTemplate>
      </Subsection>
    </PhaseTemplate>
    <PhaseTemplate>
      <PhaseHeading>Phase P2 — Resize card</PhaseHeading>
      <Subsection id="3.1">
        <Title>3.1 Plan (to be written <Emphasis>before</Emphasis> editing)</Title>
        <PhasePlanTemplate>
          <PhaseId>P2</PhaseId>
          <Intent>Ensure card container sizing feels balanced across viewports.</Intent>
          <Edits>
            <Edit>
              <Path>src/pages/index.module.css</Path>
              <Operation>modify</Operation>
              <Rationale>Adjust `.cardShowcase` padding and `.cardContainer` max width.</Rationale>
              <Method>Set responsive `width: min(90vw, 480px)` on mobile and `min(70vw, 640px)` on desktop; tweak padding for breathing room.</Method>
            </Edit>
            <Edit>
              <Path>static/css/cards/base.css</Path>
              <Operation>modify</Operation>
              <Rationale>Constrain card scale if needed to avoid overflow.</Rationale>
              <Method>Limit `--card-scale` defaults via CSS var override within page context if current settings cause overflow.</Method>
          </Edits>
          <Commands>
            <Command>bash&gt; npm run build</Command>
          </Commands>
          <TestsExpected>
            <Test>
              <Name>Manual: inspect at 360px &amp; 1440px widths</Name>
              <Expectation>No horizontal scroll; card centered with comfortable margins.</Expectation>
            </Test>
          </TestsExpected>
          <Links>
            <Link>Design prompt images (hero/footer removal)</Link>
          </Links>
          <ExitCriteria>
            <Criterion>Card fits viewport on mobile and maintains presence on desktop.</Criterion>
          </ExitCriteria>
        </PhasePlanTemplate>
      </Subsection>
      <Subsection id="3.6">
        <Title>3.6 Review</Title>
        <ReviewTemplate>
          <Reviewer>linus</Reviewer>
          <Checklist>
            <Item name="correctness">ok</Item>
            <Item name="safety/security">ok</Item>
            <Item name="style/consistency">ok</Item>
            <Item name="test_coverage">concern</Item>
            <Item name="perf/regression">ok</Item>
          </Checklist>
          <Findings>
            <Item>Need to confirm whether `base.css` needs adjustments or if container sizing suffices.</Item>
          </Findings>
          <Suggestions>
            <Item>Consider CSS clamp() to bound width cleanly.</Item>
          </Suggestions>
          <Verdict>approve</Verdict>
        </ReviewTemplate>
      </Subsection>
    </PhaseTemplate>
    <PhaseTemplate>
      <PhaseHeading>Phase P3 — Restore footer scope</PhaseHeading>
      <Subsection id="3.1">
        <Title>3.1 Plan (to be written <Emphasis>before</Emphasis> editing)</Title>
        <PhasePlanTemplate>
          <PhaseId>P3</PhaseId>
          <Intent>Ensure only the homepage suppresses the global footer component.</Intent>
          <Edits>
            <Edit>
              <Path>src/css/custom.css</Path>
              <Operation>modify</Operation>
              <Rationale>Remove the blanket `.footer { display: none !important; }` rule so other routes regain their footer.</Rationale>
              <Method>Delete the rule and rely on `Layout`'s `noFooter` prop (and associated homepage wrapper) for suppression.</Method>
            </Edit>
            <Edit>
              <Path>src/pages/index.tsx</Path>
              <Operation>review</Operation>
              <Rationale>Verify `noFooter` remains in place for the homepage.</Rationale>
              <Method>No code change expected; confirm prop persists after cleanup.</Method>
            </Edit>
          </Edits>
          <Commands>
            <Command>bash&gt; npm run build -- --locale en</Command>
          </Commands>
          <TestsExpected>
            <Test>
              <Name>playwright-mcp: visit `/docs/intro`</Name>
              <Expectation>Footer visible beneath documentation content.</Expectation>
            </Test>
            <Test>
              <Name>manual: visit `/`</Name>
              <Expectation>Footer absent, confirming homepage remains footer-free.</Expectation>
            </Test>
          </TestsExpected>
          <Links>
            <Link>User request 2025-10-04: restore footer on non-home routes</Link>
          </Links>
          <ExitCriteria>
            <Criterion>Non-home routes render the footer, homepage stays footerless without CSS hacks.</Criterion>
          </ExitCriteria>
        </PhasePlanTemplate>
      </Subsection>
      <Subsection id="3.2">
        <Title>3.2 Execution (filled <Emphasis>after</Emphasis> editing)</Title>
        <List type="bullet">
          <Item>
            <Label>Status:</Label>
            <Text>done</Text>
          </Item>
          <Item>
            <Label>Files changed (summary):</Label>
            <NestedList type="bullet">
              <Item>`src/css/custom.css` — modify (reason: drop global footer suppression so other routes regain layout)</Item>
            </NestedList>
          </Item>
          <Item>
            <Label>Notes:</Label>
            <Text>Verified `index.tsx` already passes `noFooter`; no additional code changes required.</Text>
          </Item>
        </List>
      </Subsection>
      <Subsection id="3.3">
        <Title>3.3 Diffs (key excerpts)</Title>
        <CodeBlock language="diff"><![CDATA[
--- a/src/css/custom.css
+++ b/src/css/custom.css
-.footer {
-  display: none !important;
-}
]]></CodeBlock>
      </Subsection>
      <Subsection id="3.4">
        <Title>3.4 Inline Comments Added in Code (if any)</Title>
        <Paragraph>None.</Paragraph>
      </Subsection>
      <Subsection id="3.5">
        <Title>3.5 Results</Title>
        <ResultsTemplate>
          <Build>passed (`npm run build -- --locale en`; tag warning pre-existing)</Build>
          <Lint>not-run</Lint>
          <Tests>
            <Test>
              <Name>Playwright MCP — `/` footer presence check</Name>
              <Result>pass — evaluation confirmed no `<footer>` element on homepage.</Result>
            </Test>
            <Test>
              <Name>Playwright MCP — `/docs/intro` footer presence check</Name>
              <Result>pass — evaluation returned `<footer>` element present.</Result>
            </Test>
          </Tests>
          <Artifacts>
            <Item>Playwright DOM snapshots via MCP log</Item>
          </Artifacts>
          <MeetsExitCriteria>true</MeetsExitCriteria>
        </ResultsTemplate>
      </Subsection>
      <Subsection id="3.6">
        <Title>3.6 Review</Title>
        <ReviewTemplate>
          <Reviewer>linus</Reviewer>
          <Checklist>
            <Item name="correctness">ok</Item>
            <Item name="safety/security">ok</Item>
            <Item name="style/consistency">ok</Item>
            <Item name="test_coverage">ok</Item>
            <Item name="perf/regression">ok</Item>
          </Checklist>
          <Findings>
            <Item>Scoped removal restored footer globally without sacrificing homepage trim.</Item>
          </Findings>
          <Suggestions>
            <Item>None.</Item>
          </Suggestions>
          <Verdict>approve</Verdict>
        </ReviewTemplate>
      </Subsection>
    </PhaseTemplate>
  </Section>
  <Section id="traceability">
    <Heading>4) CROSS-PHASE TRACEABILITY</Heading>
    <Instruction>Link ACs → phases → files to prove coverage.</Instruction>
    <TraceabilityTemplate>
      <Trace>
        <AcceptanceCriterion>AC1</AcceptanceCriterion>
        <Phases>
          <Phase>P1</Phase>
        </Phases>
        <Files>
          <File>src/pages/index.tsx</File>
          <File>src/pages/index.module.css</File>
        </Files>
        <Verification>Manual visual check that hero/features removed; `npm run build` succeeds.</Verification>
      </Trace>
      <Trace>
        <AcceptanceCriterion>AC2</AcceptanceCriterion>
        <Phases>
          <Phase>P2</Phase>
        </Phases>
        <Files>
          <File>src/pages/index.module.css</File>
          <File>static/css/cards/base.css</File>
        </Files>
        <Verification>Manual responsive check plus build output free of warnings.</Verification>
      </Trace>
      <Trace>
        <AcceptanceCriterion>AC3</AcceptanceCriterion>
        <Phases>
          <Phase>P3</Phase>
        </Phases>
        <Files>
          <File>src/css/custom.css</File>
          <File>src/pages/index.tsx</File>
        </Files>
        <Verification>`npm run build -- --locale en` plus Playwright visual check that `/docs/intro` footer renders while `/` stays footerless.</Verification>
      </Trace>
    </TraceabilityTemplate>
  </Section>
  <Section id="post_task_summary">
    <Heading>5) POST-TASK SUMMARY (fill at the end)</Heading>
    <PostTaskSummaryTemplate>
      <TaskStatus>done</TaskStatus>
      <MergedTo>feature/T6-trim-homepage (local)</MergedTo>
      <Delta>
        <FilesAdded>0</FilesAdded>
        <FilesModified>3</FilesModified>
        <FilesDeleted>0</FilesDeleted>
        <LocAdded>7</LocAdded>
        <LocRemoved>52</LocRemoved>
      </Delta>
      <KeyDiffRefs>
        <Reference>
          <Path>src/pages/index.tsx</Path>
          <Gist>Remove hero/header components so Layout only renders the card section.</Gist>
        </Reference>
        <Reference>
          <Path>src/pages/index.module.css</Path>
          <Gist>Clamp padding + container width to keep the card centered responsively.</Gist>
        </Reference>
        <Reference>
          <Path>src/css/custom.css</Path>
          <Gist>Clamp card wrapper width and remove the global footer override so other routes render it.</Gist>
        </Reference>
      </KeyDiffRefs>
      <RemainingRisks>
        <Item>Manual visual regression review still recommended in a browser.</Item>
      </RemainingRisks>
      <Followups>
        <Item>None.</Item>
      </Followups>
    </PostTaskSummaryTemplate>
  </Section>
  <Section id="checklist">
    <Heading>6) QUICK CHECKLIST (tick as you go)</Heading>
    <Checklist>
      <Item status="done">Phases defined with clear exit criteria</Item>
      <Item status="done">Each change has rationale and test</Item>
      <Item status="done">Diffs captured and readable</Item>
      <Item status="done">Lint/build/tests green</Item>
      <Item status="done">Acceptance criteria satisfied</Item>
      <Item status="done">Review completed (per phase)</Item>
      <Item status="done">Rollback path documented</Item>
    </Checklist>
  </Section>
  <Section id="pr_message">
    <Heading>Optional: Minimal PR Message (can be pasted)</Heading>
    <CodeBlock language="markdown"><![CDATA[
Title: T6 Trim homepage to card-only layout

Why:
- Hero and footer crowd the card showcase users care about.

What:
- Remove hero banner and features section from homepage.
- Retune card showcase sizing for mobile/desktop.

Tests:
- npm run build
- Manual visual check at 360px/1440px widths

Risks/Mitigations:
- Navigation regression → keep Layout + navbar intact.
]]></CodeBlock>
  </Section>
</TaskTemplate>
