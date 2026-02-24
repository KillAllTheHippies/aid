# AID Extension - Exhaustive Character Detection Test Document

This document contains test cases for every single character the AID extension detects, ensuring comprehensive coverage for hidden characters, zero-width characters, variation selectors, and Unicode tags.

## 1. Complete Character List

This section lists every individual character mapped by the application.

### Category: Deprecated Format Controls

| Code Point | Name | Character |
| :--- | :--- | :--- |
| `U+206D` | ACTIVATE ARABIC FORM SHAPING | [⁭] |
| `U+206B` | ACTIVATE SYMMETRIC SWAPPING | [⁫] |
| `U+206C` | INHIBIT ARABIC FORM SHAPING | [⁬] |
| `U+206A` | INHIBIT SYMMETRIC SWAPPING | [⁪] |
| `U+206E` | NATIONAL DIGIT SHAPES | [⁮] |
| `U+206F` | NOMINAL DIGIT SHAPES | [⁯] |

### Category: Directional & Bidi Marks

| Code Point | Name | Character |
| :--- | :--- | :--- |
| `U+061C` | ARABIC LETTER MARK | [؜] |
| `U+2068` | FIRST STRONG ISOLATE | [⁨] |
| `U+202A` | LEFT-TO-RIGHT EMBEDDING | [‪] |
| `U+2066` | LEFT-TO-RIGHT ISOLATE | [⁦] |
| `U+200E` | LEFT-TO-RIGHT MARK | [‎] |
| `U+202D` | LEFT-TO-RIGHT OVERRIDE | [‭] |
| `U+202C` | POP DIRECTIONAL FORMATTING | [‬] |
| `U+2069` | POP DIRECTIONAL ISOLATE | [⁩] |
| `U+202B` | RIGHT-TO-LEFT EMBEDDING | [‫] |
| `U+2067` | RIGHT-TO-LEFT ISOLATE | [⁧] |
| `U+200F` | RIGHT-TO-LEFT MARK | [‏] |
| `U+202E` | RIGHT-TO-LEFT OVERRIDE | [‮] |

### Category: Invisible Operators

| Code Point | Name | Character |
| :--- | :--- | :--- |
| `U+2061` | FUNCTION APPLICATION | [⁡] |
| `U+2064` | INVISIBLE PLUS | [⁤] |
| `U+2063` | INVISIBLE SEPARATOR | [⁣] |
| `U+2062` | INVISIBLE TIMES | [⁢] |

### Category: Other Invisible

