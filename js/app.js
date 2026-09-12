/**
 * 日本語教育ポータル メインアプリケーション
 */

(function () {
  "use strict";

  // --- 状態管理 ---
  const state = {
    lessons: LESSONS_DATA || [],
    currentView: "home",
    selectedLessonId: null,
    searchQuery: "",
    categoryFilter: "all",
    rangeFilter: "all",
    availFilter: "available",
    currentPage: 1,
    itemsPerPage: 12,
    completedLessonIds: new Set(
      JSON.parse(localStorage.getItem("nihongo_completed_lessons") || "[]")
    )
  };

  // スライドビューワーインスタンス
  let slideViewer = null;

  // 日英表記対応マップ
  const LEVEL_MAP = {
    "入門": "入門 <span class=\"tag-en\">/ Beginner</span>",
    "初級": "初級 <span class=\"tag-en\">/ Elementary</span>",
    "初級1": "初級1 <span class=\"tag-en\">/ Elementary 1</span>",
    "初級2": "初級2 <span class=\"tag-en\">/ Elementary 2</span>",
    "中級": "中級 <span class=\"tag-en\">/ Intermediate</span>"
  };

  const CATEGORY_MAP = {
    "文字・発音": "文字・発音 <span class=\"tag-en\">/ Writing & Sounds</span>",
    "基本会話": "基本会話 <span class=\"tag-en\">/ Conversation</span>",
    "文法": "文法 <span class=\"tag-en\">/ Grammar</span>",
    "実用会話": "実用会話 <span class=\"tag-en\">/ Practical</span>"
  };

  // --- DOM要素 ---
  const el = {
    homeView: document.getElementById("home-view"),
    detailView: document.getElementById("lesson-detail-view"),
    lessonsGrid: document.getElementById("lessons-grid"),
    pagination: document.getElementById("pagination"),
    visibleCount: document.getElementById("visible-count"),
    completedCounter: document.getElementById("completed-counter"),
    searchInput: document.getElementById("search-input"),
    clearSearchBtn: document.getElementById("clear-search"),
    logoHomeBtn: document.getElementById("logo-home-btn"),
    btnBackHome: document.getElementById("btn-back-home"),
    btnPrevLesson: document.getElementById("btn-prev-lesson"),
    btnNextLesson: document.getElementById("btn-next-lesson"),
    btnPrevLessonBottom: document.getElementById("btn-prev-lesson-bottom"),
    btnNextLessonBottom: document.getElementById("btn-next-lesson-bottom"),
    detailNumberBadge: document.getElementById("detail-number-badge"),
    detailLevelTag: document.getElementById("detail-level-tag"),
    detailCatTag: document.getElementById("detail-cat-tag"),
    detailTitle: document.getElementById("detail-title"),
    detailSubtitle: document.getElementById("detail-subtitle"),
    detailDesc: document.getElementById("detail-desc"),
    detailToggleDone: document.getElementById("detail-toggle-done"),
    videoSection: document.getElementById("video-section"),
    videoTitle: document.getElementById("video-title"),
    videoBadge: document.getElementById("video-badge"),
    videoDesc: document.getElementById("video-desc"),
    youtubeIframe: document.getElementById("youtube-iframe"),
    videoPlaceholder: document.getElementById("video-empty-placeholder")
  };

  /**
   * 初期化処理
   */
  function init() {
    // スライドビューワー初期化
    if (window.SlideViewer) {
      slideViewer = new window.SlideViewer();
    }

    updateCompletedCounter();
    bindEvents();
    renderLessons();

    // URLハッシュのルーティング処理 (#lesson-001 など)
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
  }

  /**
   * イベントバインド
   */
  function bindEvents() {
    // ロゴ・戻るボタン
    if (el.logoHomeBtn) {
      el.logoHomeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        navigateToHome();
      });
    }
    if (el.btnBackHome) {
      el.btnBackHome.addEventListener("click", () => {
        navigateToHome();
      });
    }

    // 前後レッスンナビゲーション
    if (el.btnPrevLesson) {
      el.btnPrevLesson.addEventListener("click", () => navigateLessonDelta(-1));
    }
    if (el.btnNextLesson) {
      el.btnNextLesson.addEventListener("click", () => navigateLessonDelta(1));
    }
    if (el.btnPrevLessonBottom) {
      el.btnPrevLessonBottom.addEventListener("click", () => navigateLessonDelta(-1));
    }
    if (el.btnNextLessonBottom) {
      el.btnNextLessonBottom.addEventListener("click", () => navigateLessonDelta(1));
    }

    // 検索入力
    if (el.searchInput) {
      let debounceTimer = null;
      el.searchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        if (el.clearSearchBtn) {
          if (state.searchQuery) {
            el.clearSearchBtn.classList.add("show");
          } else {
            el.clearSearchBtn.classList.remove("show");
          }
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.currentPage = 1;
          renderLessons();
        }, 150);
      });
    }

    // 検索クリア
    if (el.clearSearchBtn) {
      el.clearSearchBtn.addEventListener("click", () => {
        el.searchInput.value = "";
        state.searchQuery = "";
        el.clearSearchBtn.classList.remove("show");
        state.currentPage = 1;
        renderLessons();
      });
    }

    // 番号範囲フィルター
    document.querySelectorAll(".range-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".range-pill").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.rangeFilter = btn.dataset.range;
        state.currentPage = 1;
        renderLessons();
      });
    });

    // カテゴリフィルター
    document.querySelectorAll(".cat-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".cat-pill").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.categoryFilter = btn.dataset.cat;
        state.currentPage = 1;
        renderLessons();
      });
    });

    // 公開状態フィルター
    document.querySelectorAll(".avail-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled || btn.classList.contains("disabled")) return;
        document.querySelectorAll(".avail-pill").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.availFilter = btn.dataset.avail;
        state.currentPage = 1;
        renderLessons();
      });
    });

    // 詳細画面での完了トグル
    if (el.detailToggleDone) {
      el.detailToggleDone.addEventListener("click", () => {
        if (!state.selectedLessonId) return;
        toggleComplete(state.selectedLessonId);
        updateDetailDoneBtn();
        renderLessons();
      });
    }
  }

  /**
   * ルーティング・URLハッシュ処理
   */
  function handleHashChange() {
    const hash = window.location.hash;
    const match = hash.match(/^#lesson-([a-zA-Z0-9]+)$/);
    if (match) {
      const lessonId = match[1];
      openLesson(lessonId, false);
    } else {
      showHomeView();
    }
  }

  function navigateToHome() {
    window.location.hash = "";
    showHomeView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showHomeView() {
    state.currentView = "home";
    state.selectedLessonId = null;
    if (el.homeView) el.homeView.classList.remove("hidden");
    if (el.detailView) el.detailView.classList.add("hidden");

    // YouTubeの再生を停止
    if (el.youtubeIframe) {
      el.youtubeIframe.src = "";
    }
  }

  /**
   * レッスンのフィルタリング
   */
  function getFilteredLessons() {
    return state.lessons.filter((lesson) => {
      // 未作成のレッスンは当面表示しない
      if (!lesson.available) {
        return false;
      }

      // 1. 検索クエリ
      if (state.searchQuery) {
        const q = state.searchQuery;
        const inNum = lesson.number.toLowerCase().includes(q);
        const inTitle = lesson.title.toLowerCase().includes(q);
        const inSub = (lesson.subtitle || "").toLowerCase().includes(q);
        const inDesc = (lesson.description || "").toLowerCase().includes(q);
        const inTags = (lesson.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!inNum && !inTitle && !inSub && !inDesc && !inTags) {
          return false;
        }
      }

      // 2. 番号範囲フィルター
      if (state.rangeFilter !== "all") {
        const [minStr, maxStr] = state.rangeFilter.split("-");
        const min = parseInt(minStr, 10);
        const max = parseInt(maxStr, 10);
        const lessonNum = parseInt(lesson.id, 10);
        if (lessonNum < min || lessonNum > max) {
          return false;
        }
      }

      // 3. カテゴリフィルター
      if (state.categoryFilter !== "all") {
        if (!lesson.category.includes(state.categoryFilter)) {
          return false;
        }
      }

      // 4. 公開状態フィルター
      if (state.availFilter === "available") {
        if (!lesson.available) return false;
      }

      return true;
    });
  }

  /**
   * レッスン一覧の描画
   */
  function renderLessons() {
    const filtered = getFilteredLessons();

    if (el.visibleCount) {
      el.visibleCount.textContent = filtered.length;
    }

    if (!el.lessonsGrid) return;
    el.lessonsGrid.innerHTML = "";

    if (filtered.length === 0) {
      el.lessonsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: #ffffff; border-radius: 16px; border: 1px dashed #cbd5e1;">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
          <h3 style="font-size: 1.2rem; color: #1e293b; margin-bottom: 8px;">
            条件に一致するレッスンが見つかりませんでした<br>
            <span style="font-size: 0.95rem; font-weight: 500; color: #64748b;">No lessons found matching your search</span>
          </h3>
          <p style="color: #64748b; font-size: 0.92rem; line-height: 1.6;">
            検索ワードを変更するか、フィルター条件を「すべて」に戻してお試しください。<br>
            <span style="font-size: 0.85rem; color: #94a3b8;">Try adjusting keywords or resetting filters to "All".</span>
          </p>
        </div>
      `;
      renderPagination(0);
      return;
    }

    // ページネーション計算
    const totalPages = Math.ceil(filtered.length / state.itemsPerPage);
    state.currentPage = Math.min(Math.max(1, state.currentPage), totalPages);

    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const pageItems = filtered.slice(startIndex, startIndex + state.itemsPerPage);

    // カード生成
    pageItems.forEach((lesson) => {
      const isDone = state.completedLessonIds.has(lesson.id);
      const card = document.createElement("article");
      card.className = `lesson-card ${isDone ? "completed" : ""}`;
      card.setAttribute("role", "listitem");
      card.tabIndex = 0;

      // 教材情報チップの作成
      let materialsHtml = "";
      if (lesson.materials && lesson.materials.length > 0) {
        lesson.materials.forEach((m) => {
          if (m.pages > 0) {
            const isFc = (m.badge === "フラッシュカード" || m.badge === "FC");
            const chipClass = isFc ? "material-chip fc" : "material-chip slide";
            const chipIcon = isFc ? "🎴" : "📖";
            const chipJa = isFc ? "フラッシュカード" : "本編";
            const chipEn = isFc ? "FC" : "Slide";
            materialsHtml += `<span class="${chipClass}">${chipIcon} ${chipJa} <span class="ui-en">/ ${chipEn}</span> ${m.pages}p</span>`;
          }
        });
      }

      if (lesson.video && (lesson.video.youtubeId || lesson.video.youtubeUrl)) {
        materialsHtml += `<span class="material-chip video">🎥 動画あり <span class="ui-en">/ Video</span></span>`;
      }

      if (!materialsHtml) {
        materialsHtml = `<span class="material-chip">準備中 <span class="ui-en">/ Coming Soon</span></span>`;
      }

      const levelHtml = LEVEL_MAP[lesson.level] || `${lesson.level || "初級"}`;
      const catHtml = CATEGORY_MAP[lesson.category] || `${lesson.category}`;

      card.innerHTML = `
        <div class="card-top-row">
          <span class="lesson-number-badge ${!lesson.available ? "badge-coming-soon" : ""}">${lesson.number}</span>
          <div class="card-meta-tags">
            <span class="level-tag">${levelHtml}</span>
            <span class="category-tag">${catHtml}</span>
          </div>
        </div>
        <h2 class="card-title">${lesson.title}</h2>
        <div class="card-subtitle">${lesson.subtitle || ""}</div>
        <p class="card-description">
          <span class="desc-ja">${lesson.description}</span>
          ${lesson.descriptionEn ? `<span class="desc-en">${lesson.descriptionEn}</span>` : ""}
        </p>
        <div class="card-materials-bar">
          ${materialsHtml}
        </div>
        <div class="card-footer-row">
          <button class="btn-open-lesson" aria-label="${lesson.title}のレッスンを開く">
            <span>レッスンを開く <span class="btn-en">/ Open</span></span>
            <span>→</span>
          </button>
          <button class="btn-toggle-done ${isDone ? "checked" : ""}" title="完了状態を切り替え / Toggle completion" aria-label="学習完了チェック">
            <span>${isDone ? "✔ 完了済 / Done" : "未完了 / To Do"}</span>
          </button>
        </div>
      `;

      // クリックイベント
      card.addEventListener("click", (e) => {
        // 完了ボタンがクリックされた場合はカード遷移しない
        const doneBtn = e.target.closest(".btn-toggle-done");
        if (doneBtn) {
          e.stopPropagation();
          toggleComplete(lesson.id);
          renderLessons();
          return;
        }
        openLesson(lesson.id);
      });

      // キーボードEnterでオープン
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          openLesson(lesson.id);
        }
      });

      el.lessonsGrid.appendChild(card);
    });

    renderPagination(totalPages);
  }

  /**
   * ページネーションの描画
   */
  function renderPagination(totalPages) {
    if (!el.pagination) return;
    el.pagination.innerHTML = "";
    if (totalPages <= 1) return;

    // 前へボタン
    const prevBtn = document.createElement("button");
    prevBtn.className = "page-btn";
    prevBtn.innerHTML = "◀";
    prevBtn.disabled = (state.currentPage <= 1);
    prevBtn.addEventListener("click", () => {
      if (state.currentPage > 1) {
        state.currentPage--;
        renderLessons();
        window.scrollTo({ top: 300, behavior: "smooth" });
      }
    });
    el.pagination.appendChild(prevBtn);

    // ページ番号ボタン
    for (let p = 1; p <= totalPages; p++) {
      if (
        p === 1 ||
        p === totalPages ||
        (p >= state.currentPage - 2 && p <= state.currentPage + 2)
      ) {
        const pageBtn = document.createElement("button");
        pageBtn.className = `page-btn ${p === state.currentPage ? "active" : ""}`;
        pageBtn.textContent = p;
        pageBtn.addEventListener("click", () => {
          state.currentPage = p;
          renderLessons();
          window.scrollTo({ top: 300, behavior: "smooth" });
        });
        el.pagination.appendChild(pageBtn);
      } else if (
        p === state.currentPage - 3 ||
        p === state.currentPage + 3
      ) {
        const dots = document.createElement("span");
        dots.style.padding = "0 6px";
        dots.style.color = "#94a3b8";
        dots.textContent = "…";
        el.pagination.appendChild(dots);
      }
    }

    // 次へボタン
    const nextBtn = document.createElement("button");
    nextBtn.className = "page-btn";
    nextBtn.innerHTML = "▶";
    nextBtn.disabled = (state.currentPage >= totalPages);
    nextBtn.addEventListener("click", () => {
      if (state.currentPage < totalPages) {
        state.currentPage++;
        renderLessons();
        window.scrollTo({ top: 300, behavior: "smooth" });
      }
    });
    el.pagination.appendChild(nextBtn);
  }

  /**
   * レッスン詳細画面を開く
   */
  function openLesson(lessonId, updateHash = true) {
    const lesson = state.lessons.find((l) => l.id === lessonId);
    if (!lesson || !lesson.available) {
      console.warn("Lesson not found or unavailable:", lessonId);
      navigateToHome();
      return;
    }

    state.currentView = "detail";
    state.selectedLessonId = lessonId;

    if (updateHash) {
      window.location.hash = `#lesson-${lessonId}`;
    }

    // 表示切り替え
    if (el.homeView) el.homeView.classList.add("hidden");
    if (el.detailView) el.detailView.classList.remove("hidden");

    // レッスン情報反映
    if (el.detailNumberBadge) el.detailNumberBadge.textContent = lesson.number;
    if (el.detailLevelTag) el.detailLevelTag.innerHTML = LEVEL_MAP[lesson.level] || `${lesson.level || "初級"}`;
    if (el.detailCatTag) el.detailCatTag.innerHTML = CATEGORY_MAP[lesson.category] || `${lesson.category}`;
    if (el.detailTitle) el.detailTitle.textContent = lesson.title;
    if (el.detailSubtitle) el.detailSubtitle.textContent = lesson.subtitle || "";
    if (el.detailDesc) {
      if (lesson.descriptionEn) {
        el.detailDesc.innerHTML = `
          <span class="desc-ja">${lesson.description}</span>
          <span class="desc-en">${lesson.descriptionEn}</span>
        `;
      } else {
        el.detailDesc.textContent = lesson.description;
      }
    }

    updateDetailDoneBtn();
    updateLessonPagerNav();

    // スライドビューワーのセットアップ
    if (slideViewer) {
      if (lesson.materials && lesson.materials.length > 0) {
        slideViewer.setupTabs(lesson.materials, (selectedMat) => {
          slideViewer.loadPdf(selectedMat.file, 1);
        });
        // 最初の資料を読み込み
        const initialMaterial = lesson.materials[0];
        slideViewer.loadPdf(initialMaterial.file, 1);
      } else {
        slideViewer.setupTabs([], null);
        slideViewer.loadPdf("", 1);
      }
    }

    // 動画資料のセットアップ
    setupVideoPlayer(lesson.video);

    // 画面上部へスクロール
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * YouTubeプレーヤー / 動画プレースホルダーのセットアップ
   */
  function setupVideoPlayer(videoData) {
    if (!el.videoSection || !el.youtubeIframe) return;

    el.videoSection.style.display = "block";

    let videoId = "";
    if (videoData) {
      videoId = (videoData.youtubeId || "").trim();
      if (videoId.includes("/") || videoId.includes("?")) {
        const match = videoId.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?]+)/);
        if (match) videoId = match[1];
      }
      if (!videoId && videoData.youtubeUrl) {
        const urlMatch = videoData.youtubeUrl.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?]+)/);
        if (urlMatch) videoId = urlMatch[1];
      }
    }

    if (videoId) {
      // 有効な動画リンクが存在する場合
      el.youtubeIframe.style.display = "block";
      el.youtubeIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
      if (el.videoPlaceholder) {
        el.videoPlaceholder.style.display = "none";
      }
      if (el.videoBadge) {
        el.videoBadge.textContent = "YouTube";
        el.videoBadge.className = "badge-yt";
      }
      if (el.videoTitle) {
        el.videoTitle.textContent = (videoData && videoData.title) ? videoData.title : "【解説動画】";
      }
      if (el.videoDesc) {
        el.videoDesc.classList.remove("in-production");
        if (videoData && videoData.descriptionEn) {
          el.videoDesc.innerHTML = `
            <span class="video-desc-ja">${videoData.description}</span>
            <span class="video-desc-en">${videoData.descriptionEn}</span>
          `;
        } else {
          el.videoDesc.textContent = (videoData && videoData.description) || "動画を再生して学習ポイントを確認しましょう。";
        }
      }
    } else {
      // 動画リンクが無い場合：「この動画は作成中です」プレースホルダーを表示
      el.youtubeIframe.src = "";
      el.youtubeIframe.style.display = "none";
      if (el.videoPlaceholder) {
        el.videoPlaceholder.style.display = "flex";
      }
      if (el.videoBadge) {
        el.videoBadge.textContent = "作成中 / Coming Soon";
        el.videoBadge.className = "badge-yt in-production";
      }
      if (el.videoTitle) {
        el.videoTitle.textContent = (videoData && videoData.title) ? videoData.title : "【解説動画】レッスン解説";
      }
      if (el.videoDesc) {
        el.videoDesc.classList.add("in-production");
        el.videoDesc.innerHTML = `
          <span class="video-desc-ja">💡 このレッスンの解説動画は現在制作中です。完成までスライド教材と音声フラッシュカードをご活用ください。</span>
          <span class="video-desc-en">The instructional video for this lesson is currently in production. Please enjoy the slide materials and audio flashcards while you wait.</span>
        `;
      }
    }
  }

  /**
   * 利用可能（作成済み）なレッスン一覧を取得
   */
  function getAvailableLessons() {
    return state.lessons.filter((l) => l.available);
  }

  /**
   * 前後のレッスンへ移動（作成済みレッスン間のみ）
   */
  function navigateLessonDelta(delta) {
    if (!state.selectedLessonId) return;
    const availLessons = getAvailableLessons();
    const currentIndex = availLessons.findIndex((l) => l.id === state.selectedLessonId);
    if (currentIndex === -1) return;

    const nextIndex = currentIndex + delta;
    if (nextIndex >= 0 && nextIndex < availLessons.length) {
      const nextLesson = availLessons[nextIndex];
      openLesson(nextLesson.id);
    }
  }

  /**
   * 前後レッスンナビボタンの更新（作成済みレッスン間のみ）
   */
  function updateLessonPagerNav() {
    if (!state.selectedLessonId) return;
    const availLessons = getAvailableLessons();
    const currentIndex = availLessons.findIndex((l) => l.id === state.selectedLessonId);
    if (currentIndex === -1) return;

    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < availLessons.length - 1;

    // 前へボタン（上部・下部）
    const prevButtons = [el.btnPrevLesson, el.btnPrevLessonBottom].filter(Boolean);
    prevButtons.forEach((btn) => {
      btn.disabled = !hasPrev;
      if (hasPrev) {
        const prev = availLessons[currentIndex - 1];
        btn.innerHTML = `<span>◀</span> ${prev.number} <span class="ui-en">Prev</span>`;
        btn.title = prev.title;
      } else {
        btn.innerHTML = `<span>◀</span> 前へ <span class="ui-en">/ Prev</span>`;
        btn.removeAttribute("title");
      }
    });

    // 次へボタン（上部・下部）
    const nextButtons = [el.btnNextLesson, el.btnNextLessonBottom].filter(Boolean);
    nextButtons.forEach((btn) => {
      btn.disabled = !hasNext;
      if (hasNext) {
        const next = availLessons[currentIndex + 1];
        btn.innerHTML = `<span class="ui-en">Next</span> ${next.number} <span>▶</span>`;
        btn.title = next.title;
      } else {
        btn.innerHTML = `次へ <span class="ui-en">/ Next</span> <span>▶</span>`;
        btn.removeAttribute("title");
      }
    });
  }

  /**
   * 学習完了状態の切り替え
   */
  function toggleComplete(lessonId) {
    if (state.completedLessonIds.has(lessonId)) {
      state.completedLessonIds.delete(lessonId);
    } else {
      state.completedLessonIds.add(lessonId);
    }

    // LocalStorageへ保存
    localStorage.setItem(
      "nihongo_completed_lessons",
      JSON.stringify(Array.from(state.completedLessonIds))
    );

    updateCompletedCounter();
  }

  function updateCompletedCounter() {
    if (el.completedCounter) {
      el.completedCounter.textContent = state.completedLessonIds.size;
    }
  }

  function updateDetailDoneBtn() {
    if (!el.detailToggleDone || !state.selectedLessonId) return;
    const isDone = state.completedLessonIds.has(state.selectedLessonId);
    const textSpan = el.detailToggleDone.querySelector(".text");
    if (isDone) {
      el.detailToggleDone.classList.add("checked");
      if (textSpan) textSpan.innerHTML = `学習完了済み <span class="btn-en">/ Completed</span>`;
    } else {
      el.detailToggleDone.classList.remove("checked");
      if (textSpan) textSpan.innerHTML = `完了にする <span class="btn-en">/ Mark as Done</span>`;
    }
  }

  // DOMContentLoadedで起動
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
