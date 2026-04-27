(function () {
  const data = window.MONETIZATION_REPORT_DATA || { summary: {}, channels: [] };
  const channels = data.channels || [];
  const labels = (data.summary && data.summary.labels) || {};
  const semiannualDashboard = data.semiannualDashboard || null;
  const issueBaseUrl = "https://github.com/sum-lab/youtube-monetization-watch/issues/new";

  const resultWeight = {
    likely_not_monetized: 0,
    inconclusive: 1,
    failed: 2,
    likely_monetized: 3,
  };

  const elements = {
    generatedAt: document.getElementById("generatedAt"),
    summaryGrid: document.getElementById("summaryGrid"),
    searchInput: document.getElementById("searchInput"),
    resultFilter: document.getElementById("resultFilter"),
    confidenceFilter: document.getElementById("confidenceFilter"),
    sortSelect: document.getElementById("sortSelect"),
    visibleCount: document.getElementById("visibleCount"),
    channelRows: document.getElementById("channelRows"),
    globalFeedbackLink: document.getElementById("globalFeedbackLink"),
    feedbackPanelLink: document.getElementById("feedbackPanelLink"),
    sourceMetaTotal: document.getElementById("sourceMetaTotal"),
    sourceMetaDate: document.getElementById("sourceMetaDate"),
    periodDashboard: document.getElementById("periodDashboard"),
    dashboardThresholdSelect: document.getElementById("dashboardThresholdSelect"),
    dashboardVerdict: document.getElementById("dashboardVerdict"),
    dashboardKpis: document.getElementById("dashboardKpis"),
    prevalenceChart: document.getElementById("prevalenceChart"),
    incidenceChart: document.getElementById("incidenceChart"),
    dashboardRows: document.getElementById("dashboardRows"),
    dashboardNote: document.getElementById("dashboardNote"),
  };

  function issueUrl(channel) {
    const params = new URLSearchParams();
    params.set("labels", "情報提供,要確認");
    if (channel) {
      params.set("title", `情報提供: ${channel.label}`);
      params.set(
        "body",
        [
          "## 対象チャンネル",
          `- チャンネル名: ${channel.label}`,
          `- チャンネルID: ${channel.channelId}`,
          `- URL: ${channel.url}`,
          `- 現在の判定: ${channel.resultLabel}`,
          `- 信頼度: ${channel.confidenceLabel}`,
          "",
          "## 情報の種類",
          "- [ ] 収益化停止ではないと思う",
          "- [ ] 収益化停止の可能性がある",
          "- [ ] 未収益化だと思う",
          "- [ ] 収益化が復旧した",
          "- [ ] 掲載除外・表記修正の依頼",
          "- [ ] その他",
          "",
          "## 根拠",
          "- 根拠URL:",
          "- 確認日時:",
          "- 説明:",
          "",
          "## 連絡先",
          "- 任意:",
        ].join("\n")
      );
    } else {
      params.set("title", "収益化停止DBへの情報提供");
      params.set(
        "body",
        [
          "## 対象チャンネル",
          "- チャンネル名:",
          "- チャンネルIDまたはURL:",
          "",
          "## 情報の種類",
          "- [ ] 収益化停止ではないと思う",
          "- [ ] 収益化停止の可能性がある",
          "- [ ] 未収益化だと思う",
          "- [ ] 収益化が復旧した",
          "- [ ] 掲載除外・表記修正の依頼",
          "- [ ] その他",
          "",
          "## 根拠",
          "- 根拠URL:",
          "- 確認日時:",
          "- 説明:",
          "",
          "## 連絡先",
          "- 任意:",
        ].join("\n")
      );
    }
    return `${issueBaseUrl}?${params.toString()}`;
  }

  function formatDate(value) {
    if (!value) return "更新日時: -";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return `更新日時: ${value}`;
    return `更新日時: ${date.toLocaleString("ja-JP")}`;
  }

  function formatNumber(value) {
    if (value === null || value === undefined || value === "") return "-";
    return Number(value).toLocaleString("ja-JP");
  }

  function formatDays(value) {
    if (value === null || value === undefined || value === "") return "-";
    return Number(value) === 0 ? "今日" : `${formatNumber(value)}日前`;
  }

  function formatRate(value) {
    if (value === null || value === undefined || value === "") return "-";
    return `${Math.round(Number(value) * 100)}%`;
  }

  function formatPercent(value, digits = 1) {
    if (value === null || value === undefined || value === "") return "-";
    return `${(Number(value) * 100).toFixed(digits)}%`;
  }

  function formatSignedPoints(value) {
    if (value === null || value === undefined || value === "") return "-";
    const points = Number(value) * 100;
    const sign = points > 0 ? "+" : "";
    return `${sign}${points.toFixed(1)}ポイント`;
  }

  function formatRelative(value) {
    if (value === null || value === undefined || value === "") return "-";
    const pct = Number(value) * 100;
    const sign = pct > 0 ? "+" : "";
    return `${sign}${pct.toFixed(1)}%`;
  }

  function formatPeriod(value) {
    const match = String(value || "").match(/^(\d{4})H([12])$/);
    if (!match) return String(value || "-");
    return `${match[1]}年${match[2] === "1" ? "上半期" : "下半期"}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderSummary() {
    const items = [
      ["total", "判定対象", data.summary.total],
      ["likely_not_monetized", labels.likely_not_monetized, data.summary.counts?.likely_not_monetized],
      ["inconclusive", labels.inconclusive, data.summary.counts?.inconclusive],
      ["likely_monetized", labels.likely_monetized, data.summary.counts?.likely_monetized],
    ];
    elements.summaryGrid.innerHTML = items
      .map(
        ([key, label, count]) => `
          <article class="summary-card summary-card-${escapeHtml(key)}">
            <span>${escapeHtml(label || key)}</span>
            <strong>${formatNumber(count)}</strong>
          </article>
        `
      )
      .join("");
  }

  function avatarMarkup(channel) {
    if (channel.iconUrl) {
      return `<img class="avatar" src="${escapeHtml(channel.iconUrl)}" loading="lazy" referrerpolicy="no-referrer" alt="">`;
    }
    return `<div class="avatar avatar-fallback" aria-hidden="true">${escapeHtml((channel.label || "?").slice(0, 1))}</div>`;
  }

  function rowMarkup(channel) {
    return `
      <tr>
        <td>
          <div class="channel-cell">
            ${avatarMarkup(channel)}
            <div>
              <a class="channel-title" href="${escapeHtml(channel.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(channel.label)}</a>
              <div class="channel-id">${escapeHtml(channel.channelId)}</div>
            </div>
          </div>
        </td>
        <td><span class="pill ${escapeHtml(channel.result)}">${escapeHtml(channel.resultLabel)}</span></td>
        <td>${escapeHtml(channel.confidenceLabel)}</td>
        <td>${formatNumber(channel.subscribers)}</td>
        <td>${formatDays(channel.latestUploadDays)}</td>
        <td>${formatRate(channel.positiveRate)}</td>
        <td>${escapeHtml(channel.discoverySource || "-")}</td>
        <td><a class="report-link report-link-small" href="${escapeHtml(issueUrl(channel))}" target="_blank" rel="noopener noreferrer">情報提供</a></td>
      </tr>
    `;
  }

  function filteredChannels() {
    const query = elements.searchInput.value.trim().toLowerCase();
    const result = elements.resultFilter.value;
    const confidence = elements.confidenceFilter.value;

    return channels.filter((channel) => {
      if (result !== "all" && channel.result !== result) return false;
      if (confidence !== "all" && channel.confidence !== confidence) return false;
      if (!query) return true;
      const haystack = [
        channel.label,
        channel.channelId,
        channel.discoverySource,
        channel.resultLabel,
        channel.confidenceLabel,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  function sortChannels(items) {
    const sort = elements.sortSelect.value;
    return [...items].sort((a, b) => {
      if (sort === "subscribers") return (b.subscribers || 0) - (a.subscribers || 0);
      if (sort === "latest") return (a.latestUploadDays ?? 99999) - (b.latestUploadDays ?? 99999);
      if (sort === "name") return String(a.label).localeCompare(String(b.label), "ja");
      return (resultWeight[a.result] ?? 9) - (resultWeight[b.result] ?? 9) || (b.subscribers || 0) - (a.subscribers || 0);
    });
  }

  function renderRows() {
    const visible = sortChannels(filteredChannels());
    elements.visibleCount.textContent = `${formatNumber(visible.length)} / ${formatNumber(channels.length)} 件`;
    elements.channelRows.innerHTML = visible.map(rowMarkup).join("");
  }

  function initSourceMeta() {
    if (elements.sourceMetaTotal) {
      elements.sourceMetaTotal.textContent = `${formatNumber(data.summary.total)}チャンネル`;
    }
    if (elements.sourceMetaDate) {
      elements.sourceMetaDate.textContent = String(data.summary.sourceReportAt || "").slice(0, 10) || "-";
    }
  }

  function dashboardIncidenceRows(thresholdDays) {
    if (!semiannualDashboard) return [];
    return (semiannualDashboard.incidence || []).filter((row) => Number(row.thresholdDays) === Number(thresholdDays));
  }

  function incidenceByPeriod(thresholdDays) {
    return dashboardIncidenceRows(thresholdDays).reduce((index, row) => {
      index[row.period] = row;
      return index;
    }, {});
  }

  function selectedDashboardThreshold() {
    return Number(elements.dashboardThresholdSelect?.value || semiannualDashboard?.mainThresholdDays || 30);
  }

  function latestPrevalenceRow() {
    const rows = semiannualDashboard?.prevalence || [];
    return rows[rows.length - 1] || {};
  }

  function previousPrevalenceRows() {
    const rows = semiannualDashboard?.prevalence || [];
    return rows.slice(0, Math.max(0, rows.length - 1));
  }

  function bestPreviousCoverageRate() {
    const rows = previousPrevalenceRows();
    if (!rows.length) return null;
    return Math.max(...rows.map((row) => Number(row.checkedCoverageRate || 0)));
  }

  function renderDashboardVerdict() {
    if (!elements.dashboardVerdict || !semiannualDashboard) return;
    const latest = latestPrevalenceRow();
    const thresholdDays = selectedDashboardThreshold();
    const latestEvent = dashboardIncidenceRows(thresholdDays).find((row) => row.period === latest.period) || {};
    elements.dashboardVerdict.innerHTML = `
      <div class="verdict-main">
        <span>結論</span>
        <strong>まだ判断できません</strong>
      </div>
      <p>
        ${escapeHtml(formatPeriod(latest.period))}は、広告なし割合が${escapeHtml(formatPercent(latest.currentLikelyNotRateAmongChecked))}でした。
        ただし、${escapeHtml(thresholdDays)}日以上投稿が止まった候補のうち${escapeHtml(formatNumber(latestEvent.missingAdResultInactiveCandidates))}件は、広告確認がまだ終わっていません。
      </p>
    `;
  }

  function renderDashboardControls() {
    if (!elements.dashboardThresholdSelect || !semiannualDashboard) return;
    elements.dashboardThresholdSelect.innerHTML = (semiannualDashboard.thresholds || [30])
      .map((days) => `<option value="${escapeHtml(days)}">${escapeHtml(days)}日以上</option>`)
      .join("");
    elements.dashboardThresholdSelect.value = String(semiannualDashboard.mainThresholdDays || 30);
  }

  function renderDashboardKpis() {
    if (!elements.dashboardKpis || !semiannualDashboard) return;
    const thresholdDays = selectedDashboardThreshold();
    const latestPeriod = semiannualDashboard.kpis?.latestPeriod || "-";
    const previousPeriod = semiannualDashboard.kpis?.previousPeriod || "-";
    const selectedLatest = dashboardIncidenceRows(thresholdDays).find((row) => row.period === latestPeriod) || {};
    const cards = [
      {
        label: "広告なし割合",
        value: formatPercent(semiannualDashboard.kpis?.latestLikelyNotRate),
        detail: `${formatPeriod(latestPeriod)}。${formatPeriod(previousPeriod)}より${formatSignedPoints(semiannualDashboard.kpis?.latestLikelyNotDeltaPoints)}`,
        tone: "blue",
      },
      {
        label: "投稿停止後も広告なし",
        value: formatNumber(selectedLatest.likelyNotInactiveEvents),
        detail: `${thresholdDays}日以上投稿が止まり、広告なし`,
        tone: "red",
      },
      {
        label: "広告確認が未完了",
        value: formatNumber(selectedLatest.missingAdResultInactiveCandidates),
        detail: "投稿停止候補の確認がまだ残っている",
        tone: "gray",
      },
    ];
    elements.dashboardKpis.innerHTML = cards
      .map(
        (card) => `
          <article class="dashboard-kpi dashboard-kpi-${escapeHtml(card.tone)}">
            <span>${escapeHtml(card.label)}</span>
            <strong>${escapeHtml(card.value)}</strong>
            <em>${escapeHtml(card.detail)}</em>
          </article>
        `
      )
      .join("");
  }

  function renderPrevalenceChart() {
    if (!elements.prevalenceChart || !semiannualDashboard) return;
    const rows = semiannualDashboard.prevalence || [];
    const maxRate = Math.max(0.12, ...rows.map((row) => Number(row.currentLikelyNotRateAmongChecked || 0)));
    elements.prevalenceChart.innerHTML = rows
      .map((row) => {
        const width = Math.max(1, (Number(row.currentLikelyNotRateAmongChecked || 0) / maxRate) * 100);
        const coverage = formatPercent(row.checkedCoverageRate, 0);
        return `
          <div class="chart-row">
            <div class="chart-label">
              <span>${escapeHtml(formatPeriod(row.period))}</span>
              <small>確認済み ${escapeHtml(coverage)}</small>
            </div>
            <div class="chart-track" aria-hidden="true">
              <div class="chart-fill chart-fill-blue" style="width:${width.toFixed(2)}%"></div>
            </div>
            <strong>${escapeHtml(formatPercent(row.currentLikelyNotRateAmongChecked))}</strong>
          </div>
        `;
      })
      .join("");
  }

  function renderIncidenceChart() {
    if (!elements.incidenceChart || !semiannualDashboard) return;
    const rows = dashboardIncidenceRows(selectedDashboardThreshold());
    const maxCount = Math.max(1, ...rows.map((row) => Number(row.missingAdResultInactiveCandidates || 0) + Number(row.likelyNotInactiveEvents || 0)));
    elements.incidenceChart.innerHTML = rows
      .map((row) => {
        const confirmed = Number(row.likelyNotInactiveEvents || 0);
        const unknown = Number(row.missingAdResultInactiveCandidates || 0);
        const confirmedWidth = Math.max(0, (confirmed / maxCount) * 100);
        const unknownWidth = Math.max(0, (unknown / maxCount) * 100);
        return `
          <div class="chart-row">
            <div class="chart-label">
              <span>${escapeHtml(formatPeriod(row.period))}</span>
              <small>${row.eventWindowComplete ? "期間終了" : "途中"}</small>
            </div>
            <div class="chart-track chart-track-range" aria-hidden="true">
              <div class="chart-fill chart-fill-red" style="width:${confirmedWidth.toFixed(2)}%"></div>
              <div class="chart-fill chart-fill-gray" style="width:${unknownWidth.toFixed(2)}%"></div>
            </div>
            <strong>広告なし ${escapeHtml(formatNumber(confirmed))} / 未確認 ${escapeHtml(formatNumber(unknown))}</strong>
          </div>
        `;
      })
      .join("");
  }

  function renderDashboardTable() {
    if (!elements.dashboardRows || !semiannualDashboard) return;
    const thresholdDays = selectedDashboardThreshold();
    const incidence = incidenceByPeriod(thresholdDays);
    elements.dashboardRows.innerHTML = (semiannualDashboard.prevalence || [])
      .map((row) => {
        const event = incidence[row.period] || {};
        return `
          <tr>
            <td>${escapeHtml(formatPeriod(row.period))}</td>
            <td>${formatNumber(row.activeChannelsObserved)}</td>
            <td>${escapeHtml(formatPercent(row.currentLikelyNotRateAmongChecked))}</td>
            <td>${escapeHtml(formatSignedPoints(row.previousRateDeltaPoints))}</td>
            <td>${formatNumber(event.likelyNotInactiveEvents)}</td>
            <td>${formatNumber(event.missingAdResultInactiveCandidates)}</td>
            <td>${event.eventWindowComplete ? "期間終了" : "途中"}</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderDashboardNote() {
    if (!elements.dashboardNote || !semiannualDashboard) return;
    elements.dashboardNote.textContent = [
      `作成基準日: ${semiannualDashboard.asOf || "-"}`,
      "未確認とは、投稿停止候補の広告表示チェックがまだ終わっていないという意味です。",
    ].join(" / ");
  }

  function renderPeriodDashboard() {
    if (!elements.periodDashboard) return;
    if (!semiannualDashboard) {
      elements.periodDashboard.hidden = true;
      return;
    }
    renderDashboardKpis();
    renderDashboardVerdict();
    renderPrevalenceChart();
    renderIncidenceChart();
    renderDashboardTable();
    renderDashboardNote();
  }

  function initFeedbackLinks() {
    const url = issueUrl();
    if (elements.globalFeedbackLink) elements.globalFeedbackLink.href = url;
    if (elements.feedbackPanelLink) elements.feedbackPanelLink.href = url;
  }

  function init() {
    elements.generatedAt.textContent = formatDate(data.summary.generatedAt);
    initSourceMeta();
    initFeedbackLinks();
    renderDashboardControls();
    renderPeriodDashboard();
    renderSummary();
    renderRows();
    [elements.searchInput, elements.resultFilter, elements.confidenceFilter, elements.sortSelect].forEach((element) => {
      element.addEventListener("input", renderRows);
      element.addEventListener("change", renderRows);
    });
    if (elements.dashboardThresholdSelect) {
      elements.dashboardThresholdSelect.addEventListener("change", renderPeriodDashboard);
    }
  }

  init();
})();
