/**
 * スライドビューワー コントローラー (PDF.js カスタム実装)
 */

class SlideViewer {
  constructor(options = {}) {
    this.container = document.querySelector(options.container || ".slide-viewer-container");
    this.canvas = document.getElementById(options.canvasId || "slide-canvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.prevBtn = document.getElementById("btn-prev-slide");
    this.nextBtn = document.getElementById("btn-next-slide");
    this.pageIndicator = document.getElementById("slide-page-indicator");
    this.progressFill = document.getElementById("slide-progress-fill");
    this.loadingOverlay = document.getElementById("slide-loading");
    this.fullscreenBtn = document.getElementById("btn-fullscreen");
    this.downloadBtn = document.getElementById("btn-download-pdf");
    this.tabsContainer = document.getElementById("material-tabs");

    this.pdfDoc = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.pageRendering = false;
    this.pageNumPending = null;
    this.currentScale = 1.5;
    this.currentPdfUrl = "";

    // 音声発音機能プロパティ（フラッシュカード専用）
    this.audioControls = document.getElementById("slide-controls-audio") || document.querySelector(".slide-controls-audio");
    this.speakBtn = document.getElementById("btn-speak-slide");
    this.speedBtn = document.getElementById("btn-speech-speed");
    this.speedLabel = document.getElementById("speed-label");
    this.speedIcon = document.getElementById("speed-icon");
    this.floatingAudioPill = document.getElementById("floating-audio-pill");
    this.btnFloatingSpeak = document.getElementById("btn-floating-speak");
    this.floatingWordRomaji = document.getElementById("floating-word-romaji");
    this.floatingWordKana = document.getElementById("floating-word-kana");
    this.floatingWordEn = document.getElementById("floating-word-en");

    this.speechRate = 0.85; // 初学者向けデフォルト0.85倍速
    this.isSpeaking = false;
    this.jaVoice = null;
    this.currentAudio = null;
    this.overlayLayer = document.getElementById("slide-overlay-layer");
    this.currentSequentialTimer = null;
    this.currentSequentialIndex = -1;

    // 自動音声再生 (ページ送り時の自動発音)
    this.autoplayBtn = document.getElementById("btn-speech-autoplay");
    this.autoplayIcon = document.getElementById("autoplay-icon");
    this.autoplayLabel = document.getElementById("autoplay-label");
    this.autoPlayAudio = false;
    try {
      this.autoPlayAudio = localStorage.getItem("slide_audio_autoplay") === "true";
    } catch (e) {}
    this.autoPlayTimer = null;

    // 初期状態は非表示（フラッシュカード読み込み時にのみ表示）
    if (this.audioControls) {
      this.audioControls.classList.add("hidden");
      this.audioControls.style.display = "none";
    }
    if (this.floatingAudioPill) {
      this.floatingAudioPill.classList.add("hidden");
      this.floatingAudioPill.style.display = "none";
    }

    this.initEvents();
  }

  initEvents() {
    // 左右送りボタン
    if (this.prevBtn) {
      this.prevBtn.addEventListener("click", () => this.prevPage());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", () => this.nextPage());
    }

    // 発音ボタン
    if (this.speakBtn) {
      this.speakBtn.addEventListener("click", () => this.speakCurrentPage());
    }
    if (this.btnFloatingSpeak) {
      this.btnFloatingSpeak.addEventListener("click", () => this.speakCurrentPage());
    }

    // 再生速度切替ボタン
    if (this.speedBtn) {
      this.speedBtn.addEventListener("click", () => this.toggleSpeechSpeed());
    }

    // 自動音声再生 (ページめくり時) 切替ボタン
    if (this.autoplayBtn) {
      this.autoplayBtn.addEventListener("click", () => this.toggleAutoPlay());
      this.updateAutoPlayUI();
    }

    // 日本語音声エンジンのロード
    if (window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        this.jaVoice = voices.find(v => v.lang === "ja-JP" || v.lang === "ja_JP" || v.lang.startsWith("ja")) || null;
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    // フルスクリーン切り替え
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener("click", () => this.toggleFullscreen());
    }

    // PDFダウンロードボタン
    if (this.downloadBtn) {
      this.downloadBtn.addEventListener("click", () => {
        if (this.currentPdfUrl) {
          window.open(this.currentPdfUrl, "_blank");
        }
      });
    }

    // キーボードショートカット (左右矢印キー & S/Vキー発音)
    window.addEventListener("keydown", (e) => {
      // 入力フォーム操作中はスキップ
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
      
      const lessonView = document.getElementById("lesson-detail-view");
      if (!lessonView || lessonView.classList.contains("hidden")) return;

      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        this.prevPage();
      } else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        this.nextPage();
      } else if (e.key === "f" || e.key === "F") {
        this.toggleFullscreen();
      } else if (e.key === "s" || e.key === "S") {
        if (this.isFlashcard()) {
          e.preventDefault();
          this.speakCurrentPage();
        }
      } else if (e.key === "v" || e.key === "V") {
        if (this.isFlashcard()) {
          e.preventDefault();
          this.toggleSpeechSpeed();
        }
      } else if (e.key === "a" || e.key === "A") {
        if (this.isFlashcard()) {
          e.preventDefault();
          this.toggleAutoPlay();
        }
      }
    });

