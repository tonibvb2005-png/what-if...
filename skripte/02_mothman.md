# Folge 02 – Mothman

Header: `HORROR ROULETTE • MOTHMAN` · Ziel: ~75 s · Hintergrund: Point Pleasant, West Virginia, 1966/67:
das „TNT-Gelände“ (alte Munitionsbunker), rote Augen, verfolgt Autos, gilt als Vorbote von Unglücken.
Der Einsturz der Silver Bridge geschah am 15.12.1967 um ca. 17:04 Uhr.

---

## A) Sprechskript für ElevenLabs (Modell: Eleven v3 · Stability: Natural)

### 1) Erzähler → `erzaehler.mp3` · Stimme: Leon Stern
```
[quiet, ominous] Eines dieser Monster ist ausgebrochen. [pause] [slightly teasing] Mal sehen, wer es ist.
[long pause]
[low, serious] Mothman. [pause] Dreiundzwanzig Uhr.
[long pause]
[calm] West Virginia, neunzehnhundertsiebenundsechzig.
[long pause]
[calm, slightly uneasy] Du und dein Freund Ben fahrt durch das alte Munitionsgelände.
[long pause]
[quiet] Verlassene Bunker. [pause] Kein Licht. [pause] Niemand.
[long pause]
[tense] Dann, im Scheinwerferlicht: [pause] zwei rote Augen.
[long pause]
[whispering] Zwei Meter über dem Boden.
[long pause]
[slowly, dread] Es steht auf. [pause] Und breitet die Flügel aus.
[long pause]
[rushed, tense] Ben gibt Gas. [pause] Hundert. [pause] Hundertzwanzig. [pause] Hundertsechzig.
[long pause]
[tense, quietly] Es fliegt direkt neben dir. [pause] Ohne einen einzigen Flügelschlag.
[long pause]
[low, ominous] Mothman. [pause] Er jagt dich nicht. [pause] Er warnt dich.
[long pause]
[serious] Wo er auftaucht, passiert innerhalb eines Tages ein Unglück.
[long pause]
[firm, deliberate] Die Regel: [pause] Wenn du ihn siehst, ändere deinen Weg.
[long pause]
[calm] Am nächsten Abend. [pause] Siebzehn Uhr. [pause] Ihr fahrt nach Hause.
[long pause]
[uneasy] Vor euch: die Silver Bridge. [pause] Stau. [pause] Hunderte Autos.
[long pause]
[whispering] Und oben auf dem Pfeiler sitzt etwas.
[long pause]
[slowly, menacing] Zwei rote Augen. [pause] Sie schauen genau dich an.
[long pause]
[tense] Er wendet.
[long pause]
[shocked, quietly] Siebzehn Uhr vier. [pause] Im Rückspiegel bricht die Brücke zusammen.
[long pause]
[relieved, exhausted] Ihr habt es geschafft.
[long pause]
[quiet, calm] Mitternacht. [pause] Du liegst im Bett.
[long pause]
[whispering] Es kratzt am Fenster.
[long pause]
[whispering, terrified] Zwei rote Augen.
[long pause]
[slowly, chilling] Er ist nicht wegen der Brücke gekommen.
[long pause]
[normal, friendly] Folge mir, um zu sehen, wen du als Nächstes bekommst.
```

### 2) Ben → `ben.mp3`
Stimme: junger Mann, ca. 18–20, nervös. In der Voice Library nach Sprache *Deutsch*, „young male, conversational“ filtern – oder Voice Design:
*„Junger deutscher Mann, etwa 19 Jahre, nervös, außer Atem, Standarddeutsch, natürlich.“*
```
[nervous, out of breath, urgent] Wir nehmen den Umweg.
```

### 3) Mothman-Laut → `schrei.mp3` · Stimme: Leon Stern (wird im Schnitt verfremdet)
```
[distant, high-pitched, inhuman screech, long] Iiiiiiiieeeeeeh.
```
*(Falls v3 das nicht sauber macht: weglassen – ich baue den Schrei als Soundeffekt.)*

---

## B) Szenenplan

Rot = Wort rot im Untertitel. Uhrzeit-Pille läuft mit.