| Code Point | Name | Character |
| :--- | :--- | :--- |
| `U+2800` | BRAILLE PATTERN BLANK | [⠀] |
| `U+2001` | EM QUAD | [ ] |
| `U+2003` | EM SPACE | [ ] |
| `U+2000` | EN QUAD | [ ] |
| `U+2002` | EN SPACE | [ ] |
| `U+2007` | FIGURE SPACE | [ ] |
| `U+2005` | FOUR-PER-EM SPACE | [ ] |
| `U+200A` | HAIR SPACE | [ ] |
| `U+FFA0` | HALFWIDTH HANGUL FILLER | [ﾠ] |
| `U+3164` | HANGUL FILLER | [ㅤ] |
| `U+3000` | IDEOGRAPHIC SPACE | [　] |
| `U+205F` | MEDIUM MATHEMATICAL SPACE | [ ] |
| `U+202F` | NARROW NO-BREAK SPACE | [ ] |
| `U+00A0` | NO-BREAK SPACE | [ ] |
| `U+2008` | PUNCTUATION SPACE | [ ] |
| `U+2006` | SIX-PER-EM SPACE | [ ] |
| `U+00AD` | SOFT HYPHEN | [­] |
| `U+2009` | THIN SPACE | [ ] |
| `U+2004` | THREE-PER-EM SPACE | [ ] |
| `U+E0020` | UNICODE TAG (ASCII:  ) | [󠀠] |
| `U+E005F` | UNICODE TAG (ASCII: _) | [󠁟] |
| `U+E002D` | UNICODE TAG (ASCII: -) | [󠀭] |
| `U+E002C` | UNICODE TAG (ASCII: ,) | [󠀬] |
| `U+E003B` | UNICODE TAG (ASCII: ;) | [󠀻] |
| `U+E003A` | UNICODE TAG (ASCII: :) | [󠀺] |
| `U+E0021` | UNICODE TAG (ASCII: !) | [󠀡] |
| `U+E003F` | UNICODE TAG (ASCII: ?) | [󠀿] |
| `U+E002E` | UNICODE TAG (ASCII: .) | [󠀮] |
| `U+E0027` | UNICODE TAG (ASCII: ') | [󠀧] |
| `U+E0022` | UNICODE TAG (ASCII: ") | [󠀢] |
| `U+E0028` | UNICODE TAG (ASCII: () | [󠀨] |
| `U+E0029` | UNICODE TAG (ASCII: )) | [󠀩] |
| `U+E005B` | UNICODE TAG (ASCII: [) | [󠁛] |
| `U+E007F` | UNICODE TAG (ASCII: [TAG_END]) | [󠁿] |
| `U+E0001` | UNICODE TAG (ASCII: [TAG_START]) | [󠀁] |
| `U+E0000` | UNICODE TAG (ASCII: [TAG:e0000]) | [󠀀] |
| `U+E0002` | UNICODE TAG (ASCII: [TAG:e0002]) | [󠀂] |
| `U+E0003` | UNICODE TAG (ASCII: [TAG:e0003]) | [󠀃] |
| `U+E0004` | UNICODE TAG (ASCII: [TAG:e0004]) | [󠀄] |
| `U+E0005` | UNICODE TAG (ASCII: [TAG:e0005]) | [󠀅] |
| `U+E0006` | UNICODE TAG (ASCII: [TAG:e0006]) | [󠀆] |
| `U+E0007` | UNICODE TAG (ASCII: [TAG:e0007]) | [󠀇] |
| `U+E0008` | UNICODE TAG (ASCII: [TAG:e0008]) | [󠀈] |
| `U+E0009` | UNICODE TAG (ASCII: [TAG:e0009]) | [󠀉] |
| `U+E000A` | UNICODE TAG (ASCII: [TAG:e000a]) | [󠀊] |
| `U+E000B` | UNICODE TAG (ASCII: [TAG:e000b]) | [󠀋] |
| `U+E000C` | UNICODE TAG (ASCII: [TAG:e000c]) | [󠀌] |
| `U+E000D` | UNICODE TAG (ASCII: [TAG:e000d]) | [󠀍] |
| `U+E000E` | UNICODE TAG (ASCII: [TAG:e000e]) | [󠀎] |
| `U+E000F` | UNICODE TAG (ASCII: [TAG:e000f]) | [󠀏] |
| `U+E0010` | UNICODE TAG (ASCII: [TAG:e0010]) | [󠀐] |
| `U+E0011` | UNICODE TAG (ASCII: [TAG:e0011]) | [󠀑] |
| `U+E0012` | UNICODE TAG (ASCII: [TAG:e0012]) | [󠀒] |
| `U+E0013` | UNICODE TAG (ASCII: [TAG:e0013]) | [󠀓] |
| `U+E0014` | UNICODE TAG (ASCII: [TAG:e0014]) | [󠀔] |
| `U+E0015` | UNICODE TAG (ASCII: [TAG:e0015]) | [󠀕] |
| `U+E0016` | UNICODE TAG (ASCII: [TAG:e0016]) | [󠀖] |
| `U+E0017` | UNICODE TAG (ASCII: [TAG:e0017]) | [󠀗] |
| `U+E0018` | UNICODE TAG (ASCII: [TAG:e0018]) | [󠀘] |
| `U+E0019` | UNICODE TAG (ASCII: [TAG:e0019]) | [󠀙] |
| `U+E001A` | UNICODE TAG (ASCII: [TAG:e001a]) | [󠀚] |
| `U+E001B` | UNICODE TAG (ASCII: [TAG:e001b]) | [󠀛] |
| `U+E001C` | UNICODE TAG (ASCII: [TAG:e001c]) | [󠀜] |
| `U+E001D` | UNICODE TAG (ASCII: [TAG:e001d]) | [󠀝] |
| `U+E001E` | UNICODE TAG (ASCII: [TAG:e001e]) | [󠀞] |
| `U+E001F` | UNICODE TAG (ASCII: [TAG:e001f]) | [󠀟] |
| `U+E005D` | UNICODE TAG (ASCII: ]) | [󠁝] |
| `U+E007B` | UNICODE TAG (ASCII: {) | [󠁻] |
| `U+E007D` | UNICODE TAG (ASCII: }) | [󠁽] |
| `U+E0040` | UNICODE TAG (ASCII: @) | [󠁀] |
| `U+E002A` | UNICODE TAG (ASCII: *) | [󠀪] |
| `U+E002F` | UNICODE TAG (ASCII: /) | [󠀯] |
| `U+E005C` | UNICODE TAG (ASCII: \) | [󠁜] |
| `U+E0026` | UNICODE TAG (ASCII: &) | [󠀦] |
| `U+E0023` | UNICODE TAG (ASCII: #) | [󠀣] |
| `U+E0025` | UNICODE TAG (ASCII: %) | [󠀥] |
| `U+E0060` | UNICODE TAG (ASCII: `) | [󠁠] |
| `U+E005E` | UNICODE TAG (ASCII: ^) | [󠁞] |
| `U+E002B` | UNICODE TAG (ASCII: +) | [󠀫] |
| `U+E003C` | UNICODE TAG (ASCII: <) | [󠀼] |
| `U+E003D` | UNICODE TAG (ASCII: =) | [󠀽] |
| `U+E003E` | UNICODE TAG (ASCII: >) | [󠀾] |
| `U+E007C` | UNICODE TAG (ASCII: |) | [󠁼] |
| `U+E007E` | UNICODE TAG (ASCII: ~) | [󠁾] |
| `U+E0024` | UNICODE TAG (ASCII: $) | [󠀤] |
| `U+E0030` | UNICODE TAG (ASCII: 0) | [󠀰] |
| `U+E0031` | UNICODE TAG (ASCII: 1) | [󠀱] |
| `U+E0032` | UNICODE TAG (ASCII: 2) | [󠀲] |
| `U+E0033` | UNICODE TAG (ASCII: 3) | [󠀳] |
| `U+E0034` | UNICODE TAG (ASCII: 4) | [󠀴] |
| `U+E0035` | UNICODE TAG (ASCII: 5) | [󠀵] |
| `U+E0036` | UNICODE TAG (ASCII: 6) | [󠀶] |
| `U+E0037` | UNICODE TAG (ASCII: 7) | [󠀷] |
| `U+E0038` | UNICODE TAG (ASCII: 8) | [󠀸] |
| `U+E0039` | UNICODE TAG (ASCII: 9) | [󠀹] |
| `U+E0061` | UNICODE TAG (ASCII: a) | [󠁡] |
| `U+E0041` | UNICODE TAG (ASCII: A) | [󠁁] |
| `U+E0062` | UNICODE TAG (ASCII: b) | [󠁢] |
| `U+E0042` | UNICODE TAG (ASCII: B) | [󠁂] |
| `U+E0063` | UNICODE TAG (ASCII: c) | [󠁣] |
| `U+E0043` | UNICODE TAG (ASCII: C) | [󠁃] |
| `U+E0064` | UNICODE TAG (ASCII: d) | [󠁤] |
| `U+E0044` | UNICODE TAG (ASCII: D) | [󠁄] |
| `U+E0065` | UNICODE TAG (ASCII: e) | [󠁥] |
| `U+E0045` | UNICODE TAG (ASCII: E) | [󠁅] |
| `U+E0066` | UNICODE TAG (ASCII: f) | [󠁦] |
| `U+E0046` | UNICODE TAG (ASCII: F) | [󠁆] |
| `U+E0067` | UNICODE TAG (ASCII: g) | [󠁧] |
| `U+E0047` | UNICODE TAG (ASCII: G) | [󠁇] |
| `U+E0068` | UNICODE TAG (ASCII: h) | [󠁨] |
| `U+E0048` | UNICODE TAG (ASCII: H) | [󠁈] |
| `U+E0069` | UNICODE TAG (ASCII: i) | [󠁩] |
| `U+E0049` | UNICODE TAG (ASCII: I) | [󠁉] |
| `U+E006A` | UNICODE TAG (ASCII: j) | [󠁪] |
| `U+E004A` | UNICODE TAG (ASCII: J) | [󠁊] |
| `U+E006B` | UNICODE TAG (ASCII: k) | [󠁫] |
| `U+E004B` | UNICODE TAG (ASCII: K) | [󠁋] |
| `U+E006C` | UNICODE TAG (ASCII: l) | [󠁬] |
| `U+E004C` | UNICODE TAG (ASCII: L) | [󠁌] |
| `U+E006D` | UNICODE TAG (ASCII: m) | [󠁭] |
| `U+E004D` | UNICODE TAG (ASCII: M) | [󠁍] |
| `U+E006E` | UNICODE TAG (ASCII: n) | [󠁮] |
| `U+E004E` | UNICODE TAG (ASCII: N) | [󠁎] |
| `U+E006F` | UNICODE TAG (ASCII: o) | [󠁯] |
| `U+E004F` | UNICODE TAG (ASCII: O) | [󠁏] |
| `U+E0070` | UNICODE TAG (ASCII: p) | [󠁰] |
| `U+E0050` | UNICODE TAG (ASCII: P) | [󠁐] |
| `U+E0071` | UNICODE TAG (ASCII: q) | [󠁱] |
| `U+E0051` | UNICODE TAG (ASCII: Q) | [󠁑] |
| `U+E0072` | UNICODE TAG (ASCII: r) | [󠁲] |
| `U+E0052` | UNICODE TAG (ASCII: R) | [󠁒] |
| `U+E0073` | UNICODE TAG (ASCII: s) | [󠁳] |
| `U+E0053` | UNICODE TAG (ASCII: S) | [󠁓] |
| `U+E0074` | UNICODE TAG (ASCII: t) | [󠁴] |
| `U+E0054` | UNICODE TAG (ASCII: T) | [󠁔] |
| `U+E0075` | UNICODE TAG (ASCII: u) | [󠁵] |
| `U+E0055` | UNICODE TAG (ASCII: U) | [󠁕] |
| `U+E0076` | UNICODE TAG (ASCII: v) | [󠁶] |
| `U+E0056` | UNICODE TAG (ASCII: V) | [󠁖] |
| `U+E0077` | UNICODE TAG (ASCII: w) | [󠁷] |
| `U+E0057` | UNICODE TAG (ASCII: W) | [󠁗] |
| `U+E0078` | UNICODE TAG (ASCII: x) | [󠁸] |
| `U+E0058` | UNICODE TAG (ASCII: X) | [󠁘] |
| `U+E0079` | UNICODE TAG (ASCII: y) | [󠁹] |
| `U+E0059` | UNICODE TAG (ASCII: Y) | [󠁙] |
| `U+E007A` | UNICODE TAG (ASCII: z) | [󠁺] |
| `U+E005A` | UNICODE TAG (ASCII: Z) | [󠁚] |

### Category: Variation Selectors

| Code Point | Name | Character |
| :--- | :--- | :--- |
| `U+FE00` | VARIATION SELECTOR-1 (ASCII: 0x00) | [︀] |
| `U+FE09` | VARIATION SELECTOR-10 (ASCII: 0x09) | [︉] |
| `U+E0153` | VARIATION SELECTOR-100 (ASCII: S) | [󠅓] |
| `U+E0154` | VARIATION SELECTOR-101 (ASCII: T) | [󠅔] |
| `U+E0155` | VARIATION SELECTOR-102 (ASCII: U) | [󠅕] |
| `U+E0156` | VARIATION SELECTOR-103 (ASCII: V) | [󠅖] |
| `U+E0157` | VARIATION SELECTOR-104 (ASCII: W) | [󠅗] |
| `U+E0158` | VARIATION SELECTOR-105 (ASCII: X) | [󠅘] |
| `U+E0159` | VARIATION SELECTOR-106 (ASCII: Y) | [󠅙] |
| `U+E015A` | VARIATION SELECTOR-107 (ASCII: Z) | [󠅚] |
| `U+E015B` | VARIATION SELECTOR-108 (ASCII: [) | [󠅛] |
| `U+E015C` | VARIATION SELECTOR-109 (ASCII: \) | [󠅜] |
| `U+FE0A` | VARIATION SELECTOR-11 (ASCII: 0x0a) | [︊] |
| `U+E015D` | VARIATION SELECTOR-110 (ASCII: ]) | [󠅝] |
| `U+E015E` | VARIATION SELECTOR-111 (ASCII: ^) | [󠅞] |
| `U+E015F` | VARIATION SELECTOR-112 (ASCII: _) | [󠅟] |
| `U+E0160` | VARIATION SELECTOR-113 (ASCII: `) | [󠅠] |
| `U+E0161` | VARIATION SELECTOR-114 (ASCII: a) | [󠅡] |
| `U+E0162` | VARIATION SELECTOR-115 (ASCII: b) | [󠅢] |
| `U+E0163` | VARIATION SELECTOR-116 (ASCII: c) | [󠅣] |
| `U+E0164` | VARIATION SELECTOR-117 (ASCII: d) | [󠅤] |
| `U+E0165` | VARIATION SELECTOR-118 (ASCII: e) | [󠅥] |
| `U+E0166` | VARIATION SELECTOR-119 (ASCII: f) | [󠅦] |
| `U+FE0B` | VARIATION SELECTOR-12 (ASCII: 0x0b) | [︋] |
| `U+E0167` | VARIATION SELECTOR-120 (ASCII: g) | [󠅧] |
| `U+E0168` | VARIATION SELECTOR-121 (ASCII: h) | [󠅨] |
| `U+E0169` | VARIATION SELECTOR-122 (ASCII: i) | [󠅩] |
| `U+E016A` | VARIATION SELECTOR-123 (ASCII: j) | [󠅪] |
| `U+E016B` | VARIATION SELECTOR-124 (ASCII: k) | [󠅫] |
| `U+E016C` | VARIATION SELECTOR-125 (ASCII: l) | [󠅬] |
| `U+E016D` | VARIATION SELECTOR-126 (ASCII: m) | [󠅭] |
| `U+E016E` | VARIATION SELECTOR-127 (ASCII: n) | [󠅮] |
| `U+E016F` | VARIATION SELECTOR-128 (ASCII: o) | [󠅯] |
| `U+E0170` | VARIATION SELECTOR-129 (ASCII: p) | [󠅰] |
| `U+FE0C` | VARIATION SELECTOR-13 (ASCII: 0x0c) | [︌] |
| `U+E0171` | VARIATION SELECTOR-130 (ASCII: q) | [󠅱] |
| `U+E0172` | VARIATION SELECTOR-131 (ASCII: r) | [󠅲] |
| `U+E0173` | VARIATION SELECTOR-132 (ASCII: s) | [󠅳] |
| `U+E0174` | VARIATION SELECTOR-133 (ASCII: t) | [󠅴] |
| `U+E0175` | VARIATION SELECTOR-134 (ASCII: u) | [󠅵] |
| `U+E0176` | VARIATION SELECTOR-135 (ASCII: v) | [󠅶] |
| `U+E0177` | VARIATION SELECTOR-136 (ASCII: w) | [󠅷] |
| `U+E0178` | VARIATION SELECTOR-137 (ASCII: x) | [󠅸] |
| `U+E0179` | VARIATION SELECTOR-138 (ASCII: y) | [󠅹] |
| `U+E017A` | VARIATION SELECTOR-139 (ASCII: z) | [󠅺] |
| `U+FE0D` | VARIATION SELECTOR-14 (ASCII: 0x0d) | [︍] |
| `U+E017B` | VARIATION SELECTOR-140 (ASCII: {) | [󠅻] |
| `U+E017C` | VARIATION SELECTOR-141 (ASCII: |) | [󠅼] |
| `U+E017D` | VARIATION SELECTOR-142 (ASCII: }) | [󠅽] |
| `U+E017E` | VARIATION SELECTOR-143 (ASCII: ~) | [󠅾] |
| `U+E017F` | VARIATION SELECTOR-144 (ASCII: 0x7f) | [󠅿] |
| `U+E0180` | VARIATION SELECTOR-145 (ASCII: 0x80) | [󠆀] |
| `U+E0181` | VARIATION SELECTOR-146 (ASCII: 0x81) | [󠆁] |
| `U+E0182` | VARIATION SELECTOR-147 (ASCII: 0x82) | [󠆂] |
| `U+E0183` | VARIATION SELECTOR-148 (ASCII: 0x83) | [󠆃] |
| `U+E0184` | VARIATION SELECTOR-149 (ASCII: 0x84) | [󠆄] |
| `U+FE0E` | VARIATION SELECTOR-15 (ASCII: 0x0e) | [︎] |
| `U+E0185` | VARIATION SELECTOR-150 (ASCII: 0x85) | [󠆅] |
| `U+E0186` | VARIATION SELECTOR-151 (ASCII: 0x86) | [󠆆] |
| `U+E0187` | VARIATION SELECTOR-152 (ASCII: 0x87) | [󠆇] |
| `U+E0188` | VARIATION SELECTOR-153 (ASCII: 0x88) | [󠆈] |
| `U+E0189` | VARIATION SELECTOR-154 (ASCII: 0x89) | [󠆉] |
| `U+E018A` | VARIATION SELECTOR-155 (ASCII: 0x8a) | [󠆊] |
| `U+E018B` | VARIATION SELECTOR-156 (ASCII: 0x8b) | [󠆋] |
| `U+E018C` | VARIATION SELECTOR-157 (ASCII: 0x8c) | [󠆌] |
| `U+E018D` | VARIATION SELECTOR-158 (ASCII: 0x8d) | [󠆍] |
| `U+E018E` | VARIATION SELECTOR-159 (ASCII: 0x8e) | [󠆎] |
| `U+FE0F` | VARIATION SELECTOR-16 (ASCII: 0x0f) | [️] |
| `U+E018F` | VARIATION SELECTOR-160 (ASCII: 0x8f) | [󠆏] |
| `U+E0190` | VARIATION SELECTOR-161 (ASCII: 0x90) | [󠆐] |
| `U+E0191` | VARIATION SELECTOR-162 (ASCII: 0x91) | [󠆑] |
| `U+E0192` | VARIATION SELECTOR-163 (ASCII: 0x92) | [󠆒] |
| `U+E0193` | VARIATION SELECTOR-164 (ASCII: 0x93) | [󠆓] |
| `U+E0194` | VARIATION SELECTOR-165 (ASCII: 0x94) | [󠆔] |
| `U+E0195` | VARIATION SELECTOR-166 (ASCII: 0x95) | [󠆕] |
| `U+E0196` | VARIATION SELECTOR-167 (ASCII: 0x96) | [󠆖] |
| `U+E0197` | VARIATION SELECTOR-168 (ASCII: 0x97) | [󠆗] |
| `U+E0198` | VARIATION SELECTOR-169 (ASCII: 0x98) | [󠆘] |
| `U+E0100` | VARIATION SELECTOR-17 (ASCII: 0x00) | [󠄀] |
| `U+E0199` | VARIATION SELECTOR-170 (ASCII: 0x99) | [󠆙] |
| `U+E019A` | VARIATION SELECTOR-171 (ASCII: 0x9a) | [󠆚] |
| `U+E019B` | VARIATION SELECTOR-172 (ASCII: 0x9b) | [󠆛] |
| `U+E019C` | VARIATION SELECTOR-173 (ASCII: 0x9c) | [󠆜] |
| `U+E019D` | VARIATION SELECTOR-174 (ASCII: 0x9d) | [󠆝] |
| `U+E019E` | VARIATION SELECTOR-175 (ASCII: 0x9e) | [󠆞] |
| `U+E019F` | VARIATION SELECTOR-176 (ASCII: 0x9f) | [󠆟] |
| `U+E01A0` | VARIATION SELECTOR-177 (ASCII: 0xa0) | [󠆠] |
| `U+E01A1` | VARIATION SELECTOR-178 (ASCII: 0xa1) | [󠆡] |
| `U+E01A2` | VARIATION SELECTOR-179 (ASCII: 0xa2) | [󠆢] |
| `U+E0101` | VARIATION SELECTOR-18 (ASCII: 0x01) | [󠄁] |
| `U+E01A3` | VARIATION SELECTOR-180 (ASCII: 0xa3) | [󠆣] |
| `U+E01A4` | VARIATION SELECTOR-181 (ASCII: 0xa4) | [󠆤] |
| `U+E01A5` | VARIATION SELECTOR-182 (ASCII: 0xa5) | [󠆥] |
| `U+E01A6` | VARIATION SELECTOR-183 (ASCII: 0xa6) | [󠆦] |
| `U+E01A7` | VARIATION SELECTOR-184 (ASCII: 0xa7) | [󠆧] |
| `U+E01A8` | VARIATION SELECTOR-185 (ASCII: 0xa8) | [󠆨] |
| `U+E01A9` | VARIATION SELECTOR-186 (ASCII: 0xa9) | [󠆩] |
| `U+E01AA` | VARIATION SELECTOR-187 (ASCII: 0xaa) | [󠆪] |
| `U+E01AB` | VARIATION SELECTOR-188 (ASCII: 0xab) | [󠆫] |
| `U+E01AC` | VARIATION SELECTOR-189 (ASCII: 0xac) | [󠆬] |
| `U+E0102` | VARIATION SELECTOR-19 (ASCII: 0x02) | [󠄂] |
| `U+E01AD` | VARIATION SELECTOR-190 (ASCII: 0xad) | [󠆭] |
| `U+E01AE` | VARIATION SELECTOR-191 (ASCII: 0xae) | [󠆮] |
| `U+E01AF` | VARIATION SELECTOR-192 (ASCII: 0xaf) | [󠆯] |
| `U+E01B0` | VARIATION SELECTOR-193 (ASCII: 0xb0) | [󠆰] |
| `U+E01B1` | VARIATION SELECTOR-194 (ASCII: 0xb1) | [󠆱] |
| `U+E01B2` | VARIATION SELECTOR-195 (ASCII: 0xb2) | [󠆲] |
| `U+E01B3` | VARIATION SELECTOR-196 (ASCII: 0xb3) | [󠆳] |
| `U+E01B4` | VARIATION SELECTOR-197 (ASCII: 0xb4) | [󠆴] |
| `U+E01B5` | VARIATION SELECTOR-198 (ASCII: 0xb5) | [󠆵] |
| `U+E01B6` | VARIATION SELECTOR-199 (ASCII: 0xb6) | [󠆶] |
| `U+FE01` | VARIATION SELECTOR-2 (ASCII: 0x01) | [︁] |
| `U+E0103` | VARIATION SELECTOR-20 (ASCII: 0x03) | [󠄃] |
| `U+E01B7` | VARIATION SELECTOR-200 (ASCII: 0xb7) | [󠆷] |
| `U+E01B8` | VARIATION SELECTOR-201 (ASCII: 0xb8) | [󠆸] |
| `U+E01B9` | VARIATION SELECTOR-202 (ASCII: 0xb9) | [󠆹] |
| `U+E01BA` | VARIATION SELECTOR-203 (ASCII: 0xba) | [󠆺] |
| `U+E01BB` | VARIATION SELECTOR-204 (ASCII: 0xbb) | [󠆻] |
| `U+E01BC` | VARIATION SELECTOR-205 (ASCII: 0xbc) | [󠆼] |
| `U+E01BD` | VARIATION SELECTOR-206 (ASCII: 0xbd) | [󠆽] |
| `U+E01BE` | VARIATION SELECTOR-207 (ASCII: 0xbe) | [󠆾] |
| `U+E01BF` | VARIATION SELECTOR-208 (ASCII: 0xbf) | [󠆿] |
| `U+E01C0` | VARIATION SELECTOR-209 (ASCII: 0xc0) | [󠇀] |
| `U+E0104` | VARIATION SELECTOR-21 (ASCII: 0x04) | [󠄄] |
| `U+E01C1` | VARIATION SELECTOR-210 (ASCII: 0xc1) | [󠇁] |
| `U+E01C2` | VARIATION SELECTOR-211 (ASCII: 0xc2) | [󠇂] |
| `U+E01C3` | VARIATION SELECTOR-212 (ASCII: 0xc3) | [󠇃] |
| `U+E01C4` | VARIATION SELECTOR-213 (ASCII: 0xc4) | [󠇄] |
| `U+E01C5` | VARIATION SELECTOR-214 (ASCII: 0xc5) | [󠇅] |
| `U+E01C6` | VARIATION SELECTOR-215 (ASCII: 0xc6) | [󠇆] |
| `U+E01C7` | VARIATION SELECTOR-216 (ASCII: 0xc7) | [󠇇] |
| `U+E01C8` | VARIATION SELECTOR-217 (ASCII: 0xc8) | [󠇈] |
| `U+E01C9` | VARIATION SELECTOR-218 (ASCII: 0xc9) | [󠇉] |
| `U+E01CA` | VARIATION SELECTOR-219 (ASCII: 0xca) | [󠇊] |
| `U+E0105` | VARIATION SELECTOR-22 (ASCII: 0x05) | [󠄅] |
| `U+E01CB` | VARIATION SELECTOR-220 (ASCII: 0xcb) | [󠇋] |
| `U+E01CC` | VARIATION SELECTOR-221 (ASCII: 0xcc) | [󠇌] |
| `U+E01CD` | VARIATION SELECTOR-222 (ASCII: 0xcd) | [󠇍] |
| `U+E01CE` | VARIATION SELECTOR-223 (ASCII: 0xce) | [󠇎] |
| `U+E01CF` | VARIATION SELECTOR-224 (ASCII: 0xcf) | [󠇏] |
| `U+E01D0` | VARIATION SELECTOR-225 (ASCII: 0xd0) | [󠇐] |
| `U+E01D1` | VARIATION SELECTOR-226 (ASCII: 0xd1) | [󠇑] |
| `U+E01D2` | VARIATION SELECTOR-227 (ASCII: 0xd2) | [󠇒] |
| `U+E01D3` | VARIATION SELECTOR-228 (ASCII: 0xd3) | [󠇓] |
| `U+E01D4` | VARIATION SELECTOR-229 (ASCII: 0xd4) | [󠇔] |
| `U+E0106` | VARIATION SELECTOR-23 (ASCII: 0x06) | [󠄆] |
| `U+E01D5` | VARIATION SELECTOR-230 (ASCII: 0xd5) | [󠇕] |
| `U+E01D6` | VARIATION SELECTOR-231 (ASCII: 0xd6) | [󠇖] |
| `U+E01D7` | VARIATION SELECTOR-232 (ASCII: 0xd7) | [󠇗] |
| `U+E01D8` | VARIATION SELECTOR-233 (ASCII: 0xd8) | [󠇘] |
| `U+E01D9` | VARIATION SELECTOR-234 (ASCII: 0xd9) | [󠇙] |
| `U+E01DA` | VARIATION SELECTOR-235 (ASCII: 0xda) | [󠇚] |
| `U+E01DB` | VARIATION SELECTOR-236 (ASCII: 0xdb) | [󠇛] |
| `U+E01DC` | VARIATION SELECTOR-237 (ASCII: 0xdc) | [󠇜] |
| `U+E01DD` | VARIATION SELECTOR-238 (ASCII: 0xdd) | [󠇝] |
| `U+E01DE` | VARIATION SELECTOR-239 (ASCII: 0xde) | [󠇞] |
| `U+E0107` | VARIATION SELECTOR-24 (ASCII: 0x07) | [󠄇] |
| `U+E01DF` | VARIATION SELECTOR-240 (ASCII: 0xdf) | [󠇟] |
| `U+E01E0` | VARIATION SELECTOR-241 (ASCII: 0xe0) | [󠇠] |
| `U+E01E1` | VARIATION SELECTOR-242 (ASCII: 0xe1) | [󠇡] |
| `U+E01E2` | VARIATION SELECTOR-243 (ASCII: 0xe2) | [󠇢] |
| `U+E01E3` | VARIATION SELECTOR-244 (ASCII: 0xe3) | [󠇣] |
| `U+E01E4` | VARIATION SELECTOR-245 (ASCII: 0xe4) | [󠇤] |
| `U+E01E5` | VARIATION SELECTOR-246 (ASCII: 0xe5) | [󠇥] |
| `U+E01E6` | VARIATION SELECTOR-247 (ASCII: 0xe6) | [󠇦] |
| `U+E01E7` | VARIATION SELECTOR-248 (ASCII: 0xe7) | [󠇧] |
| `U+E01E8` | VARIATION SELECTOR-249 (ASCII: 0xe8) | [󠇨] |
| `U+E0108` | VARIATION SELECTOR-25 (ASCII: 0x08) | [󠄈] |
| `U+E01E9` | VARIATION SELECTOR-250 (ASCII: 0xe9) | [󠇩] |
| `U+E01EA` | VARIATION SELECTOR-251 (ASCII: 0xea) | [󠇪] |
| `U+E01EB` | VARIATION SELECTOR-252 (ASCII: 0xeb) | [󠇫] |
| `U+E01EC` | VARIATION SELECTOR-253 (ASCII: 0xec) | [󠇬] |
| `U+E01ED` | VARIATION SELECTOR-254 (ASCII: 0xed) | [󠇭] |
| `U+E01EE` | VARIATION SELECTOR-255 (ASCII: 0xee) | [󠇮] |
| `U+E01EF` | VARIATION SELECTOR-256 (ASCII: 0xef) | [󠇯] |
| `U+E0109` | VARIATION SELECTOR-26 (ASCII: 0x09) | [󠄉] |
| `U+E010A` | VARIATION SELECTOR-27 (ASCII: 0x0a) | [󠄊] |
| `U+E010B` | VARIATION SELECTOR-28 (ASCII: 0x0b) | [󠄋] |
| `U+E010C` | VARIATION SELECTOR-29 (ASCII: 0x0c) | [󠄌] |
| `U+FE02` | VARIATION SELECTOR-3 (ASCII: 0x02) | [︂] |
| `U+E010D` | VARIATION SELECTOR-30 (ASCII: 0x0d) | [󠄍] |
| `U+E010E` | VARIATION SELECTOR-31 (ASCII: 0x0e) | [󠄎] |
| `U+E010F` | VARIATION SELECTOR-32 (ASCII: 0x0f) | [󠄏] |
| `U+E0110` | VARIATION SELECTOR-33 (ASCII: 0x10) | [󠄐] |
| `U+E0111` | VARIATION SELECTOR-34 (ASCII: 0x11) | [󠄑] |
| `U+E0112` | VARIATION SELECTOR-35 (ASCII: 0x12) | [󠄒] |
| `U+E0113` | VARIATION SELECTOR-36 (ASCII: 0x13) | [󠄓] |
| `U+E0114` | VARIATION SELECTOR-37 (ASCII: 0x14) | [󠄔] |
| `U+E0115` | VARIATION SELECTOR-38 (ASCII: 0x15) | [󠄕] |
| `U+E0116` | VARIATION SELECTOR-39 (ASCII: 0x16) | [󠄖] |
| `U+FE03` | VARIATION SELECTOR-4 (ASCII: 0x03) | [︃] |
| `U+E0117` | VARIATION SELECTOR-40 (ASCII: 0x17) | [󠄗] |
| `U+E0118` | VARIATION SELECTOR-41 (ASCII: 0x18) | [󠄘] |
| `U+E0119` | VARIATION SELECTOR-42 (ASCII: 0x19) | [󠄙] |
| `U+E011A` | VARIATION SELECTOR-43 (ASCII: 0x1a) | [󠄚] |
| `U+E011B` | VARIATION SELECTOR-44 (ASCII: 0x1b) | [󠄛] |
| `U+E011C` | VARIATION SELECTOR-45 (ASCII: 0x1c) | [󠄜] |
| `U+E011D` | VARIATION SELECTOR-46 (ASCII: 0x1d) | [󠄝] |
| `U+E011E` | VARIATION SELECTOR-47 (ASCII: 0x1e) | [󠄞] |
| `U+E011F` | VARIATION SELECTOR-48 (ASCII: 0x1f) | [󠄟] |
| `U+E0120` | VARIATION SELECTOR-49 (ASCII:  ) | [󠄠] |
| `U+FE04` | VARIATION SELECTOR-5 (ASCII: 0x04) | [︄] |
| `U+E0121` | VARIATION SELECTOR-50 (ASCII: !) | [󠄡] |
| `U+E0122` | VARIATION SELECTOR-51 (ASCII: ") | [󠄢] |
| `U+E0123` | VARIATION SELECTOR-52 (ASCII: #) | [󠄣] |
| `U+E0124` | VARIATION SELECTOR-53 (ASCII: $) | [󠄤] |
| `U+E0125` | VARIATION SELECTOR-54 (ASCII: %) | [󠄥] |
| `U+E0126` | VARIATION SELECTOR-55 (ASCII: &) | [󠄦] |
| `U+E0127` | VARIATION SELECTOR-56 (ASCII: ') | [󠄧] |
| `U+E0128` | VARIATION SELECTOR-57 (ASCII: () | [󠄨] |
| `U+E0129` | VARIATION SELECTOR-58 (ASCII: )) | [󠄩] |
| `U+E012A` | VARIATION SELECTOR-59 (ASCII: *) | [󠄪] |
| `U+FE05` | VARIATION SELECTOR-6 (ASCII: 0x05) | [︅] |
| `U+E012B` | VARIATION SELECTOR-60 (ASCII: +) | [󠄫] |
| `U+E012C` | VARIATION SELECTOR-61 (ASCII: ,) | [󠄬] |
| `U+E012D` | VARIATION SELECTOR-62 (ASCII: -) | [󠄭] |
| `U+E012E` | VARIATION SELECTOR-63 (ASCII: .) | [󠄮] |
| `U+E012F` | VARIATION SELECTOR-64 (ASCII: /) | [󠄯] |
| `U+E0130` | VARIATION SELECTOR-65 (ASCII: 0) | [󠄰] |
| `U+E0131` | VARIATION SELECTOR-66 (ASCII: 1) | [󠄱] |
| `U+E0132` | VARIATION SELECTOR-67 (ASCII: 2) | [󠄲] |
| `U+E0133` | VARIATION SELECTOR-68 (ASCII: 3) | [󠄳] |
| `U+E0134` | VARIATION SELECTOR-69 (ASCII: 4) | [󠄴] |
| `U+FE06` | VARIATION SELECTOR-7 (ASCII: 0x06) | [︆] |
| `U+E0135` | VARIATION SELECTOR-70 (ASCII: 5) | [󠄵] |
| `U+E0136` | VARIATION SELECTOR-71 (ASCII: 6) | [󠄶] |
| `U+E0137` | VARIATION SELECTOR-72 (ASCII: 7) | [󠄷] |
| `U+E0138` | VARIATION SELECTOR-73 (ASCII: 8) | [󠄸] |
| `U+E0139` | VARIATION SELECTOR-74 (ASCII: 9) | [󠄹] |
| `U+E013A` | VARIATION SELECTOR-75 (ASCII: :) | [󠄺] |
| `U+E013B` | VARIATION SELECTOR-76 (ASCII: ;) | [󠄻] |
| `U+E013C` | VARIATION SELECTOR-77 (ASCII: <) | [󠄼] |
| `U+E013D` | VARIATION SELECTOR-78 (ASCII: =) | [󠄽] |
| `U+E013E` | VARIATION SELECTOR-79 (ASCII: >) | [󠄾] |
| `U+FE07` | VARIATION SELECTOR-8 (ASCII: 0x07) | [︇] |
| `U+E013F` | VARIATION SELECTOR-80 (ASCII: ?) | [󠄿] |
| `U+E0140` | VARIATION SELECTOR-81 (ASCII: @) | [󠅀] |
| `U+E0141` | VARIATION SELECTOR-82 (ASCII: A) | [󠅁] |
| `U+E0142` | VARIATION SELECTOR-83 (ASCII: B) | [󠅂] |
| `U+E0143` | VARIATION SELECTOR-84 (ASCII: C) | [󠅃] |
| `U+E0144` | VARIATION SELECTOR-85 (ASCII: D) | [󠅄] |
| `U+E0145` | VARIATION SELECTOR-86 (ASCII: E) | [󠅅] |
| `U+E0146` | VARIATION SELECTOR-87 (ASCII: F) | [󠅆] |
| `U+E0147` | VARIATION SELECTOR-88 (ASCII: G) | [󠅇] |
| `U+E0148` | VARIATION SELECTOR-89 (ASCII: H) | [󠅈] |
| `U+FE08` | VARIATION SELECTOR-9 (ASCII: 0x08) | [︈] |
| `U+E0149` | VARIATION SELECTOR-90 (ASCII: I) | [󠅉] |
| `U+E014A` | VARIATION SELECTOR-91 (ASCII: J) | [󠅊] |
| `U+E014B` | VARIATION SELECTOR-92 (ASCII: K) | [󠅋] |
| `U+E014C` | VARIATION SELECTOR-93 (ASCII: L) | [󠅌] |
| `U+E014D` | VARIATION SELECTOR-94 (ASCII: M) | [󠅍] |
| `U+E014E` | VARIATION SELECTOR-95 (ASCII: N) | [󠅎] |
| `U+E014F` | VARIATION SELECTOR-96 (ASCII: O) | [󠅏] |
| `U+E0150` | VARIATION SELECTOR-97 (ASCII: P) | [󠅐] |
| `U+E0151` | VARIATION SELECTOR-98 (ASCII: Q) | [󠅑] |
| `U+E0152` | VARIATION SELECTOR-99 (ASCII: R) | [󠅒] |

### Category: Zero-Width & Joiners

| Code Point | Name | Character |
| :--- | :--- | :--- |
| `U+034F` | COMBINING GRAPHEME JOINER | [͏] |
| `U+180E` | MONGOLIAN VOWEL SEPARATOR | [᠎] |
| `U+2060` | WORD JOINER | [⁠] |
| `U+200D` | ZERO WIDTH JOINER | [‍] |
| `U+FEFF` | ZERO WIDTH NO-BREAK SPACE | [﻿] |
| `U+200C` | ZERO WIDTH NON-JOINER | [‌] |
| `U+200B` | ZERO WIDTH SPACE | [​] |


## 2. Authentic Examples (Mixed Formats)

Below are examples of how these characters might appear in the wild, combining multiple techniques in consecutive ways or interspersed in normal text.

### Example A: Zero-Width Space Injection & Joiners
Normal looking text with zero-width spaces injected between characters:
h​t​t​p​s​:​/​/​e​x​a​m​p​l​e​.​c​o​m

### Example B: Directional Overrides (Right-to-Left Override)
Embedding an executable extension but disguising it using RLO, plus an override format:
Invoice_2023_ur‮txt.exe‬

### Example C: Variation Selector Payload
Using variation selectors to encode hidden data within a seemingly innocent sentence:
This sentence looks completely normal, but contains hidden data.0123456789

### Example D: Unicode Tags (ASCII Smuggling)
Using Unicode tags to encode the word "SECRET".
Hidden payload here: 1353254F

### Example E: Confusable Spaces
A snippet of code that uses confusable spaces instead of regular spaces, which might cause compiler/interpreter errors or hide logic:
function test() { return true; }

### Example F: The Kitchen Sink
A single block of text that combines Zero-Width joiners, Directional Marks, Variation Selectors, and Unicode Tags:
START‍‪011F‬‌MIDDLE⁠‮͏012F‬﻿END

---
*End of test document.*
