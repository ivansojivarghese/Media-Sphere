// EmbeddingManager: loads TFJS and Universal Sentence Encoder (USE)
// Provides computeSuggestions(historyEntries, topicPhrases, topN)
(function(window){
  class EmbeddingManager {
    constructor() {
      this.model = null;
      this.loading = false;
    }

    async load() {
      if (this.model) return this.model;
      if (this.loading) {
        // wait until model is ready
        return new Promise((res) => {
          const i = setInterval(() => {
            if (this.model) {
              clearInterval(i);
              res(this.model);
            }
          }, 200);
        });
      }

      this.loading = true;

      // Load TFJS and USE via CDN (with fallback URLs)
      try {
        await this._loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js');
      } catch (e) {
        console.warn('TFJS jsDelivr failed, trying unpkg', e);
        await this._loadScript('https://unpkg.com/@tensorflow/tfjs@4.10.0/dist/tf.min.js');
      }

      try {
        await this._loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder@1.3.3/dist/universal-sentence-encoder.min.js');
      } catch (e) {
        console.warn('USE jsDelivr failed, trying unpkg', e);
        await this._loadScript('https://unpkg.com/@tensorflow-models/universal-sentence-encoder@1.3.3/dist/universal-sentence-encoder.min.js');
      }

      if (!window.use) {
        throw new Error('Universal Sentence Encoder failed to load');
      }

      this.model = await window.use.load();
      this.loading = false;
      return this.model;
    }

    _loadScript(src) {
      return new Promise((resolve, reject) => {
        // If already loaded, resolve
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = (e) => reject(new Error('Failed to load ' + src));
        document.head.appendChild(s);
      });
    }

    async embedTexts(texts) {
      if (!this.model) await this.load();
      if (!texts || texts.length === 0) return [];
      const embeddings = await this.model.embed(texts);
      const array = await embeddings.array();
      embeddings.dispose && embeddings.dispose();
      return array;
    }

    _normalize(vec) {
      const len = Math.sqrt(vec.reduce((s, v) => s + v*v, 0));
      if (len === 0) return vec.map(() => 0);
      return vec.map(v => v / len);
    }

    _dot(a, b) {
      let s = 0;
      for (let i = 0; i < a.length; i++) s += a[i] * b[i];
      return s;
    }

    async computeSuggestions(historyEntries, topicPhrases, topN = 5) {
      try {
        if (!historyEntries || historyEntries.length === 0) return [];

        // Build texts for history: prefer video titles, fallback to search queries
        const texts = historyEntries.map(e => {
          if (e.type === 'video') return (e.title || '') + ' ' + (e.channel || '');
          return e.query || '';
        }).filter(Boolean);

        // keep a small recent subset to save time
        const recent = texts.slice(0, 12);
        const topicSubset = (topicPhrases || []).slice(0, 12);

        const [historyEmbeddings, topicEmbeddings] = await Promise.all([
          this.embedTexts(recent),
          this.embedTexts(topicSubset)
        ]);

        if (!historyEmbeddings.length || !topicEmbeddings.length) return [];

        // Average history embeddings
        const dim = historyEmbeddings[0].length;
        const avg = new Array(dim).fill(0);
        for (const v of historyEmbeddings) {
          for (let i = 0; i < dim; i++) avg[i] += v[i];
        }
        for (let i = 0; i < dim; i++) avg[i] /= historyEmbeddings.length;
        const avgNorm = this._normalize(avg);

        // Score topic phrases by cosine similarity to avg history vector
        const scores = topicEmbeddings.map((vec, idx) => {
          const norm = this._normalize(vec);
          return { idx, score: this._dot(avgNorm, norm) };
        });

        scores.sort((a,b) => b.score - a.score);
        const picks = [];
        for (let i = 0; i < Math.min(topN, scores.length); i++) {
          picks.push(topicSubset[scores[i].idx]);
        }

        return picks;
      } catch (e) {
        console.warn('EmbeddingManager.computeSuggestions error', e);
        return [];
      }
    }
  }

  window.EmbeddingManager = EmbeddingManager;
})(window);
