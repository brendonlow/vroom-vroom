// Average resale value: % of the new price kept after 3 years / ~45,000 km, Australia, October 2026.
// basis "market" = from AU used listings / price guides; "estimate" = too new, based on brand and segment.
// Built by .context/build-resale.py from .context/resale-*.json research.
window.EV_RESALE = {
 "byd-atto-1": {
  "pct": 55,
  "basis": "estimate",
  "note": "Too new for used data (deliveries from early 2026); based on Dolphin retention, with cheap small cars holding value a little better.",
  "src": [
   "https://eftm.com/2025/11/byd-atto-1-to-hit-australia-at-23990-australias-cheapest-electric-car-269053",
   "https://www.autotrader.com.au/for-sale/used/byd/atto-1"
  ]
 },
 "byd-atto-2": {
  "pct": 52,
  "basis": "estimate",
  "note": "Too new for 3-year data; launched at $39,990 and cut to $31,990, so early buyers already lost ~20%; based on Atto 3 and Dolphin retention.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/byd/atto-2",
   "https://www.cars24.com.au/car-news/byd-atto-1-and-atto-2-prices-detailed/"
  ]
 },
 "byd-atto-3-evo": {
  "pct": 53,
  "basis": "market",
  "note": "Based on the previous Atto 3: 2023 Extended Range cars ask about $28-31k (50-80k km) vs about $48-50k new.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/byd/atto-3",
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80"
  ]
 },
 "byd-dolphin": {
  "pct": 56,
  "basis": "market",
  "note": "2023 Dynamics ask about $24-27k vs $38,890 new, but today's price is only $29,990, which cushions buyers now.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/byd/dolphin"
  ]
 },
 "byd-seal": {
  "pct": 60,
  "basis": "market",
  "note": "2023 Performance cars ask about $48-51k vs about $70k new; auction data had the Seal holding value best of the common EVs.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/byd/seal",
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80"
  ]
 },
 "byd-sealion-7": {
  "pct": 56,
  "basis": "estimate",
  "note": "Only on sale since 2025; year-old examples ask about 90% of RRP, so extrapolated from that and the Seal's retention.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/byd/sealion-7"
  ]
 },
 "gwm-ora": {
  "pct": 48,
  "basis": "market",
  "note": "2023 Oras ask about $26-29k vs $44-48k new; repeated new-price cuts and cheap demos weigh on values.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/gwm/ora",
   "https://goauto.com.au/news/gwm/ora/price-cut-makes-gwm-ora-our-cheapest-ev/2024-04-05/93523.html"
  ]
 },
 "gwm-ora-5": {
  "pct": 47,
  "basis": "estimate",
  "note": "Too new for used data (arrived mid-2026); based on the Ora hatch and the budget small-SUV segment.",
  "src": [
   "https://thebeep.com.au/car-news/2026-gwm-ora-5-suv-price-specs-australia"
  ]
 },
 "mg-cyberster": {
  "pct": 40,
  "basis": "estimate",
  "note": "Hardly any used data; a $100k+ roadster from a budget brand, with very low sales and a $15k cheaper RWD added, points to weak resale.",
  "src": [
   "https://atlas.carexpert.com.au/make/mg/cyberster",
   "https://www.autotrader.com.au/for-sale/used/mg/cyberster"
  ]
 },
 "mg-mg4": {
  "pct": 48,
  "basis": "market",
  "note": "2023 Excite 51s ask about $23-26k vs $38,990 new; 2-year auction retention was only about 50%, and near-new demos are heavily discounted.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/mg/mg4",
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80"
  ]
 },
 "mg-mg4-urban": {
  "pct": 48,
  "basis": "estimate",
  "note": "Too new for used data; based on MG4 retention.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/mg/mg4"
  ]
 },
 "mg-s5-ev": {
  "pct": 47,
  "basis": "estimate",
  "note": "On sale since May 2025 with almost no used listings yet; based on MG4 and the budget small-SUV segment.",
  "src": [
   "https://www.cars24.com.au/car-news/mg-s5-ev-prices-australias-most-affordable-electric-suv/"
  ]
 },
 "mg-s6-ev": {
  "pct": 46,
  "basis": "estimate",
  "note": "Too new for used data (launched May 2026); based on MG EV retention in a crowded mid-size SUV segment.",
  "src": [
   "https://www.cars24.com.au/car-news/2026-mg-s6-ev-on-sale-australia/"
  ]
 },
 "tesla-model-3": {
  "pct": 52,
  "basis": "market",
  "note": "2023 RWDs ask about $37-39k vs about $58-62k new; 2-year auction retention was 54%, and the new $45,900 entry price (down $9k, Oct 2026) adds pressure.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/tesla/model-3",
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80",
   "https://carsauce.com/news/2026-tesla-model-3-rwd-price-specs-australia-new-zealand"
  ]
 },
 "tesla-model-y": {
  "pct": 56,
  "basis": "market",
  "note": "2023 RWDs ask about $39-42k vs about $65k new; 2-year auction retention was 58%, and RedBook has 2022 RWDs about 48% below their original price.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/tesla/model-y",
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80",
   "https://www.carify.com.au/resources/used-ev-depreciation-australia"
  ]
 },
 "tesla-model-y-l": {
  "pct": 52,
  "basis": "estimate",
  "note": "Too new for used data; based on Model Y retention, less a few points for the higher price and niche 6-seat layout.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/tesla/model-y"
  ]
 },
 "chery-e5": {
  "pct": 47,
  "basis": "market",
  "note": "Sold as the Omoda E5 since 2024; 2024 cars price-guide around 70-77% of RRP, but a cut of more than $6k to $37,990 drive-away pushes 3-year values down.",
  "src": [
   "https://www.carsguide.com.au/chery/omoda-e5/price/2024",
   "https://www.cars24.com.au/car-news/2025-chery-e5-arrives-in-australia-with-lower-prices/"
  ]
 },
 "cupra-tavascan": {
  "pct": 50,
  "basis": "estimate",
  "note": "Only on sale since 2025 and now repositioned with a cheaper V grade; sister Cupra Born trades around 55-60% of RRP at 3 years.",
  "src": [
   "https://www.carsguide.com.au/cupra/tavascan/price/2025",
   "https://www.carsguide.com.au/cupra/born/price/2023",
   "https://www.chasingcars.com.au/news/new-car-prices/cupra-tavascan-2026-spains-sporty-electric-midsizer-now-5000-cheaper-with-new-v-grade-to-undercut-tesla-model-y/"
  ]
 },
 "deepal-e07": {
  "pct": 40,
  "basis": "estimate",
  "note": "Niche, pricier Deepal with little used data; the S07 from the same brand has depreciated faster than most, so we expect weak resale.",
  "src": [
   "https://www.carsguide.com.au/deepal/s07/price/2024"
  ]
 },
 "deepal-s07": {
  "pct": 44,
  "basis": "market",
  "note": "2024 cars price-guide only about 54-66% of their $50,900 RRP after about two years, among the weakest in its segment.",
  "src": [
   "https://www.carsguide.com.au/deepal/s07/price/2024",
   "https://www.drive.com.au/cars-for-sale/car/970049473/"
  ]
 },
 "geely-ex2": {
  "pct": 52,
  "basis": "estimate",
  "note": "New budget city EV in a price-war segment (Atto 1, MG4); the low purchase price limits the dollars lost, but we expect percentage retention to be only average.",
  "src": [
   "https://www.carsguide.com.au/geely/ex5/price/2025"
  ]
 },
 "geely-ex5": {
  "pct": 54,
  "basis": "estimate",
  "note": "Early signs are strong: 2025 cars price-guide around 85-90% of drive-away after a year, but there is no 3-year history yet.",
  "src": [
   "https://www.carsguide.com.au/geely/ex5/price/2025",
   "https://www.carsales.com.au/cars/2025/geely/ex5/"
  ]
 },
 "honda-super-one": {
  "pct": 55,
  "basis": "estimate",
  "note": "Brand-new small EV, but Honda's established dealer network and strong brand resale should support values better than new entrants.",
  "src": []
 },
 "im-im5": {
  "pct": 40,
  "basis": "estimate",
  "note": "Low-volume premium sedan from a new brand (fewer than 150 sales so far in 2026) that has already been discounted, so we expect weak resale.",
  "src": [
   "https://zecar.com/reviews/im5-im6-eofy-deal-save-3000-500-accessories-bonus-2026"
  ]
 },
 "im-im6": {
  "pct": 42,
  "basis": "estimate",
  "note": "New premium brand with thin sales and early discounts; the SUV body should hold slightly better than the IM5 sedan.",
  "src": [
   "https://zecar.com/reviews/im5-im6-eofy-deal-save-3000-500-accessories-bonus-2026"
  ]
 },
 "jaecoo-j5-ev": {
  "pct": 50,
  "basis": "estimate",
  "note": "Strong-selling budget SUV from a young brand; launched too recently for used data.",
  "src": [
   "https://www.carsguide.com.au/car-news/chinese-built-cars-dominate-the-top-selling-evs-in-australia-in-2026-as-electric-cars-have"
  ]
 },
 "leapmotor-b05": {
  "pct": 48,
  "basis": "estimate",
  "note": "New hatch from a young brand; the C10 suggests average-to-below-average retention, and hatches trail SUVs.",
  "src": [
   "https://www.carsguide.com.au/leapmotor/c10/price/2024"
  ]
 },
 "leapmotor-b10": {
  "pct": 50,
  "basis": "estimate",
  "note": "Too new for used data; based on the C10's resale and its mainstream small-SUV appeal.",
  "src": [
   "https://www.carsguide.com.au/leapmotor/c10/price/2024"
  ]
 },
 "leapmotor-c10": {
  "pct": 51,
  "basis": "market",
  "note": "2024 cars price-guide around 66-80% of RRP after about two years, with used asks in the low-to-mid $30ks.",
  "src": [
   "https://www.carsguide.com.au/leapmotor/c10/price/2024",
   "https://www.carsales.com.au/cars/leapmotor/c10/"
  ]
 },
 "smart-1": {
  "pct": 53,
  "basis": "market",
  "note": "2024 cars price-guide around 70-80% of RRP, but new-car cuts of up to $5k and run-out deals near $44.5k drive-away are dragging used values down.",
  "src": [
   "https://www.carsguide.com.au/smart/1/price/2024",
   "https://zecar.com/offers-and-deals/smart-1-pro-plus-driveaway-save-14000",
   "https://zecar.com/reviews/smart-5-confirmed-australia-1-3-price-cuts"
  ]
 },
 "smart-3": {
  "pct": 55,
  "basis": "market",
  "note": "2024 Pro+ cars price-guide at about $40-47k against roughly $58k new, so it holds slightly better than the #1 despite the recent $5k cuts.",
  "src": [
   "https://www.carsguide.com.au/smart/3/price/2024",
   "https://www.drive.com.au/cars-for-sale/car/969942486/",
   "https://zecar.com/reviews/smart-5-confirmed-australia-1-3-price-cuts"
  ]
 },
 "smart-5": {
  "pct": 50,
  "basis": "estimate",
  "note": "Larger and pricier than the #1 and #3, with no used history yet; we assume slightly weaker retention than its siblings.",
  "src": [
   "https://www.carsguide.com.au/smart/3/price/2024"
  ]
 },
 "xpeng-g6": {
  "pct": 55,
  "basis": "market",
  "note": "Used 2024-25 cars sit around 73-80% of original RRP after 1-2 years, though new-price cuts to about $52k will erode that.",
  "src": [
   "https://www.carsguide.com.au/xpeng/g6/price/2024",
   "https://www.cars24.com.au/buy-used-xpeng-g6-cars-in-sydney/",
   "https://zecar.com/reviews/xpeng-g6-long-range-drops-to-usd52-900-as-facelift-nears"
  ]
 },
 "xpeng-x9": {
  "pct": 42,
  "basis": "estimate",
  "note": "Launched in July 2026; large luxury EV people movers from thin-network brands tend to depreciate heavily.",
  "src": [
   "https://carsauce.com/news/2026-xpeng-x9-australia-price-specs"
  ]
 },
 "zeekr-009": {
  "pct": 46,
  "basis": "estimate",
  "note": "2025 cars still price-guide high, but a new base model priced $20k lower and luxury-EV norms point to steep 3-year losses.",
  "src": [
   "https://www.carsguide.com.au/zeekr/009/price/2025",
   "https://evcentral.com.au/family-value-2026-zeekr-009-electric-people-mover-now-20000-cheaper-with-longer-600km-range/"
  ]
 },
 "zeekr-7x": {
  "pct": 53,
  "basis": "estimate",
  "note": "Only on sale since 2025 but a top seller with strong demand; used examples are still mostly demos.",
  "src": [
   "https://www.drive.com.au/news/2026-zeekr-7x-price-and-specs-record-sales-for-electric-suv/",
   "https://www.drive.com.au/cars-for-sale/search/all/all/zeekr/7x/"
  ]
 },
 "zeekr-x": {
  "pct": 49,
  "basis": "market",
  "note": "Launched at $56,900, then cut by $7k (now $48,900 drive-away); 2024 RWD cars price-guide at about $34-41k after two years.",
  "src": [
   "https://www.carsguide.com.au/zeekr/x/price/2024",
   "https://www.vicparkcity.com.au/used-cars/zeekr-x",
   "https://zecar.com/reviews/zeekr-x-gets-major-price-cut-after-australia-launch"
  ]
 },
 "ford-mustang-mach-e": {
  "pct": 50,
  "basis": "market",
  "note": "2023 examples are advertised at about 55-75% of original RRP with low kilometres, but repeated new-price cuts (Select now about $60k drive-away) push typical 3-year values down to about half.",
  "src": [
   "https://www.autotrader.com.au/for-sale/ford/mustang-mach-e",
   "https://evcentral.com.au/ford-mustang-mach-e-prices-slashed-again-now-from-64990/",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "genesis-electrified-g80": {
  "pct": 42,
  "basis": "estimate",
  "note": "Very few sell in Australia and there are no used listings, so this is an estimate: large luxury EV sedans lose value steeply, and US data shows it losing about half its value in 2 years.",
  "src": [
   "https://recharged.com/articles/genesis-g80-electrified-resale-value-guide-2026/",
   "https://www.carsguide.com.au/buy-a-car/genesis/gv70",
   "https://business.carsales.com.au/news-room/luxury-evs-hit-hard-by-depreciation/"
  ]
 },
 "genesis-electrified-gv70": {
  "pct": 48,
  "basis": "market",
  "note": "A 2022 Performance Lux (about $128k new) is advertised at about $65k after 4 years, so it keeps a little under half at 3 years.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/genesis/gv70",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "genesis-gv60": {
  "pct": 49,
  "basis": "market",
  "note": "A 2022 GV60 Performance (about $104k new) is advertised at about $53k after 4 years, and newer GV60s have had price cuts, so it keeps about half.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/genesis/gv60",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "hyundai-elexio": {
  "pct": 50,
  "basis": "estimate",
  "note": "New for 2026 so there is no used data; estimated a little below the Ioniq 5 and Kona Electric because China-built EV rivals are crowding this segment.",
  "src": [
   "https://www.chasingcars.com.au/news/new-car-prices/prices-slashed-by-8000-for-hyundai-ioniq-5-and-kona-electric-as-cheaper-rivals-continue-to-flood-australias-ev-market/",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "hyundai-inster": {
  "pct": 55,
  "basis": "estimate",
  "note": "Too new for 3-year data, but 1-year-old examples are advertised at about 74% of RRP, and cheap small EVs hold value better than the EV average.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/hyundai/inster",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "hyundai-ioniq-5": {
  "pct": 55,
  "basis": "market",
  "note": "Used 2022-23 examples are advertised at about 58-65% of RRP, but the $8k new-price cut drags typical 3-year values down to the mid-50s, still among the best for mainstream EVs.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/hyundai/ioniq-5",
   "https://webuycars.com.au/blogs/resale-value-of-evs/",
   "https://www.chasingcars.com.au/news/new-car-prices/prices-slashed-by-8000-for-hyundai-ioniq-5-and-kona-electric-as-cheaper-rivals-continue-to-flood-australias-ev-market/"
  ]
 },
 "hyundai-ioniq-5-n": {
  "pct": 55,
  "basis": "market",
  "note": "Very few listings, but a low-km early example is advertised at about 71% of its $111k launch price; enthusiast demand keeps it about level with the regular Ioniq 5 at 3 years.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/hyundai/ioniq-5",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "hyundai-ioniq-6-n": {
  "pct": 50,
  "basis": "estimate",
  "note": "New for 2026 so this is an estimate from the Ioniq 5 N, set slightly lower because performance sedans sell more slowly second-hand.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/hyundai/ioniq-6",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "hyundai-ioniq-9": {
  "pct": 54,
  "basis": "estimate",
  "note": "Too new for 3-year data; estimated from the Kia EV9, a scarce large 7-seat EV that has held value unusually well.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/kia/ev9",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "hyundai-kona-electric": {
  "pct": 52,
  "basis": "market",
  "note": "Earlier Kona Electrics are advertised at about 53% of RRP after 4 years, and the $8k cut to new prices holds 3-year values to about half.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/hyundai/kona",
   "https://www.chasingcars.com.au/news/new-car-prices/prices-slashed-by-8000-for-hyundai-ioniq-5-and-kona-electric-as-cheaper-rivals-continue-to-flood-australias-ev-market/",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "jeep-avenger-electric": {
  "pct": 46,
  "basis": "market",
  "note": "2024 examples are advertised at $30-33k, about 60% of RRP after 2 years, and Jeep's weak brand and slow sales point to below-average 3-year values.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/jeep/avenger",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "kia-ev3": {
  "pct": 55,
  "basis": "estimate",
  "note": "Launched in 2025 so this is an estimate: an affordable small Kia SUV, in line with the EV average of about 55% at 3 years.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/kia/ev3",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "kia-ev4": {
  "pct": 51,
  "basis": "estimate",
  "note": "New for 2026 so this is an estimate: set slightly below Kia's SUVs because EV sedans and hatches are less in demand second-hand.",
  "src": [
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299",
   "https://www.gridly.com.au/blog/ev-depreciation-australia/"
  ]
 },
 "kia-ev5": {
  "pct": 56,
  "basis": "market",
  "note": "2024 EV5 Air examples are advertised at about $40k, around 70% of RRP after 2 years, which points to slightly above-average 3-year retention.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/kia/ev5",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "kia-ev6": {
  "pct": 53,
  "basis": "market",
  "note": "2023 EV6 Air examples are advertised at about $42k (about 60% of RRP) and 2022 GT-Lines at about 50% after 4 years, so it keeps a little over half at 3 years.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/kia/ev6",
   "https://webuycars.com.au/blogs/resale-value-of-evs/",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "kia-ev9": {
  "pct": 58,
  "basis": "market",
  "note": "Used 2023-24 EV9s are advertised at about 70-79% of RRP after 2-2.5 years because large 7-seat EVs are scarce, making it one of the strongest EVs for resale.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/kia/ev9",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "lexus-rz": {
  "pct": 40,
  "basis": "estimate",
  "note": "There are few Australian used RZ450e listings; the new RZ is now about $34k cheaper than the 2023 launch price, and US data shows roughly half the value lost in 2 years.",
  "src": [
   "https://recharged.com/articles/lexus-rz-450e-depreciation-curve-5-years",
   "https://www.carsguide.com.au/buy-a-car/lexus/rz",
   "https://business.carsales.com.au/news-room/luxury-evs-hit-hard-by-depreciation/"
  ]
 },
 "mazda-6e": {
  "pct": 48,
  "basis": "estimate",
  "note": "New in Australia with no used data; China-built EV sedans have depreciated quickly, partly offset by Mazda's brand strength.",
  "src": [
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299",
   "https://www.gridly.com.au/blog/ev-depreciation-australia/"
  ]
 },
 "nissan-ariya": {
  "pct": 45,
  "basis": "market",
  "note": "2025 Ariyas are already advertised at about 67-75% of RRP after only 1 year, and steady discounting plus Nissan's weak position point to below-average 3-year values.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/nissan/ariya",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "subaru-solterra": {
  "pct": 45,
  "basis": "market",
  "note": "A 2024 Solterra is advertised at about $39k, about 56% of RRP after 2 years, and the $6-7k cut to new prices pulls 3-year values below half.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/subaru/solterra",
   "https://www.carexpert.com.au/car-news/2026-toyota-bz4x-prices-slashed-by-thousands-despite-extensive-updates"
  ]
 },
 "subaru-trailseeker": {
  "pct": 46,
  "basis": "estimate",
  "note": "New for 2026 so this is an estimate from the Solterra's weak resale values.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/subaru/solterra",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "subaru-uncharted": {
  "pct": 47,
  "basis": "estimate",
  "note": "New for 2026 so this is an estimate from the Solterra, set slightly higher because it is the smaller, cheaper model.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/subaru/solterra",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "toyota-bz4x": {
  "pct": 55,
  "basis": "market",
  "note": "2023 bZ4Xs are advertised at about $39-46k (about 59-65% of RRP), but the $10k new-price cut in Dec 2025 holds typical 3-year values to the mid-50s.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/toyota/bz4x",
   "https://www.drive.com.au/news/2026-toyota-bz4x-price-and-specs-10000-price-slash-for-updated-model-y-rival/"
  ]
 },
 "toyota-bz4x-touring": {
  "pct": 52,
  "basis": "estimate",
  "note": "New for 2026 so this is an estimate from the bZ4X, set slightly lower because it is a pricier, niche wagon.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/toyota/bz4x",
   "https://www.whichcar.com.au/news/pricing-confirmed-flagship-toyota-bz4x-touring-electric-suv"
  ]
 },
 "audi-q4-sportback-e-tron": {
  "pct": 55,
  "basis": "estimate",
  "note": "Only on sale here since 2024; nearly-new 2025 cars list at about 80% of new after a year, so we estimate mid-50s at three years.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/audi/q4-e-tron",
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80"
  ]
 },
 "audi-q4-e-tron": {
  "pct": 55,
  "basis": "estimate",
  "note": "Only on sale here since 2024; nearly-new 2025 cars list at about 80-85% of new, so we estimate mid-50s at three years.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/audi/q4-e-tron",
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80"
  ]
 },
 "audi-q6-sportback-e-tron": {
  "pct": 50,
  "basis": "estimate",
  "note": "Too new for used data; estimated a little below the Q4 because pricier luxury EVs lose value faster.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/audi/e-tron",
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80"
  ]
 },
 "audi-q6-e-tron": {
  "pct": 50,
  "basis": "estimate",
  "note": "Too new for used data; estimated a little below the Q4 because pricier luxury EVs lose value faster.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/audi/e-tron",
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80"
  ]
 },
 "audi-q8-e-tron": {
  "pct": 38,
  "basis": "market",
  "note": "Used e-tron S models from 2022-23 list at about $63-65k, roughly 37-39% of their $165k+ new price.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/audi/e-tron",
   "https://business.carsales.com.au/news-room/luxury-evs-hit-hard-by-depreciation/"
  ]
 },
 "audi-e-tron-gt": {
  "pct": 52,
  "basis": "market",
  "note": "Low-km used e-tron GTs list at about two-thirds of new, so a typical 3-year, 45,000 km car keeps about half.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/audi/e-tron-gt",
   "https://business.carsales.com.au/news-room/luxury-evs-hit-hard-by-depreciation/"
  ]
 },
 "bmw-i4": {
  "pct": 58,
  "basis": "market",
  "note": "Used 2023 eDrive35s list at about $55-56k against roughly $86k new, so it holds value well for a luxury EV.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/bmw/i4",
   "https://www.iseecars.com/car/bmw-i4/resale-value"
  ]
 },
 "bmw-i5": {
  "pct": 45,
  "basis": "estimate",
  "note": "Too few used examples. Demo i5 M60s were already selling at under 81% of new, and large luxury EVs fall heavily.",
  "src": [
   "https://business.carsales.com.au/news-room/luxury-evs-hit-hard-by-depreciation/"
  ]
 },
 "bmw-i5-touring": {
  "pct": 43,
  "basis": "estimate",
  "note": "No used data. Estimated like the i5 sedan but slightly lower because it is a $220k performance model.",
  "src": [
   "https://business.carsales.com.au/news-room/luxury-evs-hit-hard-by-depreciation/"
  ]
 },
 "bmw-ix": {
  "pct": 47,
  "basis": "market",
  "note": "Used 2023 xDrive40s with about 30,000 km list at about $70k against roughly $136k new, so it keeps about half.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/bmw/ix",
   "https://business.carsales.com.au/news-room/luxury-evs-hit-hard-by-depreciation/",
   "https://www.iseecars.com/car/bmw-ix/resale-value"
  ]
 },
 "bmw-ix1": {
  "pct": 58,
  "basis": "market",
  "note": "Used 2022-23 xDrive30s list at about $51-57k against roughly $83k new, one of the better-holding luxury EVs.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/bmw/ix1"
  ]
 },
 "bmw-ix2": {
  "pct": 55,
  "basis": "estimate",
  "note": "Launched in 2024 so little used data; estimated just under its iX1 sibling.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/bmw/ix1"
  ]
 },
 "bmw-ix3": {
  "pct": 58,
  "basis": "estimate",
  "note": "The new Neue Klasse iX3 is too new for used data; the outgoing iX3 kept about 60% at three years.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/bmw/ix3"
  ]
 },
 "mercedes-benz-cla-eq": {
  "pct": 50,
  "basis": "estimate",
  "note": "Too new for used data; Mercedes EVs have resold poorly and big new-car discounts drag used prices down.",
  "src": [
   "https://carexpert.com.au/mercedes-benz/eqe/2023",
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80"
  ]
 },
 "mercedes-benz-eqa": {
  "pct": 50,
  "basis": "market",
  "note": "Used EQA 250s mostly list at about $46-60k against $77-85k new, and new-car discounting pushes values down.",
  "src": [
   "https://www.carsales.com.au/cars/mercedes-benz/eqa/",
   "https://www.caradvice.com.au/cars-for-sale/car/969542683/"
  ]
 },
 "mercedes-benz-eqb": {
  "pct": 48,
  "basis": "estimate",
  "note": "We found few Australian used listings; estimated just below the EQA, its close sibling.",
  "src": [
   "https://www.carsales.com.au/cars/mercedes-benz/eqa/"
  ]
 },
 "mercedes-benz-eqe-sedan": {
  "pct": 42,
  "basis": "market",
  "note": "A 2023 EQE 300 with 20,000 km listed at about $80k against $142k drive-away new, so it loses heavily.",
  "src": [
   "https://www.caradvice.com.au/cars-for-sale/car/969538601/",
   "https://carexpert.com.au/mercedes-benz/eqe/2023",
   "https://www.kbb.com/mercedes-benz/mercedes-eq-eqe/2023/depreciation"
  ]
 },
 "mercedes-benz-eqs-sedan": {
  "pct": 38,
  "basis": "market",
  "note": "Among the worst EVs for depreciation: near-new AMG EQS 53s sold at about 55% of list, and older EQS lose far more.",
  "src": [
   "https://business.carsales.com.au/news-room/luxury-evs-hit-hard-by-depreciation/",
   "https://m.arenaev.com/used_mercedes_eqs_loses_half_of_its_value_in_just_one_year-amp-3364.php"
  ]
 },
 "mercedes-benz-eqv": {
  "pct": 45,
  "basis": "estimate",
  "note": "Niche, very expensive electric people-mover; estimated low despite the V-Class's solid resale.",
  "src": [
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80"
  ]
 },
 "mercedes-benz-g-580-eq": {
  "pct": 60,
  "basis": "estimate",
  "note": "Too new for used data. The G-Class name holds value strongly, but the electric version is unproven and costs $250k.",
  "src": [
   "https://business.carsales.com.au/news-room/luxury-evs-hit-hard-by-depreciation/"
  ]
 },
 "mercedes-benz-glc-eq": {
  "pct": 52,
  "basis": "estimate",
  "note": "Too new for used data; estimated slightly above older Mercedes EVs because GLC SUVs are popular.",
  "src": [
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80"
  ]
 },
 "mini-aceman": {
  "pct": 55,
  "basis": "estimate",
  "note": "Launched 2024 with little used data; estimated from Mini's fairly strong EV resale.",
  "src": [
   "https://www.carsguide.com.au/car/15097816/mini/cooper/vic/ferntree-gully/hatchback"
  ]
 },
 "mini-cooper-electric": {
  "pct": 58,
  "basis": "market",
  "note": "A 2022 Cooper SE with 34,000 km listed at about $34.5k against $55.7k new, which is good retention for a small EV.",
  "src": [
   "https://www.carsguide.com.au/car/15097816/mini/cooper/vic/ferntree-gully/hatchback"
  ]
 },
 "mini-countryman-electric": {
  "pct": 55,
  "basis": "estimate",
  "note": "Launched 2024 with little used data; estimated from Mini and BMW's compact EV retention.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/bmw/ix1"
  ]
 },
 "porsche-macan-electric": {
  "pct": 55,
  "basis": "estimate",
  "note": "Launched late 2024, too new for used data; estimated level with the Taycan.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/porsche/taycan"
  ]
 },
 "porsche-taycan": {
  "pct": 55,
  "basis": "market",
  "note": "Australian used Taycans list at about 58-65% of new (with options) at 3-5 years, better than in the US.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/porsche/taycan",
   "https://www.iseecars.com/car/porsche-taycan/resale-value"
  ]
 },
 "skoda-elroq": {
  "pct": 55,
  "basis": "estimate",
  "note": "Too new for used data; estimated from mainstream VW Group EVs.",
  "src": [
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80",
   "https://www.flarehr.com/blog/ev-myths-busted-do-electric-cars-really-lose-value-faster"
  ]
 },
 "skoda-enyaq": {
  "pct": 52,
  "basis": "estimate",
  "note": "Few used listings. Large new-price cuts since its 2023 launch weigh on early cars, so we estimate low 50s.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/skoda/enyaq",
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80"
  ]
 },
 "skoda-enyaq-coupe": {
  "pct": 50,
  "basis": "estimate",
  "note": "Few used listings; the $81k RS coupe is estimated just below the Enyaq wagon.",
  "src": [
   "https://www.autotrader.com.au/for-sale/used/skoda/enyaq"
  ]
 },
 "volkswagen-id-buzz-lwb": {
  "pct": 55,
  "basis": "estimate",
  "note": "On sale since 2025, too new for used data. Its novelty helps demand but the high price limits it.",
  "src": [
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80"
  ]
 },
 "volkswagen-id-buzz-swb": {
  "pct": 55,
  "basis": "estimate",
  "note": "On sale since 2025, too new for used data. Its novelty helps demand but the high price limits it.",
  "src": [
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80"
  ]
 },
 "volkswagen-id-4": {
  "pct": 52,
  "basis": "market",
  "note": "A 2025 ID.4 Pro with 7,000 km sold for about $48.7k against about $60-63k new. Used data is thin and price cuts hurt.",
  "src": [
   "https://www.cars24.com.au/buy-used-volkswagen-id-4/",
   "https://driveagent.io/news/ev-resale-values-steep-depreciation-is-documented-but-australia-s-used-market-turned-in-2026-52b55c80"
  ]
 },
 "volkswagen-id-5": {
  "pct": 50,
  "basis": "estimate",
  "note": "Thin used data; estimated a little below the ID.4.",
  "src": [
   "https://www.cars24.com.au/buy-used-volkswagen-id-4/"
  ]
 },
 "abarth-500e": {
  "pct": 42,
  "basis": "estimate",
  "note": "Too rare for used data; a low-volume, heavily discounted niche hot hatch from Stellantis, so expect well below the EV average.",
  "src": [
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299",
   "https://www.carsguide.com.au/buy-a-car/abarth/500e"
  ]
 },
 "alfa-romeo-junior-elettrica": {
  "pct": 44,
  "basis": "estimate",
  "note": "New, low-volume Alfa with no used market yet; estimated below the EV average because small Stellantis EVs have weak brand demand.",
  "src": [
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "cadillac-lyriq": {
  "pct": 45,
  "basis": "estimate",
  "note": "No used market yet; a new brand in Australia, and a $32k price cut shows how soft values are, though buying at today's lower price helps.",
  "src": [
   "https://www.canberratimes.com.au/story/9237280/monster-32000-price-cut-for-ev/",
   "https://jalopnik.com/1949566/cadillac-lyriq-depreciation/"
  ]
 },
 "cadillac-lyriq-v": {
  "pct": 42,
  "basis": "estimate",
  "note": "Low-volume performance flagship of a new brand; estimated slightly below the regular Lyriq.",
  "src": [
   "https://www.canberratimes.com.au/story/9237280/monster-32000-price-cut-for-ev/"
  ]
 },
 "cadillac-optiq": {
  "pct": 46,
  "basis": "estimate",
  "note": "No used data; the cheaper, more mainstream Cadillac should hold value slightly better than the Lyriq.",
  "src": [
   "https://www.carexpert.com.au/cadillac/lyriq/pricing"
  ]
 },
 "cadillac-vistiq": {
  "pct": 42,
  "basis": "estimate",
  "note": "Large, expensive seven-seater from a new brand with a tiny buyer pool, so estimated at the low end.",
  "src": [
   "https://www.carexpert.com.au/cadillac/lyriq/pricing"
  ]
 },
 "fiat-500e": {
  "pct": 45,
  "basis": "estimate",
  "note": "Used examples are very scarce; a short-range, pricey city car with low sales, estimated well below the EV average.",
  "src": [
   "https://www.caradvice.com.au/cars-for-sale/car/969515178/",
   "https://www.autotrader.com.au/for-sale/fiat/500"
  ]
 },
 "lotus-eletre": {
  "pct": 38,
  "basis": "market",
  "note": "A near-new Eletre R demo is advertised at about $145k against roughly $280k RRP, and big launch price cuts point to very steep depreciation.",
  "src": [
   "https://www.autotrader.com.au/for-sale/lotus/eletre",
   "https://www.caradvice.com.au/news/2024-lotus-eletre-price-slashed-australia/"
  ]
 },
 "lotus-emeya": {
  "pct": 37,
  "basis": "estimate",
  "note": "Too new for used data; estimated in line with the Eletre's steep early depreciation, with an even smaller buyer pool for a luxury EV sedan.",
  "src": [
   "https://www.autotrader.com.au/for-sale/lotus/eletre"
  ]
 },
 "peugeot-e-308": {
  "pct": 38,
  "basis": "estimate",
  "note": "Almost none sold and no used listings, and Inchcape is handing Peugeot back to Stellantis amid falling sales, which hurts resale confidence.",
  "src": [
   "https://www.carexpert.com.au/car-news/peugeot-dumped-by-australian-distributor-but-stellantis-says-french-brand-will-stick-around-here",
   "https://www.autotrader.com.au/for-sale/peugeot/e-308"
  ]
 },
 "polestar-polestar-2": {
  "pct": 50,
  "basis": "market",
  "note": "Three-year-old 2023 cars with 40-60k km are advertised at about $34-42k, roughly 53-57% of RRP before dealer margin, and Polestar's finances and price cuts weigh on values.",
  "src": [
   "https://www.autotrader.com.au/for-sale/polestar/2",
   "https://www.electrive.com/2026/05/08/polestar-posts-wider-q1-losses/",
   "https://www.carexpert.com.au/car-news/polestar-australia-boss-steps-down-to-lead-ev-lobby-group-as-brands-sales-slide"
  ]
 },
 "polestar-polestar-3": {
  "pct": 44,
  "basis": "estimate",
  "note": "Only a single near-new used listing; a large premium EV from a financially troubled brand, estimated below the Polestar 2.",
  "src": [
   "https://www.autotrader.com.au/for-sale/polestar",
   "https://www.electrive.com/2026/05/08/polestar-posts-wider-q1-losses/"
  ]
 },
 "polestar-polestar-4": {
  "pct": 47,
  "basis": "estimate",
  "note": "One-year-old cars are holding up so far (about $66k advertised), but brand risk and repeated price cuts point to roughly Polestar 2-level retention.",
  "src": [
   "https://www.autotrader.com.au/for-sale/polestar",
   "https://www.examiner.com.au/story/8749850/polestar-slashes-prices-across-australian-ev-lineup"
  ]
 },
 "polestar-polestar-5": {
  "pct": 38,
  "basis": "estimate",
  "note": "A $170k+ low-volume GT from a brand in financial trouble; expensive luxury EVs lose value fastest.",
  "src": [
   "https://www.electrive.com/2026/05/08/polestar-posts-wider-q1-losses/"
  ]
 },
 "renault-megane-e-tech": {
  "pct": 52,
  "basis": "market",
  "note": "Two-year-old cars, mostly low-km demos, are advertised at about $40-46k after a big launch-price cut, which suggests middling retention for a slow seller.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/renault/megane-e-tech"
  ]
 },
 "renault-scenic-e-tech": {
  "pct": 48,
  "basis": "estimate",
  "note": "Too new for used data; estimated a little below the Megane E-Tech because Renault EVs sell in low volumes.",
  "src": [
   "https://www.carsguide.com.au/buy-a-car/renault/megane-e-tech",
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "volvo-ec40": {
  "pct": 46,
  "basis": "market",
  "note": "Three-year-old C40s are advertised at about $35-43k, roughly 44-51% of their original price, slightly weaker than the XC40/EX40.",
  "src": [
   "https://www.autotrader.com.au/for-sale/volvo/c40",
   "https://www.carsguide.com.au/buy-a-car/volvo/c40"
  ]
 },
 "volvo-es90": {
  "pct": 42,
  "basis": "estimate",
  "note": "New large luxury EV sedan in a body style few buyers want; estimated below Volvo's EV SUVs.",
  "src": [
   "https://carbids.com.au/h/allbids-blogs/just-how-much-do-evs-depreciate-we-crunched-the-numbers--299"
  ]
 },
 "volvo-ex30": {
  "pct": 54,
  "basis": "market",
  "note": "Two-year-old Ultras are advertised at about $42-43k, but much lower new pricing now caps used values, so expect a little under the EV average.",
  "src": [
   "https://www.autotrader.com.au/for-sale/volvo/ex30"
  ]
 },
 "volvo-ex40": {
  "pct": 54,
  "basis": "market",
  "note": "Three-year-old 2023 XC40 Recharge Twins with 20-40k km are advertised at about $48-50k (around 60% of RRP before dealer margin), the best of the group.",
  "src": [
   "https://www.autotrader.com.au/for-sale/volvo/xc40/electric"
  ]
 },
 "volvo-ex60": {
  "pct": 50,
  "basis": "estimate",
  "note": "No used data yet; a mid-size SUV in the most popular segment, estimated near the EX40 but discounted for early-model risk.",
  "src": [
   "https://www.autotrader.com.au/for-sale/volvo/xc40/electric"
  ]
 },
 "volvo-ex90": {
  "pct": 46,
  "basis": "estimate",
  "note": "One-year-old cars are already advertised about 23% under their launch RRP, and software issues and a big price cut hurt values.",
  "src": [
   "https://www.autotrader.com.au/for-sale/volvo/ex90"
  ]
 }
};
