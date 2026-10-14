# Column reference — all 139 columns in CSV order

`3-story-analysis/city_master.csv`. Within each family (word types, vocabulary categories, themes)
every extraction comes first, then every count, then every rate. See
METHODOLOGY.md for reasoning and limitations.

Regenerate with `python make_columns.py` after any pipeline change.

## Identity

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 1 | `City` | City name | From the input CSV, unmodified. |
| 2 | `Country` | Country | From the input CSV, unmodified. |
| 3 | `Category` | popular or hidden | Hand-assigned in the input. ~20% disagrees with Annual pageviews — prefer Obscurity for claims you intend to defend. |

## Wikipedia popularity

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 4 | `Annual pageviews` | English Wikipedia views, last 12 complete months | Wikimedia pageviews API, all-access, all-agents, summed over 12 months. |
| 5 | `Wikipedia title` | Article the views came from | MediaWiki query with redirects=1; disambiguation pages refused; ambiguous names pinned in places.py. |
| 6 | `Obscurity` | 0 = famous, 1 = obscure | clamp01((log 10^7 − log views) / (log 10^7 − log 10^4)). Fixed anchors, so values compare across corpora. |

## Raw input

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 7 | `Site link` | Official tourism site scraped | From the input CSV. |
| 8 | `Annual tourists` | Visitor count | From the input CSV (currently empty). |
| 9 | `Annual international tourists` | International visitor count | From the input CSV (currently empty). |
| 10 | `Specific attractions?` | Input annotation | From the input CSV, passed through untouched. |
| 11 | `Word count` | Alphabetic tokens in Description | spaCy tokens where is_alpha is true. Denominator for every "per 1k words" column. |
| 12 | `Description` | Scraped homepage text | Source column for everything else. |

## Word types — extractions

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 13 | `Adjectives` | Every adjective, in order | Tokens tagged ADJ, plus VERB/AUX with dep amod ("chilling places"). ~25 quantifiers excluded. Duplicates kept. |
| 14 | `Adjective phrases` | Each adjective plus what it modifies | Attributive: span from adjective through its head noun. Predicative: adjective plus up to 2 following tokens. |
| 15 | `Superlatives` | Superlative forms only | Tokens tagged JJS or RBS. "most beautiful" merges to one entry. "most of them" excluded as a quantifier. |
| 16 | `Superlative phrases` | Each superlative plus what it modifies | As adjective phrases, but follows adverb→adjective→noun chains. |
| 17 | `Noun modifiers` | Nouns used adjectivally ("luxury level") | NOUN with dep compound, lowercase, noun head. Separate column because the class also catches "bus station". |
| 18 | `Noun modifier phrases` | Each modifier plus its noun | As adjective phrases. |
| 19 | `High sentiment nouns` | Emotionally charged nouns | NOUN tokens (never PROPN) in VADER ≥1.5 plus a curated travel list, minus an idiom blocklist. |

## Word types — most common

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 20 | `Most common adjective` | Most repeated adjective | Lowercase the entries, count, take the highest. |
| 21 | `Most common adjective count` | Its count | Frequency of that word. |
| 22 | `Most common superlative` | Most repeated superlative | Lowercase the entries, count, take the highest. |
| 23 | `Most common superlative count` | Its count | Frequency of that word. |
| 24 | `Most common noun modifier` | Most repeated noun modifier | Lowercase the entries, count, take the highest. |
| 25 | `Most common noun modifier count` | Its count | Frequency of that word. |
| 26 | `Most common sentiment noun` | Most repeated sentiment noun | Lowercase the entries, count, take the highest. |
| 27 | `Most common sentiment noun count` | Its count | Frequency of that word. |
| 28 | `Most common word` | Most repeated content word | Lemma counts over NOUN/PROPN/VERB/ADJ, minus stopwords, generic words and the city's own name. |
| 29 | `Most common word count` | Its count | Frequency of that lemma. |

## Word types — counts

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 30 | `Adjective count` | Number of adjectives | Length of the Adjectives list. |
| 31 | `Superlative count` | Number of superlatives | Length of the Superlatives list. |
| 32 | `Noun modifier count` | Number of noun modifiers | Length of the Noun modifiers list. |
| 33 | `High sentiment noun count` | Number of them | Length of that list. |

