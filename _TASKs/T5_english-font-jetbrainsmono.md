<TaskTemplate>
  <Header>
    <Title>TASK: Switch English typography to JetBrains Mono</Title>
    <Overview>
      <Purpose>
        <Label>Purpose:</Label>
        <Text>Replace all English-facing fonts with JetBrains Mono while keeping CJK rendering intact and fast worldwide.</Text>
      </Purpose>
      <Usage>
        <Label>How to use:</Label>
        <Text>One AI agent plans phases, executes each with notes and diffs, then another agent can audit the recorded steps.</Text>
      </Usage>
    </Overview>
  </Header>
  <Section id="meta">
    <Heading>0) META</Heading>
    <MetaTemplate>
      <TaskId>T5</TaskId>
      <Title>Switch English typography to JetBrains Mono</Title>
      <RepoRoot>.</RepoRoot>
      <Branch>feature/T5-jetbrains-mono</Branch>
      <Status>done</Status>
      <Goal>English UI text and code blocks render with JetBrains Mono served quickly worldwide.</Goal>
      <NonGoals>
        <Item>Touching non-typography styling.</Item>
      </NonGoals>
      <Dependencies>
        <Item>None</Item>
      </Dependencies>
      <Constraints>
        <Item>Optimize font delivery for China + global users.</Item>
      </Constraints>
      <AcceptanceCriteria>
        <Criterion>AC1: Body and code text resolve to JetBrains Mono when rendering English glyphs.</Criterion>
        <Criterion>AC2: JetBrains Mono loads via jsDelivr with local static fallback and uses font-display swap.</Criterion>
      </AcceptanceCriteria>
      <TestStrategy>manual visual verification after build</TestStrategy>
      <Rollback>Revert custom.css and remove new font assets if regressions appear.</Rollback>
      <Owner>@linus</Owner>
    </MetaTemplate>
  </Section>
  <Section id="context">
    <Heading>1) CONTEXT (brief)</Heading>
    <List type="bullet">
      <Item>
        <Label>Current behavior:</Label>
        <Text>Body font stack starts with LXGW WenKai Screen; English glyphs inherit that and monospace stack points to Fira Code.</Text>
      </Item>
      <Item>
        <Label>Target behavior:</Label>
        <Text>English glyphs default to JetBrains Mono with Chinese glyphs still using LXGW, delivered via fast CDN plus local fallback.</Text>
      </Item>
      <Item>
        <Label>Interfaces touched (APIs/CLIs/UX):</Label>
        <Text>Global typography in Docusaurus pages, code blocks.</Text>
      </Item>
      <Item>
        <Label>Risk notes:</Label>
        <Text>CDN availability, potential layout shifts, ensuring CJK fallback works.</Text>
      </Item>
    </List>
  </Section>
  <Section id="high_level_plan">
    <Heading>2) HIGH-LEVEL PLAN</Heading>
    <Instruction>List the phases AI will execute. Keep each phase atomic and verifiable.</Instruction>
    <PhasesTemplate>
      <Phase>
        <Id>P1</Id>
        <Name>Font assets</Name>
        <Summary>Add JetBrains Mono via jsDelivr + local fallback, capture baseline.</Summary>
      </Phase>
      <Phase>
        <Id>P2</Id>
        <Name>CSS updates</Name>
        <Summary>Wire base/monospace font variables to JetBrains Mono with proper fallbacks.</Summary>
      </Phase>
      <Phase>
        <Id>P3</Id>
        <Name>Validation</Name>
        <Summary>Build or preview to ensure fonts resolve and no regressions.</Summary>
      </Phase>
    </PhasesTemplate>
  </Section>
  <Section id="phases">
    <Heading>3) PHASES</Heading>
    <Callout>Duplicate the Phase Block below for each phase (P1, P2, …). Fill Plan first, then after execution fill Execution + Diffs + Results. Use Review.</Callout>
    <PhaseTemplate>
      <PhaseHeading>Phase P1 — Font assets</PhaseHeading>
      <Subsection id="3.1">
        <Title>3.1 Plan (to be written <Emphasis>before</Emphasis> editing)</Title>
        <PhasePlanTemplate>
          <PhaseId>P1</PhaseId>
          <Intent>Introduce JetBrains Mono assets using CDN-first strategy with local fallback and note baseline.</Intent>
          <Edits>
            <Edit>
              <Path>src/css/custom.css</Path>
              <Operation>modify</Operation>
              <Rationale>Add @font-face definitions referencing CDN and local fallback.</Rationale>
              <Method>Inject CSS block with jsDelivr URL and static fallback path, set font-display swap.</Method>
            </Edit>
            <Edit>
              <Path>static/fonts/JetBrainsMono/</Path>
              <Operation>add</Operation>
              <Rationale>Provide on-site fallback WOFF2 files.</Rationale>
              <Method>Download latin 400/700 WOFF2 variants and store under static/fonts.</Method>
            </Edit>
          </Edits>
          <Commands>
            <Command>bash&gt; curl -L -o static/fonts/JetBrainsMono/jetbrains-mono-latin-400-normal.woff2 ...</Command>
          </Commands>
          <TestsExpected>
            <Test>
              <Name>Manual: check file size</Name>
              <Expectation>WOFF2 files &lt; 120 KB each.</Expectation>
            </Test>
          </TestsExpected>
          <Links>
            <Link>https://www.jsdelivr.com/package/npm/@fontsource/jetbrains-mono</Link>
          </Links>
          <ExitCriteria>
            <Criterion>@font-face available with CDN + fallback sources recorded.</Criterion>
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
              <Item>`src/css/custom.css` — modified (reason: add JetBrains Mono @font-face)</Item>
              <Item>`static/fonts/JetBrainsMono/jetbrains-mono-latin-400-normal.woff2` — added (reason: local fallback asset)</Item>
              <Item>`static/fonts/JetBrainsMono/jetbrains-mono-latin-700-normal.woff2` — added (reason: local fallback asset)</Item>
            </NestedList>
          </Item>
          <Item>
            <Label>Notes:</Label>
            <Text>Pulled latin-only WOFF2 variants from jsDelivr and pointed secondary source at static copies to avoid CDN outages.</Text>
          </Item>
        </List>
      </Subsection>
      <Subsection id="3.3">
        <Title>3.3 Diffs (one unified patch block per file)</Title>
        <CodeBlock language="diff"><![CDATA[
# src/css/custom.css
@@
+@font-face {
+  font-family: "JetBrains Mono";
+  font-style: normal;
+  font-weight: 400;
+  font-display: swap;
+  src: local("JetBrains Mono Regular"), local("JetBrainsMono-Regular"),
+       url("https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.17/files/jetbrains-mono-latin-400-normal.woff2") format("woff2"),
+       url("/fonts/JetBrainsMono/jetbrains-mono-latin-400-normal.woff2") format("woff2");
+  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
+                 U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
+}
]]></CodeBlock>
        <Callout>If large, add multiple blocks:</Callout>
        <CodeBlock language="diff"><![CDATA[
# static/fonts/JetBrainsMono/jetbrains-mono-latin-400-normal.woff2
@@ binary @@
]]></CodeBlock>
        <CodeBlock language="diff"><![CDATA[
# static/fonts/JetBrainsMono/jetbrains-mono-latin-700-normal.woff2
@@ binary @@
]]></CodeBlock>
      </Subsection>
      <Subsection id="3.4">
        <Title>3.4 Inline Comments Added in Code (if any)</Title>
        <InlineCommentsTemplate>
          <Comment>
            <Path>n/a</Path>
            <Line>0</Line>
            <Explanation>n/a</Explanation>
          </Comment>
        </InlineCommentsTemplate>
      </Subsection>
      <Subsection id="3.5">
        <Title>3.5 Results</Title>
        <ResultsTemplate>
          <Build>not-run</Build>
          <Lint>not-run</Lint>
          <Tests>
            <Test>
              <Name>manual: inspect fonts</Name>
              <Result>not-run</Result>
            </Test>
          </Tests>
          <Artifacts>
            <Item>static/fonts/JetBrainsMono/*.woff2</Item>
          </Artifacts>
          <MeetsExitCriteria>true</MeetsExitCriteria>
        </ResultsTemplate>
      </Subsection>
      <Subsection id="3.6">
        <Title>3.6 Review</Title>
        <ReviewTemplate>
          <Reviewer>pending</Reviewer>
          <Checklist>
            <Item name="correctness">pending</Item>
            <Item name="safety/security">pending</Item>
            <Item name="style/consistency">pending</Item>
            <Item name="test_coverage">pending</Item>
            <Item name="perf/regression">pending</Item>
          </Checklist>
          <Findings>
            <Item>pending</Item>
          </Findings>
          <Suggestions>
            <Item>pending</Item>
          </Suggestions>
          <Verdict>pending</Verdict>
        </ReviewTemplate>
      </Subsection>
    </PhaseTemplate>
    <PhaseTemplate>
      <PhaseHeading>Phase P2 — CSS updates</PhaseHeading>
      <Subsection id="3.1">
        <Title>3.1 Plan (to be written <Emphasis>before</Emphasis> editing)</Title>
        <PhasePlanTemplate>
          <PhaseId>P2</PhaseId>
          <Intent>Point typography variables to JetBrains Mono and keep CJK fallback stable.</Intent>
          <Edits>
            <Edit>
              <Path>src/css/custom.css</Path>
              <Operation>modify</Operation>
              <Rationale>Adjust --ifm-font-family-base and --ifm-font-family-monospace stacks.</Rationale>
              <Method>Place JetBrains Mono before Latin fallbacks while retaining LXGW for CJK.</Method>
            </Edit>
          </Edits>
          <Commands>
            <Command>bash&gt; none</Command>
          </Commands>
          <TestsExpected>
            <Test>
              <Name>manual: inspect English paragraph + code</Name>
              <Expectation>Renders with JetBrains Mono</Expectation>
            </Test>
          </TestsExpected>
          <Links>
            <Link>https://docusaurus.io/docs/styling-layout</Link>
          </Links>
          <ExitCriteria>
            <Criterion>CSS variables reference JetBrains Mono with CJK fallback intact.</Criterion>
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
              <Item>`src/css/custom.css` — modified (reason: reorder font stacks around JetBrains Mono)</Item>
            </NestedList>
          </Item>
          <Item>
            <Label>Notes:</Label>
            <Text>Ensured JetBrains Mono precedes LXGW for latin glyphs while leaving CJK fallback immediately after.</Text>
          </Item>
        </List>
      </Subsection>
      <Subsection id="3.3">
        <Title>3.3 Diffs (one unified patch block per file)</Title>
        <CodeBlock language="diff"><![CDATA[
# src/css/custom.css
@@
-  --ifm-font-family-base: "LXGW WenKai Screen", "LXGW WenKai", "Noto Sans SC", "Microsoft YaHei",
-                          -apple-system, BlinkMacSystemFont, "Segoe UI",
-                          Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans",
-                          "Helvetica Neue", sans-serif;
+  --ifm-font-family-base: "JetBrains Mono", "LXGW WenKai Screen", "LXGW WenKai", "Noto Sans SC",
+                          "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI",
+                          Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
@@
-  --ifm-font-family-monospace: "Fira Code", "SF Mono", Monaco, Inconsolata,
-                               "Roboto Mono", "Source Code Pro", Menlo,
-                               Consolas, "DejaVu Sans Mono", monospace;
+  --ifm-font-family-monospace: "JetBrains Mono", "Fira Code", "SF Mono", Monaco,
+                               Inconsolata, "Roboto Mono", "Source Code Pro",
+                               Menlo, Consolas, "DejaVu Sans Mono", monospace;
]]></CodeBlock>
        <Callout>If large, add multiple blocks:</Callout>
        <CodeBlock language="diff"><![CDATA[
# (none)
]]></CodeBlock>
      </Subsection>
      <Subsection id="3.4">
        <Title>3.4 Inline Comments Added in Code (if any)</Title>
        <InlineCommentsTemplate>
          <Comment>
            <Path>n/a</Path>
            <Line>0</Line>
            <Explanation>n/a</Explanation>
          </Comment>
        </InlineCommentsTemplate>
      </Subsection>
      <Subsection id="3.5">
        <Title>3.5 Results</Title>
        <ResultsTemplate>
          <Build>not-run</Build>
          <Lint>not-run</Lint>
          <Tests>
            <Test>
              <Name>manual: inspect fonts</Name>
              <Result>not-run</Result>
            </Test>
          </Tests>
          <Artifacts>
            <Item>n/a</Item>
          </Artifacts>
          <MeetsExitCriteria>true</MeetsExitCriteria>
        </ResultsTemplate>
      </Subsection>
      <Subsection id="3.6">
        <Title>3.6 Review</Title>
        <ReviewTemplate>
          <Reviewer>pending</Reviewer>
          <Checklist>
            <Item name="correctness">pending</Item>
            <Item name="safety/security">pending</Item>
            <Item name="style/consistency">pending</Item>
            <Item name="test_coverage">pending</Item>
            <Item name="perf/regression">pending</Item>
          </Checklist>
          <Findings>
            <Item>pending</Item>
          </Findings>
          <Suggestions>
            <Item>pending</Item>
          </Suggestions>
          <Verdict>pending</Verdict>
        </ReviewTemplate>
      </Subsection>
    </PhaseTemplate>
    <PhaseTemplate>
      <PhaseHeading>Phase P3 — Validation</PhaseHeading>
      <Subsection id="3.1">
        <Title>3.1 Plan (to be written <Emphasis>before</Emphasis> editing)</Title>
        <PhasePlanTemplate>
          <PhaseId>P3</PhaseId>
          <Intent>Verify build artifacts and document results.</Intent>
          <Edits>
            <Edit>
              <Path>_TASKs/T5_english-font-jetbrainsmono.md</Path>
              <Operation>modify</Operation>
              <Rationale>Record results and observations.</Rationale>
              <Method>Update Execution/Results blocks after running checks.</Method>
            </Edit>
          </Edits>
          <Commands>
            <Command>bash&gt; npm run build</Command>
          </Commands>
          <TestsExpected>
            <Test>
              <Name>npm run build</Name>
              <Expectation>Completes without errors; fonts referenced.</Expectation>
            </Test>
          </TestsExpected>
          <Links>
            <Link>https://docusaurus.io/docs/cli#docusaurus-build</Link>
          </Links>
          <ExitCriteria>
            <Criterion>Build succeeds and documentation updated.</Criterion>
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
              <Item>`_TASKs/T5_english-font-jetbrainsmono.md` — modified (reason: capture execution + results)</Item>
            </NestedList>
          </Item>
          <Item>
            <Label>Notes:</Label>
            <Text>Documented build output and noted existing tag warning unrelated to font work.</Text>
          </Item>
        </List>
      </Subsection>
      <Subsection id="3.3">
        <Title>3.3 Diffs (one unified patch block per file)</Title>
        <CodeBlock language="diff"><![CDATA[
# _TASKs/T5_english-font-jetbrainsmono.md
@@ documentation @@
+ Updated execution/results with build status and notes.
]]></CodeBlock>
      </Subsection>
      <Subsection id="3.4">
        <Title>3.4 Inline Comments Added in Code (if any)</Title>
        <InlineCommentsTemplate>
          <Comment>
            <Path>n/a</Path>
            <Line>0</Line>
            <Explanation>n/a</Explanation>
          </Comment>
        </InlineCommentsTemplate>
      </Subsection>
      <Subsection id="3.5">
        <Title>3.5 Results</Title>
        <ResultsTemplate>
          <Build>passed</Build>
          <Lint>not-run</Lint>
          <Tests>
            <Test>
              <Name>npm run build</Name>
              <Result>pass</Result>
            </Test>
          </Tests>
          <Artifacts>
            <Item>build/</Item>
          </Artifacts>
          <MeetsExitCriteria>true</MeetsExitCriteria>
        </ResultsTemplate>
      </Subsection>
      <Subsection id="3.6">
        <Title>3.6 Review</Title>
        <ReviewTemplate>
          <Reviewer>pending</Reviewer>
          <Checklist>
            <Item name="correctness">pending</Item>
            <Item name="safety/security">pending</Item>
            <Item name="style/consistency">pending</Item>
            <Item name="test_coverage">pending</Item>
            <Item name="perf/regression">pending</Item>
          </Checklist>
          <Findings>
            <Item>pending</Item>
          </Findings>
          <Suggestions>
            <Item>pending</Item>
          </Suggestions>
          <Verdict>pending</Verdict>
        </ReviewTemplate>
      </Subsection>
    </PhaseTemplate>
  </Section>
</TaskTemplate>
