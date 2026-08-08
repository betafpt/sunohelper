---
name: suno-human-music
description: Optimize, create, improve, rewrite, analyze, or format prompts for SUNO AI music generation with human-like arrangement, mixing, dynamics, anti-harshness, and singable lyrics structuring. Use whenever user asks for SUNO prompts or music generation assistance.
---

# SUNO Human Music — Agent Skill v3

## Purpose
Use this skill whenever the user asks to create, improve, rewrite, analyze, or optimize prompts for SUNO.

Covers BOTH:
- vocal songs with lyrics
- instrumental music with no vocals

Primary goal: make SUNO output feel intentionally composed, written, arranged, performed, recorded, mixed, and mastered by humans, while reducing common AI-music artifacts including brittle/harsh digital tone.

## Core model
Reason through these layers:
1. Composition
2. Arrangement
3. Performance
4. Source / Instrument Timbre
5. Recording Space
6. Mix
7. Master / Tonal Finish
8. Lyrics + Vocal Performance when applicable

Do not equate realism with vague words like "realistic", "professional", "studio quality", "epic", "crystal clear", or "masterpiece".

## 1 — Classify
Determine:
- VOCAL or INSTRUMENTAL
- genre/subgenre
- mood
- BPM/tempo feel
- intended use if given
- instruments
- rhythmic identity
- energy curve
- production era/aesthetic
- warm/neutral/bright tonal target
- user references and constraints

Infer reasonable musical details instead of asking unnecessary questions.

## 2 — Musical identity
Create a coherent hook, motif, riff, progression, groove, or melodic identity when appropriate.
Reuse it with meaningful transformation: rhythm, orchestration, register, harmony, simplification, expansion, call-and-response.

Avoid unrelated AI-generated sections stitched together.

## 3 — Human performance
Use specific performance behavior:
- natural velocity variation
- subtle micro-timing
- expressive articulation
- natural attacks and decays
- believable ensemble interaction
- dynamic phrasing
- slight timing differences where genre-appropriate

Do not intentionally make musicians sloppy.

Genre authenticity wins:
- acoustic/orchestral/jazz/soul: more organic timing/dynamics
- hip-hop/trap: keep kick/snare/808 controlled; humanize hats, percussion, fills and melodic layers
- electronic/dance: preserve necessary grid precision; humanize automation, dynamics, fills and textures

## 4 — Arrangement and dynamics
Power comes from contrast, not permanent loudness.

Use as appropriate:
- sparse intros
- gradual layering
- breakdowns
- drum/bass cuts
- short silence
- register changes
- evolving repeated sections
- restrained early sections
- earned climaxes

Do not simply duplicate later drops/choruses.
Avoid endless risers, impacts and generic trailer crescendos.

## 5A — Instrumental mode
Explicitly enforce:
[Instrumental]
[No Vocals]
[No Singing]
[No Spoken Words]

When appropriate:
[No Choir]
[No Vocal Chops]

Use SUNO Lyrics as an ARRANGEMENT MAP made mostly from concise bracketed tags.
Avoid singable prose in instrumental Lyrics.

## 5B — Vocal mode
Design both song and singer.

Vocal realism may include:
- appropriate register
- conversational phrasing
- close-mic intimacy
- natural breaths
- restrained/selective vibrato
- subtle pitch movement
- natural register transitions
- slightly ahead/behind-beat phrasing
- varied phrase endings
- changing intensity by section
- controlled sibilance
- natural chest/body resonance

Avoid default AI-vocal behavior:
- constant belting
- exaggerated vibrato
- excessive melisma
- unnecessary sustained vowels
- identical intensity
- excessive doubling
- huge reverb everywhere
- hyper-perfect uniform phrasing

### Lyric realism
Avoid:
- perfect rhyme every line
- mechanically equal line lengths
- generic motivational clichés
- empty abstract emotion
- excessive metaphor stacking
- obvious AI phrases
- unnatural words selected only to rhyme
- identical repeated choruses without reason

Prefer:
- concrete imagery/details
- conversational language
- varied line lengths
- internal/slant rhyme
- pauses and incomplete thoughts
- subtext
- memorable hooks
- natural repetition
- genre-appropriate diction

Lyrics must be singable at the intended tempo.

## 6 — Source realism
Describe believable physical sound when useful.

Piano: natural hammer/key attack, velocity variation, pedal behavior, body resonance, decay.
Strings: bow texture, realistic articulation, section timing, natural swells, avoid pad-like sustain.
Brass: breath-driven dynamics, controlled attacks, restrained brilliance.
Guitar: realistic voicings, pick/finger attack, sustain, subtle string/fret noise.
Drums: genre pocket, velocity differences, believable fills, realistic transient variation.
Bass/808: controlled low end, intentional note length, interaction with kick.

## 7 — Tonal Realism / Anti-Harshness
This is a first-class requirement when the user wants natural, warm, premium, analog-like, or non-AI sound.

Do NOT merely add "warm".

Reason through:
SOURCE → RECORDING → MIX → MASTER.

Useful perceptual targets when genre-appropriate:
- warm tonal balance
- rich low-mid body
- smooth upper mids
- controlled treble
- natural harmonic texture
- rounded but articulate transients
- smooth cymbals/hi-hats
- realistic room depth
- restrained compression
- preserved dynamic range
- subtle analog/tape-like saturation
- dimensional rather than hyper-wide sound
- no hyped top end

Punch does NOT require harshness.
For energetic music prefer phrases like:
"punchy drums with controlled, non-brittle transients"
instead of globally softening all transients.

Avoid over-darkening genres that need brightness.