## Word types — rates

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 34 | `Adjectives per 1k words` | Adjective rate | count × 1000 / Word count. |
| 35 | `Superlatives per 1k words` | Superlative rate | count × 1000 / Word count. |
| 36 | `Noun modifiers per 1k words` | Noun modifier rate | count × 1000 / Word count. |
| 37 | `High sentiment noun per 1k words` | High-sentiment noun rate | count × 1000 / Word count. |

## Vocabulary categories — extractions

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 38 | `Rank words` | Claims of position in an ordering | Regex alternation over the raw text, case-insensitive, longest pattern first. |
| 39 | `Numeric scale` | Quantified boasting ("over 300 museums") | Regex alternation over the raw text, case-insensitive, longest pattern first. |
| 40 | `Authority borrowing` | Outside institutions vouching for the city | Regex alternation over the raw text, case-insensitive, longest pattern first. |
| 41 | `UNESCO` | World Heritage and related designations | Regex alternation over the raw text, case-insensitive, longest pattern first. |
| 42 | `Urgency` | Scarcity and deadline pressure | Regex alternation over the raw text, case-insensitive, longest pattern first. |
| 43 | `Imperatives` | Sentence-initial commands | Regex alternation over the raw text, case-insensitive, longest pattern first. |
| 44 | `Second person` | Direct address to the reader | Regex alternation over the raw text, case-insensitive, longest pattern first. |
| 45 | `Sensory` | Appeals to taste, smell, sound, touch, sight | Regex alternation over the raw text, case-insensitive, longest pattern first. |
| 46 | `Defensive qualifiers` | Language pre-empting a low opinion | Regex alternation over the raw text, case-insensitive, longest pattern first. |
| 47 | `Surprise` | Conceding the reader expected less | Regex alternation over the raw text, case-insensitive, longest pattern first. |
| 48 | `Price and value` | Cost framing | Regex alternation over the raw text, case-insensitive, longest pattern first. |
| 49 | `Sustainability` | Green credentials | Regex alternation over the raw text, case-insensitive, longest pattern first. |
| 50 | `Inclusivity` | Who the city says it is for | Regex alternation over the raw text, case-insensitive, longest pattern first. |
| 51 | `Cliches used` | Which of 12 tracked clichés appear | Regex group match; labels of groups that hit. |

## Vocabulary categories — counts

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 52 | `Rank words count` | Number of rank words matches | Length of that list. |
| 53 | `Numeric scale count` | Number of numeric scale matches | Length of that list. |
| 54 | `Authority borrowing count` | Number of authority borrowing matches | Length of that list. |
| 55 | `UNESCO count` | Number of unesco matches | Length of that list. |
| 56 | `Urgency count` | Number of urgency matches | Length of that list. |
| 57 | `Imperatives count` | Number of imperatives matches | Length of that list. |
| 58 | `Second person count` | Number of second person matches | Length of that list. |
| 59 | `Sensory count` | Number of sensory matches | Length of that list. |
| 60 | `Defensive qualifiers count` | Number of defensive qualifiers matches | Length of that list. |
| 61 | `Surprise count` | Number of surprise matches | Length of that list. |
| 62 | `Price and value count` | Number of price and value matches | Length of that list. |
| 63 | `Sustainability count` | Number of sustainability matches | Length of that list. |
| 64 | `Inclusivity count` | Number of inclusivity matches | Length of that list. |
| 65 | `Cliche count` | How many distinct clichés (0–12) | Number of groups that hit, not total uses. |

