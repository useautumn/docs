# Generate Changelog Entry

A guide for creating changelog entries from merged GitHub PRs.

## Step 1: Fetch PRs

Run this command to get all merged PRs since the last changelog entry:

```bash
gh pr list --repo useautumn/autumn --state merged --limit 500 --json number,title,url,mergedAt,body > /tmp/all_prs.json && cat /tmp/all_prs.json | jq --arg date "YYYY-MM-DD" '[.[] | select(.mergedAt >= $date)] | sort_by(.mergedAt) | reverse' > /tmp/filtered_prs.json && echo "Total PRs:" && jq 'length' /tmp/filtered_prs.json
```

> **Note:** Replace `YYYY-MM-DD` with the date of the last changelog entry (e.g., "2026-01-12").

## Step 2: Review the PRs

Get a quick summary of all PRs:

```bash
jq '[.[] | {number, title, mergedAt: .mergedAt[0:10]}]' /tmp/filtered_prs.json
```

To inspect specific PRs with generic titles (like "main", "dev"):

```bash
jq '[.[] | select(.number == 123 or .number == 456)] | .[] | {number, title, body: .body[0:500]}' /tmp/filtered_prs.json
```

## Step 3: Generate Changelog

Using the PR list, create a new changelog entry following the structure in `mintlify/changelog/changelog.mdx`.

### PR Format

Format each PR as:

```
<PR description> - [#<number>](<url>)
```

### Accordion Groups

Group changes into these accordion sections:

| Section | What to Include |
|---------|-----------------|
| **Improvements** | New features, enhancements, developer experience, performance |
| **Bug Fixes** | Fixes to existing functionality |
| **API** | New endpoints, schema changes, SDK updates, breaking changes |

### Headline Features

Pick **1-3 headline features** that are most exciting for users. Our audience is technical (developers, product builders, founders).

Headline features should:
- Have a clear user benefit
- Be described in 2-4 bullet points
- Include a screenshot/image placeholder (the user will place it in `mintlify/assets/changelog/`)

### Example Structure

```mdx
<Update label="January 18th 2026">
  ## Headline Feature Name

  Brief description of what this enables for users.

  - **Key benefit 1**: Description
  - **Key benefit 2**: Description
  - **Key benefit 3**: Description

  <br />
  <Frame style={{ width: "500px" }}>
    <img src="/assets/changelog/feature-screenshot.png" />
  </Frame>
  <br />

  <AccordionGroup>
    <Accordion title="Improvements">
      - Description of improvement - [#123](https://github.com/useautumn/autumn/pull/123)
      - Another improvement - [#124](https://github.com/useautumn/autumn/pull/124)
    </Accordion>
    
    <Accordion title="Bug Fixes">
      - Fixed issue with X - [#125](https://github.com/useautumn/autumn/pull/125)
    </Accordion>
    
    <Accordion title="API">
      - Added new `/endpoint` for Y - [#126](https://github.com/useautumn/autumn/pull/126)
    </Accordion>
  </AccordionGroup>
</Update>
```

## Tips

- PRs with generic titles ("main", "dev", "ayush") often contain significant features - check their bodies
- Consolidate related PRs (e.g., multiple PRs for "update subscription frontend") into single line items
- Skip internal/chore PRs unless they have user-facing impact
- Review the draft before editing the changelog file
