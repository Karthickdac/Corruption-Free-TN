---
name: TN district geojson name matching
description: How the TN choropleth joins geo features to DB districts and its pitfalls
---
The transparency map joins geojson features to DB rows by lowercase district *name* string match.
**Why:** public/tn-districts.geojson was regenerated from 2011-census shapes; four names were normalized (Thiruvallur→Tiruvallur, Thiruvarur→Tiruvarur, Thoothukkudi→Thoothukudi, Kanyakumari→Kanniyakumari) and Mayiladuthurai was carved from Nagapattinam via an approximate lat-11.0 half-plane clip to get all 38 districts.
**How to apply:** if district names change in the DB or geojson is regenerated, re-verify all 38 names match exactly — mismatches silently drop districts from the map with no error.
