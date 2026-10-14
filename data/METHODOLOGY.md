# Column reference and methodology

`3-story-analysis/city_master.csv` — 50 cities × 139 columns. Produced by two
programs from one input column, `Description` (the scraped homepage text of each
city's official tourism site):

* `2-word-extraction/parser.py` — word-level extraction and tagged vocabulary
* `3-story-analysis/story.py` — city-level measures, comparisons, and the merge

The input is `2-word-extraction/city_sites_input.csv` (50 cities, 25 popular and
25 hidden). Any column it carries — including `Specific attractions?` — is
passed through untouched to the master.

Text processing uses spaCy `en_core_web_sm`. Multi-value cells are joined with
` | `; any literal `|` in the source is converted to `/` first so the separator
is always safe to split on. Two normalisations are provided for every count. Columns ending **"per 1k"**
are per 1,000 characters; columns ending **"per 1k words"** are per 1,000
alphabetic tokens. Word-based rates are the steadier of the two, since character
counts are inflated by markup and punctuation that survived scraping.

Columns are grouped by *kind* within each family: for word types, vocabulary
categories and themes alike, every extraction comes first, then every
most-common, then every count, then every rate. Overall the order runs:
identity → Wikipedia popularity → raw input → word types → tagged vocabulary →
personality → themes → archetype → comparisons → similarity. The order is an
explicit list in `story.py`; any column missing from that list is appended at
the end rather than dropped.

Examples below use **Ghent** (hidden, 1,167 chars) and **Mecca** (popular, 1,400 chars).

---

## Identity and input (9)

| column | meaning |
| --- | --- |
| `City`, `Country`, `Category` | as supplied in the input; Category is popular or hidden |
| `Annual tourists`, `Annual international tourists` | as supplied (empty in the current input) |
| `Site link` | the official tourism site the text came from |
| `Specific attractions?` | as supplied in the input |
| `Word count` | alphabetic tokens; the denominator for every rate |
| `Description` | the source text |

## Word types (25)

| column | meaning |
| --- | --- |
| `Adjectives` | every adjective, in order, duplicates kept so frequency survives |
| `Adjective phrases` | each adjective plus what it modifies |
| `Superlatives` | superlative forms only |
| `Superlative phrases` | each superlative plus what it modifies |
| `Noun modifiers` | nouns used adjectivally |
| `Noun modifier phrases` | each one plus the noun it modifies |
| `High sentiment nouns` + `count` | emotionally charged nouns |
| `Most common word` + `count` | most frequent content lemma |
| `Most common adjective` + `count` | most repeated adjective, case-insensitive |
| `Most common sentiment noun` + `count` | most repeated high-sentiment noun |
| `Most common superlative` + `count` | most repeated superlative |
| `Most common noun modifier` + `count` | most repeated noun modifier |
| `Adjective count`, `Superlative count`, `Noun modifier count` | list lengths, exposed as numbers for charting |
| `<type> per 1k words` | each of the four types as a rate |

**Adjectives** are tokens tagged `ADJ`, plus participles (`VERB` with dependency
`amod`) — "chilling places" and "leading department stores" are adjectival but
spaCy tags them `VERB`. About 25 quantifier-like words (`other`, `many`, `such`,
`first`, `only`) are excluded: tagged `ADJ`, but they describe nothing.

**Phrases** follow grammar, not a word count. An attributive adjective runs
through the noun it attaches to, picking up anything between — `major` yields
"major tourist attractions". A predicative adjective has no such noun, so up to
two following words are taken: "important in history".

**Superlatives** are `JJS` or `RBS`. "most beautiful" is `RBS` + `ADJ`, so the
pair is merged into one superlative and the adjective is not counted twice.
Quantifier uses are excluded: "**most** of them are historical" modifies nothing,
so `JJS` "most"/"least" followed by "of" is skipped. Superlatives never appear in
`Adjectives`, so nothing is double counted.

**Noun modifiers** are their own column because the class is unavoidably noisy:
the same grammar gives "luxury level" and "bus station". Capitalised modifiers
are skipped as probable proper names ("Weekend Market").

**High sentiment nouns** come from VADER (score ≥ 1.5) plus a curated travel
supplement — VADER was built for social media and lacks `gem`, `haven`, `oasis`,
`magic`, `wonder`. Matched against `NOUN` only, never `PROPN`, or "Champs"
(Champs-Élysées) and "Grand" (Grand Palais) score as sentiment. Idioms
(`thanks to`, `on the other hand`) are blocklisted.

**Most common word** is lemmatised, with spaCy's stop list plus a `GENERIC_WORDS`
list removing words that would otherwise win everywhere (`city`, `place`,
`visitor`) and scraping residue (`div`, `span`). Each city's own name and country
are excluded — otherwise "Prague" trivially wins for Prague.

## Tagged vocabulary (39) — 13 categories × 3 columns

Each category yields three columns: the matched terms, a `count`, and a
`per 1k words` rate. Earlier `present` flags and per-category "most common"
columns were dropped as low-value; filter on `count > 0` instead.
All patterns are in `2-word-extraction/vocab.py` and exported in full to
`2-word-extraction/vocabulary.csv`.

| category | what it captures | coverage |
| --- | --- | --- |
| `Rank words` | position claims: `largest`, `second largest`, `top ten`, `one of the best` | 33/50 |
| `Authority borrowing` | outside validation: UNESCO, Michelin, Lonely Planet, `voted`, `award-winning` | 24/50 |
| `Defensive qualifiers` | pre-empting a low opinion: `authentic`, `underrated`, `hidden gem`, `more than just` | 22/50 |
| `Second person` | direct address: `you`, `your`, `you'll` | 44/50 |
| `Sensory` | taste, smell, sound, touch, sight words | 41/50 |
| `Imperatives` | sentence-initial commands: `Discover`, `Explore`, `Wander` | 35/50 |
| `Numeric scale` | quantified boasting: "over 300 museums", "more than 200 years" | 22/50 |
| `Inclusivity` | who it is for: LGBTQ, accessible, halal, vegan, family-friendly | 18/50 |
| `Urgency` | scarcity: `don't miss`, `must-see`, `book now` | 15/50 |
| `Price and value` | cost framing: `free`, `affordable`, `budget` | 14/50 |
| `Sustainability` | green credentials: `sustainable`, `eco-friendly`, `car-free` | 7/50 |
| `UNESCO` | World Heritage and related designations: `UNESCO`, `World Heritage Site`, `biosphere reserve`, `geopark` | 13/50 |
| `Surprise` | conceding low expectations: `surprising`, `unexpected`, `who knew`, `defies expectation` | 13/50 |

`UNESCO` and `Surprise` are counted twice on purpose — they also sit inside
`Authority borrowing` and `Defensive qualifiers` respectively, which measure the
broader move. Do not add those columns together.

Two exclusions worth knowing. **Centuries are not rank words**: "19th century"
and "19th and 20th century" are dates, but "14th greenest city in the world" is
kept. **"first-time visitors"** is not a rank claim. Imperatives need sentence
anchors, so they compile without word boundaries (`RAW_CATEGORIES` in `vocab.py`).

## Popularity (3)

An external measure of how known each city actually is, so claims can be tested
against something other than the hand-assigned `Category`.

| column | meaning |
| --- | --- |
| `Annual pageviews` | English Wikipedia views over the last 12 complete months |
| `Wikipedia title` | the article the views were read from, after redirects |
| `Obscurity` | 0–1, log-scaled on fixed anchors: 0.0 at 10M views/yr, 1.0 at 10k |

Redirects are resolved first, disambiguation pages are refused, and a handful of
ambiguous names are pinned by hand in `places.py` (`Mendoza` → *Mendoza,
Argentina*). All 50 cities resolved.

## Clichés, personality and story measures (33)

| column | meaning |
| --- | --- |
| `Archetype`, `Dominant theme`, `Theme over-index` | what a city talks *about*: the theme it over-indexes on, and by how much |
| `Personality`, `Personality strength` | *how* it talks: the rhetorical move it over-uses, and the z-score behind it |
| `Distinctiveness` | how unlike the average city's pitch |
| `Sounds most like`, `Similarity to twin` | nearest city by descriptive language, and the score |
| `Shared with twin` | the words doing the most work in that pairing |
| `Twin (vocabulary overlap)`, `Vocabulary overlap score`, `Shared distinctive words` | twin by Jaccard on top-50 distinctive words |
| `Twin (theme profile)`, `Theme profile distance` | twin by what the city talks about |
| `Twin (personality profile)`, `Personality profile distance` | twin by how the city talks |
| `Twin region`, `Cross-region twin` | the twin's region, and whether it differs |
| `Fingerprint words` | top TF-IDF terms including proper nouns |
| `Descriptive fingerprint` | top TF-IDF terms with proper nouns stripped |
| `Cliches used`, `Cliche count` | which of 12 tracked clichés appear, and how many distinct ones |
| `Comparisons`, `Comparison count` | sentences measuring the city against a named rival, and how many |
| `Compared to` | the rival places named |
| `Nickname claims` | borrowed identities ("the Silicon Valley of the East") |
| `Signature word` | most over-used word vs the rest of the corpus |
| `Vocabulary richness` | unique lemmas ÷ total lemmas |
| `Rare word share` | share of a city's words no other city uses |
| `Theme focus` | 1.0 = single-theme specialist, 0.1 = even generalist |
| `Self reference per 1k words` | how often the city names itself |

**Archetype is not the most-mentioned theme.** Food leads corpus-wide
(3.38/1k), so raw counts would make almost everyone a Gourmand. Each theme is
divided by its corpus average and the highest ratio wins — the theme that makes
a city *unusual*. A theme must also be mentioned at least **9 times per 1,000 words**
before it can define a city; without that floor, Athens was labelled "The Night
Owl" on a handful of nightlife mentions while its history rate was far higher.
The floor was rescaled from an earlier character-based 1.5 when rates moved to a
word denominator; no city's archetype changed as a result.

> Ghent: Nightlife 1.71/1k vs corpus average 0.20 = **8.70×**, clears the floor →
> The Night Owl. Its Food rate is higher absolutely (2.57) but unremarkable.

**Personality is the rhetorical counterpart to Archetype.** Archetype is built
from the ten theme lexicons and says what a city discusses; Personality is built
from the tagged vocabulary rates and says how it sells. Nine personalities, each
defined by the columns that characterise it:

| personality | built from |
| --- | --- |
| The Braggart | rank words + numeric scale |
| The Name-Dropper | authority borrowing + UNESCO |
| The Closer | urgency + imperatives |
| The Host | second person |
| The Sensualist | sensory + high-sentiment nouns |
| The Underdog | defensive qualifiers + surprise |
| The Bargain | price and value |
| The Good Citizen | sustainability + inclusivity |
| The Cliche Machine | cliché rate |

Every input is z-scored across the corpus before comparison, because the base
rates are wildly different — second person averages ~13 per 1,000 words,
sustainability ~0.5 — so raw values would make one dimension win every time. A
personality built from two columns takes the mean of their z-scores. If a city's
best score is below 0.5 standard deviations it is not really leaning on
anything, and it is labelled **The Understated** (8 of 50 cities).

> Hamburg is The Braggart: "2,500 bridges — outnumbering even Amsterdam and
> Venice combined" is rank and numeric language together. Berlin is The Host,
> on 46 uses of "you". Ottawa is The Good Citizen.

**Four definitions of "twin", and they disagree.** The original — cosine on
TF-IDF vectors — asks which cities use the same words. Three alternatives ask
different questions, and are kept alongside rather than replacing it:

| method | question | measure |
| --- | --- | --- |
| `Sounds most like` | same words, weighted | cosine on descriptive TF-IDF |
| `Twin (vocabulary overlap)` | same distinctive words, unweighted | Jaccard on each city's top 50 TF-IDF words |
| `Twin (theme profile)` | same subjects | Euclidean distance on 10 z-scored theme rates |
| `Twin (personality profile)` | same rhetorical style | Euclidean distance on 9 z-scored personality dimensions |

Theme and personality profiles are z-scored per dimension first, or Food (mean
~20 per 1,000 words) would swamp Family (~0.9) on scale alone. The two distance
columns are **lower-is-closer**, unlike the two similarity columns.

Of 50 cities the methods agree rarely: TF-IDF and vocabulary overlap pick the
same twin for 8, TF-IDF and theme for 3, TF-IDF and personality for 1. Treat any
single twin column as one defensible choice among four, not as a fact.
Paris↔Bucharest is the exception, surviving on two methods.

**Two fingerprints.** Both are TF-IDF (term frequency × `log(50 / cities using
the word)`), implemented directly. With proper nouns it is trivially unique —
only Mecca says "Makkah". The **descriptive** one strips proper nouns and the
city's own name, and is the one used for similarity and distinctiveness, because
it compares pitches rather than place names.

> Mecca, descriptive: `mosque, spiritual, pilgrim, islamic, revelation, sacred`.

**Distinctiveness** = `1 − cosine(city, corpus centroid)` on descriptive vectors.
**Similarity** is cosine between two descriptive vectors; the corpus maximum is
0.20, so treat it as a ranking, not a percentage.

> Ghent → Sydney at 0.200 (Europe/Oceania) is the strongest pair in the data.
> Mecca → Bucharest at 0.083 is better read as *Mecca has no twin*.

**Signature word** is chosen by lift: the word's share of this city ÷ its share of all other
cities, with add-one smoothing (without it, a word no other city uses divides by
near-zero and reports lifts in the tens of millions). Mecca → `pilgrim` (264×).

**Theme focus** is a Herfindahl index: the sum of squared theme shares.

**Comparisons** are found at sentence level, not by keyword. A sentence counts
only if it has a strong comparative cue (`than`, `outnumber`, `rival`,
`second only to`, `combined`, `unlike`) **and** names a place that appears in the
gazetteer in `1-scraping-and-ranking/countries.py`. The gazetteer requirement is
what makes it usable: spaCy tags Montmartre and the Naschmarkt as `GPE` exactly
like Amsterdam, so without it a looser pattern returned 39 hits that were mostly
neighbourhoods and "markets like the ...". With it, 10 real comparisons remain
across 12 cities. Weak cues (`like`, `as ... as`) are excluded for the same reason.

> Hamburg: "over 2,500 bridges—outnumbering even Amsterdam and Venice combined!"
> → `Compared to` = Amsterdam, Venice.

**Nickname claims** capture a different move — borrowing another place's
identity rather than beating it ("the Silicon Valley of the East", "the Gate of
the Balkans"). The capture is generous and then trimmed, because nicknames
contain commas and abbreviations: a comma ends the claim unless the next
fragment also begins "the" ("the learned, the fat and the red"), and apostrophes
are never boundaries ("L.A.'s South Bay").

## Themes (30)

Two columns per theme, for all ten themes (Food, History, Art & Culture, Nature,
Beach & Water, Nightlife, Shopping, Architecture, Modern & Business, Family):

| column | meaning |
| --- | --- |
| `<Theme> words` | the actual words that matched, de-duplicated, first-seen order |
| `<Theme> count` | total keyword matches, counting repeats |
| `theme: <Theme>` | that theme's mentions per 1,000 words |

Note `<Theme> count` counts every occurrence while `<Theme> words` lists only
distinct ones — Mendoza matched Nature 16 times but shows 8 words, because
"mountain" appears 7 times.

The word columns exist so a score can be audited. Mendoza's `Nature words` reads
*landscape, Mountain, river, valley, lake, Park, nature, outdoor* — which is the
evidence behind its Naturalist label at 6.5× the corpus average.

Patterns are in `3-story-analysis/story.py`.

---


## How each value is computed

Exact procedure per column. "token" means a spaCy token from the `Description`
text; "lemma" is its lowercased dictionary form.

### Identity and input (9)

| column | procedure |
| --- | --- |
| `City`, `Country`, `Category`, `Annual tourists`, `Annual international tourists`, `Site link`, `Specific attractions?`, `Description` | copied verbatim from `city_sites_input.csv`; never modified |

### Word types (25)

| column | procedure |
| --- | --- |
| `Adjectives` | walk every token in order. Keep it if `pos_ == "ADJ"`, or `pos_ in (VERB, AUX)` with `dep_ == "amod"`. Skip tokens under 3 characters, with no letter, in `STOP_ADJECTIVES`, already claimed by a superlative, or classified as a superlative. Append the token's surface text. Join with ` \| ` |
| `Adjective phrases` | for each kept adjective: if its syntactic head is a `NOUN`/`PROPN` positioned after it, take the text span from adjective through head inclusive. Otherwise take the adjective plus up to 2 following tokens, stopping at punctuation. One phrase per adjective, same order |
| `Superlatives` | tokens with `tag_` of `JJS` or `RBS`. Excluded when the token is "most"/"least" **and** `tag_ == JJS` **and** the next token is "of" or absent. If `tag_ == RBS` and its head is an `ADJ`, emit `"<adverb> <adjective>"` as one entry and mark the adjective as claimed |
| `Superlative phrases` | same phrase rule as adjectives, with one addition: if the token's head is an `ADJ` whose own head is a later `NOUN`/`PROPN`, follow that chain so the noun is included ("most beautiful temple") |
| `Noun modifiers` | tokens with `pos_ == "NOUN"`, `dep_ == "compound"`, a lowercase first letter, and a `NOUN`/`PROPN` head. Only reached if the token was not already an adjective |
| `Noun modifier phrases` | same phrase rule as adjectives |
| `High sentiment nouns` | tokens with `pos_ == "NOUN"` (never `PROPN`) whose surface form **or** lemma is in the sentiment vocabulary: VADER entries scoring >= 1.5 that are alphabetic, plus `TRAVEL_SENTIMENT_NOUNS`, minus `SENTIMENT_BLOCKLIST` |
| `High sentiment noun count` | length of that list |
| `Most common word` | count lemmas where `pos_` is `NOUN`/`PROPN`/`VERB`/`ADJ`, `is_stop` is false, `is_alpha` is true, lemma longer than 2 characters, and the lemma is not in `GENERIC_WORDS` nor in the city's own name/country words. Take the single highest count; ties resolve to first-seen |
| `Most common word count` | that word's count |
| `Most common adjective` | lowercase every entry in `Adjectives`, count, take the highest |
| `Most common adjective count` | that adjective's count |
| `Most common superlative` / `Most common superlative count`, `Most common noun modifier` / `Most common noun modifier count`, `Most common sentiment noun` / `Most common sentiment noun count` | same procedure, over the corresponding list |
| `Word count` | number of tokens where spaCy's `is_alpha` is true. Counted in the same pass, before any filtering, so it is the raw length of the prose |
| `Adjective count`, `Superlative count`, `Noun modifier count` | length of the corresponding list |

### Tagged vocabulary (39 = 13 categories × 3)

Identical procedure for all 13 categories:

| column | procedure |
| --- | --- |
| `<Category>` | build one regex per category: sort its patterns longest-first, join with `\|`, and wrap in `\b(?:...)\b` — except `Imperatives`, which carries its own sentence anchors and compiles unwrapped. Run `finditer` over the raw `Description`, case-insensitive. Emit each match's text in order of appearance |
| `<Category> count` | number of matches |
| `<Category> per 1k words` | count × 1000 / `Word count` |

Longest-first ordering matters: it makes "second largest" match as one rank claim
rather than as "second" plus "largest".

### Popularity (3)

An external measure of how known each city actually is, so claims can be tested
against something other than the hand-assigned `Category`.

| column | meaning |
| --- | --- |
| `Annual pageviews` | English Wikipedia views over the last 12 complete months |
| `Wikipedia title` | the article the views were read from, after redirects |
| `Obscurity` | 0–1, log-scaled on fixed anchors: 0.0 at 10M views/yr, 1.0 at 10k |

Redirects are resolved first, disambiguation pages are refused, and a handful of
ambiguous names are pinned by hand in `places.py` (`Mendoza` → *Mendoza,
Argentina*). All 50 cities resolved.

### Clichés, personality and story measures (33)

| column | procedure |
| --- | --- |
| `theme: X` (10 columns) | run theme X's regex over the `Description`, count matches, multiply by 1000, divide by `Word count` |
| `Dominant theme` | divide each of the 10 theme rates by that theme's corpus-wide mean. Among themes whose own rate is >= `THEME_FLOOR` (9.0 per 1k words), take the highest ratio. If no theme clears the floor, fall back to the highest raw rate |
| `Archetype` | the fixed label mapped to `Dominant theme` (History → The Historian, and so on) |
| `Personality` | z-score every city on each column named in the `VOICE` map; average the z-scores within each personality; take the highest. If that value is < 0.5, return `The Understated` |
| `Personality strength` | that highest mean z-score, in standard deviations above the corpus mean |
| `Theme over-index` | the winning theme's rate divided by that theme's corpus mean |
| `Theme focus` | divide each theme rate by the sum of all ten, square each share, sum them (Herfindahl). 1.0 = one theme only |
| `Fingerprint words` | tokenize to content lemmas **including** `PROPN`, excluding stopwords, `GENERIC_WORDS`, `NAV_WORDS` and the city's own name/country. TF-IDF = (lemma count / total lemmas) × `log(50 / cities using that lemma)`. Take the top 8 |
| `Descriptive fingerprint` | identical, but `PROPN` tokens are excluded before counting, and IDF is recomputed over this proper-noun-free vocabulary. Top 8 |
| `Distinctiveness` | average all 50 descriptive TF-IDF vectors into a centroid, then `1 − cosine(city vector, centroid)` |
| `Sounds most like` | cosine similarity between this city's descriptive vector and each other city's; the highest-scoring city |
| `Similarity to twin` | that cosine value |
| `Shared with twin` | words present in both cities' descriptive vectors, ranked by the product of the two TF-IDF weights, top 10. A word scores only when *both* cities use it more than the corpus does |
| `Twin region` | the twin's country looked up in `REGION` |
| `Cross-region twin` | `yes` if the two cities' regions differ, else `no` |
| `Twin (vocabulary overlap)` | build each city's set of its 50 highest-TF-IDF words; score every pair by `|A ∩ B| / |A ∪ B|`; take the highest |
| `Vocabulary overlap score` | that Jaccard value |
| `Shared distinctive words` | the intersection of the two top-50 sets, ordered by the product of the two TF-IDF weights, top 12 |
| `Twin (theme profile)` | z-score each of the 10 theme rates across the corpus, then take the city with the smallest Euclidean distance |
| `Theme profile distance` | that distance, in standard deviations |
| `Twin (personality profile)` | same, over the 9 z-scored personality dimensions |
| `Personality profile distance` | that distance |
| `Cliches used` | for each of the 12 cliché groups, test whether any of its patterns matches the `Description`; emit the group labels that hit |
| `Cliche count` | how many distinct groups hit (0–12) |
| `Signature word` | over descriptive lemmas appearing >= 2 times in this city: `lift = (count / this city's total) ÷ ((occurrences in all other cities + 1) / (all other cities' total + 1))`. The highest-lift lemma |
| `Vocabulary richness` | distinct lemmas ÷ total lemmas, over the fingerprint token list (proper nouns included) |
| `Rare word share` | of this city's distinct **descriptive** lemmas, the fraction whose corpus document frequency is exactly 1 |
| `Self reference per 1k words` | case-insensitive count of the `City` string inside the `Description` × 1000 / `Word count` |
| `Comparisons` | split into sentences. Keep a sentence if it matches `COMPARISON_CUE` **and** contains a `GPE`/`LOC` entity whose lowercase text is in the gazetteer (cities + countries from `countries.py`, plus continents and regions) and is not the city's own name or country. Emit the whitespace-normalised sentence |
| `Comparison count` | number of such sentences |
| `Compared to` | the sorted, de-duplicated gazetteer places named in those sentences |
| `Nickname claims` | sentences not already counted as comparisons that match `NICKNAME_CUE` (`known as`/`nicknamed`/`dubbed`/`called` + optional quote + "the" + up to 70 characters). Trim the capture: drop the opening quote, cut at a closing quote, at `:` or `;`, at a comma **not** followed by "the", at a sentence break, or before a relative pronoun |

## Limitations

1. **Popular vs hidden does not separate on most measures.** Frequency metrics,
   per-word log-odds and vector distinctiveness were each tested on the balanced
   25/25 corpus; none reached significance.
2. **The `Category` label is hand-assigned and ~20% inconsistent with the
   external measure.** Ten of the 50 cities sit on the wrong side of the median
   `Annual pageviews` for their label — Chicago is marked hidden with 3.6M
   views/year; Marrakech, Zurich, Taipei, Reykjavik, Cusco, The Hague and Sao
   Paulo also disagree. Group medians do separate (1.43M vs 675k), so the labels
   are not noise, but any finding stated against `Category` is partly measuring
   the labelling.
3. **Tested against continuous obscurity, most category signals disappear.**
   Correlations between `Obscurity` and per-1k-word rates: UNESCO +0.26,
   urgency -0.30, second person +0.18, numeric scale **+0.13**, surprise +0.10.
   Numeric scale looked like the strongest binary split (0.48 sd) and is near
   zero against the real measure — it was largely an artifact of which cities
   went in which bucket. Only urgency (famous cities push it) and UNESCO
   (obscure cities cite it) survive in the expected direction, both weakly.
   Prefer `Obscurity` over `Category` for any claim you intend to defend.
4. **Pooled and per-city rates disagree, and per-city is the honest one.**
   Pooled rates (total hits / total characters) over-weight long descriptions;
   imperatives looked like a split when pooled but are level per-city.
5. **Distinctiveness largely measures length.** It correlates −0.76 with
   description length, and vocabulary richness −0.72: a short text has fewer
   words available to overlap with anyone. Do not put either on an axis without
   controlling for length. `Rare word share` is the more robust choice.
6. **Website furniture** (`tab`, `panel`, `image`) survived scraping in some rows
   and is filtered by `NAV_WORDS`, which is unlikely to be exhaustive.
7. **spaCy tags inconsistently**: "Best Things" is `JJ` while "Best things" is
   `JJS`, so one word can land in both `Adjectives` and `Superlatives` from
   different occurrences.
8. **Lexicons are hand-built** and therefore choices, not measurements. They are
   fully auditable in `vocabulary.csv`.
9. **Self reference misses renamed cities**: Mecca scores 0.00 because its site
   writes "Makkah". The column matches the spelling in the `City` column.
10. **Sustainability is thin** (7/50 cities) — use it as a flag, not a rate.