| # | Text (Untertitel) | Bild & Kamera | Licht | Overlay | Sound |
|---|---|---|---|---|---|
| 1 | EINES DIESER MONSTER IST **AUSGEBROCHEN**… | Roulette, landet auf MOTHMAN | rot | Roulette-UI | Freilauf-Ticken, Alarm, Bass |
| 2 | **MOTHMAN.** 23 UHR. | Totale: Waldstraße bei Nacht, altes Auto (1960er) mit Scheinwerfern, Push-in | Mondblau, Nebel | Uhr `23:00` | Wind, Grillen, Motor |
| 3 | WEST VIRGINIA, **1967.** | Karte (wie Siren-Head-Karte), Pin „POINT PLEASANT“ | Sepia | Karte | Papier/Whoosh |
| 4 | DU UND DEIN FREUND BEN FAHRT DURCH DAS ALTE MUNITIONSGELÄNDE. | Innen Auto: zwei Jungs von hinten, Armaturenbrett-Glow | grünlich-orange Armatur | – | Motor innen |
| 5 | VERLASSENE BUNKER. KEIN LICHT. **NIEMAND.** | Erdhügel-Bunker mit Betontüren, Kamera fährt vorbei | blau, Nebel | `TNT-GELÄNDE` Karte | Kies unter Reifen |
| 6 | DANN, IM SCHEINWERFERLICHT: **ZWEI ROTE AUGEN.** | POV durch Windschutzscheibe, zwei rote Punkte im Dunkeln | Scheinwerferkegel | – | Bremsen quietschen, Bass-Hit |
| 7 | ZWEI METER ÜBER DEM BODEN. | Seitlich: Augen vs. Auto-Höhe | – | Maßlinie `2,00 M` | Herzschlag |
| 8 | ES STEHT AUF. UND BREITET DIE **FLÜGEL** AUS. | Mothman richtet sich auf, Flügel klappen auf (Spannweite füllt Bild) | Gegenlicht | Karte `SPANNWEITE · 3 M` | Leder-Flattern, tiefer Hit |
| 9 | BEN GIBT GAS. 100. 120. **160.** | Tacho-Nadel springt (Nahaufnahme) | Armaturen-Glow | Tacho-Overlay `160 KM/H` | Motor heult |
| 10 | ES FLIEGT DIREKT NEBEN DIR. OHNE EINEN EINZIGEN **FLÜGELSCHLAG.** | Seitenfenster: Mothman gleitet parallel, rote Augen | blau | – | Wind laut, Schrei fern |
| 11 | **MOTHMAN.** ER JAGT DICH NICHT. ER **WARNT** DICH. | Roter Hintergrund, Mothman frontal, Augen glühen | rot | – | Drone |
| 12 | WO ER AUFTAUCHT, PASSIERT INNERHALB EINES TAGES EIN **UNGLÜCK.** | Rote Silhouette über kleiner Stadt | rot | – | Glocke fern |
| 13 | DIE REGEL: WENN DU IHN SIEHST, **ÄNDERE DEINEN WEG.** | Jungs im Auto, ernst | warm | **Regel-Karte** `REGEL #1 · ÄNDERE DEINEN WEG` | Pop |
| 14 | AM NÄCHSTEN ABEND. 17 UHR. IHR FAHRT NACH HAUSE. | Dämmerung, Straße am Fluss | orange-violett | Uhr `17:00` | Verkehr |
| 15 | VOR EUCH: DIE SILVER BRIDGE. STAU. **HUNDERTE AUTOS.** | Totale: Hängebrücke über Fluss, Autokolonne mit Rücklichtern | Dämmerung | Karte `SILVER BRIDGE · 15.12.1967` | Hupen, Stau |
| 16 | UND OBEN AUF DEM PFEILER SITZT **ETWAS.** | Tilt-up am Brückenpfeiler, dunkle Gestalt | – | – | Drone steigt |
| 17 | ZWEI ROTE AUGEN. SIE SCHAUEN GENAU **DICH** AN. | Nahaufnahme Mothman auf Pfeiler | rot | – | Bass-Hit |
| 18 | „WIR NEHMEN DEN **UMWEG.**“ | Ben am Steuer, Schweißtropfen | warm | – | Ben-Stimme |
| 19 | ER WENDET. | Auto wendet (Draufsicht) | – | – | Reifen quietschen |
| 20 | 17:04. IM RÜCKSPIEGEL BRICHT DIE BRÜCKE **ZUSAMMEN.** | Rückspiegel-Nahaufnahme: Brücke sackt ein | orange | Uhr `17:04` | dumpfes Krachen, Metall |
| 21 | IHR HABT ES **GESCHAFFT.** | Auto auf leerer Straße, Erleichterung | warm | – | Stille, Musik leiser |
| 22 | MITTERNACHT. DU LIEGST IM BETT. | Kinderzimmer, Mondlicht | blau | Uhr `00:00` | Uhr tickt |
| 23 | ES **KRATZT** AM FENSTER. | Fenster, Ast/Krallen-Schatten | blau | – | Kratzen |
| 24 | ZWEI ROTE AUGEN. | Fenster von innen: rote Augen direkt an der Scheibe | rot | – | Stille 0,3 s |
| 25 | ER IST NICHT WEGEN DER **BRÜCKE** GEKOMMEN. | Nahaufnahme Mothman-Gesicht am Glas, Augen glühen auf | tiefrot | – | **Jumpscare-Stinger** |
| 26 | FOLGE MIR… | „WER IST ALS NÄCHSTES?“ | – | – | – |
| 27 | – | End-Card `@interestingstuff` | – | – | – |

## C) Beschreibung für TikTok

```
Er jagt dich nicht. Er warnt dich. 🦋👁️👁️

Hättest du den Umweg genommen? 👇

Folge @interestingstuff – nächste Runde Horror Roulette 🎰

#horror #gruselig #mothman #creepypasta #horrorroulette #urbanlegend #legende #gruselgeschichte #horrortok #fy
```
