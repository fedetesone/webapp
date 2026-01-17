# ES Query Visualizer & Editor - Design Document

## Overview

A web tool that takes Elasticsearch JSON queries and visualizes them as an understandable, editable tree. Users can modify queries through a visual UI and export to multiple languages (Java, cURL, Python).

**Primary users:** Developers debugging/understanding existing ES queries, and secondarily building new ones.

**Core value:** Complex nested ES queries become readable, editable, and exportable without memorizing the DSL.

---

## App Shell & Navigation

### Dreamy Sidebar

**Visual foundation:**
- Glassmorphism base - semi-transparent with backdrop blur, main content subtly shows through
- Soft gradient accent on sidebar edge (purple→blue), subtle glow
- Dark mode first (#0a0a0b base), light mode inverts elegantly

**Logo area (top):**
- Minimal wordmark or icon
- Subtle breathing animation - slow pulse, almost imperceptible
- Click returns to home/launcher

**Search (Cmd+K):**
- Pill-shaped input with soft inner shadow
- Placeholder fades between hints: "Search tools...", "Try 'elasticsearch'...", "Cmd+K"
- Focused: expands slightly, border glows with accent color
- Results appear inline, fuzzy-matched

**Tool list:**
- Each row: icon (outlined, monoline) + name + description on hover
- Hover: soft luminous background, icon fills in, slight lift
- Active: left edge lights up with accent gradient
- Transitions: spring physics, snappy but organic

**Micro-interactions:**
- Click: icon micro-bounce
- Collapse: tools shrink to icons with staggered timing
- Scroll: top/bottom edges fade (no harsh scrollbar)

**Footer:**
- Theme toggle: sun/moon morphs when switching
- Settings gear: rotates on hover
- Version badge reveals changelog on click

**Collapsed state:**
- Icons only, centered
- Hover expands temporarily
- Active tool keeps glow indicator

**Ambient (optional, toggle-able):**
- Subtle particle drift in background
- Or: slow-moving gradient shifting hue over minutes

---

## ES Query Tool - Core Interface

### Three-Panel Layout

**Left Panel - Input:**
- Code editor with ES JSON syntax highlighting (Monaco or CodeMirror)
- Line numbers, error squiggles for invalid JSON
- Top bar: "Paste JSON", "Load from URL", "Format", "Clear"
- Bottom status: "Valid ES Query" or "Error on line X"
- Floating "Copy JSON" button (Cmd+Shift+C)
- Undo/redo arrows in header

**Center Panel - Visual Tree:**
- Header: "Query Structure" with expand all / collapse all
- Nodes styled as colored pills/chips:
  - `bool` → purple
  - `must/should/filter` → blue
  - `match/term/range` → green
  - `aggs` → orange
  - `script/function_score` → yellow
- Subtle curved connector lines
- Selected node: glows, slight scale-up
- Collapsed embedding: dim chip "[vector: 512 dims]"

**Right Panel - Detail & Actions:**
- Nothing selected: plain English summary (see below)
- Node selected: editable form for that clause
  - Field name input with autocomplete
  - Value inputs (text, number, date picker)
  - Delete / Duplicate / Wrap buttons

### Plain English Summary

When no node selected, shows human-readable explanation:

```
**Search** in `products` index

**Find** documents where:
- `title` matches "wireless headphones"
- AND `description` matches "bluetooth"

**Filter** to only:
- `status` = "active"  [✕] [edit]
- `price` between 50 and 200  [✕] [edit]

**Sort** by `relevance`, then `created_at` descending

**Return** 20 results, starting from offset 0

**Aggregate**:
- `categories`: top 10 terms in `category` field
- `price_ranges`: histogram on `price`, interval 50
```

- Field names in `code style`, values in "quotes"
- Each line clickable → selects that node in tree
- Inline [✕] removes clause, [edit] opens form

### Quick Actions

**On hover, each tree node shows:**
- ✕ Remove - deletes clause
- ⎘ Duplicate - copies as sibling
- ⤴ Unwrap - removes unnecessary bool wrapper
- { } Wrap - wraps in new bool

**Editing flow:**
- Every change immediately updates JSON (live sync)
- Changed lines flash/highlight
- Cmd+Z / Cmd+Shift+Z for undo/redo
- Copy button pulses after changes

---

## Architecture

```
/app                    → Next.js pages/routes (thin UI shell)
/components             → React components (UI only, no business logic)
/lib
  /core                 → Pure TypeScript, zero React dependencies
    /es-query           → ES query parsing, analysis, code generation
    /[future-tool]      → Next tool's core logic
  /ui                   → Shared UI utilities (hooks, context, helpers)
```

**Key principle:** `/lib/core` knows nothing about React.

- `lib/core/es-query/parser.ts` - JSON string → structured AST
- `lib/core/es-query/analyzer.ts` - AST → simplification suggestions
- `lib/core/es-query/codegen/java.ts` - AST → Java code
- `lib/core/es-query/codegen/python.ts` - AST → Python code
- `lib/core/es-query/codegen/curl.ts` - AST → cURL command

**Benefits:**
- Testable: core logic has unit tests, no React mocking
- Portable: runs in Node, Deno, CLI, or future backend
- Extensible: new tool = new folder in `/lib/core`
- Backend-ready: logic moves to server, UI switches to fetch()

---

## AST Structure

```typescript
type ESNode = {
  id: string                    // Unique ID for UI selection
  type: 'bool' | 'match' | 'term' | 'range' | 'aggs' | ...
  field?: string                // Field being queried
  params: Record<string, any>   // Type-specific parameters
  children?: ESNode[]           // Nested clauses
  raw: object                   // Original JSON fragment
  meta: {
    collapsed: boolean          // UI state
    warning?: string            // Simplification hint
    path: string[]              // JSONPath location
  }
}
```

**Smart collapsing rules:**
- Arrays >10 numeric values → collapsed (embeddings)
- `_source`, `_name`, `track_total_hits` → de-emphasized
- Depth >5 levels → suggest flattening

**Simplification detection (v2):**
- `bool` with single `must` → "Unnecessary wrapper"
- Empty arrays → "Can remove"
- Nested same-context bools → "Can flatten"
- Duplicate filters → "Redundant"

---

## Code Generation

### Java (Elasticsearch Java Client)

```java
SearchRequest request = SearchRequest.of(s -> s
    .index("products")
    .query(q -> q
        .bool(b -> b
            .must(m -> m.match(t -> t.field("title").query("search")))
            .filter(f -> f.term(t -> t.field("status").value("active")))
        )
    )
);
```

### cURL

```bash
curl -X POST "localhost:9200/products/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": { ... }
  }'
```

Options: pretty print, auth headers, configurable host.

### Python (elasticsearch-py)

```python
response = client.search(
    index="products",
    query={
        "bool": {
            "must": [{"match": {"title": "search"}}],
            "filter": [{"term": {"status": "active"}}]
        }
    }
)
```

Option for elasticsearch-dsl style vs raw dict.

### UI

- Tabs for each language
- Copy button with "Copied!" feedback
- Per-language settings (host, auth, style)

---

## Error Handling

**Invalid JSON:**
- Red squiggle at error location
- Status: "Invalid JSON: Unexpected token at line X"
- Tree shows: "Fix JSON errors to see visualization"
- Keeps last valid state with "(stale)" indicator

**Valid JSON, unknown ES clauses:**
- Best-effort rendering
- Unknown clauses as gray "unknown" nodes
- Warning banner: "Unrecognized clause: X"

**Warnings:**
- Yellow icon on suspicious nodes
- Hover explains: "This match_all is redundant"
- Non-blocking, informational only

**Code generation edge cases:**
- Notes for unsupported features
- TODO comments in generated code

---

## MVP Scope (v1)

### Build First

- Dreamy sidebar shell with home launcher
- ES Query Tool as first tool
- Input panel: JSON editor, syntax highlighting, validation
- Visual tree: smart collapsing, colored node types
- Plain English summary with inline actions
- Quick actions: remove, edit, undo/redo
- Code generation: Java, cURL, Python
- Dark mode

### Not in v1

- Simplification suggestions
- Index mapping integration
- User accounts, saved queries, sharing
- Multiple query tabs
- Query history
- Advanced keyboard shortcuts
- Import from URL / export to file

### Supported ES Clauses (v1)

**Queries:** `bool`, `match`, `term`, `range`, `exists`, `multi_match`, `nested`

**Aggregations:** `terms`, `histogram`, `date_histogram`, `avg`, `sum`, `cardinality`

**Skip for v1:** `function_score`, `script`, `percolate`, pipeline aggs, geo queries

---

## Future Expansion

- Additional ES clause support
- Simplification suggestions with one-click apply
- Query history and favorites
- Shareable query links
- Index mapping autocomplete
- Additional tools in the sidebar (to be determined based on user needs)
