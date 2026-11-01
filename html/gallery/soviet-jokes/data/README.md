# Soviet Jokes Archive Data

Independent external mirror data package. Source files are copied from `D:/AI Pj/苏联笑话工程` and remain unchanged there.

Migration conventions:
- UTF-8 JSON source data is retained as supplied wherever possible.
- Joke `id` is the canonical application key. The source contains two records with `num=574` and duplicate `id=joke-574`; the second is assigned a deterministic `recordKey` during external packaging. The original `id` and `num` remain preserved.
- `num` is a source/display number, not a unique key.
- Tags are multi-valued; tag totals must not be interpreted as mutually exclusive primary-domain totals.
- Glossary related joke numbers are source references and can resolve to multiple records when source numbers collide.
- `classic.json` is an editorial overlay, not a source-data rewrite: it selects 60 jokes by `recordKey`, adds a title and three writing-oriented annotations (craft / target / workshop), plus a core move, a retargeted example, a self-test and a boundary note. Jokes without an overlay keep original text, tags, diagnoses and source annotations; they are not forced into three-layer interpretation.
- `curation.json` is a separate reliability overlay: it splits the dimension into stance (popular grievance / elite satire / possible Western / ethnic stereotype) and evidence (historical anchor / pure fantasy), and records per-joke corrections with notes. `joke-517` is reclassified from popular grievance to historical anchor; elite-satire is added to insider-perspective jokes. Overrides are data, not hidden code.

This mirror is not connected to or modifying the Qmlmreader mother site. Links to existing knowledge-base entries are optional outbound links only; unsupported anchors must not be presented as valid entries.
