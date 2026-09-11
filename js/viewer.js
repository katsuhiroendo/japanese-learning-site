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

    // キーボードショートカット (左右矢印キー)
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
    this.currentPdfUrl = url;
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
  }

  queueRenderPage(num) {
    if (this.pageRendering) {
      this.pageNumPending = num;
    } else {
      this.renderPage(num);
    }
  }

  prevPage() {
    if (this.currentPage <= 1) return;
    this.currentPage--;
    this.queueRenderPage(this.currentPage);
  }

  nextPage() {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage++;
    this.queueRenderPage(this.currentPage);
  }

  goToPage(num) {
    const target = parseInt(num, 10);
    if (!isNaN(target) && target >= 1 && target <= this.totalPages) {
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
