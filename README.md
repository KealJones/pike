# Piké <small><small><small><small><small>`/ˈpi-kē/`</small></small></small></small></small>

Analyzes your Pokémon GO storage from a Poké Genie CSV export and provides tooling for PvP optimization and trade planning.

## Features

- Upload your storage and view potential PvP builds.
- Percentile Target Calculator: explore representative IV spreads for a trade at or above a chosen performance percentile.

## Percentile Target Calculator

Navigate to the "Percentile Target" page in the sidebar. Provide:

1. Species selection (autocomplete from Game Master) or manually enter base stats (ATK/DEF/STA).
2. Friendship tier and whether the trade is Lucky.
3. Recipient trainer level (sets post-trade level cap TL+2).
4. Target league or custom CP cap.
5. Percentile (0–1) and optimization metric (SP or CP).
6. Tail strategy and aggregator (for upper-tail sampling).

Press Compute to see:

- Recommended integer level to power to before trading.
- Post-trade CP and IV representative at/above percentile.
- CP range for the level given min vs perfect IVs.
- Tail statistics when using the upper tail strategy.

## Development

Install deps and start dev server:

```bash
pnpm install
pnpm run dev
```

Build:

```bash
pnpm run build
```

Lint:

```bash
pnpm run lint
```

---

MIT License — see `LICENSE`.