## Vocabulary categories — rates

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 66 | `Rank words per 1k words` | Rank words rate | count × 1000 / Word count. |
| 67 | `Numeric scale per 1k words` | Numeric scale rate | count × 1000 / Word count. |
| 68 | `Authority borrowing per 1k words` | Authority borrowing rate | count × 1000 / Word count. |
| 69 | `UNESCO per 1k words` | UNESCO rate | count × 1000 / Word count. |
| 70 | `Urgency per 1k words` | Urgency rate | count × 1000 / Word count. |
| 71 | `Imperatives per 1k words` | Imperatives rate | count × 1000 / Word count. |
| 72 | `Second person per 1k words` | Second person rate | count × 1000 / Word count. |
| 73 | `Sensory per 1k words` | Sensory rate | count × 1000 / Word count. |
| 74 | `Defensive qualifiers per 1k words` | Defensive qualifiers rate | count × 1000 / Word count. |
| 75 | `Surprise per 1k words` | Surprise rate | count × 1000 / Word count. |
| 76 | `Price and value per 1k words` | Price and value rate | count × 1000 / Word count. |
| 77 | `Sustainability per 1k words` | Sustainability rate | count × 1000 / Word count. |
| 78 | `Inclusivity per 1k words` | Inclusivity rate | count × 1000 / Word count. |
| 79 | `Cliches per 1k words` | Cliché rate | Total matches across all groups × 1000 / Word count. |

## Personality

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 80 | `Personality` | The rhetorical move it over-uses | Z-score each vocabulary rate, average within each of 9 dimensions, take the highest. Below 0.5 sd → The Understated. |
| 81 | `Personality strength` | That z-score | Standard deviations above the corpus mean. |

## Themes — extractions

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 82 | `Food words` | Food keywords that matched | Every match of the theme lexicon, de-duplicated, first-seen order. |
| 83 | `History words` | History keywords that matched | Every match of the theme lexicon, de-duplicated, first-seen order. |
| 84 | `Art & Culture words` | Art & Culture keywords that matched | Every match of the theme lexicon, de-duplicated, first-seen order. |
| 85 | `Nature words` | Nature keywords that matched | Every match of the theme lexicon, de-duplicated, first-seen order. |
| 86 | `Beach & Water words` | Beach & Water keywords that matched | Every match of the theme lexicon, de-duplicated, first-seen order. |
| 87 | `Nightlife words` | Nightlife keywords that matched | Every match of the theme lexicon, de-duplicated, first-seen order. |
| 88 | `Shopping words` | Shopping keywords that matched | Every match of the theme lexicon, de-duplicated, first-seen order. |
| 89 | `Architecture words` | Architecture keywords that matched | Every match of the theme lexicon, de-duplicated, first-seen order. |
| 90 | `Modern & Business words` | Modern & Business keywords that matched | Every match of the theme lexicon, de-duplicated, first-seen order. |
| 91 | `Family words` | Family keywords that matched | Every match of the theme lexicon, de-duplicated, first-seen order. |

## Themes — counts

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 92 | `Food count` | Total Food keyword matches | Counts repeats, unlike the words column. |
| 93 | `History count` | Total History keyword matches | Counts repeats, unlike the words column. |
| 94 | `Art & Culture count` | Total Art & Culture keyword matches | Counts repeats, unlike the words column. |
| 95 | `Nature count` | Total Nature keyword matches | Counts repeats, unlike the words column. |
| 96 | `Beach & Water count` | Total Beach & Water keyword matches | Counts repeats, unlike the words column. |
| 97 | `Nightlife count` | Total Nightlife keyword matches | Counts repeats, unlike the words column. |
| 98 | `Shopping count` | Total Shopping keyword matches | Counts repeats, unlike the words column. |
| 99 | `Architecture count` | Total Architecture keyword matches | Counts repeats, unlike the words column. |
| 100 | `Modern & Business count` | Total Modern & Business keyword matches | Counts repeats, unlike the words column. |
| 101 | `Family count` | Total Family keyword matches | Counts repeats, unlike the words column. |

## Themes — rates

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 102 | `theme: Food` | Food mentions per 1k words | All matches × 1000 / Word count. |
| 103 | `theme: History` | History mentions per 1k words | All matches × 1000 / Word count. |
| 104 | `theme: Art & Culture` | Art & Culture mentions per 1k words | All matches × 1000 / Word count. |
| 105 | `theme: Nature` | Nature mentions per 1k words | All matches × 1000 / Word count. |
| 106 | `theme: Beach & Water` | Beach & Water mentions per 1k words | All matches × 1000 / Word count. |
| 107 | `theme: Nightlife` | Nightlife mentions per 1k words | All matches × 1000 / Word count. |
| 108 | `theme: Shopping` | Shopping mentions per 1k words | All matches × 1000 / Word count. |
| 109 | `theme: Architecture` | Architecture mentions per 1k words | All matches × 1000 / Word count. |
| 110 | `theme: Modern & Business` | Modern & Business mentions per 1k words | All matches × 1000 / Word count. |
| 111 | `theme: Family` | Family mentions per 1k words | All matches × 1000 / Word count. |