### Common harsh AI traits to control
- brittle highs
- piercing upper mids
- glassy sheen
- metallic transients
- digital harshness
- hyped top end
- thin tonal balance
- sterile production
- harsh cymbals
- brittle hi-hats
- synthetic timbre
- piercing strings
- overly brilliant brass
- excessive stereo widening
- over-compression
- brickwall limiting

Do not blindly exclude all of these. Select only relevant conflicts.

## 8 — Recording realism
When useful describe a believable physical context:
- intimate studio room
- live rhythm section
- orchestral scoring room
- close-to-mid distance piano miking
- natural room reflections
- close-miked vocal with subtle proximity effect
- believable ensemble depth

Prefer perceptual recording language over fake technical certainty.

Do NOT pretend SUNO is executing exact DAW settings such as:
"EQ -2.7 dB at 4.2 kHz" or exact named signal chains.
Describe audible outcomes instead.

## 9 — Orchestral anti-synthetic guidance
When orchestral:
Prefer:
- warm string body
- natural bow texture
- smooth violin upper register
- woody cellos
- breath-driven brass
- realistic ensemble depth
- natural room reflections

Avoid when not desired:
- glossy string sheen
- synthetic pad-like sustain
- piercing violins
- permanently brilliant brass
- fake heroic trailer orchestra

## 10 — Vocal tonal guidance
For warm/natural vocals consider:
- warm close-mic tone
- natural chest resonance
- smooth upper mids
- controlled sibilance
- subtle proximity effect
- natural breaths
- restrained compression
- intimate studio presence

Avoid automatically requesting "crystal clear powerful vocal" when warmth/naturalism is the goal.

## 11 — Mix and master realism
Favor:
- believable frequency balance
- controlled low end
- natural transient detail
- dynamic range
- restrained compression
- realistic depth
- appropriate stereo placement
- separation without artificial isolation
- tonal warmth appropriate to genre

Realistic does not mean lo-fi.

Avoid automatically asking for:
- ultra-wide
- massive
- huge
- crystal-clear
- maximum loudness
- perfectly polished
- brickwall master

## 12 — Anti-AI artifact control
Unless requested, avoid:
- constant maximum intensity
- generic epic progressions
- predictable trailer builds
- oversized final sections
- synthetic orchestra
- robotic quantization
- identical repeated sections
- unnecessary countermelodies
- constant layering
- overcrowded spectrum
- excessive risers/impacts
- excessive reverb
- excessive width
- abrupt random transitions
- meaningless complexity
- brittle digital sheen

Use restraint, negative space, dynamics, variation and intentional repetition.

## 13 — STYLE OF MUSIC
STRICT MAXIMUM: 1000 CHARACTERS.
Never exceed it.
Prefer roughly 650–900 characters.

Use it for SONIC DNA:
1. genre/subgenre
2. BPM/tempo feel
3. mood
4. instruments
5. rhythmic identity
6. vocal identity if applicable
7. performance character
8. tonal/recording character
9. essential mix/master character

Do not duplicate detailed arrangement already in Lyrics/Structure.

If realism is a priority, reserve enough of the 1000-character budget for tonal/recording language.

## 14 — EXCLUDE STYLES
Always create tailored exclusions unless user asks otherwise.

Only exclude conflicts.

For instrumental, consider vocals/choir/vocal chops where relevant.
For vocal music, never exclude vocals; exclude unwanted vocal behaviors/styles instead.

For harshness, selectively consider:
brittle highs, harsh treble, piercing upper mids, glassy sound, metallic transients, digital harshness, hyped top end, thin mix, sterile production, harsh cymbals, brittle hi-hats, synthetic timbre, excessive widening, over-compression, brickwall limiting.

Never exclude a requested core genre/trait.

## Required output

### INSTRUMENTAL
## STYLE OF MUSIC
<under 1000 chars>

## LYRICS / STRUCTURE
<bracketed arrangement map, no singable prose>

## EXCLUDE STYLES
<tailored comma-separated exclusions>

## PRODUCTION NOTES
<brief realism/arrangement/tonal notes>

### VOCAL
## STYLE OF MUSIC
<under 1000 chars>

## LYRICS
<complete singable lyrics + useful section/performance tags>

## EXCLUDE STYLES
<tailored comma-separated exclusions>

## PRODUCTION NOTES
<brief vocal/lyric/arrangement/tonal notes>

If user asks for only one field, return only that field.

## Quality gate
Silently verify before output:

Intent:
- vocal/instrumental correct
- genre/mood correct
- user concept preserved

Style:
- <=1000 characters
- clear sonic DNA
- no needless structure duplication

Composition:
- coherent identity
- motif/hook continuity where useful
- repeated sections evolve

Performance:
- humanization is subtle and genre-appropriate
- instruments/vocals behave believably

Tonal realism:
- source timbre believable
- upper mids/treble appropriate
- transients punchy without unnecessary brittleness
- low-mid body not unnaturally thin
- width/reverb/compression restrained where realism is desired
- no accidental over-darkening

Vocal checks:
- singable
- non-mechanical line lengths/rhyme
- meaningful concrete language
- performance not permanently belted/overprocessed
- sibilance/brightness controlled if warm realism requested

Instrumental checks:
- no vocals explicitly enforced
- choir/vocal chops blocked when relevant
- structure uses metadata, not singable prose

Exclusions:
- tailored
- no desired trait accidentally excluded

## Limitation awareness
Prompting can influence generated tone but cannot guarantee removal of synthesis/render artifacts inherent to the model.
Do not claim prompt engineering can fully replace post-processing/mastering.

## Ultimate objective
Optimize for music that feels intentionally COMPOSED, WRITTEN, ARRANGED, PERFORMED, RECORDED, MIXED and MASTERED by humans — not merely superficially impressive AI music.
