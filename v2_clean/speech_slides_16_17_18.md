# Speech — Slides 16-18 (Technical Knowledge & Design Decisions)
Target: ~2 minutes (≈300 words)

---

Moving into the technical core of the project — the design decisions behind WA-TGCN, and why each one is justified.

Air pollution is fundamentally spatio-temporal: it spreads across locations and evolves hour by hour. So we combine graph-based learning, which captures how stations relate to each other spatially, with sequence-based learning, which captures how each station evolves over time. The key question we wanted to test was whether those spatial relationships should depend on wind direction, not just proximity — which is exactly what our dynamic adjacency does.

The formula itself is simple: an edge from station i to station j exists only if wind is blowing from i toward j, within a 12-kilometer radius, weighted by that alignment over distance, and row-normalized. And this isn't just a static design choice — look at the right side. Comparing a calm hour with only 233 edges to an active wind hour with 306 edges, you can see the graph is physically rewiring itself hour to hour. A static distance-based graph simply cannot do this.

On the loss side, we use a volatility-weighted Huber loss in log-space — pollution windows with bigger swings get emphasized during training, and the log-transform brings our skew down from 2.58 to almost zero, which stabilizes training against extreme spikes.

For the architecture itself, every choice was empirically justified. Hidden size 32 with a single GRU layer matched the performance of a much larger model at 5.6 times fewer parameters — so complexity was never the bottleneck. StandardScaler replaced MinMax because MinMax was compressing over two-thirds of our values below 0.1. We use AdamW with a cosine schedule, gradient clipping, and early stopping — and as the training convergence chart shows, validation loss stabilizes by epoch 5 to 7, with no runaway overfitting. Finally, everything is benchmarked fairly — persistence, a graph-free model, and a static-graph model all isolate exactly what the dynamic wind-aware graph contributes. All of this trains locally on a single RTX 3050 laptop GPU, no cloud — about 25 to 35 minutes for the full seven-seed ensemble.
