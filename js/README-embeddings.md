Embedding prototype (TF.js + USE)

What this does:
- Loads TensorFlow.js and Universal Sentence Encoder from CDN at runtime.
- Computes an average embedding for recent history (searches / video titles) and ranks human-friendly topic phrases.
- Stores top semantic suggestions in `historyManager.semanticCandidates` and refreshes the placeholder animator.

Files:
- `js/embeddings.js` — EmbeddingManager implementation.
- `js/request.js` — wired to call semantic updates after history writes.

How to test locally:
1. Open the app in a browser (serve the folder or open `index.html`).
2. Interact (perform searches / click videos). After a short delay (≈1s) the placeholder suggestions should update to semantically-relevant phrases.

Notes:
- The first run downloads the TFJS and USE bundles from CDN which may take a second or two.
- This is a lightweight prototype; for production consider bundling or using a server-side embedding service.