    // モバイル用タッチスワイプ
    let touchStartX = 0;
    let touchStartY = 0;
    const stage = document.querySelector(".slide-stage-wrapper");
    if (stage) {
      stage.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });

      stage.addEventListener("touchend", (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // 横スワイプかつ縦移動が少ない場合
        if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX < 0) {
            this.nextPage();
          } else {
            this.prevPage();
          }
        }
      }, { passive: true });
    }

    // ウィンドウリサイズ時の再描画（レスポンシブスケール）
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (this.pdfDoc && this.currentPage) {
          this.renderPage(this.currentPage);
        }
      }, 200);
    });
  }

  setLoading(isLoading) {
    if (!this.loadingOverlay) return;
    if (isLoading) {
      this.loadingOverlay.classList.remove("hidden");
    } else {
      this.loadingOverlay.classList.add("hidden");
    }
  }

  /**
   * PDFドキュメントの読み込み
   */
  async loadPdf(url, initialPage = 1) {
    this.stopCurrentAudio();
    if (this.autoPlayTimer) {
      clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    this.currentPdfUrl = url;
    this.updateSpeechUI();
    this.setLoading(true);

    if (this.downloadBtn) {
      this.downloadBtn.style.display = url ? "inline-flex" : "none";
    }

    if (!url) {
      this.setLoading(false);
      this.showPlaceholder("スライド資料は準備中です / Slides Coming Soon");
      return;
    }

    try {
      // PDF.jsワーカー設定
      if (window.pdfjsLib) {
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "lib/pdf.worker.min.js";
        }
      } else {
        throw new Error("PDF.js ライブラリが読み込まれていません。");
      }

      const loadingTask = pdfjsLib.getDocument({
        url: url,
        cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
        cMapPacked: true
      });

      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.currentPage = Math.min(Math.max(1, initialPage), this.totalPages);
      this.updateSpeechUI();

      await this.renderPage(this.currentPage);
      this.setLoading(false);
    } catch (err) {
      console.error("PDF読み込みエラー:", err);
      this.setLoading(false);
      this.showPlaceholder("スライドの読み込みに失敗しました / Failed to load slides");
    }
  }

  showPlaceholder(message) {
    if (!this.canvas || !this.ctx) return;
    this.canvas.width = 960;
    this.canvas.height = 540;
    this.ctx.fillStyle = "#1e293b";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#94a3b8";
    this.ctx.font = "bold 24px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
    
    if (this.pageIndicator) this.pageIndicator.innerHTML = "- / -";
    if (this.progressFill) this.progressFill.style.width = "0%";
    if (this.prevBtn) this.prevBtn.disabled = true;
    if (this.nextBtn) this.nextBtn.disabled = true;
  }

  /**
   * 指定ページをCanvasにレンダリング
   */
  async renderPage(num) {
    if (!this.pdfDoc) return;
    this.pageRendering = true;

    try {
      const page = await this.pdfDoc.getPage(num);
      
      // コンテナ幅に応じた高画質スケール計算
      const containerWidth = this.container ? this.container.clientWidth - 32 : 900;
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      
      // 画面幅に合わせた基本倍率
      let desiredScale = (containerWidth / unscaledViewport.width);
      // 上限・下限の調整
      if (desiredScale > 2.0) desiredScale = 2.0;
      if (desiredScale < 0.6) desiredScale = 0.6;
      
      // Retinaディスプレイ（高DPI）向けピクセル比率
      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: desiredScale * pixelRatio });

      this.canvas.width = viewport.width;
      this.canvas.height = viewport.height;
      this.canvas.style.width = `${viewport.width / pixelRatio}px`;
      this.canvas.style.height = `${viewport.height / pixelRatio}px`;

      const renderContext = {
        canvasContext: this.ctx,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      this.pageRendering = false;

      if (this.pageNumPending !== null) {
        this.renderPage(this.pageNumPending);
        this.pageNumPending = null;
      }
    } catch (err) {
      console.error("ページ描画エラー:", err);
      this.pageRendering = false;
    }

    this.updateControls();

    // ページ切り替え時の自動音声再生 (有効時)
    if (this.autoPlayAudio) {
      this.triggerAutoPlay();
    }
  }

  queueRenderPage(num) {
    if (this.pageRendering) {
      this.pageNumPending = num;
    } else {
      this.renderPage(num);
    }
  }

  stopCurrentAudio() {
    if (this.autoPlayTimer) {
      clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    if (this.currentSequentialTimer) {
      clearTimeout(this.currentSequentialTimer);
      this.currentSequentialTimer = null;
    }
    this.currentSequentialIndex = -1;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
      window.speechSynthesis.cancel();
    }
    if (this.overlayLayer) {
      this.overlayLayer.querySelectorAll(".slide-overlay-audio-btn").forEach(b => b.classList.remove("is-speaking"));
    }
    this.setSpeakingState(false);
  }

  prevPage() {
    if (this.currentPage <= 1) return;
    this.stopCurrentAudio();
    this.currentPage--;
    this.queueRenderPage(this.currentPage);
  }

  nextPage() {
    if (this.currentPage >= this.totalPages) return;
    this.stopCurrentAudio();
    this.currentPage++;
    this.queueRenderPage(this.currentPage);
  }

  goToPage(num) {
    const target = parseInt(num, 10);
    if (!isNaN(target) && target >= 1 && target <= this.totalPages) {
      this.stopCurrentAudio();
      this.currentPage = target;
      this.queueRenderPage(this.currentPage);
    }
  }

  updateControls() {
    // 左右ボタンの有効/無効
    if (this.prevBtn) {
      this.prevBtn.disabled = (this.currentPage <= 1);
    }
    if (this.nextBtn) {
      this.nextBtn.disabled = (this.currentPage >= this.totalPages);
    }

    // ページ番号表示
    if (this.pageIndicator) {
      this.pageIndicator.innerHTML = `スライド <span class="ui-en">/ Slide</span> <strong>${this.currentPage}</strong> <span class="total">/ ${this.totalPages}</span>`;
    }

    // 進捗バー更新
    if (this.progressFill && this.totalPages > 0) {
      const percentage = (this.currentPage / this.totalPages) * 100;
      this.progressFill.style.width = `${percentage}%`;
    }

    // 音声発音UIの更新
    this.updateSpeechUI();
  }

  /**
   * 現在のスライドがフラッシュカードかどうかを判定
   * 音声発音機能はフラッシュカード専用です（本編スライドには提供されません）
   */
  isFlashcard() {
    if (!this.currentPdfUrl) return false;
    const url = this.currentPdfUrl.toLowerCase();
    return url.includes("_fc.pdf") || url.includes("_fc") || url.includes("flashcard");
  }

  /**
   * 現在のスライドに対応する発音データの取得 (フラッシュカードのみ)
   */
  getCurrentSpeechItem() {
    if (!this.isFlashcard()) return null;

    const dict = (typeof SPEECH_DATA !== "undefined" ? SPEECH_DATA : null) || 
                 (typeof window !== "undefined" && window.SPEECH_DATA ? window.SPEECH_DATA : null) || 
                 null;
    if (!dict || !this.currentPdfUrl) return null;

    // パスを正規化（./slides/... やクエリ/ハッシュを吸収）
    const cleanUrl = this.currentPdfUrl.replace(/^\.\//, "").split("?")[0].split("#")[0];
    
    // 1. 完全一致
    let pdfData = dict[cleanUrl] || dict[this.currentPdfUrl];
    
    // 2. キー末尾一致（ファイル名による検索）
    if (!pdfData) {
      const filename = cleanUrl.split("/").pop();
      for (const key of Object.keys(dict)) {
        if (key.endsWith(filename)) {
          pdfData = dict[key];
          break;
        }
      }
    }

    if (!pdfData) return null;

    // 3. ページ番号（数値・文字列両方で取得）
    const pageNum = this.currentPage;
    return pdfData[pageNum] || pdfData[String(pageNum)] || null;
  }

  /**
   * 現在のスライドの日本語を発音再生（フラッシュカード専用）
   * 高品質スタジオMP3音源を優先再生し、フォールバックとしてWeb Speech APIを使用
   */
  speakCurrentPage() {
    if (!this.isFlashcard()) return;

    const item = this.getCurrentSpeechItem();
    if (!item || item.isExplanation || item.noAudio) {
      return;
    }

    // 複数文（ドリル）スライドの場合は順番に連続再生
    if (item.items && Array.isArray(item.items) && item.items.length > 0) {
      this.speakSequential(item.items);
      return;
    }

    this.stopCurrentAudio();

    // 1. 高品位ニューラルMP3音源がある場合はHTML5 Audioで再生（最高品質）
    if (item.audio) {
      try {
        const audioUrl = item.audio + (item.audio.includes('?') ? '&' : '?') + 'v=5.3';
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        audio.playbackRate = this.speechRate || 1.0;

        this.setSpeakingState(true);

        audio.onended = () => {
          this.setSpeakingState(false);
          this.currentAudio = null;
        };

        audio.onerror = (e) => {
          console.warn("MP3 audio play error, falling back to Web Speech:", e);
          this.setSpeakingState(false);
          this.currentAudio = null;
          this.speakWithWebSpeech(item);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn("Audio autoplay / play rejected:", err);
            this.setSpeakingState(false);
          });
        }
        return;
      } catch (err) {
        console.warn("HTML5 audio creation error:", err);
      }
    }

    // 2. MP3がない場合のフォールバック（Web Speech API）
    this.speakWithWebSpeech(item);
  }

  /**
   * Web Speech API によるフォールバック発音
   */
  speakWithWebSpeech(item) {
    if (!("speechSynthesis" in window)) {
      alert("お使いのブラウザは音声再生に対応していません。");
      return;
    }

    const text = item.kana || item.romaji;
    if (!text) return;

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = this.speechRate || 1.0;

    if (window.speechSynthesis.getVoices) {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const jaVoices = voices.filter(v => v.lang === "ja-JP" || v.lang === "ja_JP" || v.lang.startsWith("ja"));
        const preferredVoice = jaVoices.find(v => v.localService) || jaVoices[0] || null;
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }
    }

    this.setSpeakingState(true);

    utterance.onend = () => {
      this.setSpeakingState(false);
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error or interrupted:", e);
      this.setSpeakingState(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * 複数文（ドリル）スライドの各文を順番に連続再生
   */
  speakSequential(items) {
    this.stopCurrentAudio();
    if (!items || items.length === 0) return;

    this.setSpeakingState(true);

    const playStep = (index) => {
      if (index >= items.length) {
        this.setSpeakingState(false);
        this.currentSequentialIndex = -1;
        if (this.overlayLayer) {
          this.overlayLayer.querySelectorAll(".slide-overlay-audio-btn").forEach(b => b.classList.remove("is-speaking"));
        }
        return;
      }

      this.currentSequentialIndex = index;
      const subItem = items[index];

      // スライド上の該当ボタンをアクティブ表示
      if (this.overlayLayer) {
        this.overlayLayer.querySelectorAll(".slide-overlay-audio-btn").forEach(b => {
          b.classList.toggle("is-speaking", b.dataset.index === String(index));
        });
      }

      // フローティングバーの表示テキスト更新
      if (this.floatingWordRomaji) this.floatingWordRomaji.textContent = subItem.romaji || "";
      if (this.floatingWordKana) this.floatingWordKana.textContent = subItem.kana ? `(${subItem.kana})` : "";
      if (this.floatingWordEn) this.floatingWordEn.textContent = subItem.label ? `[${subItem.label}]` : "";

      try {
        const audioUrl = subItem.audio + (subItem.audio.includes('?') ? '&' : '?') + 'v=5.3';
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        audio.playbackRate = this.speechRate || 1.0;

        audio.onended = () => {
          this.currentAudio = null;
          if (this.overlayLayer) {
            const curBtn = this.overlayLayer.querySelector(`.slide-overlay-audio-btn[data-index="${index}"]`);
            if (curBtn) curBtn.classList.remove("is-speaking");
          }
          // 次の文の再生まで600msの間隔を空ける
          this.currentSequentialTimer = setTimeout(() => {
            this.currentSequentialTimer = null;
            playStep(index + 1);
          }, 600);
        };

        audio.onerror = (err) => {
          console.warn("Sequential audio error:", err);
          this.currentAudio = null;
          if (this.overlayLayer) {
            const curBtn = this.overlayLayer.querySelector(`.slide-overlay-audio-btn[data-index="${index}"]`);
            if (curBtn) curBtn.classList.remove("is-speaking");
          }
          this.currentSequentialTimer = setTimeout(() => {
            this.currentSequentialTimer = null;
            playStep(index + 1);
          }, 400);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn("Sequential audio play rejected:", err);
            this.stopCurrentAudio();
          });
        }
      } catch (err) {
        console.warn("Sequential audio creation error:", err);
        this.stopCurrentAudio();
      }
    };

    playStep(0);
  }

  /**
   * 指定インデックスの個別文のみを発音再生
   */
  speakSingleItem(index) {
    this.stopCurrentAudio();

    const item = this.getCurrentSpeechItem();
    if (!item || !item.items || !item.items[index]) return;

    const subItem = item.items[index];
    this.setSpeakingState(true);

    if (this.overlayLayer) {
      const btn = this.overlayLayer.querySelector(`.slide-overlay-audio-btn[data-index="${index}"]`);
      if (btn) btn.classList.add("is-speaking");
    }

    if (this.floatingWordRomaji) this.floatingWordRomaji.textContent = subItem.romaji || "";
    if (this.floatingWordKana) this.floatingWordKana.textContent = subItem.kana ? `(${subItem.kana})` : "";
    if (this.floatingWordEn) this.floatingWordEn.textContent = subItem.label ? `[${subItem.label}]` : "";

    try {
      const audioUrl = subItem.audio + (subItem.audio.includes('?') ? '&' : '?') + 'v=5.3';
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      audio.playbackRate = this.speechRate || 1.0;

      audio.onended = () => {
        this.setSpeakingState(false);
        this.currentAudio = null;
        if (this.overlayLayer) {
          const btn = this.overlayLayer.querySelector(`.slide-overlay-audio-btn[data-index="${index}"]`);
          if (btn) btn.classList.remove("is-speaking");
        }
      };

      audio.onerror = (e) => {
        console.warn("Single item audio error:", e);
        this.setSpeakingState(false);
        this.currentAudio = null;
        if (this.overlayLayer) {
          const btn = this.overlayLayer.querySelector(`.slide-overlay-audio-btn[data-index="${index}"]`);
          if (btn) btn.classList.remove("is-speaking");
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Single audio play rejected:", err);
          this.setSpeakingState(false);
          if (this.overlayLayer) {
            const btn = this.overlayLayer.querySelector(`.slide-overlay-audio-btn[data-index="${index}"]`);
            if (btn) btn.classList.remove("is-speaking");
          }
        });
      }
    } catch (err) {
      console.warn("Single audio creation error:", err);
      this.setSpeakingState(false);
    }
  }

  /**
   * スライド上に各文の音声再生ボタンをオーバーレイ描画
   */
  renderOverlayAudioButtons() {
    if (!this.overlayLayer) return;
    this.overlayLayer.innerHTML = "";

    if (!this.isFlashcard()) return;

    const item = this.getCurrentSpeechItem();
    if (!item || !item.items || !Array.isArray(item.items) || item.items.length === 0) {
      return;
    }

    item.items.forEach((subItem, index) => {
      const btn = document.createElement("button");
      btn.className = `slide-overlay-audio-btn type-${subItem.type || 'pos'}`;
      btn.dataset.index = String(index);
      btn.style.top = `${subItem.top || 50}%`;
      btn.style.right = `${subItem.right || 4.5}%`;
      btn.title = `「${subItem.romaji}」を発音 (${subItem.kana || ''})`;
      btn.setAttribute("aria-label", `発音: ${subItem.romaji}`);

      btn.innerHTML = `
        <span class="btn-icon">🔊</span>
        <span class="btn-type-label">${subItem.label || '▶'}</span>
      `;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.speakSingleItem(index);
      });

      this.overlayLayer.appendChild(btn);
    });
  }

  setSpeakingState(speaking) {
    this.isSpeaking = speaking;
    if (this.speakBtn) {
      this.speakBtn.classList.toggle("is-speaking", speaking);
    }
    if (this.btnFloatingSpeak) {
      this.btnFloatingSpeak.classList.toggle("is-speaking", speaking);
    }
  }

  toggleSpeechSpeed() {
    if (this.speechRate <= 0.85) {
      this.speechRate = 1.0;
      if (this.speedLabel) this.speedLabel.textContent = "1.0x (標準)";
      if (this.speedIcon) this.speedIcon.textContent = "⚡";
    } else {
      this.speechRate = 0.85;
      if (this.speedLabel) this.speedLabel.textContent = "0.8x (ゆっくり)";
      if (this.speedIcon) this.speedIcon.textContent = "🐢";
    }
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.playbackRate = this.speechRate;
    }
  }

  /**
   * ページ切り替え時の自動発音トリガー (フラッシュカード専用)
   */
  triggerAutoPlay() {
    if (!this.isFlashcard() || !this.autoPlayAudio) return;

    const item = this.getCurrentSpeechItem();
    if (!item || item.isExplanation || item.noAudio) return;

    if (this.autoPlayTimer) {
      clearTimeout(this.autoPlayTimer);
    }
    // スライドが描画されてから自然な間隔（120ms）を空けて発音
    this.autoPlayTimer = setTimeout(() => {
      this.autoPlayTimer = null;
      this.speakCurrentPage();
    }, 120);
  }

  /**
   * 自動音声再生のON/OFF切り替え (フラッシュカード専用)
   */
  toggleAutoPlay() {
    if (!this.isFlashcard()) return;

    this.autoPlayAudio = !this.autoPlayAudio;
    try {
      localStorage.setItem("slide_audio_autoplay", String(this.autoPlayAudio));
    } catch (e) {}
    this.updateAutoPlayUI();

    // ONにした際、まだ再生中でなければ現在のスライドをすぐに発音（説明カード除く）
    if (this.autoPlayAudio && !this.isSpeaking) {
      const item = this.getCurrentSpeechItem();
      if (item && !item.isExplanation && !item.noAudio) {
        this.speakCurrentPage();
      }
    }
  }

  /**
   * 自動音声再生ボタンのUI更新
   */
  updateAutoPlayUI() {
    if (!this.autoplayBtn) return;
    this.autoplayBtn.classList.toggle("is-active", this.autoPlayAudio);
    if (this.autoPlayAudio) {
      if (this.autoplayIcon) this.autoplayIcon.textContent = "🔊";
      if (this.autoplayLabel) this.autoplayLabel.innerHTML = `自動再生: ON <span class="btn-en">/ Auto</span>`;
      this.autoplayBtn.title = "スライド切り替え時の自動発音: 有効 (Aキーで無効化) / Auto-play: ON (A key)";
    } else {
      if (this.autoplayIcon) this.autoplayIcon.textContent = "🔈";
      if (this.autoplayLabel) this.autoplayLabel.innerHTML = `自動再生: OFF <span class="btn-en">/ Auto</span>`;
      this.autoplayBtn.title = "スライド切り替え時の自動発音: 無効 (Aキーで有効化) / Auto-play: OFF (A key)";
    }
  }

  updateSpeechUI() {
    // フラッシュカード以外（本編スライド等）：音声UIを完全に非表示にし、音声再生を停止
    if (!this.isFlashcard()) {
      if (this.audioControls) {
        this.audioControls.classList.add("hidden");
        this.audioControls.style.display = "none";
      }
      if (this.floatingAudioPill) {
        this.floatingAudioPill.classList.add("hidden");
        this.floatingAudioPill.style.display = "none";
      }
      this.renderOverlayAudioButtons();
      this.stopCurrentAudio();
      return;
    }

    // フラッシュカードの場合：音声コントロールバーを表示
    if (this.audioControls) {
      this.audioControls.classList.remove("hidden");
      this.audioControls.style.display = "flex";
    }

    const item = this.getCurrentSpeechItem();
    const hasAudio = item && !item.isExplanation && !item.noAudio && (item.audio || item.kana || item.romaji);

    if (hasAudio) {
      const isMultiItem = item.items && Array.isArray(item.items) && item.items.length > 0;

      // 発音データあり（通常フラッシュカード）：発音ボタンとフローティングバッジを表示・有効化
      if (this.speakBtn) {
        this.speakBtn.classList.remove("hidden", "disabled");
        this.speakBtn.style.display = "";
        this.speakBtn.disabled = false;
        if (isMultiItem) {
          this.speakBtn.title = `このスライドの全文章を順番に発音 (Sキー) / Listen all sentences: ${item.kana || item.romaji}`;
          const speakText = this.speakBtn.querySelector(".speak-text");
          if (speakText) speakText.innerHTML = `全文章を発音 <span class="btn-en">/ Listen All</span>`;
        } else {
          this.speakBtn.title = `このスライドの日本語を発音 (Sキー) / Listen: ${item.kana || item.romaji}`;
          const speakText = this.speakBtn.querySelector(".speak-text");
          if (speakText) speakText.innerHTML = `発音を聞く <span class="btn-en">/ Listen</span>`;
        }
      }
      if (this.speedBtn) {
        this.speedBtn.classList.remove("hidden", "disabled");
        this.speedBtn.style.display = "";
        this.speedBtn.disabled = false;
      }
      if (this.autoplayBtn) {
        this.autoplayBtn.classList.remove("hidden", "disabled");
        this.autoplayBtn.style.display = "";
        this.autoplayBtn.disabled = false;
      }
      if (this.floatingAudioPill) {
        this.floatingAudioPill.classList.remove("hidden");
        this.floatingAudioPill.style.display = "";
      }
      if (this.floatingWordRomaji) {
        this.floatingWordRomaji.textContent = item.romaji || "";
      }
      if (this.floatingWordKana) {
        this.floatingWordKana.textContent = item.kana ? `(${item.kana})` : "";
      }
      if (this.floatingWordEn) {
        this.floatingWordEn.textContent = item.en || "";
      }

      // スライド上の個別音声ボタンを描画
      this.renderOverlayAudioButtons();
    } else {
      // 説明カードまたは発音データなし：音声再生を停止し、発音ボタンとフローティングバッジを非表示
      this.stopCurrentAudio();
      this.renderOverlayAudioButtons();

      if (this.speakBtn) {
        this.speakBtn.classList.add("hidden");
        this.speakBtn.style.display = "none";
        this.speakBtn.disabled = true;
      }
      if (this.speedBtn) {
        this.speedBtn.classList.add("hidden");
        this.speedBtn.style.display = "none";
        this.speedBtn.disabled = true;
      }
      if (this.floatingAudioPill) {
        this.floatingAudioPill.classList.add("hidden");
        this.floatingAudioPill.style.display = "none";
      }
    }
  }

  toggleFullscreen() {
    if (!this.container) return;
    if (!document.fullscreenElement) {
      if (this.container.requestFullscreen) {
        this.container.requestFullscreen();
      } else if (this.container.webkitRequestFullscreen) {
        this.container.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  /**
   * 複数教材タブのセットアップ
   */
  setupTabs(materials, onSelect) {
    if (!this.tabsContainer) return;
    this.tabsContainer.innerHTML = "";

    if (!materials || materials.length <= 1) {
      this.tabsContainer.style.display = "none";
      return;
    }

    this.tabsContainer.style.display = "flex";
    materials.forEach((mat, index) => {
      const btn = document.createElement("button");
      btn.className = `material-tab-btn ${index === 0 ? "active" : ""}`;
      btn.innerHTML = `${mat.title}`;
      btn.addEventListener("click", () => {
        this.tabsContainer.querySelectorAll(".material-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        if (onSelect) onSelect(mat);
      });
      this.tabsContainer.appendChild(btn);
    });
  }
}

// グローバル公開
window.SlideViewer = SlideViewer;