## Theme summary

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 112 | `Theme focus` | Specialist (1.0) vs generalist (0.1) | Herfindahl index: square each theme's share of the total, sum them. |
| 113 | `Archetype` | What the city talks about | Fixed label mapped from Dominant theme. |
| 114 | `Dominant theme` | The theme behind the archetype | Highest rate÷corpus-mean ratio among themes scoring ≥9.0 per 1k words. |
| 115 | `Theme over-index` | How far above corpus average | That winning ratio. Below 1.0 means under-average even on its best theme. |

## Comparisons

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 116 | `Comparisons` | Sentences measuring the city against a named rival | Needs a strong comparative cue AND a gazetteer place that is not itself. |
| 117 | `Comparison count` | How many | Number of such sentences. |
| 118 | `Comparisons per 1k words` | Comparison rate | count × 1000 / Word count. |
| 119 | `Compared to` | The rivals named | Gazetteer places from those sentences, de-duplicated. |
| 120 | `Nickname claims` | Borrowed identities ("the Silicon Valley of the East") | "known as/nicknamed/dubbed" + "the" + up to 70 chars, then trimmed. |

## Similarity and distinctiveness

| # | Column | What it is | How it is computed |
| --- | --- | --- | --- |
| 121 | `Distinctiveness` | How unlike the average pitch | 1 − cosine(city, corpus centroid) on descriptive vectors. Correlates −0.73 with length. |
| 122 | `Sounds most like` | Twin, method 1: same words (weighted) | Highest cosine similarity among the other 49 descriptive TF-IDF vectors. |
| 123 | `Similarity to twin` | That cosine value | Corpus maximum is 0.169 — treat as a ranking, not a strength. |
| 124 | `Shared with twin` | Words driving that pairing | In both vectors, ranked by the product of the two TF-IDF weights, top 10. |
| 125 | `Twin region` | The twin's world region | Country looked up in the REGION map. |
| 126 | `Cross-region twin` | yes/no | Whether the two regions differ. |
| 127 | `Fingerprint words` | Top distinctive words, names included | TF-IDF top 8. Mostly proper nouns, so trivially unique. |
| 128 | `Descriptive fingerprint` | Top distinctive words, names stripped | Same with PROPN excluded and IDF recomputed. This is the similarity vector. |
| 129 | `Twin (vocabulary overlap)` | Twin, method 2: same distinctive words | Jaccard on each city's top-50 TF-IDF words: |A∩B| / |A∪B|, highest wins. |
| 130 | `Vocabulary overlap score` | That Jaccard value | Unweighted set overlap. |
| 131 | `Shared distinctive words` | The overlapping top-50 words | Intersection of the two sets, ordered by the product of TF-IDF weights, top 12. |
| 132 | `Twin (theme profile)` | Twin, method 3: same subjects | Smallest Euclidean distance on the 10 z-scored theme rates. |
| 133 | `Theme profile distance` | That distance | In standard deviations. Lower is closer. |
| 134 | `Twin (personality profile)` | Twin, method 4: same rhetorical style | Smallest Euclidean distance on the 9 z-scored personality dimensions. |
| 135 | `Personality profile distance` | That distance | In standard deviations. Lower is closer. |
| 136 | `Signature word` | Most over-used word vs the rest of the corpus | Highest lift: (share here) ÷ ((occurrences elsewhere + 1)/(other total + 1)); needs ≥2 uses. |
| 137 | `Vocabulary richness` | Distinct ÷ total lemmas | Type-token ratio. Length-sensitive (−0.72). |
| 138 | `Rare word share` | Share of words no other city uses | Distinct descriptive lemmas with document frequency 1, ÷ distinct lemmas. |
| 139 | `Self reference per 1k words` | How often it names itself | Case-insensitive count of the City string × 1000 / Word count. |
