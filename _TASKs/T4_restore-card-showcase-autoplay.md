<TaskTemplate>
  <Header>
    <Title>TASK: Restore homepage card showcase autoplay</Title>
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
      <TaskId>T4</TaskId>
      <Title>Restore homepage card showcase autoplay</Title>
      <RepoRoot>.</RepoRoot>
      <Branch>feature/T4-card-showcase</Branch>
      <Status>in-progress</Status>
      <Goal>Ensure the homepage card showcase auto-plays once per load with ±10° spring motion unless user interaction cancels it.</Goal>
      <NonGoals>
        <Item>Do not alter pointer/touch/orientation interaction behavior outside showcase flow.</Item>
      </NonGoals>
      <Dependencies>
        <Item>None</Item>
      </Dependencies>
      <Constraints>
        <Item>Respect existing spring configs, reduced-motion preference, and visibility cancellation.</Item>
      </Constraints>
      <AcceptanceCriteria>
        <Criterion>AC1: On initial page load the card showcase animates once automatically, sweeping roughly ±10° unless interrupted.</Criterion>
        <Criterion>AC2: After completion or user interruption the showcase does not auto-repeat until page refresh while manual interactions still work.</Criterion>
      </AcceptanceCriteria>
      <TestStrategy>manual (logic inspection + CSS variable verification)</TestStrategy>
      <Rollback>Revert edits to `_TASKs/T4_restore-card-showcase-autoplay.md` and `src/components/Cards/Card.tsx`.</Rollback>
      <Owner>@assistant</Owner>
    </MetaTemplate>
  </Section>
  <Section id="context">
    <Heading>1) CONTEXT (brief)</Heading>
    <List type="bullet">
      <Item>
        <Label>Current behavior:</Label>
        <Text>Showcase autoplay fails to start because the effect cancels itself when `isActive` flips true, leaving the card idle unless a user interacts.</Text>
      </Item>
      <Item>
        <Label>Target behavior:</Label>
        <Text>Showcase animates once shortly after load using the spring-driven choreography, then yields control back to idle unless user input restarts another controller.</Text>
      </Item>
      <Item>
        <Label>Interfaces touched (APIs/CLIs/UX):</Label>
        <Text>`src/components/Cards/Card.tsx` (showcase effect), homepage UI.</Text>
      </Item>
      <Item>
        <Label>Risk notes:</Label>
        <Text>Must avoid regressions in reduced-motion mode, pointer/orientation controllers, and ensure springs keep latest refs without memory leaks.</Text>
      </Item>
    </List>
  </Section>
  <Section id="high_level_plan">
    <Heading>2) HIGH-LEVEL PLAN</Heading>
    <Instruction>List the phases AI will execute. Keep each phase atomic and verifiable.</Instruction>
    <PhasesTemplate>
      <Phase>
        <Id>P1</Id>
        <Name>Stabilize showcase effect</Name>
        <Summary>Refactor showcase autoplay to use stable refs for springs/controller helpers so the cycle runs once and respects interrupts.</Summary>
      </Phase>
    </PhasesTemplate>
  </Section>
  <Section id="phases">
    <Heading>3) PHASES</Heading>
    <Callout>Duplicate the Phase Block below for each phase (P1, P2, …). Fill Plan first, then after execution fill Execution + Diffs + Results. Use Review.</Callout>

    <PhaseTemplate>
      <PhaseHeading>Phase P1 — Stabilize showcase effect</PhaseHeading>
      <Subsection id="3.1">
        <Title>3.1 Plan (to be written <Emphasis>before</Emphasis> editing)</Title>
        <PhasePlanTemplate>
          <PhaseId>P1</PhaseId>
          <Intent>Restore autoplay once-per-load behavior by preventing premature cleanup and keeping spring targets in sync.</Intent>
          <Edits>
            <Edit>
              <Path>src/components/Cards/Card.tsx</Path>
              <Operation>modify</Operation>
              <Rationale>Current showcase effect clears itself when state updates; need refs and guarded scheduling.</Rationale>
              <Method>Introduce `useLatest` refs for springs/helpers, gate effect start on controller state, and adjust cleanup to run only on unmount or prop changes.</Method>
            </Edit>
          </Edits>
          <Commands>
            <Command>bash&gt; npm run lint -- --max-warnings=0</Command>
          </Commands>
          <TestsExpected>
            <Test>
              <Name>Manual: load homepage without input</Name>
              <Expectation>Card animates through one showcase cycle (±10°) then idles until refreshed or interrupted.</Expectation>
            </Test>
            <Test>
              <Name>Manual: interact via pointer during showcase</Name>
              <Expectation>Showcase stops immediately and does not restart automatically.</Expectation>
            </Test>
          </TestsExpected>
          <Links>
            <Link>src/components/Cards/Card.tsx — showcase effect block</Link>
          </Links>
          <ExitCriteria>
            <Criterion>Showcase autoplay runs once per load unless cancelled, while other controllers remain unaffected.</Criterion>
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
              <Item>`src/components/Cards/Card.tsx` — modify (stabilized showcase refs, guarded autoplay)</Item>
            </NestedList>
          </Item>
          <Item>
            <Label>Notes:</Label>
            <Text>Converted showcase effect to use ref-backed spring handles so state toggles no longer cancel the cycle; added retry when pointer/orientation holds control.</Text>
          </Item>
        </List>
      </Subsection>
      <Subsection id="3.3">
        <Title>3.3 Diffs (one unified patch block per file)</Title>
        <CodeBlock language="diff"><![CDATA[
# src/components/Cards/Card.tsx
+ add `useLatest` hook to memoize spring/controller handles without retriggering effects
+ track `isShowcaseActive` state so autoplay skips the `active` glow while exposing a `showcase-active` class hook
+ drive showcase animation through ref-backed springs and reschedule when another controller is active
+ release springs via `releaseToIdleRef` when autoplay completes naturally
- drop `resetCard` helper and the `isActive` gate that cancelled autoplay prematurely
- stop using direct spring setters inside showcase effect
]]></CodeBlock>
        <Callout>If large, add multiple blocks:</Callout>
        <CodeBlock language="diff"><![CDATA[
# (n/a)
]]></CodeBlock>
      </Subsection>
      <Subsection id="3.4">
        <Title>3.4 Inline Comments Added in Code (if any)</Title>
        <InlineCommentsTemplate>
          <Comment>
            <Path>n/a</Path>
            <Line>0</Line>
            <Explanation>No inline code comments added yet.</Explanation>
          </Comment>
        </InlineCommentsTemplate>
      </Subsection>
      <Subsection id="3.5">
        <Title>3.5 Results</Title>
        <ResultsTemplate>
          <Build>not-run</Build>
          <Lint>failed (npm error: missing "lint" script)</Lint>
          <Tests>
            <Test>
              <Name>manual showcase cycle</Name>
              <Result>pending</Result>
            </Test>
          </Tests>
          <Artifacts>
            <Item>n/a</Item>
          </Artifacts>
          <MeetsExitCriteria>false</MeetsExitCriteria>
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
