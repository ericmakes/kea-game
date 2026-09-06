# STATION.md — THE HIGH STATION

The sixth map, and the one that finishes the tour. Branch `replat-b`. Take SESSION.lock.
Standard laws. Governed by REPLAT.md. Follows pieces 39/40, 41, 42 and 44.

    {id:'station', need:30, name:'THE HIGH STATION',
     sub:'a woolshed, a dog kennel, ten thousand sheep', pin:{x:0.86,y:0.66}}

---

## 1. WHAT IT IS

A high-country sheep station: the yards, the woolshed, and the dog that runs them.

- **THE WOOLSHED** — long, corrugate, on piles, with a raised loading race down one side and a
  wool press inside the open bay. The map's big structure and its climbable roof.
- **THE DRAFTING YARDS** — the signature, and the reason this map is last: a run of pens
  connected by **GATES THAT CASCADE**. Opening one lets sheep through into the next pen, which
  is the map's own mechanic and the first thing in the tour where one act changes the state of
  another object. Four pens, three gates, and a race at the end.
- **THE FARM UTE** — mud to the sills, tray down, dog on the back.
- **THE DOG** — a working dog on a chain by its kennel. It is the map's hazard: it barks, and a
  barking dog brings the farmer. Not a cast member — a prop with a radius.
- **SHEEP, AND YOU CAN RIDE ONE.** The carpark has three sheep and a muster mission; this map
  has a mob, and the new verb is that a kea on a sheep's back GOES WHERE THE SHEEP GOES. It is
  the floe mechanic again on something that panics.
- **SMOKO** — a thermos, a tin of scones and a newspaper on the woolshed step. Theft targets.

Plus: a shearing-stand board, wool bales, a water trough, a windbreak of macrocarpa.

---

## 2. THE MISSIONS — 8 TO 12, TWO STAR PAGES

`G.chapters=[A.yards, A.shed]`.

**THE DRAFTING YARDS** — open all three gates in a cascade; ride a sheep; put a sheep in the
wrong pen; hold the race rail; set the dog off and get away with it.

**THE WOOLSHED** — steal the smoko; get the shed roof; work a wool bale open; take the dog's
bowl; ride the ute tray.

A **finale declared with the mission** — the woolshed ridge, the highest thing on the station,
reachable only from the loading race.

**NOT ONE ID ON ANOTHER MAP, IN EITHER MODE.** Six lists now, which is all of them.

---

## 3. THE MAP DECLARATIONS

- **CAST** — the farmer, and a shearer. Two, because a station in the off-season is empty.
- **NEST SITE** — in the macrocarpa windbreak.
- **SNOW ENVELOPE** — declared null (high country in summer), asserted zero.
- **ROAD LANES** — none; a farm track takes no through traffic. Declared, asserted zero.
- **TRAVEL ANCHOR** — over the yards looking down the race.

## 4. PROOF

- A boot-station battery in house style. Every mission driven headless.
- Additivity: the five existing maps' P6A digests unchanged.
- **THE CASCADE IS ASSERTED AS A CASCADE**: opening gate 1 must move sheep from pen 1 to pen 2
  and MUST NOT move the pen-3 sheep. A cascade that fires everything is not a cascade.
- **THE SHEEP CARRY IS ASSERTED LIKE THE FLOE'S**: relative drift near zero while the sheep
  moves, and the sheep must actually move.
- The brochure pin flips — and with it, **every pin on the brochure is built**, which the tour
  has never been. The battery's unbuilt-map section reads the first pin with no builder and
  will find none; it throws a NAMED error saying so rather than dying confused. That error is
  the signal to rewrite that section, not to delete it.
- New vantages are FIRST PINS, LEFT FLAGGED. Nothing in the 34 re-pinned.

## 5. WHAT IT DOES NOT DO

No graduation. No sourced models. It does not fix the carpark's sheep or its muster mission —
those stay where they are (TODO 47).
